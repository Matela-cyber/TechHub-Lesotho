
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import React from "react";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, error, role, roleLoading, roleError } = useAuth();
  const location = useLocation();

  if (loading || roleLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error || roleError) {
    return <div>Error: {error?.message || roleError?.message}</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
