import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, LayoutDashboard, Layers, Briefcase } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { label: "Dashboard", path: "/provider", icon: LayoutDashboard },
  { label: "Job Pool", path: "/provider/pool", icon: Layers },
  { label: "My Jobs", path: "/provider/jobs", icon: Briefcase },
];

const ProviderLayout: React.FC = () => {
  const [pageTitle, setPageTitle] = useState("");
  const { signOut } = useAuth();
  const location = useLocation();
  const [poolCount, setPoolCount] = useState(0);

  useEffect(() => {
    const fetchPoolCount = async () => {
      const { count } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "open_in_pool");
      setPoolCount(count || 0);
    };

    fetchPoolCount();

    const channel = supabase
      .channel("pool-count-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        fetchPoolCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
          <h1 className="text-lg font-bold text-sidebar-primary">Provider Panel</h1>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button variant={location.pathname === item.path ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.path === "/provider/pool" && poolCount > 0 && (
                  <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center p-0 text-xs">
                    {poolCount}
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold">{pageTitle}</h2>
          <NotificationBell />
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ setPageTitle }} />
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;
