import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Briefcase, Building2, PlusCircle } from "lucide-react";

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
        <h2 className="text-2xl font-bold">Client Dashboard</h2>
        {canCreateJob && (
          <Link to="/client/jobs/new">
            <Button><PlusCircle className="h-4 w-4 mr-2" />New Job</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Company Status</CardTitle>
            <Building2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {company ? (
              <div>
                <p className="text-lg font-semibold">{company.business_name}</p>
                <Badge variant={company.status === "approved" ? "default" : "secondary"}>{company.status.replace(/_/g, " ")}</Badge>
                {company.status === "rejected" && company.rejection_reason && (
                  <p className="text-sm text-destructive mt-2">{company.rejection_reason}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">No company registered</p>
                <Link to="/client/company"><Button size="sm" variant="outline" className="mt-2">Register Company</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{jobs.length}</div></CardContent>
        </Card>
      </div>

      {!canCreateJob && company && company.status !== "approved" && (
        <Card className="border-dashed">
          <CardContent className="p-4 text-center text-muted-foreground">
            Your company must be approved before you can create jobs.
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
