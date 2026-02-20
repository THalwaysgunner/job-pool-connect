import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, User, Building2 } from "lucide-react";

const docTypes = [
  { value: "registration_approval", label: "Company Registration Approval" },
  { value: "company_id", label: "Company ID / Identification" },
  { value: "accountant_approval", label: "Accountant Approval" },
];

const ClientSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ full_name: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Company state
  const [company, setCompany] = useState<any>(null);
  const [companyForm, setCompanyForm] = useState({ business_name: "", details: "" });
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch profile
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setProfileForm({ full_name: data.full_name || "" }); }
    });
    // Fetch company
    fetchCompany();
  }, [user]);

  const fetchCompany = async () => {
    if (!user) return;
    const { data } = await supabase.from("companies").select("*").eq("client_user_id", user.id).limit(1).single();
    if (data) {
      setCompany(data);
      setCompanyForm({ business_name: data.business_name, details: data.details || "" });
      const { data: d } = await supabase.from("company_documents").select("*").eq("company_id", data.id);
      if (d) setDocs(d);
    }
  };

  // Profile actions
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await supabase.from("profiles").update({ full_name: profileForm.full_name }).eq("user_id", user!.id);
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    if (passwordForm.password !== passwordForm.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (passwordForm.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (error) throw error;
      toast({ title: "Password updated" });
      setPasswordForm({ password: "", confirm: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSavingPassword(false); }
  };

  // Company actions
  const saveCompany = async () => {
    setSavingCompany(true);
    try {
      if (company) {
        await supabase.from("companies").update(companyForm).eq("id", company.id);
      } else {
        const { data, error } = await supabase.from("companies").insert({ ...companyForm, client_user_id: user!.id }).select().single();
        if (error) throw error;
        setCompany(data);
      }
      toast({ title: "Company saved" });
      fetchCompany();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSavingCompany(false); }
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
    } finally { setUploading(false); }
  };

  const submitForApproval = async () => {
    if (!company) return;
    await supabase.from("companies").update({ status: "submitted_for_approval" }).eq("id", company.id);
    toast({ title: "Submitted for approval" });
    fetchCompany();
  };

  const isCompanyEditable = !company || company.status === "draft" || company.status === "rejected";

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" />Company</TabsTrigger>
        </TabsList>

        {/* ─── PROFILE TAB ─── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label>Full Name</Label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
              </div>
              <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Changes"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
              </div>
              <Button onClick={changePassword} disabled={savingPassword}>{savingPassword ? "Updating..." : "Update Password"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── COMPANY TAB ─── */}
        <TabsContent value="company" className="space-y-6">
          {company && (
            <div className="flex items-center gap-3">
              <Badge variant={company.status === "approved" ? "default" : company.status === "rejected" ? "destructive" : "secondary"}>
                {company.status.replace(/_/g, " ")}
              </Badge>
              {company.status === "rejected" && company.rejection_reason && (
                <p className="text-sm text-destructive">{company.rejection_reason}</p>
              )}
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Business Name</Label>
                <Input value={companyForm.business_name} onChange={(e) => setCompanyForm({ ...companyForm, business_name: e.target.value })} disabled={!isCompanyEditable} />
              </div>
              <div>
                <Label>Details</Label>
                <Textarea value={companyForm.details} onChange={(e) => setCompanyForm({ ...companyForm, details: e.target.value })} disabled={!isCompanyEditable} />
              </div>
              {isCompanyEditable && (
                <Button onClick={saveCompany} disabled={savingCompany}>{savingCompany ? "Saving..." : company ? "Update" : "Create Company"}</Button>
              )}
            </CardContent>
          </Card>

          {company && (
            <Card>
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
                      {isCompanyEditable && (
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

          {company && isCompanyEditable && company.status !== "submitted_for_approval" && (
            <Button onClick={submitForApproval} className="w-full">Submit for Approval</Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientSettings;
