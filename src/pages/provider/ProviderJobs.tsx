import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const ProviderJobs: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("jobs").select("*").eq("provider_user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setJobs(data); });
  }, [user]);

  const translateStatus = (status: string) => t(`status.${status}`) || status.replace(/_/g, " ");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("nav.myJobs")}</h2>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground">{t("job.noAssignedJobs")}</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <Link key={j.id} to={`/provider/jobs/${j.id}`}>
              <Card className="cursor-pointer hover:bg-accent/30 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{j.business_name}</p>
                    <p className="text-sm text-muted-foreground">{j.business_category}</p>
                  </div>
                  <Badge>{translateStatus(j.status)}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderJobs;
