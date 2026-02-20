import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, User, LogOut, Settings } from "lucide-react";
import { Language, languageNames } from "@/i18n/translations";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const HeaderActions: React.FC = () => {
  const { signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      {/* Language */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" title={t("header.language")}>
            <Globe className="h-5 w-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {(Object.keys(languageNames) as Language[]).map((lang) => (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={language === lang ? "bg-accent font-semibold" : ""}
            >
              {languageNames[lang]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <NotificationBell />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <User className="h-5 w-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem>
            <Settings className="h-4 w-4 me-2" />
            {t("header.accountSettings")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="h-4 w-4 me-2" />
            {t("header.logOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HeaderActions;
