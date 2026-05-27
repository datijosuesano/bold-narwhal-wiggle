"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Building2, UserPlus, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsSubmitting(true);
  setErrorMessage(null);

  try {

    let finalSpecialite = specialty;

    if (!finalSpecialite) {
      finalSpecialite = "Biomédical";
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          specialite: finalSpecialite,
          site_name: null
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      showSuccess("Compte créé avec succès !");
      navigate("/login");
    }

  } catch (err: any) {

    console.error(err);

    const message =
      err?.message ||
      "Erreur lors de l'inscription.";

    setErrorMessage(message);

    showError(message);

  } finally {
    setIsSubmitting(false);
  }
};

      if (error) {
        throw error;
      }

      if (data.user) {
        showSuccess("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        navigate("/login");
      } else {
        throw new Error("Impossible de créer le compte. Vérifiez les informations saisies.");
      }
    } catch (err: any) {
      console.error("Erreur d'inscription détaillée :", err);
      const msg = err.message || "Une erreur s'est produite lors de l'inscription.";
      setErrorMessage(msg);
      showError(`Erreur d'inscription : ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-none overflow-hidden">
        <div className="h-2 bg-blue-600 w-full" />
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Créer un compte
          </CardTitle>
          <CardDescription>
            Rejoignez la plateforme GMAO Dyad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="rounded-xl bg-red-50 border-red-200 text-red-800 animate-in fade-in duration-300">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="font-bold">Erreur d'inscription</AlertTitle>
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" placeholder="Jean" required className="rounded-xl h-11" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" placeholder="Dupont" required className="rounded-xl h-11" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Spécialité technique / Métier</Label>
              <Select onValueChange={setSpecialty} value={specialty} required>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Sélectionnez votre métier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Biomédical">Technicien Biomédical</SelectItem>
                  <SelectItem value="Imagerie">Ingénieur Imagerie</SelectItem>
                  <SelectItem value="Laboratoire">Spécialiste Laboratoire</SelectItem>
                  <SelectItem value="Froid Médical">Technicien Froid</SelectItem>
                  <SelectItem value="Gestion Stock">Gestionnaire de Stock</SelectItem>
                  <SelectItem value="Administratif">Administratif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <Input id="email" type="email" placeholder="votre@email.com" required className="rounded-xl h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required className="rounded-xl h-11 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg font-bold text-lg mt-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2 h-5 w-5" />}
              S'inscrire
            </Button>
            <p className="text-center text-sm text-slate-600 mt-4">
              Déjà un compte ? <Link to="/login" className="text-blue-600 font-bold hover:underline">Se connecter</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;