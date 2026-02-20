import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

const docTypes = [
  { value: "registration_approval", label: "Company Registration Approval" },
  { value: "company_id", label: "Company ID / Identification" },
  { value: "accountant_approval", label: "Accountant Approval" },
];

const ClientCompany: React.FC = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [form, setForm] = useState({ business_name: "", details: "" });
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCompany = async () => {
    if (!user) return;
    const { data } = await supabase.from("companies").select("*").eq("client_user_id", user.id).limit(1).single();
    if (data) {
      setCompany(data);
      setForm({ business_name: data.business_name, details: data.details || "" });
      const { data: d } = await supabase.from("company_documents").select("*").eq("company_id", data.id);
      if (d) setDocs(d);
    }
  };

  useEffect(() => { fetchCompany(); }, [user]);

  const saveCompany = async () => {
    setSaving(true);
    try {
      if (company) {
        await supabase.from("companies").update(form).eq("id", company.id);
      } else {
        const { data, error } = await supabase.from("companies").insert({ ...form, client_user_id: user!.id }).select().single();
        if (error) throw error;
        setCompany(data);
      }
      toast({ title: "Company saved" });
      fetchCompany();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadDoc = async (docType: string, file: File) => {
    if (!company) return;
    setUploading(true);
    try {
      const path = `${company.id}/${docType}_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("company-documents").upload(path, file);
      if (error) throw error;
      await supabase.from("company_documents").insert({ company_id: company.id, doc_type: docType, file_name: file.name, file_path: path });
      toast({ title: "Document uploaded" });
      fetchCompany();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submitForApproval = async () => {
    if (!company) return;
    await supabase.from("companies").update({ status: "submitted_for_approval" }).eq("id", company.id);
    
    // Notify all admin users
    const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (adminRoles) {
      for (const admin of adminRoles) {
        await supabase.functions.invoke("create-notification", {
          body: {
            user_id: admin.user_id,
            title: "Company Submitted for Approval",
            message: `The company "${company.business_name}" has been submitted for approval.`,
            link: "/admin/companies",
          },
        });
      }
    }
    
    toast({ title: "Submitted for approval" });
    fetchCompany();
  };

  const isEditable = !company || company.status === "draft" || company.status === "rejected";

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">My Company</h2>

      {company && (
        <div className="mb-4">
          <Badge variant={company.status === "approved" ? "default" : company.status === "rejected" ? "destructive" : "secondary"}>
            {company.status.replace(/_/g, " ")}
          </Badge>
          {company.status === "rejected" && company.rejection_reason && (
            <p className="text-sm text-destructive mt-2">{company.rejection_reason}</p>
          )}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Business Name</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} disabled={!isEditable} /></div>
          <div><Label>Details</Label><Textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} disabled={!isEditable} /></div>
          {isEditable && <Button onClick={saveCompany} disabled={saving}>{saving ? "Saving..." : company ? "Update" : "Create Company"}</Button>}
        </CardContent>
      </Card>

      {company && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {docTypes.map((dt) => {
              const existing = docs.filter((d) => d.doc_type === dt.value);
              return (
                <div key={dt.value} className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-2">{dt.label}</p>
                  {existing.map((d) => (
                    <p key={d.id} className="text-sm text-muted-foreground">✓ {d.file_name}</p>
                  ))}
                  {isEditable && (
                    <Label className="cursor-pointer mt-2 inline-block">
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <span><Upload className="h-3 w-3 mr-1" />Upload</span>
                      </Button>
                      <Input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadDoc(dt.value, e.target.files[0]); }} />
                    </Label>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {company && isEditable && company.status !== "submitted_for_approval" && (
        <Button onClick={submitForApproval} className="w-full">Submit for Approval</Button>
      )}
    </div>
  );
};

export default ClientCompany;
