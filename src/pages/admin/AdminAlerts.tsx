import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const AdminAlerts: React.FC = () => {
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

    // Close the job
    await supabase.from("jobs").update({ status: "closed_by_admin" }).eq("id", alert.job_id);
    // Mark alert resolved
    await supabase.from("admin_alerts").update({ is_resolved: true }).eq("id", alert.id);

    // Notify both parties
    const job = alert.jobs;
    if (job) {
      const notifyBoth = [job.client_user_id, job.provider_user_id].filter(Boolean);
      for (const uid of notifyBoth) {
        await supabase.functions.invoke("create-notification", {
          body: { user_id: uid, title: "Job Closed by Admin", message: closeMessage, link: `/jobs/${alert.job_id}` },
        });
      }
    }

    toast({ title: "Job closed and parties notified" });
    setCloseDialog({ open: false, alert: null });
    setCloseMessage("");
    fetchAlerts();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Compliance Alerts</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.jobs?.business_name || a.job_id}</TableCell>
              <TableCell>{a.reason}</TableCell>
              <TableCell><Badge variant={a.is_resolved ? "default" : "destructive"}>{a.is_resolved ? "Resolved" : "Open"}</Badge></TableCell>
              <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {!a.is_resolved && (
                  <Button size="sm" variant="destructive" onClick={() => setCloseDialog({ open: true, alert: a })}>Close Job</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={closeDialog.open} onOpenChange={(o) => setCloseDialog({ ...closeDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close Job</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This message will be sent to both the Client and Provider.</p>
          <Textarea placeholder="Reason for closing..." value={closeMessage} onChange={(e) => setCloseMessage(e.target.value)} />
          <Button variant="destructive" onClick={closeJob}>Close Job & Notify</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAlerts;
