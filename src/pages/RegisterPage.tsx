"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { Building2, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

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
      const emailClean = email.trim();

      // Déconnexion sécurité (évite conflits session)
      await supabase.auth.signOut();

      // Déterminer rôle côté frontend (optionnel, backend peut aussi gérer)
      let role = 'technicien_biomedical';

      if (specialty === 'Administratif') {
        role = 'administratif';
      } else if (specialty === 'Gestion Stock') {
        role = 'gestionnaire_stock';
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailClean,
        password
        }
      };

      if (error) throw error;

      if (data.user) {
        showSuccess("Compte créé avec succès !");
        navigate("/login");
      } else {
        throw new Error("Création du compte impossible.");
      }

    } catch (err: any) {
      console.error("Erreur inscription :", err);

      const msg =
        err?.message ||
        "Erreur lors de l'inscription";

      setErrorMessage(msg);
      showError(`Erreur : ${msg}`);

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

          <CardTitle className="text-3xl font-black text-slate-900">
            Créer un compte
          </CardTitle>

          <CardDescription>
            Plateforme GMAO biomédicale
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">

            {errorMessage && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prénom</Label>
                <Input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <Label>Nom</Label>
                <Input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Spécialité</Label>

              <Select value={specialty} onValueChange={setSpecialty} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir spécialité" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Biomédical">Technicien Biomédical</SelectItem>
                  <SelectItem value="Imagerie">Imagerie</SelectItem>
                  <SelectItem value="Laboratoire">Laboratoire</SelectItem>
                  <SelectItem value="Gestion Stock">Gestion Stock</SelectItem>
                  <SelectItem value="Administratif">Administratif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Mot de passe</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <UserPlus className="mr-2" />
              )}
              S'inscrire
            </Button>

            <p className="text-center text-sm">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-blue-600 font-bold">
                Connexion
              </Link>
            </p>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;