"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Building2, LogIn, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const LoginPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirection stable : attend que l'auth soit chargée avant de rediriger
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showError(`Erreur: ${error.message}`);
      } else {
        showSuccess("Connexion réussie !");
        // Note: La redirection vers "/" est gérée par le useEffect ci-dessus
      }
    } catch (err) {
      showError("Une erreur s'est produite lors de la connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Pendant le chargement initial de Supabase
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // 2. Si l'utilisateur est déjà connecté, on ne rend rien (le useEffect redirige)
  if (user) return null;

  // 3. Affichage du formulaire de connexion
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-none overflow-hidden">
        <div className="h-2 bg-blue-600 w-full" />
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="mx-auto bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">
            GMAO DYAD
          </CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à votre espace de gestion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                required
                className="rounded-xl h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="rounded-xl h-11 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Se connecter
            </Button>
            <p className="text-center text-sm text-slate-600 mt-4">
              Pas encore de compte ?{" "}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                S'inscrire
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;