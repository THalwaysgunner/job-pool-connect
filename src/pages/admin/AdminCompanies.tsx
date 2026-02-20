import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, FileText } from "lucide-react";

const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; company: any | null }>({ open: false, company: null });
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [docViewUrl, setDocViewUrl] = useState<string | null>(null);
  const [docViewOpen, setDocViewOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [rejectDocDialog, setRejectDocDialog] = useState<{ open: boolean; docId: string | null }>({ open: false, docId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCategory, setRejectCategory] = useState("");
  const [rejectCompanyDialog, setRejectCompanyDialog] = useState<{ open: boolean; companyId: string | null }>({ open: false, companyId: null });
  const [rejectCompanyReason, setRejectCompanyReason] = useState("");
  const { toast } = useToast();

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (data) setCompanies(data);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const viewDetails = async (company: any) => {
    setDetailDialog({ open: true, company });
    const { data: docs } = await supabase.from("company_documents").select("*").eq("company_id", company.id);
    if (docs) setCompanyDocs(docs);
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", company.client_user_id).single();
    if (profile) setCompanyProfile(profile);
  };

  const viewDoc = async (doc: any) => {
    const { data, error } = await supabase.storage.from("company-documents").createSignedUrl(doc.file_path, 300);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.signedUrl) {
      setViewingDoc(doc);
      setDocViewUrl(data.signedUrl);
      setDocViewOpen(true);
    }
  };

  const approveDoc = async (docId: string) => {
    await supabase.from("company_documents").update({ status: "approved", rejection_reason: null } as any).eq("id", docId);
    toast({ title: "Document approved" });
    if (detailDialog.company) {
      const { data: docs } = await supabase.from("company_documents").select("*").eq("company_id", detailDialog.company.id);
      if (docs) setCompanyDocs(docs);
    }
    setDocViewOpen(false);
    setViewingDoc(null);
  };

  const rejectCategories = [
    { value: "not_clear", label: "Not clear / unreadable", requiresReupload: true },
    { value: "wrong_document", label: "Wrong document type", requiresReupload: true },
    { value: "expired", label: "Expired document", requiresReupload: true },
    { value: "incomplete", label: "Incomplete / missing info", requiresReupload: true },
    { value: "fraudulent", label: "Suspected fraud", requiresReupload: false },
    { value: "other", label: "Other", requiresReupload: false },
  ];

  const rejectDoc = async () => {
    if (!rejectDocDialog.docId || !rejectCategory) return;
    const category = rejectCategories.find(c => c.value === rejectCategory);
    const fullReason = `[${category?.label}] ${rejectReason}`.trim();

    if (category?.requiresReupload) {
      // Delete file from storage and remove record so client must re-upload
      const doc = companyDocs.find(d => d.id === rejectDocDialog.docId);
      if (doc) {
        await supabase.storage.from("company-documents").remove([doc.file_path]);
        await supabase.from("company_documents").delete().eq("id", rejectDocDialog.docId);
      }
    } else {
      await supabase.from("company_documents").update({ status: "rejected", rejection_reason: fullReason } as any).eq("id", rejectDocDialog.docId);
    }

    // Notify the client
    if (detailDialog.company) {
      const doc = companyDocs.find(d => d.id === rejectDocDialog.docId);
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: detailDialog.company.client_user_id,
          title: category?.requiresReupload ? "Document Rejected - Re-upload Required" : "Document Rejected",
          message: `Your document "${doc?.file_name}" (${doc?.doc_type.replace(/_/g, " ")}) was rejected. Reason: ${fullReason}.${category?.requiresReupload ? " Please upload a new document." : ""}`,
          link: "/client/settings",
        },
      });
    }

    toast({ title: "Document rejected" });
    setRejectDocDialog({ open: false, docId: null });
    setRejectReason("");
    setRejectCategory("");
    if (detailDialog.company) {
      const { data: docs } = await supabase.from("company_documents").select("*").eq("company_id", detailDialog.company.id);
      if (docs) setCompanyDocs(docs);
    }
    setDocViewOpen(false);
    setViewingDoc(null);
  };

  const approveCompany = async (id: string) => {
    await supabase.from("companies").update({ status: "approved" }).eq("id", id);
    const company = companies.find(c => c.id === id);
    if (company) {
      await supabase.functions.invoke("create-notification", {
        body: { user_id: company.client_user_id, title: "Company Approved", message: `Your company "${company.business_name}" has been approved.`, link: "/client/settings" },
      });
    }
    toast({ title: "Company approved" });
    setDetailDialog({ open: false, company: null });
    fetchCompanies();
  };

  const rejectCompany = async () => {
    if (!rejectCompanyDialog.companyId) return;
    await supabase.from("companies").update({ status: "rejected", rejection_reason: rejectCompanyReason }).eq("id", rejectCompanyDialog.companyId);
    const company = companies.find(c => c.id === rejectCompanyDialog.companyId);
    if (company) {
      await supabase.functions.invoke("create-notification", {
        body: { user_id: company.client_user_id, title: "Company Rejected", message: `Your company "${company.business_name}" was rejected. Reason: ${rejectCompanyReason}`, link: "/client/settings" },
      });
    }
    toast({ title: "Company rejected" });
    setRejectCompanyDialog({ open: false, companyId: null });
    setRejectCompanyReason("");
    setDetailDialog({ open: false, company: null });
    fetchCompanies();
  };

  const docStatusBadge = (s: string) => {
    if (s === "approved") return <Badge className="bg-green-600 hover:bg-green-700 text-white">approved</Badge>;
    if (s === "rejected") return <Badge className="bg-red-600 hover:bg-red-700 text-white">rejected</Badge>;
    return <Badge className="bg-gray-400 hover:bg-gray-500 text-white">pending</Badge>;
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
                <Button size="sm" variant="outline" onClick={() => viewDetails(c)}>
                  <Eye className="h-4 w-4 mr-1" />View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Company Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(o) => { setDetailDialog({ ...detailDialog, open: o }); if (!o) { setCompanyDocs([]); setCompanyProfile(null); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-background pb-3 border-b">
            <DialogHeader><DialogTitle>Company Details</DialogTitle></DialogHeader>
            {detailDialog.company && (
              <div className="mt-2">
                <Badge variant={statusVariant(detailDialog.company.status) as any}>
                  {detailDialog.company.status.replace(/_/g, " ")}
                </Badge>
              </div>
            )}
          </div>
          {detailDialog.company && (
            <div className="space-y-4 overflow-y-auto flex-1 pt-3">
              {companyProfile && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Client Information</CardTitle></CardHeader>
                   <CardContent className="space-y-2 text-sm">
                    <p><span className="font-medium">Full Name:</span> {companyProfile.full_name || "Not provided"}</p>
                    <p><span className="font-medium">Email:</span> {companyProfile.email}</p>
                    <p><span className="font-medium">ID Number:</span> {(companyProfile as any).id_number || "Not provided"}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">ID Document:</span>
                      {(companyProfile as any).id_file_path ? (
                        <Button size="sm" variant="outline" onClick={async () => {
                          const { data } = await supabase.storage.from("company-documents").createSignedUrl((companyProfile as any).id_file_path, 300);
                          if (data?.signedUrl) { setDocViewUrl(data.signedUrl); setDocViewOpen(true); }
                        }}>
                          <Eye className="h-3 w-3 mr-1" />View ID
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">Not uploaded</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

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

              {/* Per-document review */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Documents ({companyDocs.length})</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {companyDocs.filter(d => (d as any).status === "approved").length} approved · {companyDocs.filter(d => (d as any).status === "rejected").length} rejected · {companyDocs.filter(d => (d as any).status === "pending").length} pending
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {companyDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                  ) : (
                    <div className="space-y-3">
                      {companyDocs.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{doc.file_name}</p>
                                <p className="text-xs text-muted-foreground">{doc.doc_type.replace(/_/g, " ")}</p>
                              </div>
                            </div>
                            {docStatusBadge((doc as any).status)}
                          </div>
                          {(doc as any).status === "rejected" && (doc as any).rejection_reason && (
                            <p className="text-xs text-destructive">Reason: {(doc as any).rejection_reason}</p>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => viewDoc(doc)}>
                              <Eye className="h-3 w-3 mr-1" />View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overall company approve/reject - only when ALL docs are approved */}
              {detailDialog.company.status === "submitted_for_approval" && companyDocs.length > 0 && companyDocs.every(d => (d as any).status === "approved") && (
                <div className="flex gap-3">
                  <Button onClick={() => approveCompany(detailDialog.company.id)} className="flex-1">
                    <Check className="h-4 w-4 mr-1" />Approve Company
                  </Button>
                  <Button variant="destructive" onClick={() => { setRejectCompanyDialog({ open: true, companyId: detailDialog.company.id }); setRejectCompanyReason(""); }} className="flex-1">
                    <X className="h-4 w-4 mr-1" />Reject Company
                  </Button>
                </div>
              )}
              {detailDialog.company.status === "submitted_for_approval" && companyDocs.length > 0 && !companyDocs.every(d => (d as any).status === "approved") && (
                <p className="text-sm text-muted-foreground text-center py-2">Review and approve all documents before approving the company.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Doc View Dialog */}
      <Dialog open={docViewOpen} onOpenChange={(o) => { setDocViewOpen(o); if (!o) setViewingDoc(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
              {viewingDoc && <div className="mt-1">{docStatusBadge((viewingDoc as any).status)}</div>}
            </div>
            {viewingDoc && (
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approveDoc(viewingDoc.id)}>
                  <Check className="h-3 w-3 mr-1" />Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setRejectDocDialog({ open: true, docId: viewingDoc.id }); setRejectReason(""); }}>
                  <X className="h-3 w-3 mr-1" />Reject
                </Button>
              </div>
            )}
          </div>
          {docViewUrl && (
            <iframe src={docViewUrl} className="w-full flex-1 min-h-[60vh] border rounded" title="Document preview" />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Doc Dialog */}
      <Dialog open={rejectDocDialog.open} onOpenChange={(o) => { setRejectDocDialog({ ...rejectDocDialog, open: o }); if (!o) { setRejectReason(""); setRejectCategory(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Document</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason for rejecting this document..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Rejection Category</Label>
            <RadioGroup value={rejectCategory} onValueChange={setRejectCategory}>
              {rejectCategories.map((cat) => (
                <div key={cat.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={cat.value} id={cat.value} />
                  <Label htmlFor={cat.value} className="text-sm font-normal cursor-pointer">
                    {cat.label}
                    {cat.requiresReupload && (
                      <span className="text-xs text-muted-foreground ml-1">(client must re-upload)</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <Button variant="destructive" onClick={rejectDoc} disabled={!rejectCategory}>Reject Document</Button>
        </DialogContent>
      </Dialog>

      {/* Reject Company Dialog */}
      <Dialog open={rejectCompanyDialog.open} onOpenChange={(o) => setRejectCompanyDialog({ ...rejectCompanyDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Company</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason for rejection..." value={rejectCompanyReason} onChange={(e) => setRejectCompanyReason(e.target.value)} />
          <Button variant="destructive" onClick={rejectCompany}>Reject Company</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompanies;