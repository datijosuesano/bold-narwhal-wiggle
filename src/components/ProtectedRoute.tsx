import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  // Ne pas rediriger si on est sur le portail public
  if (location.pathname === '/portal') {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    ); 
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // REDIRECTION SPÉCIFIQUE CLIENT (Services Hospitaliers)
  if (role === 'client' && location.pathname !== '/portal') {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;