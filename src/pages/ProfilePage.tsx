import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Shield, Phone, Briefcase, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { Badge } from '@/components/ui/badge';

const ProfilePage: React.FC = () => {
  const { user, role, specialty } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-2xl">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">Mon Profil</h1>
          <p className="text-lg text-muted-foreground">Gérez vos informations et votre sécurité.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Informations personnelles */}
        <Card className="md:col-span-1 shadow-lg border-none bg-slate-900 text-white overflow-hidden">
          <div className="h-24 bg-blue-600 w-full" />
          <div className="px-6 -mt-12 pb-6">
            <div className="h-24 w-24 rounded-3xl bg-white border-4 border-slate-900 flex items-center justify-center mb-4 shadow-xl">
              <User size={48} className="text-slate-900" />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">{user?.email?.split('@')[0]}</h3>
                <Badge className="mt-1 bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full uppercase text-[10px]">
                  <Shield size={10} className="mr-1" /> {role}
                </Badge>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center text-sm text-slate-400">
                  <Mail size={16} className="mr-3 text-blue-400" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-400">
                  <Briefcase size={16} className="mr-3 text-blue-400" />
                  <span>{specialty || "Non défini"}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Sécurité / Mot de passe */}
        <Card className="md:col-span-2 shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Lock size={20} className="text-blue-600" /> Sécurité du compte
            </CardTitle>
            <CardDescription>
              Modifiez votre mot de passe pour maintenir la sécurité de vos accès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;