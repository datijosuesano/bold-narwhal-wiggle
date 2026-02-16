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
import { Eye, CheckCircle2, Receipt, CreditCard, Loader2, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface WorkOrder {
  id: string;
  title: string;
  asset_id: string;
  assetName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'InProgress' | 'Completed' | 'Cancelled';
  due_date: string;
  maintenance_type: 'Preventive' | 'Corrective' | 'Palliative' | 'Ameliorative';
  parts_replaced: boolean;
  invoice_status: 'None' | 'Deposited' | 'Paid';
  client_name: string;
  has_active_contract: boolean;
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
      // Tentative de récupération simple d'abord pour vérifier l'existence de la table
      const { data, error: fetchError } = await supabase
        .from('work_orders')
        .select('*, assets(name, location)')
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Si erreur de cache ou de jointure, on tente sans jointure
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('work_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;

        setWorkOrders((fallbackData || []).map(item => ({
          ...item,
          assetName: 'Équipement',
          client_name: 'Site',
          has_active_contract: false
        })));
      } else {
        const { data: contracts } = await supabase.from('contracts').select('clinic').eq('status', 'Active');
        const activeClinics = (contracts || []).map(c => c.clinic);

        const mappedOrders: WorkOrder[] = (data || []).map((item: any) => ({
          ...item,
          assetName: item.assets ? item.assets.name : 'Équipement',
          client_name: item.assets ? item.assets.location : 'Site',
          has_active_contract: item.assets ? activeClinics.includes(item.assets.location) : false
        }));
        setWorkOrders(mappedOrders);
      }
    } catch (err: any) {
      console.error("Erreur API Work Orders:", err);
      setError(err.message || "La table 'work_orders' n'est pas encore accessible.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWorkOrders(); }, [refreshTrigger]);

  const updateInvoice = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('work_orders')
      .update({ invoice_status: newStatus })
      .eq('id', id);

    if (error) showError("Erreur mise à jour facture.");
    else {
      showSuccess("Statut mis à jour.");
      fetchWorkOrders();
    }
  };

  if (error) {
    return (
      <div className="p-12 text-center bg-slate-50 border-2 border-dashed rounded-2xl">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Initialisation de la base...</h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          La table des ordres de travail est en cours de synchronisation avec l'API. 
          Veuillez patienter quelques instants.
        </p>
        <Button onClick={fetchWorkOrders} className="bg-blue-600 rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" /> Réessayer la connexion
        </Button>
        <div className="mt-4 text-[10px] font-mono text-slate-400">Code: {error}</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">OT & Client</TableHead>
            <TableHead className="font-semibold">Type / Pièces</TableHead>
            <TableHead className="font-semibold">Statut OT</TableHead>
            <TableHead className="font-semibold">Facturation</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
          ) : workOrders.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground italic">Aucun ordre de travail enregistré.</TableCell></TableRow>
          ) : workOrders.map((ot) => (
            <TableRow key={ot.id} className="hover:bg-accent/50 transition-colors">
              <TableCell>
                <div className="font-bold">{ot.title}</div>
                <div className="text-xs text-blue-600 font-medium">{ot.client_name}</div>
              </TableCell>
              <TableCell>
                <div className="text-xs font-medium">{ot.maintenance_type}</div>
                <Badge variant="outline" className={cn("mt-1 h-5 text-[9px]", ot.parts_replaced ? "bg-amber-50 text-amber-600" : "text-gray-400")}>
                  <Package size={10} className="mr-1" /> {ot.parts_replaced ? "Pièces" : "Standard"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("rounded-full text-[10px]", ot.status === 'Completed' ? "bg-green-600" : "bg-blue-500")}>
                  {ot.status}
                </Badge>
              </TableCell>
              <TableCell>
                {ot.status === 'Completed' ? (
                  <div className="flex flex-col gap-1">
                    {ot.invoice_status === 'Paid' ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Payé</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg" onClick={() => updateInvoice(ot.id, 'Paid')}>Marquer Payé</Button>
                    )}
                  </div>
                ) : <span className="text-[10px] text-muted-foreground">En cours</span>}
              </TableCell>
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