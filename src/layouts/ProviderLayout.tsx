import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Layers, Briefcase } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { label: "Dashboard", path: "/provider", icon: LayoutDashboard },
  { label: "Job Pool", path: "/provider/pool", icon: Layers },
  { label: "My Jobs", path: "/provider/jobs", icon: Briefcase },
];

const ProviderLayout: React.FC = () => {
  const { signOut } = useAuth();
  const location = useLocation();

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
        <header className="h-14 border-b flex items-center justify-end px-6 gap-4 shrink-0">
          <NotificationBell />
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;
