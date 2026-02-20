import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user?.id}` }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    fetchNotifications();
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.is_read) {
      setNotifications((prev) => prev.map((notif) => notif.id === n.id ? { ...notif, is_read: true } : notif));
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center p-0 text-xs" variant="destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">{t("notifications.title")}</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>{t("notifications.markAllRead")}</Button>
          )}
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">{t("notifications.empty")}</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 border-b last:border-0 cursor-pointer hover:bg-accent/80 transition-colors ${!n.is_read ? "bg-accent/50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-[#0865ff] shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
