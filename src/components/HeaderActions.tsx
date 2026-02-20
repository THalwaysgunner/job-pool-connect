import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Globe, User, LogOut, Settings } from "lucide-react";
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
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1">
      {/* Language */}
      <Button variant="ghost" size="icon" className="h-9 w-9" title="Language">
        <Globe className="h-5 w-5 text-muted-foreground" />
      </Button>

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
          <DropdownMenuItem onClick={() => navigate("/client/settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HeaderActions;
