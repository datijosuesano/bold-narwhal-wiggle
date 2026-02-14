import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, MapPin, User, Calendar, Shield, CheckCircle } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'Intervention' | 'Mission';
  client: string;
  technician: string;
  date: Date;
  status: 'Draft' | 'Finalized';
  content: string; // Ajout du contenu
}

interface ReportPDFPreviewProps {
  report: Report;
}

const ReportPDFPreview: React.FC<ReportPDFPreviewProps> = ({ report }) => {
  return (
    <div className="bg-white text-gray-900 p-8 shadow-inner border rounded-sm font-sans min-h-[600px] flex flex-col">
      {/* Header PDF */}
      <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-blue-700 uppercase tracking-tighter">GMAO DYAD</h1>
          <p className="text-xs text-gray-500">Service Maintenance & Ingénierie</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold">RAPPORT D'{report.type.toUpperCase()}</h2>
          <p className="text-sm font-mono text-gray-600">REF: {report.id.substring(0, 8)}</p>
        </div>
      </div>

      {/* Infos Client et Date */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <MapPin size={16} className="mr-2 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-500 uppercase text-[10px]">Client / Site</p>
              <p className="text-base font-bold">{report.client}</p>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <User size={16} className="mr-2 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-500 uppercase text-[10px]">Intervenant</p>
              <p className="text-base font-bold">{report.technician}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar size={16} className="mr-2 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-500 uppercase text-[10px]">Date d'intervention</p>
              <p className="text-base font-bold">{format(report.date, 'EEEE d MMMM yyyy', { locale: fr })}</p>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <Shield size={16} className="mr-2 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-500 uppercase text-[10px]">Statut Document</p>
              <p className={`text-base font-bold ${report.status === 'Finalized' ? 'text-green-600' : 'text-amber-600'}`}>
                {report.status === 'Finalized' ? 'DOCUMENT VALIDÉ' : 'BROUILLON'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Objet */}
      <div className="bg-gray-50 p-4 rounded-md mb-8 border-l-4 border-blue-600">
        <p className="font-semibold text-gray-500 uppercase text-[10px] mb-1">Objet de la mission</p>
        <p className="text-lg font-bold">{report.title}</p>
      </div>

      {/* Corps du rapport */}
      <div className="flex-1 space-y-4">
        <h3 className="text-sm font-bold border-b pb-2 text-blue-700 uppercase">Description des travaux</h3>
        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap min-h-[200px]">
          {report.content || "Aucun contenu détaillé n'a été saisi pour ce rapport."}
        </p>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-12 pt-8 border-t flex justify-between items-end">
        <div className="text-[10px] text-gray-400">
          <p>Généré automatiquement par GMAO Dyad</p>
          <p>Date d'impression : {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold mb-8">Cachet et Signature</p>
          {report.status === 'Finalized' && (
            <div className="flex items-center text-green-600 text-[10px] font-bold border-2 border-green-600 p-1 rotate-[-5deg]">
              <CheckCircle size={14} className="mr-1" /> VALIDÉ NUMÉRIQUEMENT
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPDFPreview;