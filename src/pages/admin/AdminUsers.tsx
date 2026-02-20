import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const AdminUsers: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "client" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (!profiles) return;
    const { data: roles } = await supabase.from("user_roles").select("*");
    const merged = profiles.map((p: any) => ({
      ...p,
      roles: (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
    }));
    setUsers(merged);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("create-user", { body: form });
      if (res.error) throw new Error(res.error.message);
      toast({ title: t("admin.users.userCreated") });
      setOpen(false);
      setForm({ email: "", password: "", full_name: "", role: "client" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: t("generic.error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const roleBadgeVariant = (role: string) => {
    if (role === "admin") return "destructive";
    if (role === "provider") return "secondary";
    return "default";
  };

  const translateRole = (role: string) => t(`admin.users.${role}`) || role;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("admin.users.title")}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-2" />{t("admin.users.createUser")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("admin.users.createNewUser")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t("admin.users.fullName")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>{t("admin.users.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>{t("admin.users.password")}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div>
                <Label>{t("admin.users.role")}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">{t("admin.users.client")}</SelectItem>
                    <SelectItem value="provider">{t("admin.users.provider")}</SelectItem>
                    <SelectItem value="admin">{t("admin.users.admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={submitting}>{submitting ? t("admin.users.creating") : t("admin.users.createUser")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.users.name")}</TableHead>
            <TableHead>{t("admin.users.email")}</TableHead>
            <TableHead>{t("admin.users.role")}</TableHead>
            <TableHead>{t("admin.users.created")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {u.roles.map((r: string) => (
                    <Badge key={r} variant={roleBadgeVariant(r) as any}>{translateRole(r)}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminUsers;
