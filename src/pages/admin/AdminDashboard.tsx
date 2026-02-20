import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Building2, AlertTriangle } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, jobs: 0, companies: 0, alerts: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [u, j, c, a] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("admin_alerts").select("id", { count: "exact", head: true }).eq("is_resolved", false),
      ]);
      setStats({
        users: u.count || 0,
        jobs: j.count || 0,
        companies: c.count || 0,
        alerts: a.count || 0,
      });
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Total Jobs", value: stats.jobs, icon: Briefcase, color: "text-primary" },
    { label: "Companies", value: stats.companies, icon: Building2, color: "text-primary" },
    { label: "Open Alerts", value: stats.alerts, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
