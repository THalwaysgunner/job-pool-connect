import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const ProviderPool: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();

  const fetchPool = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("status", "open_in_pool").order("created_at", { ascending: false });
    if (data) setJobs(data);
  };

  useEffect(() => { fetchPool(); }, []);

  const claimJob = async (jobId: string) => {
    if (!user) return;
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_job", { _job_id: jobId, _provider_id: user.id });
      if (error) throw error;
      if (data) {
        toast({ title: t("job.jobAssigned") });
        setPreview(null);
        fetchPool();
      } else {
        toast({ title: t("job.jobAlreadyAssigned"), description: t("job.anotherProviderTook"), variant: "destructive" });
        fetchPool();
      }
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("nav.jobPool")}</h2>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground">{t("job.noJobsInPool")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Card key={j.id}>
              <CardHeader>
                <CardTitle className="text-base">{j.business_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{j.business_category}</p>
                <p className="text-sm mb-3 line-clamp-2">{j.business_details}</p>
                <div className="flex items-center justify-between">
                  <Badge>{t("status.open_in_pool")}</Badge>
                  <Button size="sm" onClick={() => setPreview(j)}>{t("job.openPreview")}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-lg">
          {preview && (
            <>
              <DialogHeader><DialogTitle>{preview.business_name}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <p><span className="text-muted-foreground">{t("job.category")}:</span> {preview.business_category}</p>
                <p><span className="text-muted-foreground">{t("job.details")}:</span> {preview.business_details}</p>
                <p><span className="text-muted-foreground">{t("job.payment")}:</span> {preview.payment_method.replace(/_/g, " ")}</p>
                <p><span className="text-muted-foreground">{t("job.created")}:</span> {new Date(preview.created_at).toLocaleDateString()}</p>
              </div>
              <Button className="w-full mt-4" onClick={() => claimJob(preview.id)} disabled={claiming}>
                {claiming ? t("job.claiming") : t("job.claimJob")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderPool;
