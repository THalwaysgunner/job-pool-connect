import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"];

interface MessageItemProps {
  message: any;
  replies: any[];
  reactions: any[];
  senderProfiles: Record<string, any>;
  isLocked: boolean;
  jobId: string;
  onRefresh: () => void;
  allMessages: any[];
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  replies,
  reactions,
  senderProfiles,
  isLocked,
  jobId,
  onRefresh,
  allMessages,
}) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [hovered, setHovered] = useState(false);

  const isMine = message.sender_user_id === user?.id;
  const profile = senderProfiles[message.sender_user_id];
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const timeStr = new Date(message.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Group reactions by emoji
  const reactionGroups: Record<string, { count: number; userReacted: boolean; users: string[] }> = {};
  reactions.forEach((r) => {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = { count: 0, userReacted: false, users: [] };
    }
    reactionGroups[r.emoji].count++;
    if (r.user_id === user?.id) reactionGroups[r.emoji].userReacted = true;
    const p = senderProfiles[r.user_id];
    reactionGroups[r.emoji].users.push(p?.full_name || "Unknown");
  });

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const existing = reactions.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("message_reactions").insert({
        message_id: message.id,
        user_id: user.id,
        emoji,
      });
    }
    onRefresh();
  };

  const sendReply = async () => {
    if (!replyText.trim() || !user) return;
    await supabase.from("job_messages").insert({
      job_id: jobId,
      sender_user_id: user.id,
      message: replyText,
      parent_message_id: message.id,
    });
    setReplyText("");
    onRefresh();
  };

  const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
  const lastReplyProfile = lastReply ? senderProfiles[lastReply.sender_user_id] : null;
  const lastReplyInitials = lastReplyProfile?.full_name
    ? lastReplyProfile.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main message row */}
      <div className="flex items-start gap-2 py-1 px-4 hover:bg-muted/40 transition-colors">
        <div
          className={`h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
            isMine ? "bg-[#0865ff]/20 text-[#0865ff]" : "bg-muted text-muted-foreground"
          }`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-bold ${isMine ? "text-[#0865ff]" : "text-foreground"}`}>
              {profile?.full_name || "Unknown"}
            </span>
            <span className="text-[11px] text-muted-foreground">{timeStr}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap text-foreground">{message.message}</p>

          {/* Reactions display */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactionGroups).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                    data.userReacted
                      ? "bg-[#0865ff]/10 border-[#0865ff]/40 text-[#0865ff]"
                      : "bg-muted border-border text-muted-foreground hover:border-[#0865ff]/40"
                  }`}
                  title={data.users.join(", ")}
                >
                  <span>{emoji}</span>
                  <span>{data.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Thread preview (collapsed) */}
          {replies.length > 0 && !showReplies && (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-2 mt-1.5 text-xs text-[#0865ff] hover:underline"
            >
              <div className="h-5 w-5 rounded shrink-0 bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                {lastReplyInitials}
              </div>
              <span className="font-semibold">
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </span>
              {lastReply && (
                <span className="text-muted-foreground">
                  Last reply{" "}
                  {formatRelativeTime(new Date(lastReply.created_at))}
                </span>
              )}
            </button>
          )}

          {/* Expanded thread */}
          {showReplies && (
            <div className="mt-2 ml-0 border-l-2 border-[#0865ff]/20 pl-3 space-y-1">
              {replies.map((r) => {
                const rProfile = senderProfiles[r.sender_user_id];
                const rInitials = rProfile?.full_name
                  ? rProfile.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                  : "?";
                const rIsMine = r.sender_user_id === user?.id;
                const rTime = new Date(r.created_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                return (
                  <div key={r.id} className="flex items-start gap-2 py-1 hover:bg-muted/40 rounded px-1 -mx-1 transition-colors">
                    <div
                      className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-semibold ${
                        rIsMine ? "bg-[#0865ff]/20 text-[#0865ff]" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {rInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-bold ${rIsMine ? "text-[#0865ff]" : "text-foreground"}`}>
                          {rProfile?.full_name || "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{rTime}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-foreground">{r.message}</p>
                    </div>
                  </div>
                );
              })}
              {!isLocked && (
                <div className="flex gap-2 pt-1">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  />
                  <Button size="sm" className="h-8 bg-[#0865ff] hover:bg-[#0865ff]/90 text-white" onClick={sendReply}>
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <button
                onClick={() => setShowReplies(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Hide replies
              </button>
            </div>
          )}
        </div>

        {/* Hover action buttons */}
        {hovered && !isLocked && (
          <div className="absolute top-0 right-4 -translate-y-1/2 flex items-center gap-0.5 bg-background border border-border rounded-md shadow-sm px-1 py-0.5">
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 rounded hover:bg-muted transition-colors" title="Add reaction">
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top" align="end">
                <div className="flex gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(emoji)}
                      className="text-lg hover:bg-muted p-1 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <button
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Reply"
              onClick={() => setShowReplies(true)}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

export default MessageItem;
