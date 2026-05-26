import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Calendar, Building2, DollarSign, FileText, AlertTriangle, Hash, Printer } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  displayNumber?: number; // Nouveau prop pour le numéro séquentiel
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    currencyDisplay: 'symbol'
  }).format(amount).replace('XOF', 'FCFA');
};

const ContractDetailView: React.FC<ContractDetailViewProps> = ({ contract, displayNumber }) => {
  const daysLeft = differenceInDays(contract.endDate, new Date());
  
  const getStatusInfo = () => {
    if (daysLeft < 0) return { label: 'Expiré', color: 'bg-red-500', icon: <AlertTriangle size={16} /> };
    if (daysLeft <= 30) return { label: 'Échéance Proche', color: 'bg-amber-500', icon: <Calendar size={16} /> };
    return { label: 'Actif', color: 'bg-green-600', icon: <ShieldCheck size={16} /> };
  };

  const status = getStatusInfo();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print-contract-details">
      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border print:bg-transparent print:border-slate-300">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg print:border print:bg-black">
            {displayNumber || "#"}
          </div>
          <div>
            <h3 className="text-xl font-bold">{contract.name}</h3>
            <p className="text-sm text-muted-foreground font-medium">Prestataire: {contract.provider}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={handlePrint} size="sm" variant="outline" className="rounded-xl border-slate-200 print:hidden">
            <Printer size={16} className="mr-1.5" /> Exporter PDF / Imprimer
          </Button>
          <div className={cn("flex items-center space-x-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-sm print:bg-transparent print:text-black print:border", status.color)}>
            {status.icon}
            <span>{status.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-md print:border-slate-300 print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Building2 size={14} className="mr-2" /> Localisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{contract.clinic}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md print:border-slate-300 print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign size={14} className="mr-2" /> Coût Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCurrency(contract.annualCost)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md print:border-slate-300 print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Calendar size={14} className="mr-2" /> Date de début
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{format(contract.startDate, 'dd MMMM yyyy', { locale: fr })}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md print:border-slate-300 print:shadow-none">
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

      <Card className="shadow-md print:border-slate-300 print:shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <FileText size={14} className="mr-2" /> Description et Clauses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/80">
            {contract.description || "Aucune description détaillée n'a été fournie pour ce contrat."}
          </p>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden, button, header, nav, aside, footer {
            display: none !important;
          }
          .print-contract-details, .print-contract-details * {
            visibility: visible;
          }
          .print-contract-details {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ContractDetailView;