import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const AdminAlerts: React.FC = () => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [closeDialog, setCloseDialog] = useState<{ open: boolean; alert: any }>({ open: false, alert: null });
  const [closeMessage, setCloseMessage] = useState("");
  const { toast } = useToast();

  const fetchAlerts = async () => {
    const { data } = await supabase.from("admin_alerts").select("*, jobs(business_name, client_user_id, provider_user_id)").order("created_at", { ascending: false });
    if (data) setAlerts(data);
  };

  useEffect(() => { fetchAlerts(); }, []);

  const closeJob = async () => {
    if (!closeDialog.alert) return;
    const alert = closeDialog.alert;
    await supabase.from("jobs").update({ status: "closed_by_admin" }).eq("id", alert.job_id);
    await supabase.from("admin_alerts").update({ is_resolved: true }).eq("id", alert.id);
    const job = alert.jobs;
    if (job) {
      const notifyBoth = [job.client_user_id, job.provider_user_id].filter(Boolean);
      for (const uid of notifyBoth) {
        await supabase.functions.invoke("create-notification", {
          body: { user_id: uid, title: "Job Closed by Admin", message: closeMessage, link: `/jobs/${alert.job_id}` },
        });
      }
    }
    toast({ title: t("admin.alerts.jobClosed") });
    setCloseDialog({ open: false, alert: null });
    setCloseMessage("");
    fetchAlerts();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("admin.alerts.title")}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.alerts.job")}</TableHead>
            <TableHead>{t("admin.alerts.reason")}</TableHead>
            <TableHead>{t("admin.alerts.status")}</TableHead>
            <TableHead>{t("admin.alerts.created")}</TableHead>
            <TableHead>{t("admin.alerts.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.jobs?.business_name || a.job_id}</TableCell>
              <TableCell>{a.reason}</TableCell>
              <TableCell><Badge variant={a.is_resolved ? "default" : "destructive"}>{a.is_resolved ? t("status.resolved") : t("status.open")}</Badge></TableCell>
              <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {!a.is_resolved && (
                  <Button size="sm" variant="destructive" onClick={() => setCloseDialog({ open: true, alert: a })}>{t("admin.alerts.closeJob")}</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={closeDialog.open} onOpenChange={(o) => setCloseDialog({ ...closeDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.alerts.closeJobTitle")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("admin.alerts.closeJobMsg")}</p>
          <Textarea placeholder={t("admin.alerts.closeReason")} value={closeMessage} onChange={(e) => setCloseMessage(e.target.value)} />
          <Button variant="destructive" onClick={closeJob}>{t("admin.alerts.closeAndNotify")}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAlerts;
