import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  console.log("PROTECTED ROUTE", {
    isLoading,
    userId: user?.id,
    role,
    pathname: location.pathname,
  });

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        LOADING AUTH...
      </div>
    );
  }

  if (!user) {
    console.log("REDIRECT LOGIN");

    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (role === "client" && location.pathname !== "/portal") {
    console.log("REDIRECT PORTAL");

    return <Navigate to="/portal" replace />;
  }

  console.log("RENDER OUTLET");

  return <Outlet />;
};

export default ProtectedRoute;