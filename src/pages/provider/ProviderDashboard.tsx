import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [poolCount, setPoolCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("jobs").select("*").eq("provider_user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setMyJobs(data); });
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open_in_pool").then(({ count }) => setPoolCount(count || 0));
  }, [user]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Provider Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Jobs</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{myJobs.length}</div></CardContent>
        </Card>
        <Link to="/provider/pool">
          <Card className="cursor-pointer hover:bg-accent/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jobs in Pool</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{poolCount}</div></CardContent>
          </Card>
        </Link>
      </div>
      {myJobs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent Jobs</h3>
          <div className="space-y-2">
            {myJobs.slice(0, 5).map((j) => (
              <Link key={j.id} to={`/provider/jobs/${j.id}`}>
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

export default ProviderDashboard;
