import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Building2, AlertTriangle } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ users: 0, jobs: 0, companies: 0, alerts: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [u, j, c, a] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("admin_alerts").select("id", { count: "exact", head: true }).eq("is_resolved", false),
      ]);
      setStats({ users: u.count || 0, jobs: j.count || 0, companies: c.count || 0, alerts: a.count || 0 });
    };
    fetch();
  }, []);

  const cards = [
    { labelKey: "admin.dashboard.totalUsers", value: stats.users, icon: Users, color: "text-primary" },
    { labelKey: "admin.dashboard.totalJobs", value: stats.jobs, icon: Briefcase, color: "text-primary" },
    { labelKey: "admin.dashboard.companies", value: stats.companies, icon: Building2, color: "text-primary" },
    { labelKey: "admin.dashboard.openAlerts", value: stats.alerts, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("admin.dashboard.title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.labelKey}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t(c.labelKey)}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
