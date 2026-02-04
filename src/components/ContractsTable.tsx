import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Contract {
  id: string;
  name: string;
  provider: string;
  clinic: string;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'ExpiringSoon' | 'Expired';
  annualCost: number;
}

interface ContractsTableProps {
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
}

const mockContracts: Contract[] = [
  { id: 'CTR-001', name: 'Maintenance IRM Siemens', provider: 'Siemens Healthineers', clinic: 'Clinique du Parc', startDate: new Date('2023-01-01'), endDate: new Date('2024-12-31'), status: 'Active', annualCost: 12500 },
  { id: 'CTR-002', name: 'Contrat Ascenseurs', provider: 'Otis SAS', clinic: 'Clinique Sainte-Marie', startDate: new Date('2023-06-01'), endDate: new Date('2024-05-31'), status: 'ExpiringSoon', annualCost: 4800 },
  { id: 'CTR-003', name: 'Maintenance Groupes Électrogènes', provider: 'Eneria Cat', clinic: 'Hôpital Privé Nord', startDate: new Date('2022-01-01'), endDate: new Date('2023-12-31'), status: 'Expired', annualCost: 3200 },
  { id: 'CTR-004', name: 'Contrat Désinfection Salles Blanches', provider: 'CleanSafe Inc.', clinic: 'Clinique du Parc', startDate: new Date('2024-02-15'), endDate: new Date('2025-02-14'), status: 'Active', annualCost: 15000 },
];

const getStatusBadge = (contract: Contract) => {
  const daysLeft = differenceInDays(contract.endDate, new Date());
  if (daysLeft < 0 || contract.status === 'Expired') return <Badge variant="destructive" className="rounded-full">Expiré</Badge>;
  if (daysLeft <= 30 || contract.status === 'ExpiringSoon') return <Badge className="bg-amber-500 hover:bg-amber-600 text-white rounded-full">Échéance Proche</Badge>;
  return <Badge className="bg-green-600 hover:bg-green-700 text-white rounded-full">Actif</Badge>;
};

const ContractsTable: React.FC<ContractsTableProps> = ({ onView, onEdit }) => {
  return (
    <div className="overflow-x-auto rounded-xl border shadow-md bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Contrat / Prestataire</TableHead>
            <TableHead className="font-semibold">Clinique</TableHead>
            <TableHead className="font-semibold">Période</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="font-semibold text-right">Coût Annuel</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockContracts.map((contract) => (
            <TableRow key={contract.id} className="hover:bg-accent/50 transition-colors">
              <TableCell>
                <div className="font-medium text-foreground">{contract.name}</div>
                <div className="text-xs text-muted-foreground">{contract.provider}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{contract.clinic}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Calendar size={14} />
                  <span>{format(contract.startDate, 'dd/MM/yy')} - {format(contract.endDate, 'dd/MM/yy')}</span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(contract)}</TableCell>
              <TableCell className="text-right font-semibold">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.annualCost)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => onView(contract)}>
                    <Eye size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => onEdit(contract)}>
                    <Edit2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContractsTable;