import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const CreateJobWizard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [businessDetails, setBusinessDetails] = useState({ category: "", details: "" });
  const [paymentMethod, setPaymentMethod] = useState<string>("wire");
  const [armyAmount, setArmyAmount] = useState("");

  const steps = [t("wizard.step1"), t("wizard.step2"), t("wizard.step3")];

  useEffect(() => {
    if (!user) return;
    supabase.from("companies").select("*").eq("client_user_id", user.id).eq("status", "approved").limit(1).single().then(({ data }) => setCompany(data));
  }, [user]);

  const handleSubmit = async () => {
    if (!company || !user) return;
    setSubmitting(true);
    try {
      const { data: job, error } = await supabase.from("jobs").insert({
        client_user_id: user.id,
        company_id: company.id,
        business_name: company.business_name,
        business_category: businessDetails.category,
        business_details: businessDetails.details,
        payment_method: paymentMethod as any,
        army_deposit_amount: paymentMethod === "army_deposit" ? parseFloat(armyAmount) : null,
        status: "open_in_pool",
      }).select().single();
      if (error) throw error;
      toast({ title: t("wizard.jobSubmitted") });
      navigate("/client/jobs");
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) {
    return <div className="text-center text-muted-foreground p-8">{t("wizard.needApprovedCompany")}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">{t("wizard.title")}</h2>

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
            <div><Label>{t("wizard.businessName")}</Label><Input value={company.business_name} disabled className="bg-muted" /></div>
            <div><Label>{t("wizard.businessCategory")}</Label><Input value={businessDetails.category} onChange={(e) => setBusinessDetails({ ...businessDetails, category: e.target.value })} /></div>
            <div><Label>{t("wizard.details")}</Label><Textarea value={businessDetails.details} onChange={(e) => setBusinessDetails({ ...businessDetails, details: e.target.value })} /></div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Label>{t("wizard.howDoYouPay")}</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2"><RadioGroupItem value="wire" id="wire" /><Label htmlFor="wire">{t("wizard.wire")}</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="credit_card" id="cc" /><Label htmlFor="cc">{t("wizard.creditCard")}</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="army_deposit" id="army" /><Label htmlFor="army">{t("wizard.armyDeposit")}</Label></div>
            </RadioGroup>
            {paymentMethod === "army_deposit" && (
              <div><Label>{t("wizard.amountAvailable")}</Label><Input type="number" value={armyAmount} onChange={(e) => setArmyAmount(e.target.value)} /></div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">{t("wizard.preview")}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">{t("wizard.business")}:</span> {company.business_name}</p>
              <p><span className="text-muted-foreground">{t("wizard.category")}:</span> {businessDetails.category}</p>
              <p><span className="text-muted-foreground">{t("wizard.details")}:</span> {businessDetails.details}</p>
              <p><span className="text-muted-foreground">{t("wizard.payment")}:</span> {paymentMethod.replace(/_/g, " ")}</p>
              {paymentMethod === "army_deposit" && <p><span className="text-muted-foreground">{t("wizard.amount")}:</span> ₪{armyAmount}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}><ChevronLeft className="h-4 w-4 me-1" />{t("wizard.back")}</Button>
        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)}>{t("wizard.next")}<ChevronRight className="h-4 w-4 ms-1" /></Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? t("wizard.submitting") : t("wizard.submitJob")}</Button>
        )}
      </div>
    </div>
  );
};

export default CreateJobWizard;
