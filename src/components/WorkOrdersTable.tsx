import React, { useState, useEffect } from 'react';
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
import { Eye, Edit2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

// --- Types ---

interface WorkOrder {
  id: string;
  title: string;
  asset_id: string; // ID de l'actif
  assetName: string; // Nom de l'actif joint
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'InProgress' | 'Completed' | 'Cancelled';
  due_date: string; // Date de la DB (string ISO)
  maintenance_type: 'Preventive' | 'Corrective' | 'Palliative' | 'Ameliorative';
}

interface WorkOrdersTableProps {
  refreshTrigger: number; // Prop pour forcer le rafraîchissement
}

// --- Utility Functions ---

const getPriorityBadge = (priority: WorkOrder['priority']) => {
  const base = "rounded-full text-xs font-medium";
  switch (priority) {
    case 'High': return <Badge className={cn(base, "bg-red-500 hover:bg-red-600 text-white")}>Haute</Badge>;
    case 'Medium': return <Badge className={cn(base, "bg-amber-500 hover:bg-amber-600 text-white")}>Moyenne</Badge>;
    case 'Low': return <Badge className={cn(base, "bg-green-500 hover:bg-green-600 text-white")}>Basse</Badge>;
  }
};

const getStatusBadge = (status: WorkOrder['status'], dueDate: string) => {
  const base = "rounded-full text-xs font-medium";
  const date = new Date(dueDate);
  const isOverdue = status !== 'Completed' && status !== 'Cancelled' && date < new Date();

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

const WorkOrdersTable: React.FC<WorkOrdersTableProps> = ({ refreshTrigger }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkOrders = async () => {
    setIsLoading(true);
    
    // Jointure pour récupérer le nom de l'actif
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        assets (name)
      `)
      .order('due_date', { ascending: true });

    if (error) {
      console.error("Error fetching work orders:", error);
      showError("Erreur lors du chargement des Ordres de Travail.");
      setWorkOrders([]);
    } else {
      // Mapper les données pour inclure assetName
      const mappedOrders: WorkOrder[] = data.map((item: any) => ({
        ...item,
        assetName: item.assets ? item.assets.name : 'Actif Inconnu',
        due_date: item.due_date, // Reste en string ISO
        maintenance_type: item.maintenance_type,
      }));
      setWorkOrders(mappedOrders);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [refreshTrigger]); // Déclenche le fetch lors du montage et du rafraîchissement

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
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                Chargement des ordres de travail...
              </TableCell>
            </TableRow>
          ) : workOrders.length > 0 ? (
            workOrders.map((ot) => (
              <TableRow key={ot.id} className="hover:bg-accent/50 transition-colors">
                <TableCell className="font-mono text-sm text-muted-foreground">{ot.id.substring(0, 8)}...</TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{ot.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ot.maintenance_type}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{ot.assetName}</TableCell>
                <TableCell>{getPriorityBadge(ot.priority)}</TableCell>
                <TableCell>
                  <div className={cn(
                    "text-sm font-medium",
                    ot.status !== 'Completed' && new Date(ot.due_date) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                  )}>
                    {format(new Date(ot.due_date), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(ot.status, ot.due_date)}</TableCell>
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
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Aucun Ordre de Travail trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default WorkOrdersTable;