import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  open_in_pool: "default",
  in_progress: "secondary",
  waiting_for_client_approval: "outline",
  done: "default",
  closed_by_admin: "destructive",
};

const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchJobs = async () => {
    let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as any);
    const { data } = await query;
    if (data) setJobs(data);
  };

  useEffect(() => { fetchJobs(); }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Jobs Management</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="open_in_pool">Open in Pool</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_for_client_approval">Waiting Approval</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="closed_by_admin">Closed by Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((j) => (
            <TableRow key={j.id}>
              <TableCell className="font-medium">{j.business_name}</TableCell>
              <TableCell>{j.business_category}</TableCell>
              <TableCell><Badge variant={statusColors[j.status] as any}>{j.status.replace(/_/g, " ")}</Badge></TableCell>
              <TableCell>{new Date(j.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Link to={`/admin/jobs/${j.id}`}>
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminJobs;
