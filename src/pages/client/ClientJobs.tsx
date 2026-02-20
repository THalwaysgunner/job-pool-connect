import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const ClientJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("jobs").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setJobs(data); });
  }, [user]);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background pb-4">
        <h2 className="text-2xl font-bold">My Jobs</h2>
      </div>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground">No jobs yet.</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <Link key={j.id} to={`/client/jobs/${j.id}`}>
              <Card className="cursor-pointer hover:bg-accent/30 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{j.business_name}</p>
                    <p className="text-sm text-muted-foreground">{j.business_category}</p>
                  </div>
                  <Badge>{j.status.replace(/_/g, " ")}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientJobs;
