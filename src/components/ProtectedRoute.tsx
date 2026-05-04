import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, role, isLoading, hasRole } = useAuth();
  const location = useLocation();

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

  // SÉCURITÉ : Redirection si un Gestionnaire de Stock tente d'accéder aux modules techniques
  const techRoutes = ['/work-orders', '/interventions', '/assets', '/planning'];
  if (role === 'gestionnaire de stock' && techRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  // SÉCURITÉ : Redirection si un Technicien tente d'accéder au Stock
  const stockRoutes = ['/inventory', '/reagents'];
  if (role === 'technicien biomedical' && stockRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;