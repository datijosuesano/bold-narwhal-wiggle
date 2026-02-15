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
import { Eye, CheckCircle2, Receipt, CreditCard, Loader2, Package, AlertCircle } from 'lucide-react';
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
      // Tentative de récupération simple d'abord
      const { data, error: fetchError } = await supabase
        .from('work_orders')
        .select('*, assets(name, location)')
        .order('due_date', { ascending: true });

      if (fetchError) throw fetchError;

      const { data: contracts } = await supabase.from('contracts').select('clinic').eq('status', 'Active');
      const activeClinics = (contracts || []).map(c => c.clinic);

      const mappedOrders: WorkOrder[] = (data || []).map((item: any) => ({
        ...item,
        assetName: item.assets ? item.assets.name : 'Équipement inconnu',
        client_name: item.assets ? item.assets.location : 'Site inconnu',
        has_active_contract: item.assets ? activeClinics.includes(item.assets.location) : false
      }));
      setWorkOrders(mappedOrders);
    } catch (err: any) {
      console.error("Erreur API Supabase:", err);
      setError(err.message);
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
      showSuccess(newStatus === 'Deposited' ? "Facture marquée comme déposée." : "Paiement confirmé.");
      fetchWorkOrders();
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
        <h3 className="text-lg font-bold text-red-800">Erreur de connexion</h3>
        <p className="text-sm text-red-600 mb-4">L'API ne parvient pas à lire la table 'work_orders'.</p>
        <div className="text-xs text-left bg-white p-4 rounded border font-mono overflow-auto max-h-32">
          Détail: {error}
        </div>
        <Button onClick={fetchWorkOrders} variant="outline" className="mt-4">Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border shadow-lg bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">OT & Client</TableHead>
            <TableHead className="font-semibold">Type / Pièces</TableHead>
            <TableHead className="font-semibold">Statut OT</TableHead>
            <TableHead className="font-semibold">Suivi Facturation</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
          ) : workOrders.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Aucun ordre de travail trouvé.</TableCell></TableRow>
          ) : workOrders.map((ot) => {
            const needsInvoicing = !ot.has_active_contract || ot.parts_replaced;
            const isCompleted = ot.status === 'Completed';

            return (
              <TableRow key={ot.id} className="hover:bg-accent/50 transition-colors">
                <TableCell>
                  <div className="font-bold">{ot.title}</div>
                  <div className="text-xs text-blue-600 font-medium">{ot.client_name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{ot.assetName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium">{ot.maintenance_type}</div>
                  <Badge variant="outline" className={cn("mt-1 h-5 text-[9px]", ot.parts_replaced ? "bg-amber-50 text-amber-600" : "text-gray-400")}>
                    <Package size={10} className="mr-1" />
                    {ot.parts_replaced ? "Pièces remplacées" : "Aucune pièce"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "rounded-full text-[10px]",
                    ot.status === 'Completed' ? "bg-green-600" : "bg-blue-500"
                  )}>
                    {ot.status}
                  </Badge>
                  {ot.has_active_contract && (
                    <div className="text-[9px] text-green-600 font-bold mt-1 uppercase">Sous Contrat</div>
                  )}
                </TableCell>
                <TableCell>
                  {isCompleted && needsInvoicing ? (
                    <div className="space-y-2">
                      {ot.invoice_status === 'None' && (
                        <Button 
                          size="sm" 
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-8 text-xs"
                          onClick={() => updateInvoice(ot.id, 'Deposited')}
                        >
                          <Receipt size={14} className="mr-1" /> Déposer Facture
                        </Button>
                      )}
                      {ot.invoice_status === 'Deposited' && (
                        <Button 
                          size="sm" 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-8 text-xs"
                          onClick={() => updateInvoice(ot.id, 'Paid')}
                        >
                          <CreditCard size={14} className="mr-1" /> Confirmer Paiement
                        </Button>
                      )}
                      {ot.invoice_status === 'Paid' && (
                        <Badge className="w-full justify-center bg-green-100 text-green-700 border-green-200 rounded-xl h-8">
                          <CheckCircle2 size={14} className="mr-1" /> Payé
                        </Badge>
                      )}
                    </div>
                  ) : isCompleted ? (
                    <span className="text-[10px] text-muted-foreground italic">Inclus dans contrat</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">En attente fin OT</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Eye size={16} /></Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default WorkOrdersTable;