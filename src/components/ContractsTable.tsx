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
import { Eye, Edit2, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Contract {
  id: string;
  name: string;
  provider: string;
  clinic: string;
  start_date: string;
  end_date: string;
  status: string;
  annual_cost: number;
}

interface ContractsTableProps {
  contracts: Contract[];
  isLoading: boolean;
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
}

const getStatusBadge = (contract: Contract) => {
  const daysLeft = differenceInDays(new Date(contract.end_date), new Date());
  
  if (daysLeft < 0) return <Badge variant="destructive" className="rounded-full">Expiré</Badge>;
  if (daysLeft <= 30) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white rounded-full">Échéance Proche</Badge>;
  return <Badge className="bg-green-600 hover:bg-green-700 text-white rounded-full">Actif</Badge>;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    currencyDisplay: 'symbol'
  }).format(amount).replace('XOF', 'FCFA');
};

const ContractsTable: React.FC<ContractsTableProps> = ({ contracts, isLoading, onView, onEdit }) => {
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
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                Chargement des contrats...
              </TableCell>
            </TableRow>
          ) : contracts.length > 0 ? (
            contracts.map((contract) => (
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
                    <span>{format(new Date(contract.start_date), 'dd/MM/yy')} - {format(new Date(contract.end_date), 'dd/MM/yy')}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(contract)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(contract.annual_cost)}
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
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                Aucun contrat enregistré.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContractsTable;