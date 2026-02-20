import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, User, Building2, Shield } from "lucide-react";

const ClientSettings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const docTypes = [
    { value: "registration_approval", labelKey: "docType.registration_approval" },
    { value: "company_id", labelKey: "docType.company_id" },
    { value: "accountant_approval", labelKey: "docType.accountant_approval" },
  ];

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", id_number: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [idFile, setIdFile] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);

  // Company state
  const [company, setCompany] = useState<any>(null);
  const [companyForm, setCompanyForm] = useState({ business_name: "", details: "" });
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setProfileForm({ full_name: data.full_name || "", id_number: (data as any).id_number || "" });
        setIdFile((data as any).id_file_path || null);
      }
    });
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

  const uploadIdFile = async (file: File) => {
    if (!user) return;
    setUploadingId(true);
    try {
      const path = `${user.id}/id_document_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("company-documents").upload(path, file);
      if (error) throw error;
      await supabase.from("profiles").update({ id_file_path: path } as any).eq("user_id", user.id);
      setIdFile(path);
      toast({ title: t("company.docUploaded") });
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
    } finally { setUploadingId(false); }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await supabase.from("profiles").update({ full_name: profileForm.full_name, id_number: profileForm.id_number } as any).eq("user_id", user!.id);
      toast({ title: t("settings.profileUpdated") });
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
    } finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    if (passwordForm.password !== passwordForm.confirm) {
      toast({ title: t("settings.passwordsDontMatch"), variant: "destructive" }); return;
    }
    if (passwordForm.password.length < 6) {
      toast({ title: t("settings.passwordTooShort"), variant: "destructive" }); return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (error) throw error;
      toast({ title: t("settings.passwordUpdated") });
      setPasswordForm({ password: "", confirm: "" });
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
    } finally { setSavingPassword(false); }
  };

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
      toast({ title: t("company.companySaved") });
      fetchCompany();
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
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
      toast({ title: t("company.docUploaded") });
      fetchCompany();
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const submitForApproval = async () => {
    if (!company) return;
    await supabase.from("companies").update({ status: "submitted_for_approval" }).eq("id", company.id);
    try {
      const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (adminRoles) {
        for (const admin of adminRoles) {
          await supabase.functions.invoke("create-notification", {
            body: { user_id: admin.user_id, title: "Company Submitted for Approval", message: `Company "${company.business_name}" has been submitted for approval.`, link: "/admin/companies" },
          });
        }
      }
    } catch (e) { console.error("Failed to send notifications:", e); }
    toast({ title: t("company.submittedForApproval") });
    fetchCompany();
  };

  const isCompanyEditable = !company || company.status === "draft" || company.status === "rejected";
  const translateStatus = (status: string) => t(`status.${status}`) || status.replace(/_/g, " ");

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">{t("settings.title")}</h2>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" />{t("settings.company")}</TabsTrigger>
          <TabsTrigger value="account" className="gap-2"><Shield className="h-4 w-4" />{t("settings.account")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("settings.personalInfo")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("settings.email")}</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">{t("settings.emailCantChange")}</p>
              </div>
              <div>
                <Label>{t("settings.fullName")}</Label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
              </div>
              <div>
                <Label>{t("settings.idNumber")}</Label>
                <Input value={profileForm.id_number} onChange={(e) => setProfileForm({ ...profileForm, id_number: e.target.value })} placeholder={t("settings.idPlaceholder")} />
              </div>
              <div>
                <Label>{t("settings.idDocUpload")}</Label>
                {idFile ? (
                  <p className="text-sm text-muted-foreground mb-2">{t("settings.idUploaded")}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-2">{t("settings.pleaseUploadId")}</p>
                )}
                <Label className="cursor-pointer inline-block">
                  <Button variant="outline" size="sm" asChild disabled={uploadingId}>
                    <span><Upload className="h-3 w-3 me-1" />{uploadingId ? t("settings.uploading") : idFile ? t("settings.replaceId") : t("settings.uploadId")}</span>
                  </Button>
                  <Input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) uploadIdFile(e.target.files[0]); }} />
                </Label>
              </div>
              <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? t("settings.saving") : t("settings.saveChanges")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("settings.changePassword")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("settings.newPassword")}</Label>
                <Input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} />
              </div>
              <div>
                <Label>{t("settings.confirmPassword")}</Label>
                <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
              </div>
              <Button onClick={changePassword} disabled={savingPassword}>{savingPassword ? t("settings.updating") : t("settings.updatePassword")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          {company && (
            <div className="flex items-center gap-3">
              <Badge variant={company.status === "approved" ? "default" : company.status === "rejected" ? "destructive" : "secondary"}>
                {translateStatus(company.status)}
              </Badge>
              {company.status === "rejected" && company.rejection_reason && (
                <p className="text-sm text-destructive">{company.rejection_reason}</p>
              )}
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>{t("company.details")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("company.businessName")}</Label>
                <Input value={companyForm.business_name} onChange={(e) => setCompanyForm({ ...companyForm, business_name: e.target.value })} disabled={!isCompanyEditable} />
              </div>
              <div>
                <Label>{t("company.detailsLabel")}</Label>
                <Textarea value={companyForm.details} onChange={(e) => setCompanyForm({ ...companyForm, details: e.target.value })} disabled={!isCompanyEditable} />
              </div>
              {isCompanyEditable && (
                <Button onClick={saveCompany} disabled={savingCompany}>{savingCompany ? t("settings.saving") : company ? t("company.update") : t("company.createCompany")}</Button>
              )}
            </CardContent>
          </Card>

          {company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t("company.documents")}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {docs.filter(d => (d as any).status === "approved").length}/{docs.length} {t("status.approved")}
                    {docs.filter(d => (d as any).status === "rejected").length > 0 && ` · ${docs.filter(d => (d as any).status === "rejected").length} ${t("status.rejected")}`}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {docTypes.map((dt) => {
                  const existing = docs.filter((d) => d.doc_type === dt.value);
                  return (
                    <div key={dt.value} className="border rounded-lg p-3">
                      <p className="font-medium text-sm mb-2">{t(dt.labelKey)}</p>
                      {existing.map((d) => (
                        <div key={d.id} className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            (d as any).status === "approved" ? "default" : 
                            (d as any).status === "rejected" ? "destructive" : "secondary"
                          } className="text-xs">
                            {translateStatus((d as any).status)}
                          </Badge>
                          <span className="text-sm">{d.file_name}</span>
                          {(d as any).status === "rejected" && (d as any).rejection_reason && (
                            <span className="text-xs text-destructive">— {(d as any).rejection_reason}</span>
                          )}
                        </div>
                      ))}
                      {(isCompanyEditable || existing.some(d => (d as any).status === "rejected")) && (
                        <Label className="cursor-pointer mt-2 inline-block">
                          <Button variant="outline" size="sm" asChild disabled={uploading}>
                            <span><Upload className="h-3 w-3 me-1" />{existing.some(d => (d as any).status === "rejected") ? t("company.reUpload") : t("deliverable.upload")}</span>
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
            <Button onClick={submitForApproval} className="w-full">{t("company.submitForApproval")}</Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientSettings;
