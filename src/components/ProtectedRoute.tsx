import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "client" | "provider";

const ProtectedRoute: React.FC<{ allowedRoles: AppRole[] }> = ({ allowedRoles }) => {
  const { user, roles, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (!user) return <Navigate to="/login" />;

  const hasAccess = roles.some((r) => allowedRoles.includes(r));
  if (!hasAccess) return <Navigate to="/login" />;

  return <Outlet />;
};

export default ProtectedRoute;
