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
import { Eye, Edit2, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- Types ---

interface WorkOrder {
  id: string;
  title: string;
  assetName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'InProgress' | 'Completed' | 'Cancelled';
  dueDate: Date;
  type: 'Preventive' | 'Corrective';
}

// --- Données Mockées ---

const mockWorkOrders: WorkOrder[] = [
  { id: 'OT-1001', title: 'Remplacement du roulement de la pompe P-101', assetName: 'Pompe P-101', priority: 'High', status: 'InProgress', dueDate: new Date(Date.now() + 86400000 * 2), type: 'Corrective' },
  { id: 'OT-1002', title: 'Inspection trimestrielle du compresseur', assetName: 'Compresseur V12', priority: 'Medium', status: 'Open', dueDate: new Date(Date.now() + 86400000 * 7), type: 'Preventive' },
  { id: 'OT-1003', title: 'Réparation fuite hydraulique Zone C', assetName: 'Presse H-500', priority: 'High', status: 'Open', dueDate: new Date(Date.now() - 86400000 * 1), type: 'Corrective' }, // En retard
  { id: 'OT-1004', title: 'Graissage général des convoyeurs', assetName: 'Convoyeur Principal', priority: 'Low', status: 'Completed', dueDate: new Date(Date.now() - 86400000 * 10), type: 'Preventive' },
  { id: 'OT-1005', title: 'Vérification des systèmes de sécurité', assetName: 'Système général', priority: 'Medium', status: 'InProgress', dueDate: new Date(Date.now() + 86400000 * 14), type: 'Preventive' },
];

// --- Utility Functions ---

const getPriorityBadge = (priority: WorkOrder['priority']) => {
  const base = "rounded-full text-xs font-medium";
  switch (priority) {
    case 'High': return <Badge className={cn(base, "bg-red-500 hover:bg-red-600 text-white")}>Haute</Badge>;
    case 'Medium': return <Badge className={cn(base, "bg-amber-500 hover:bg-amber-600 text-white")}>Moyenne</Badge>;
    case 'Low': return <Badge className={cn(base, "bg-green-500 hover:bg-green-600 text-white")}>Basse</Badge>;
  }
};

const getStatusBadge = (status: WorkOrder['status'], dueDate: Date) => {
  const base = "rounded-full text-xs font-medium";
  const isOverdue = status !== 'Completed' && status !== 'Cancelled' && dueDate < new Date();

  if (isOverdue) {
    return <Badge variant="destructive" className={cn(base, "bg-red-700 hover:bg-red-800 text-white")}>En Retard</Badge>;
  }

  switch (status) {
    case 'Open': return <Badge variant="outline" className={cn(base, "border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/30")}>Ouvert</Badge>;
    case 'InProgress': return <Badge className={cn(base, "bg-amber-500 hover:bg-amber-600 text-white")}>En Cours</Badge>;
    case 'Completed': return <Badge className={cn(base, "bg-green-600 hover:bg-green-700 text-white")}>Terminé</Badge>;
    case 'Cancelled': return <Badge variant="secondary" className={cn(base, "bg-gray-400 hover:bg-gray-500 text-white")}>Annulé</Badge>;
    default: return <Badge variant="secondary" className={base}>Inconnu</Badge>;
  }
};

const WorkOrdersTable: React.FC = () => {
  // En production, cette liste viendrait d'un state ou d'une API
  const workOrders = mockWorkOrders; 

  return (
    <div className="overflow-x-auto rounded-xl border shadow-lg">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-muted/50">
            <TableHead className="w-[100px] font-semibold">ID</TableHead>
            <TableHead className="font-semibold">Titre</TableHead>
            <TableHead className="font-semibold">Équipement</TableHead>
            <TableHead className="font-semibold">Priorité</TableHead>
            <TableHead className="font-semibold">Échéance</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workOrders.map((ot) => (
            <TableRow key={ot.id} className="hover:bg-accent/50 transition-colors">
              <TableCell className="font-mono text-sm text-muted-foreground">{ot.id}</TableCell>
              <TableCell>
                <div className="font-medium text-foreground">{ot.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{ot.type === 'Preventive' ? 'Préventive' : 'Corrective'}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{ot.assetName}</TableCell>
              <TableCell>{getPriorityBadge(ot.priority)}</TableCell>
              <TableCell>
                <div className={cn(
                  "text-sm font-medium",
                  ot.status !== 'Completed' && ot.dueDate < new Date() ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                )}>
                  {format(ot.dueDate, 'dd MMM yyyy', { locale: fr })}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(ot.status, ot.dueDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-blue-600">
                    <Eye size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                    <Edit2 size={16} />
                  </Button>
                  {ot.status !== 'Completed' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-green-500 hover:bg-green-500/10">
                      <CheckCircle2 size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WorkOrdersTable;