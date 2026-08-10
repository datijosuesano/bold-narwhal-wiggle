"use client";

import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, Trash2, AlertCircle, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Import du service et du type (tu peux ajouter WorkOrder au schema.ts ou ici)
import { workOrderService } from "./workOrderService";

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

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workOrderService.getWorkOrders();
      setWorkOrders(data || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [refreshTrigger]);

  // ... (Garde tes fonctions getStatusBadge et getPriorityBadge ici car elles font partie du rendu UI)

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-red-600">{error}</p>
        <Button onClick={loadData} variant="link">Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
      <Table>
        {/* ... Ton JSX de table reste identique, utilise simplement workOrders */}
      </Table>
    </div>
  );
};

export default WorkOrdersTable;