import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";

const fileTypeKeys = [
  { value: "terms_client", labelKey: "legalType.terms_client" },
  { value: "terms_provider", labelKey: "legalType.terms_provider" },
  { value: "contract_client", labelKey: "legalType.contract_client" },
  { value: "contract_provider", labelKey: "legalType.contract_provider" },
];

const AdminLegal: React.FC = () => {
  const { t } = useLanguage();
  const [files, setFiles] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState("terms_client");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchFiles = async () => {
    const { data } = await supabase.from("admin_legal_files").select("*").order("uploaded_at", { ascending: false });
    if (data) setFiles(data);
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${selectedType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("legal-files").upload(path, file);
      if (uploadError) throw uploadError;
      const existing = files.filter((f) => f.file_type === selectedType);
      const maxVersion = existing.length > 0 ? Math.max(...existing.map((f) => f.version)) : 0;
      await supabase.from("admin_legal_files").insert({ file_type: selectedType, file_name: file.name, file_path: path, version: maxVersion + 1 });
      toast({ title: t("admin.legal.fileUploaded") });
      fetchFiles();
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const latestByType = fileTypeKeys.map((ft) => {
    const matching = files.filter((f) => f.file_type === ft.value);
    return { ...ft, latest: matching[0] || null };
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("admin.legal.title")}</h2>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">{t("admin.legal.uploadNew")}</CardTitle></CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>{t("admin.legal.fileType")}</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {fileTypeKeys.map((ft) => <SelectItem key={ft.value} value={ft.value}>{t(ft.labelKey)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="legal-upload" className="cursor-pointer">
              <Button asChild disabled={uploading}>
                <span><Upload className="h-4 w-4 me-2" />{uploading ? t("settings.uploading") : t("admin.legal.uploadFile")}</span>
              </Button>
            </Label>
            <Input id="legal-upload" type="file" className="hidden" onChange={handleUpload} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {latestByType.map((ft) => (
          <Card key={ft.value}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />{t(ft.labelKey)}</CardTitle>
            </CardHeader>
            <CardContent>
              {ft.latest ? (
                <div className="text-sm">
                  <p><span className="text-muted-foreground">{t("admin.legal.file")}:</span> {ft.latest.file_name}</p>
                  <p><span className="text-muted-foreground">{t("admin.legal.version")}:</span> {ft.latest.version}</p>
                  <p><span className="text-muted-foreground">{t("admin.legal.uploaded")}:</span> {new Date(ft.latest.uploaded_at).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("admin.legal.noFile")}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminLegal;
