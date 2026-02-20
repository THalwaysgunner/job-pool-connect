import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, Download, FileText } from "lucide-react";

const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; companyId: string | null }>({ open: false, companyId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; company: any | null }>({ open: false, company: null });
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (data) setCompanies(data);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const viewDetails = async (company: any) => {
    setDetailDialog({ open: true, company });
    // Fetch documents
    const { data: docs } = await supabase.from("company_documents").select("*").eq("company_id", company.id);
    if (docs) setCompanyDocs(docs);
    // Fetch client profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", company.client_user_id).single();
    if (profile) setCompanyProfile(profile);
  };

  const downloadDoc = async (doc: any) => {
    const { data, error } = await supabase.storage.from("company-documents").createSignedUrl(doc.file_path, 300);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const approve = async (id: string) => {
    await supabase.from("companies").update({ status: "approved" }).eq("id", id);
    // Notify client
    const company = companies.find(c => c.id === id);
    if (company) {
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: company.client_user_id,
          title: "Company Approved",
          message: `Your company "${company.business_name}" has been approved. You can now create jobs.`,
          link: "/client/settings",
        },
      });
    }
    toast({ title: "Company approved" });
    setDetailDialog({ open: false, company: null });
    fetchCompanies();
  };

  const reject = async () => {
    if (!rejectDialog.companyId) return;
    await supabase.from("companies").update({ status: "rejected", rejection_reason: rejectReason }).eq("id", rejectDialog.companyId);
    // Notify client
    const company = companies.find(c => c.id === rejectDialog.companyId);
    if (company) {
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: company.client_user_id,
          title: "Company Rejected",
          message: `Your company "${company.business_name}" was rejected. Reason: ${rejectReason}`,
          link: "/client/settings",
        },
      });
    }
    toast({ title: "Company rejected" });
    setRejectDialog({ open: false, companyId: null });
    setRejectReason("");
    setDetailDialog({ open: false, company: null });
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
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => viewDetails(c)}>
                    <Eye className="h-4 w-4 mr-1" />View
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(o) => { setDetailDialog({ ...detailDialog, open: o }); if (!o) { setCompanyDocs([]); setCompanyProfile(null); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Company Details</DialogTitle></DialogHeader>
          {detailDialog.company && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant(detailDialog.company.status) as any}>
                  {detailDialog.company.status.replace(/_/g, " ")}
                </Badge>
              </div>

              {/* Client Info */}
              {companyProfile && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Client Information</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p><span className="font-medium">Full Name:</span> {companyProfile.full_name || "Not provided"}</p>
                    <p><span className="font-medium">Email:</span> {companyProfile.email}</p>
                    <p><span className="font-medium">ID Number:</span> {(companyProfile as any).id_number || "Not provided"}</p>
                  </CardContent>
                </Card>
              )}

              {/* Company Info */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Company Information</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="font-medium">Business Name:</span> {detailDialog.company.business_name}</p>
                  <p><span className="font-medium">Details:</span> {detailDialog.company.details || "None"}</p>
                  {detailDialog.company.rejection_reason && (
                    <p className="text-destructive"><span className="font-medium">Rejection Reason:</span> {detailDialog.company.rejection_reason}</p>
                  )}
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Uploaded Documents ({companyDocs.length})</CardTitle></CardHeader>
                <CardContent>
                  {companyDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                  ) : (
                    <div className="space-y-2">
                      {companyDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">{doc.doc_type.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => downloadDoc(doc)}>
                            <Download className="h-4 w-4 mr-1" />Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {detailDialog.company.status === "submitted_for_approval" && (
                <div className="flex gap-3">
                  <Button onClick={() => approve(detailDialog.company.id)} className="flex-1">
                    <Check className="h-4 w-4 mr-1" />Approve
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectDialog({ open: true, companyId: detailDialog.company.id })} className="flex-1">
                    <X className="h-4 w-4 mr-1" />Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
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