import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; companyId: string | null }>({ open: false, companyId: null });
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (data) setCompanies(data);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const approve = async (id: string) => {
    await supabase.from("companies").update({ status: "approved" }).eq("id", id);
    toast({ title: "Company approved" });
    fetchCompanies();
  };

  const reject = async () => {
    if (!rejectDialog.companyId) return;
    await supabase.from("companies").update({ status: "rejected", rejection_reason: rejectReason }).eq("id", rejectDialog.companyId);
    toast({ title: "Company rejected" });
    setRejectDialog({ open: false, companyId: null });
    setRejectReason("");
    fetchCompanies();
  };

  const statusVariant = (s: string) => {
    if (s === "approved") return "default";
    if (s === "rejected") return "destructive";
    if (s === "submitted_for_approval") return "secondary";
    return "outline";
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Companies Management</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.business_name}</TableCell>
              <TableCell><Badge variant={statusVariant(c.status) as any}>{c.status.replace(/_/g, " ")}</Badge></TableCell>
              <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {c.status === "submitted_for_approval" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve(c.id)}><Check className="h-4 w-4 mr-1" />Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => setRejectDialog({ open: true, companyId: c.id })}><X className="h-4 w-4 mr-1" />Reject</Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ ...rejectDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Company</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <Button variant="destructive" onClick={reject}>Reject</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompanies;
