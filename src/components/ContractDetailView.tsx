import React, { useRef } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  ShieldCheck,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  AlertTriangle,
  Printer,
  Download
} from 'lucide-react';

import { format, differenceInDays } from 'date-fns';

import { fr } from 'date-fns/locale';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

import {
  showSuccess,
  showError
} from '@/utils/toast';

import html2pdf from 'html2pdf.js';

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

  displayNumber?: number;
}

const formatCurrency = (amount: number) => {

  return new Intl.NumberFormat(
    'fr-FR',
    {
      style: 'currency',
      currency: 'XOF',
      currencyDisplay: 'symbol'
    }
  )
    .format(amount)
    .replace('XOF', 'FCFA');
};

const ContractDetailView: React.FC<ContractDetailViewProps> = ({
  contract,
  displayNumber
}) => {

  const printRef = useRef<HTMLDivElement>(null);

  const daysLeft = differenceInDays(
    contract.endDate,
    new Date()
  );

  const getStatusInfo = () => {

    if (daysLeft < 0) {

      return {
        label: 'Expiré',
        color: 'bg-red-500',
        icon: <AlertTriangle size={16} />
      };
    }

    if (daysLeft <= 30) {

      return {
        label: 'Échéance Proche',
        color: 'bg-amber-500',
        icon: <Calendar size={16} />
      };
    }

    return {
      label: 'Actif',
      color: 'bg-green-600',
      icon: <ShieldCheck size={16} />
    };
  };

  const status = getStatusInfo();

  // =========================
  // EXPORT PDF
  // =========================

  const handleExportPDF = async () => {

    try {

      if (!printRef.current) return;

      const opt = {

        margin: 0.5,

        filename: `contrat-${contract.name}.pdf`,

        image: {
          type: 'jpeg',
          quality: 1
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0
        },

        jsPDF: {
          unit: 'in',
          format: 'a4',
          orientation: 'portrait'
        },

        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']
        }
      };

      await html2pdf()
        .set(opt)
        .from(printRef.current)
        .save();

      showSuccess("PDF généré avec succès !");

    } catch (error) {

      console.error(error);

      showError("Erreur lors de la génération du PDF.");
    }
  };

  // =========================
  // IMPRESSION
  // =========================

  const handlePrint = () => {

    window.print();
  };

  return (

    <div
      ref={printRef}
      className="space-y-6 print-contract-details bg-white p-4 rounded-2xl"
    >

      {/* HEADER */}

      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border print:bg-transparent print:border-slate-300">

        <div className="flex items-center space-x-4">

          <div className="h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg print:border print:bg-black">

            {displayNumber || "#"}

          </div>

          <div>

            <h3 className="text-xl font-bold">
              {contract.name}
            </h3>

            <p className="text-sm text-muted-foreground font-medium">

              Prestataire : {contract.provider}

            </p>

          </div>

        </div>

        <div className="flex gap-2 items-center print:hidden">

          {/* EXPORT PDF */}

          <Button
            onClick={handleExportPDF}
            size="sm"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >

            <Download
              size={16}
              className="mr-1.5"
            />

            Exporter PDF

          </Button>

          {/* IMPRESSION */}

          <Button
            onClick={handlePrint}
            size="sm"
            variant="outline"
            className="rounded-xl border-slate-200"
          >

            <Printer
              size={16}
              className="mr-1.5"
            />

            Imprimer

          </Button>

          {/* STATUT */}

          <div
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-sm print:bg-transparent print:text-black print:border",
              status.color
            )}
          >

            {status.icon}

            <span>{status.label}</span>

          </div>

        </div>

      </div>

      {/* INFOS */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CLINIQUE */}

        <Card className="shadow-md print:border-slate-300 print:shadow-none">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">

              <Building2
                size={14}
                className="mr-2"
              />

              Localisation

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-lg font-semibold">

              {contract.clinic}

            </p>

          </CardContent>

        </Card>

        {/* COUT */}

        <Card className="shadow-md print:border-slate-300 print:shadow-none">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">

              <DollarSign
                size={14}
                className="mr-2"
              />

              Coût Annuel

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-lg font-semibold">

              {formatCurrency(contract.annualCost)}

            </p>

          </CardContent>

        </Card>

        {/* DATE DEBUT */}

        <Card className="shadow-md print:border-slate-300 print:shadow-none">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">

              <Calendar
                size={14}
                className="mr-2"
              />

              Date de début

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-lg font-semibold">

              {format(
                contract.startDate,
                'dd MMMM yyyy',
                { locale: fr }
              )}

            </p>

          </CardContent>

        </Card>

        {/* DATE FIN */}

        <Card className="shadow-md print:border-slate-300 print:shadow-none">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">

              <Calendar
                size={14}
                className="mr-2"
              />

              Date de fin

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-lg font-semibold">

              {format(
                contract.endDate,
                'dd MMMM yyyy',
                { locale: fr }
              )}

            </p>

            <p className="text-xs text-muted-foreground mt-1">

              {daysLeft > 0
                ? `Expire dans ${daysLeft} jours`
                : 'Contrat expiré'}

            </p>

          </CardContent>

        </Card>

      </div>

      {/* DESCRIPTION */}

      <Card className="shadow-md print:border-slate-300 print:shadow-none">

        <CardHeader>

          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">

            <FileText
              size={14}
              className="mr-2"
            />

            Description et Clauses

          </CardTitle>

        </CardHeader>

        <CardContent>

          <p className="text-sm leading-relaxed text-foreground/80">

            {contract.description ||
              "Aucune description détaillée n'a été fournie pour ce contrat."}

          </p>

        </CardContent>

      </Card>

      {/* STYLES IMPRESSION */}

      <style>{`

        @media print {

          body * {
            visibility: hidden;
          }

          .print-contract-details,
          .print-contract-details * {
            visibility: visible;
          }

          .print-contract-details {

            position: absolute;

            left: 0;

            top: 0;

            width: 100%;

            background: white;

            padding: 20px;
          }

          .print\\:hidden,
          button,
          nav,
          aside,
          footer,
          header {

            display: none !important;
          }

          .shadow-md,
          .shadow-lg {

            box-shadow: none !important;
          }
        }

      `}</style>

    </div>
  );
};

export default ContractDetailView;