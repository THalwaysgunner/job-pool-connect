import React, { useEffect, useState, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, Send, Check, AlertTriangle, Upload, MessageSquare, HelpCircle, CreditCard, Package, FileWarning, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageItem from "@/components/job/MessageItem";

const JobDetailPage: React.FC<{ role: "client" | "provider" | "admin" }> = ({ role }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const outletContext = useOutletContext<{ setPageTitle?: (t: string) => void }>();
  const [job, setJob] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, any>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [jobDocs, setJobDocs] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState<Record<string, string>>({});
  const [newPR, setNewPR] = useState({ title: "", amount: "", details: "" });
  const [disputeReason, setDisputeReason] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist seen counts in localStorage so they survive navigation/refresh
  const seenKey = (tab: string) => `job_seen_${id}_${tab}`;
  const getSeenCount = (tab: string): number => {
    const val = localStorage.getItem(seenKey(tab));
    return val !== null ? parseInt(val, 10) : -1; // -1 means never initialized
  };
  const setSeenCount = (tab: string, count: number) => {
    localStorage.setItem(seenKey(tab), String(count));
  };

  const fetchAll = async () => {
    if (!id) return;
    const [j, m, q, pr, d, dis, docs, rxn] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", id).single(),
      supabase.from("job_messages").select("*").eq("job_id", id).order("created_at"),
      supabase.from("job_questions").select("*").eq("job_id", id).order("created_at"),
      supabase.from("payment_requests").select("*").eq("job_id", id).order("created_at"),
      supabase.from("deliverables").select("*").eq("job_id", id),
      supabase.from("disputes").select("*").eq("job_id", id).order("created_at"),
      supabase.from("job_documents").select("*").eq("job_id", id),
      supabase.from("message_reactions").select("*"),
    ]);
    if (j.data) setJob(j.data);
    if (m.data) {
      setMessages(m.data);
      // Fetch sender profiles
      const uniqueIds = [...new Set(m.data.map((msg: any) => msg.sender_user_id))];
      if (uniqueIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", uniqueIds);
        if (profiles) {
          const map: Record<string, any> = {};
          profiles.forEach((p: any) => { map[p.user_id] = p; });
          setSenderProfiles(map);
        }
      }
    }
    if (q.data) setQuestions(q.data);
    if (pr.data) setPaymentRequests(pr.data);
    if (d.data) setDeliverables(d.data);
    if (dis.data) setDisputes(dis.data);
    if (docs.data) setJobDocs(docs.data);
    // Filter reactions to only messages in this job
    if (rxn.data && m.data) {
      const msgIds = new Set(m.data.map((msg: any) => msg.id));
      setReactions(rxn.data.filter((r: any) => msgIds.has(r.message_id)));
    }

    // First time ever visiting this job? Initialize seen counts
    if (getSeenCount("messages") === -1) setSeenCount("messages", m.data?.length ?? 0);
    if (getSeenCount("questions") === -1) setSeenCount("questions", q.data?.length ?? 0);
    if (getSeenCount("payments") === -1) setSeenCount("payments", pr.data?.length ?? 0);
  };

  useEffect(() => { fetchAll(); }, [id]);

  // Mark as seen ONLY when user clicks into the specific tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "messages") setSeenCount("messages", messages.length);
    if (tab === "questions") setSeenCount("questions", questions.length);
    if (tab === "payments") setSeenCount("payments", paymentRequests.length);
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // If user is already on the tab, keep seen count in sync (e.g. they send a message themselves)
  useEffect(() => {
    if (activeTab === "messages") setSeenCount("messages", messages.length);
  }, [messages.length]);
  useEffect(() => {
    if (activeTab === "questions") setSeenCount("questions", questions.length);
  }, [questions.length]);
  useEffect(() => {
    if (activeTab === "payments") setSeenCount("payments", paymentRequests.length);
  }, [paymentRequests.length]);

  // Realtime for messages, questions, payments, deliverables
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`job-detail-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_messages", filter: `job_id=eq.${id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "job_questions", filter: `job_id=eq.${id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_requests", filter: `job_id=eq.${id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "deliverables", filter: `job_id=eq.${id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const unreadMessages = Math.max(0, messages.length - getSeenCount("messages"));
  const unreadQuestions = Math.max(0, questions.length - getSeenCount("questions"));
  const unreadPayments = Math.max(0, paymentRequests.length - getSeenCount("payments"));

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;
    await supabase.from("job_messages").insert({ job_id: id, sender_user_id: user.id, message: newMessage });
    setNewMessage("");
  };

  const askQuestion = async () => {
    if (!newQuestion.trim() || !user || !id) return;
    await supabase.from("job_questions").insert({ job_id: id, provider_user_id: user.id, question: newQuestion });
    setNewQuestion("");
    fetchAll();
  };

  const answerQuestion = async (qId: string) => {
    const answer = newAnswer[qId];
    if (!answer?.trim()) return;
    await supabase.from("job_questions").update({ answer, status: "answered", answered_at: new Date().toISOString() }).eq("id", qId);
    setNewAnswer((p) => ({ ...p, [qId]: "" }));
    fetchAll();
  };

  const createPaymentRequest = async () => {
    if (!user || !id) return;
    await supabase.from("payment_requests").insert({ job_id: id, provider_user_id: user.id, title: newPR.title, amount: parseFloat(newPR.amount), details: newPR.details });
    setNewPR({ title: "", amount: "", details: "" });
    fetchAll();
  };

  const confirmPayment = async (prId: string) => {
    await supabase.from("payment_requests").update({ status: "paid_confirmed_by_client", confirmed_at: new Date().toISOString() }).eq("id", prId);
    fetchAll();
  };

  const markDone = async () => {
    await supabase.from("jobs").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", id);
    fetchAll();
  };

  const markWaitingApproval = async () => {
    await supabase.from("jobs").update({ status: "waiting_for_client_approval", waiting_approval_at: new Date().toISOString() }).eq("id", id);
    fetchAll();
  };

  const openDispute = async () => {
    if (!disputeReason.trim() || !user || !id) return;
    await supabase.from("disputes").insert({ job_id: id, client_user_id: user.id, reason: disputeReason });
    setDisputeReason("");
    fetchAll();
  };

  const isLocked = job?.status === "done" || job?.status === "closed_by_admin";

  const navItems = [
    { key: "summary", label: "Summary", icon: Info, badge: 0 },
    { key: "messages", label: "Messages", icon: MessageSquare, badge: unreadMessages },
    { key: "questions", label: "Q&A", icon: HelpCircle, badge: unreadQuestions },
    { key: "payments", label: "Payments", icon: CreditCard, badge: unreadPayments },
    { key: "deliverables", label: "Delivery", icon: Package, badge: 0 },
    ...(role === "client" ? [{ key: "disputes", label: "Disputes", icon: FileWarning, badge: 0 }] : []),
  ];

  // Sync active tab label to layout header
  useEffect(() => {
    const label = navItems.find((n) => n.key === activeTab)?.label ?? "";
    outletContext?.setPageTitle?.(label);
  }, [activeTab]);

  // Clear title on unmount
  useEffect(() => {
    return () => { outletContext?.setPageTitle?.(""); };
  }, []);

  if (!job) return <div className="p-4 text-muted-foreground">Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14))] -m-6">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages tab — full height chat */}
        {activeTab === "messages" && (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
              <div className="space-y-0">
                {(() => {
                  const topLevel = messages.filter((m) => !m.parent_message_id);
                  return topLevel.map((m, idx) => {
                    const msgDate = new Date(m.created_at);
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    const isToday = msgDate.toDateString() === today.toDateString();
                    const isYesterday = msgDate.toDateString() === yesterday.toDateString();
                    const dateStr = isToday ? "Today" : isYesterday ? "Yesterday" : msgDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
                    const prevTopLevel = idx > 0 ? topLevel[idx - 1] : null;
                    const prevDate = prevTopLevel ? new Date(prevTopLevel.created_at).toDateString() : null;
                    const showDateSep = idx === 0 || msgDate.toDateString() !== prevDate;
                    const msgReplies = messages.filter((r) => r.parent_message_id === m.id);
                    const msgReactions = reactions.filter((r) => r.message_id === m.id);

                    return (
                      <React.Fragment key={m.id}>
                        {showDateSep && (
                          <div className="flex items-center my-4 gap-3 px-4">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground border border-border px-3 py-1 rounded-full shrink-0">{dateStr}</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        )}
                        <MessageItem
                          message={m}
                          replies={msgReplies}
                          reactions={msgReactions}
                          senderProfiles={senderProfiles}
                          isLocked={isLocked}
                          jobId={id!}
                          onRefresh={fetchAll}
                          allMessages={messages}
                        />
                      </React.Fragment>
                    );
                  });
                })()}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            {!isLocked && (
              <div className="border-t p-4 flex gap-2 shrink-0 bg-background">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && sendMessage()} className="flex-1" />
                <Button onClick={sendMessage} size="icon" className="bg-[#0865ff] hover:bg-[#0865ff]/90 text-white"><Send className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
        )}

        {/* Summary tab */}
        {activeTab === "summary" && (
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Details:</span> {job.business_details}</p>
              <p><span className="text-muted-foreground">Payment:</span> {job.payment_method.replace(/_/g, " ")}</p>
              {job.army_deposit_amount && <p><span className="text-muted-foreground">Army Deposit:</span> ₪{job.army_deposit_amount}</p>}
              <Separator />
              <p className="font-medium">Documents ({jobDocs.length})</p>
              {jobDocs.map((d) => (
                <p key={d.id} className="text-muted-foreground">• {d.doc_type}: {d.file_name}</p>
              ))}
              <Separator />
              {role === "client" && job.status === "waiting_for_client_approval" && !isLocked && (
                <Button onClick={markDone}><Check className="h-4 w-4 mr-2" />Mark Done</Button>
              )}
              {role === "provider" && job.status === "in_progress" && !isLocked && (
                <Button onClick={markWaitingApproval}>Mark as Waiting for Approval</Button>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Q&A tab */}
        {activeTab === "questions" && (
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="border rounded-lg p-3">
                  <p className="font-medium text-sm">Q: {q.question}</p>
                  <Badge variant={q.status === "answered" ? "default" : "secondary"} className="mt-1">{q.status}</Badge>
                  {q.answer && <p className="text-sm mt-2">A: {q.answer}</p>}
                  {role === "client" && q.status === "open" && !isLocked && (
                    <div className="flex gap-2 mt-2">
                      <Input value={newAnswer[q.id] || ""} onChange={(e) => setNewAnswer((p) => ({ ...p, [q.id]: e.target.value }))} placeholder="Your answer..." />
                      <Button size="sm" onClick={() => answerQuestion(q.id)}>Answer</Button>
                    </div>
                  )}
                </div>
              ))}
              {role === "provider" && !isLocked && (
                <div className="flex gap-2">
                  <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Ask the client..." />
                  <Button onClick={askQuestion}>Ask</Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Payments tab */}
        {activeTab === "payments" && (
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {paymentRequests.map((pr) => (
                <div key={pr.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{pr.title}</p>
                      <p className="text-sm text-muted-foreground">{pr.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₪{pr.amount}</p>
                      <Badge variant={pr.status === "paid_confirmed_by_client" ? "default" : "secondary"}>{pr.status.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  {role === "client" && pr.status === "sent" && !isLocked && (
                    <Button size="sm" className="mt-2" onClick={() => confirmPayment(pr.id)}>Mark as Paid</Button>
                  )}
                </div>
              ))}
              {role === "provider" && !isLocked && (
                <div className="space-y-2 border-t pt-4">
                  <Input placeholder="Title" value={newPR.title} onChange={(e) => setNewPR({ ...newPR, title: e.target.value })} />
                  <Input type="number" placeholder="Amount" value={newPR.amount} onChange={(e) => setNewPR({ ...newPR, amount: e.target.value })} />
                  <Textarea placeholder="Details" value={newPR.details} onChange={(e) => setNewPR({ ...newPR, details: e.target.value })} />
                  <Button onClick={createPaymentRequest}>Create Payment Request</Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Deliverables tab */}
        {activeTab === "deliverables" && (
          <ScrollArea className="flex-1 p-6">
            <DeliverableSection role={role} jobId={id!} deliverables={deliverables} isLocked={isLocked} onRefresh={fetchAll} />
          </ScrollArea>
        )}

        {/* Disputes tab */}
        {activeTab === "disputes" && role === "client" && (
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {disputes.map((d) => (
                <div key={d.id} className="border rounded-lg p-3">
                  <p className="text-sm">{d.reason}</p>
                  <Badge variant={d.status === "resolved" ? "default" : "destructive"} className="mt-1">{d.status}</Badge>
                  {d.resolution && <p className="text-sm mt-2 text-muted-foreground">Resolution: {d.resolution}</p>}
                </div>
              ))}
              {!isLocked && (
                <div className="flex gap-2">
                  <Textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Describe the issue..." />
                  <Button onClick={openDispute} className="shrink-0"><AlertTriangle className="h-4 w-4 mr-1" />Open Dispute</Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="w-64 border-l bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        {/* Company info — centered */}
        <div className="px-4 pt-6 pb-4 flex flex-col items-center text-center border-b border-sidebar-border">
          <h2 className="font-bold text-lg text-sidebar-primary truncate max-w-full">{job.business_name}</h2>
          <p className="text-sm text-muted-foreground truncate max-w-full">{job.business_category}</p>
        </div>

        {/* Nav grid */}
        <nav className="flex-1 px-4 pt-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl p-4 text-sm font-medium transition-colors border ${activeTab === item.key ? "bg-[#0865ff] text-white border-[#0865ff]" : "bg-background text-muted-foreground border-border hover:bg-[#0865ff]/10 hover:border-[#0865ff] hover:text-[#0865ff]"}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold px-1">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Status badge at bottom */}
        <div className="p-4 flex justify-center">
          <Badge
            variant="outline"
            className={`text-xs px-4 py-1.5 rounded-full capitalize ${
              job.status === "done" ? "border-green-500 text-green-600 bg-green-50" :
              job.status === "in_progress" ? "border-yellow-500 text-yellow-600 bg-yellow-50" :
              job.status === "waiting_for_client_approval" ? "border-blue-500 text-blue-600 bg-blue-50" :
              job.status === "closed_by_admin" ? "border-destructive text-destructive bg-destructive/10" :
              "border-muted-foreground text-muted-foreground"
            }`}
          >
            {job.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </aside>
    </div>
  );
};

// Deliverables sub-component
const DeliverableSection: React.FC<{ role: string; jobId: string; deliverables: any[]; isLocked: boolean; onRefresh: () => void }> = ({ role, jobId, deliverables, isLocked, onRefresh }) => {
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteCreds, setWebsiteCreds] = useState("");

  const uploadDeliverable = async (type: string, file: File) => {
    const path = `${jobId}/${type}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("deliverables").upload(path, file);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("deliverables").insert({ job_id: jobId, deliverable_type: type, file_name: file.name, file_path: path });
    onRefresh();
  };

  const saveWebsite = async () => {
    await supabase.from("deliverables").insert({ job_id: jobId, deliverable_type: "website", website_url: websiteUrl, website_credentials: websiteCreds });
    setWebsiteUrl("");
    setWebsiteCreds("");
    onRefresh();
  };

  const downloadFile = async (path: string, name: string) => {
    const { data } = await supabase.storage.from("deliverables").download(path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const types = [
    { value: "website", label: "Website Delivery" },
    { value: "strategy_plan", label: "3-Month Strategy Plan" },
    { value: "ads_plan", label: "Ads Plan & Timeline" },
    { value: "invoice", label: "Paid Invoice (חשבונית)" },
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {types.map((t) => {
          const items = deliverables.filter((d) => d.deliverable_type === t.value);
          return (
            <div key={t.value} className="border rounded-lg p-3">
              <p className="font-medium text-sm mb-2">{t.label}</p>
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm mb-1">
                  {item.website_url ? (
                    <div>
                      <p>URL: <a href={item.website_url} target="_blank" rel="noreferrer" className="text-primary underline">{item.website_url}</a></p>
                      {item.website_credentials && <p className="text-muted-foreground">Credentials: {item.website_credentials}</p>}
                    </div>
                  ) : (
                    <span>{item.file_name}</span>
                  )}
                  {item.file_path && (
                    <Button variant="ghost" size="sm" onClick={() => downloadFile(item.file_path, item.file_name)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {role === "provider" && !isLocked && (
                <>
                  {t.value === "website" ? (
                    <div className="space-y-2 mt-2">
                      <Input placeholder="Website URL" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                      <Input placeholder="Access credentials (optional)" value={websiteCreds} onChange={(e) => setWebsiteCreds(e.target.value)} />
                      <Button size="sm" onClick={saveWebsite}>Save</Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer mt-2 inline-block">
                      <Button variant="outline" size="sm" asChild><span><Upload className="h-3 w-3 mr-1" />Upload</span></Button>
                      <Input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadDeliverable(t.value, e.target.files[0]); }} />
                    </label>
                  )}
                </>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default JobDetailPage;
