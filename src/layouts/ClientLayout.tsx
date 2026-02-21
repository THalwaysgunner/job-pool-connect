import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Briefcase, Settings } from "lucide-react";
import HeaderActions from "@/components/HeaderActions";

const navItems = [
  { labelKey: "nav.dashboard", path: "/client", icon: LayoutDashboard },
  { labelKey: "nav.myJobs", path: "/client/jobs", icon: Briefcase },
  { labelKey: "nav.settings", path: "/client/settings", icon: Settings },
];

const ClientLayout: React.FC = () => {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState("");

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-e bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
          <h1 className="text-lg font-bold text-sidebar-primary">{t("client.panel")}</h1>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button variant={location.pathname.startsWith(item.path) && (item.path !== "/client" || location.pathname === "/client") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> {t("nav.signOut")}
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold">{pageTitle}</h2>
          <HeaderActions />
        </header>
        <main className="flex-1 p-6 overflow-y-auto text-start">
          <Outlet context={{ setPageTitle }} />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
