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

const steps = ["Business Details", "Payment Method", "Preview & Submit"];


const CreateJobWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [businessDetails, setBusinessDetails] = useState({ category: "", details: "" });
  const [paymentMethod, setPaymentMethod] = useState<string>("wire");
  const [armyAmount, setArmyAmount] = useState("");

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
            <div><Label>Business Name</Label><Input value={company.business_name} disabled className="bg-muted" /></div>
            <div><Label>Business Category</Label><Input value={businessDetails.category} onChange={(e) => setBusinessDetails({ ...businessDetails, category: e.target.value })} /></div>
            <div><Label>Details</Label><Textarea value={businessDetails.details} onChange={(e) => setBusinessDetails({ ...businessDetails, details: e.target.value })} /></div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
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

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Preview</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Business:</span> {company.business_name}</p>
              <p><span className="text-muted-foreground">Category:</span> {businessDetails.category}</p>
              <p><span className="text-muted-foreground">Details:</span> {businessDetails.details}</p>
              <p><span className="text-muted-foreground">Payment:</span> {paymentMethod.replace(/_/g, " ")}</p>
              {paymentMethod === "army_deposit" && <p><span className="text-muted-foreground">Amount:</span> ₪{armyAmount}</p>}
              
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
