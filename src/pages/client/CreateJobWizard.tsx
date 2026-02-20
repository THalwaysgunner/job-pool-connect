import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Upload, ChevronLeft, ChevronRight, Check } from "lucide-react";

const steps = ["Business Details", "Documents", "Payment Method", "Preview & Submit"];

const docTypes = [
  { value: "tax_payer", label: "Tax Payer Document" },
  { value: "bituah_leumi", label: "Bituah Leumi Document" },
  { value: "company_id_doc", label: "אישור פתיחת תיק עוסק מורשה" },
  { value: "bank_approval", label: "אישור ניהול חשבון" },
  { value: "other", label: "Other Documents" },
];

const CreateJobWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [businessDetails, setBusinessDetails] = useState({ name: "", category: "", details: "" });
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; path: string }[]>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("wire");
  const [armyAmount, setArmyAmount] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("companies").select("*").eq("client_user_id", user.id).eq("status", "approved").limit(1).single().then(({ data }) => setCompany(data));
  }, [user]);

  const handleDocUpload = async (docType: string, file: File) => {
    const path = `temp/${user!.id}/${docType}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("job-documents").upload(path, file);
    if (error) { toast({ title: "Upload error", description: error.message, variant: "destructive" }); return; }
    setUploadedDocs((prev) => ({
      ...prev,
      [docType]: [...(prev[docType] || []), { name: file.name, path }],
    }));
    toast({ title: `${file.name} uploaded` });
  };

  const handleSubmit = async () => {
    if (!company || !user) return;
    setSubmitting(true);
    try {
      const { data: job, error } = await supabase.from("jobs").insert({
        client_user_id: user.id,
        company_id: company.id,
        business_name: businessDetails.name,
        business_category: businessDetails.category,
        business_details: businessDetails.details,
        payment_method: paymentMethod as any,
        army_deposit_amount: paymentMethod === "army_deposit" ? parseFloat(armyAmount) : null,
        status: "open_in_pool",
      }).select().single();

      if (error) throw error;

      // Insert doc references
      const allDocs = Object.entries(uploadedDocs).flatMap(([type, files]) =>
        files.map((f) => ({ job_id: job.id, doc_type: type, file_name: f.name, file_path: f.path }))
      );
      if (allDocs.length > 0) {
        await supabase.from("job_documents").insert(allDocs);
      }

      toast({ title: "Job submitted to pool!" });
      navigate("/client/jobs");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) {
    return <div className="text-center text-muted-foreground p-8">You need an approved company to create a job.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Create New Job</h2>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`h-0.5 w-8 ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mb-4">{steps[step]}</p>

      {step === 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div><Label>Business Name</Label><Input value={businessDetails.name} onChange={(e) => setBusinessDetails({ ...businessDetails, name: e.target.value })} /></div>
            <div><Label>Business Category</Label><Input value={businessDetails.category} onChange={(e) => setBusinessDetails({ ...businessDetails, category: e.target.value })} /></div>
            <div><Label>Details</Label><Textarea value={businessDetails.details} onChange={(e) => setBusinessDetails({ ...businessDetails, details: e.target.value })} /></div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            {docTypes.map((dt) => (
              <div key={dt.value} className="border rounded-lg p-3">
                <p className="font-medium text-sm mb-2">{dt.label}</p>
                {(uploadedDocs[dt.value] || []).map((f, i) => (
                  <p key={i} className="text-sm text-muted-foreground">✓ {f.name}</p>
                ))}
                <Label className="cursor-pointer mt-2 inline-block">
                  <Button variant="outline" size="sm" asChild><span><Upload className="h-3 w-3 mr-1" />Upload</span></Button>
                  <Input type="file" className="hidden" multiple={dt.value === "other"} onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach((f) => handleDocUpload(dt.value, f)); }} />
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Label>How do you pay?</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2"><RadioGroupItem value="wire" id="wire" /><Label htmlFor="wire">Wire</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="credit_card" id="cc" /><Label htmlFor="cc">Credit Card</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="army_deposit" id="army" /><Label htmlFor="army">Army Deposit (פיקדון צבאי)</Label></div>
            </RadioGroup>
            {paymentMethod === "army_deposit" && (
              <div><Label>Amount Available</Label><Input type="number" value={armyAmount} onChange={(e) => setArmyAmount(e.target.value)} /></div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Preview</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Business:</span> {businessDetails.name}</p>
              <p><span className="text-muted-foreground">Category:</span> {businessDetails.category}</p>
              <p><span className="text-muted-foreground">Details:</span> {businessDetails.details}</p>
              <p><span className="text-muted-foreground">Payment:</span> {paymentMethod.replace(/_/g, " ")}</p>
              {paymentMethod === "army_deposit" && <p><span className="text-muted-foreground">Amount:</span> ₪{armyAmount}</p>}
              <p><span className="text-muted-foreground">Documents:</span> {Object.values(uploadedDocs).flat().length} files</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)}><ChevronRight className="h-4 w-4 ml-1" />Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit Job"}</Button>
        )}
      </div>
    </div>
  );
};

export default CreateJobWizard;
