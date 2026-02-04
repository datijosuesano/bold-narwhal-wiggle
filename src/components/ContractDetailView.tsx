import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Calendar, Building2, User, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Contract {
  id: string;
  name: string;
  provider: string;
  clinic: string;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'ExpiringSoon' | 'Expired';
  annualCost: number;
  description?: string;
}

interface ContractDetailViewProps {
  contract: Contract;
}

const ContractDetailView: React.FC<ContractDetailViewProps> = ({ contract }) => {
  const daysLeft = differenceInDays(contract.endDate, new Date());
  
  const getStatusInfo = () => {
    if (daysLeft < 0) return { label: 'Expiré', color: 'bg-red-500', icon: <AlertTriangle size={16} /> };
    if (daysLeft <= 30) return { label: 'Échéance Proche', color: 'bg-amber-500', icon: <Calendar size={16} /> };
    return { label: 'Actif', color: 'bg-green-600', icon: <ShieldCheck size={16} /> };
  };

  const status = getStatusInfo();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border">
        <div className="flex items-center space-x-4">
          <ShieldCheck className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold">{contract.name}</h3>
            <p className="text-sm text-muted-foreground">ID: {contract.id} | Prestataire: {contract.provider}</p>
          </div>
        </div>
        <div className={cn("flex items-center space-x-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-sm", status.color)}>
          {status.icon}
          <span>{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Building2 size={14} className="mr-2" /> Localisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{contract.clinic}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign size={14} className="mr-2" /> Coût Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.annualCost)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Calendar size={14} className="mr-2" /> Date de début
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{format(contract.startDate, 'dd MMMM yyyy', { locale: fr })}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Calendar size={14} className="mr-2" /> Date de fin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{format(contract.endDate, 'dd MMMM yyyy', { locale: fr })}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {daysLeft > 0 ? `Expire dans ${daysLeft} jours` : 'Contrat expiré'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <FileText size={14} className="mr-2" /> Description et Clauses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/80">
            {contract.description || "Aucune description détaillée n'a été fournie pour ce contrat. Ce contrat couvre la maintenance préventive et curative des équipements spécifiés, incluant les pièces et la main d'œuvre selon les conditions générales de vente du prestataire."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractDetailView;