import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Send, Check, AlertTriangle, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const JobDetailPage: React.FC<{ role: "client" | "provider" | "admin" }> = ({ role }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [jobDocs, setJobDocs] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState<Record<string, string>>({});
  const [newPR, setNewPR] = useState({ title: "", amount: "", details: "" });
  const [disputeReason, setDisputeReason] = useState("");

  const fetchAll = async () => {
    if (!id) return;
    const [j, m, q, pr, d, dis, docs] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", id).single(),
      supabase.from("job_messages").select("*").eq("job_id", id).order("created_at"),
      supabase.from("job_questions").select("*").eq("job_id", id).order("created_at"),
      supabase.from("payment_requests").select("*").eq("job_id", id).order("created_at"),
      supabase.from("deliverables").select("*").eq("job_id", id),
      supabase.from("disputes").select("*").eq("job_id", id).order("created_at"),
      supabase.from("job_documents").select("*").eq("job_id", id),
    ]);
    if (j.data) setJob(j.data);
    if (m.data) setMessages(m.data);
    if (q.data) setQuestions(q.data);
    if (pr.data) setPaymentRequests(pr.data);
    if (d.data) setDeliverables(d.data);
    if (dis.data) setDisputes(dis.data);
    if (docs.data) setJobDocs(docs.data);
  };

  useEffect(() => { fetchAll(); }, [id]);

  // Realtime messages
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`job-messages-${id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "job_messages", filter: `job_id=eq.${id}` }, () => fetchAll()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

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

  if (!job) return <div className="p-4 text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{job.business_name}</h2>
          <p className="text-muted-foreground">{job.business_category}</p>
        </div>
        <Badge className="text-sm">{job.status.replace(/_/g, " ")}</Badge>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="questions">Q&A</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          {role === "client" && <TabsTrigger value="disputes">Disputes</TabsTrigger>}
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardContent className="p-6 space-y-3 text-sm">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-80 mb-4">
                {messages.map((m) => (
                  <div key={m.id} className={`mb-3 p-2 rounded ${m.sender_user_id === user?.id ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
                    <p className="text-sm">{m.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </ScrollArea>
              {!isLocked && (
                <div className="flex gap-2">
                  <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardContent className="p-4 space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-4 space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables">
          <DeliverableSection role={role} jobId={id!} deliverables={deliverables} isLocked={isLocked} onRefresh={fetchAll} />
        </TabsContent>

        {role === "client" && (
          <TabsContent value="disputes">
            <Card>
              <CardContent className="p-4 space-y-4">
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
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
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
