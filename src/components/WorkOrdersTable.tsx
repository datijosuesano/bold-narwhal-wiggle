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
import { Eye, Loader2, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface WorkOrder {
  id: string;
  title: string;
  asset_id: string;
  priority: string;
  status: string;
  due_date: string;
  maintenance_type: string;
  parts_replaced: boolean;
  invoice_status: string;
}

interface WorkOrdersTableProps {
  refreshTrigger: number;
}

const WorkOrdersTable: React.FC<WorkOrdersTableProps> = ({ refreshTrigger }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkOrders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Requête ultra-simple sans jointure pour tester la visibilité de la table
      const { data, error: fetchError } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setWorkOrders(data || []);
    } catch (err: any) {
      console.error("Erreur API Work Orders:", err);
      setError(err.message || "La table 'work_orders' est introuvable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWorkOrders(); }, [refreshTrigger]);

  if (error) {
    return (
      <div className="p-12 text-center bg-slate-50 border-2 border-dashed rounded-2xl">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Erreur de connexion</h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          L'API ne parvient pas à lire vos données. <br/>
          Détail: <span className="font-mono text-xs text-red-500">{error}</span>
        </p>
        <Button onClick={fetchWorkOrders} className="bg-blue-600 rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Ordre de Travail</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="font-semibold">Échéance</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
          ) : workOrders.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground italic">Aucun ordre de travail trouvé.</TableCell></TableRow>
          ) : workOrders.map((ot) => (
            <TableRow key={ot.id} className="hover:bg-accent/50 transition-colors">
              <TableCell className="font-bold">{ot.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] uppercase">{ot.maintenance_type}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("rounded-full text-[10px]", ot.status === 'Completed' ? "bg-green-600" : "bg-blue-500")}>
                  {ot.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{ot.due_date}</TableCell>
              <TableCell className="text-right">
                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Eye size={16} /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WorkOrdersTable;