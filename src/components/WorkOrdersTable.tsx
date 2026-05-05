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
import { Eye, Loader2, Edit2, Trash2, AlertCircle, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  asset_id: string;
  priority: string;
  status: string;
  due_date: string;
  created_at: string;
  maintenance_type: string;
}

interface WorkOrdersTableProps {
  refreshTrigger: number;
  onEdit: (ot: WorkOrder) => void;
  onDelete: (ot: WorkOrder) => void;
}

const WorkOrdersTable: React.FC<WorkOrdersTableProps> = ({ refreshTrigger, onEdit, onDelete }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkOrders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setWorkOrders(data || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWorkOrders(); }, [refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Terminé': return <Badge className="bg-green-600 rounded-full">Terminé</Badge>;
      case 'En cours': return <Badge className="bg-blue-500 rounded-full">En cours</Badge>;
      case 'En attente de pièce': return <Badge className="bg-amber-500 text-white rounded-full flex items-center gap-1"><Clock size={10} /> En attente pièce</Badge>;
      case 'Annulé': return <Badge variant="secondary" className="rounded-full">Annulé</Badge>;
      default: return <Badge variant="outline" className="rounded-full">Ouvert</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critique': return <Badge variant="destructive" className="rounded-full text-[10px]">Critique</Badge>;
      case 'Élevée': return <Badge className="bg-red-500 text-white rounded-full text-[10px]">Élevée</Badge>;
      case 'Moyenne': return <Badge className="bg-amber-500 text-white rounded-full text-[10px]">Moyenne</Badge>;
      default: return <Badge variant="outline" className="rounded-full text-[10px]">Basse</Badge>;
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-red-600">{error}</p>
        <Button onClick={fetchWorkOrders} variant="link">Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Titre</TableHead>
            <TableHead className="font-semibold">Priorité</TableHead>
            <TableHead className="font-semibold">Ouvert le</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="font-semibold">Échéance</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
          ) : workOrders.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-16 text-muted-foreground italic">Aucun ordre de travail.</TableCell></TableRow>
          ) : workOrders.map((ot) => (
            <TableRow key={ot.id} className="hover:bg-accent/50 transition-colors">
              <TableCell className="font-bold">{ot.title}</TableCell>
              <TableCell>{getPriorityBadge(ot.priority)}</TableCell>
              <TableCell className="text-xs">
                <div className="flex items-center">
                  <Calendar size={12} className="mr-1 text-muted-foreground" />
                  {format(new Date(ot.created_at), 'dd/MM/yyyy')}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(ot.status)}</TableCell>
              <TableCell className="text-sm">
                <div className="flex items-center">
                  <Clock size={12} className="mr-1 text-muted-foreground" />
                  {ot.due_date}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => onEdit(ot)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500" onClick={() => onDelete(ot)}>
                    <Trash2 size={16} />
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

export default WorkOrdersTable;