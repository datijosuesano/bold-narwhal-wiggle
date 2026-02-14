"use client";

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Building2, LogIn, Loader2, ShieldAlert } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const LoginPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showError(`Erreur: ${error.message}`);
      setIsSubmitting(false);
    } else {
      showSuccess("Connexion réussie !");
      navigate("/");
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    // Simulation pour la démo Dyad
    localStorage.setItem('dyad_fake_auth_token', 'fake-jwt-token-for-dyad-demo');
    window.location.reload(); 
  };

  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;

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
            Plateforme de gestion technique centralisée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Professionnel</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="nom@entreprise.com" 
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
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
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
              Se connecter
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold">Mode Démonstration</span>
            </div>
          </div>

          <Button 
            onClick={handleDemoLogin} 
            variant="outline"
            className="w-full h-11 rounded-xl border-dashed border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Utiliser le compte Démo
          </Button>
          
          <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 leading-tight">
              L'accès est restreint au personnel autorisé. Toute tentative de connexion non autorisée est enregistrée.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;