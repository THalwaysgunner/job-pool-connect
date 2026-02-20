import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Briefcase, PlusCircle } from "lucide-react";

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("companies").select("*").eq("client_user_id", user.id).limit(1).single().then(({ data }) => setCompany(data));
    supabase.from("jobs").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setJobs(data); });
  }, [user]);

  const canCreateJob = company?.status === "approved";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        {canCreateJob && (
          <Link to="/client/jobs/new">
            <Button><PlusCircle className="h-4 w-4 mr-2" />New Job</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{jobs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{jobs.filter(j => j.status === "in_progress").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{jobs.filter(j => j.status === "done").length}</div></CardContent>
        </Card>
      </div>

      {!canCreateJob && (
        <Card className="border-dashed mb-6">
          <CardContent className="p-4 text-center text-muted-foreground">
            {!company
              ? <>You need to register a company first. Go to <Link to="/client/settings" className="text-primary underline">Settings → Company</Link> to get started.</>
              : company.status !== "approved"
                ? <>Your company is pending approval. You can create jobs once it's approved.</>
                : null
            }
          </CardContent>
        </Card>
      )}

      {jobs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent Jobs</h3>
          <div className="space-y-2">
            {jobs.slice(0, 5).map((j) => (
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
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
