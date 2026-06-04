"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, Box, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

const CloseSchema = z.object({
  diagnosis: z.string().min(5, "Le diagnostic ou la cause de la panne est requis (5 car. min)."),
  workDone: z.string().min(10, "Le détail du travail effectué est requis (10 car. min)."),
  timeSpent: z.coerce.number().min(1, "Le temps passé doit être d'au moins 1 minute."),
  isOperational: z.boolean().default(true),
  notes: z.string().optional(),
});

type CloseFormValues = z.infer<typeof CloseSchema>;

interface CloseInterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any;
  onSuccess: () => void;
}

interface UsedPart {
  partId: string;
  quantity: number;
}

const CloseInterventionDialog: React.FC<CloseInterventionDialogProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSuccess
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [selectedParts, setSelectedParts] = useState<UsedPart[]>([]);

  const form = useForm<CloseFormValues>({
    resolver: zodResolver(CloseSchema),
    defaultValues: {
      diagnosis: "",
      workDone: "",
      timeSpent: 30,
      isOperational: true,
      notes: "",
    }
  });

  // Charger les pièces détachées pour la gestion des stocks
  useEffect(() => {
    if (isOpen) {
      const fetchParts = async () => {
        const { data } = await supabase
          .from('spare_parts')
          .select('id, name, reference, current_stock')
          .order('name');
        setSpareParts(data || []);
      };
      fetchParts();
      // Reset form values on open
      form.reset();
      setSelectedParts([]);
    }
  }, [isOpen]);

  const handleAddPartRow = () => {
    setSelectedParts([...selectedParts, { partId: "", quantity: 1 }]);
  };

  const handleRemovePartRow = (index: number) => {
    const updated = [...selectedParts];
    updated.splice(index, 1);
    setSelectedParts(updated);
  };

  const handlePartChange = (index: number, partId: string) => {
    const updated = [...selectedParts];
    updated[index].partId = partId;
    updated[index].quantity = 1;
    setSelectedParts(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...selectedParts];
    updated[index].quantity = Math.max(1, qty);
    setSelectedParts(updated);
  };

  const onSubmit = async (data: CloseFormValues) => {
    if (!user) {
      showError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    setIsLoading(true);

    // Étape 1 : Validation stricte des quantités de pièces en stock
    for (const item of selectedParts) {
      if (!item.partId) {
        showError("Veuillez sélectionner une pièce de rechange valide.");
        setIsLoading(false);
        return;
      }
      const matched = spareParts.find(p => p.id === item.partId);
      if (matched && item.quantity > matched.current_stock) {
        showError(`Stock insuffisant pour "${matched.name}". Disponible: ${matched.current_stock}.`);
        setIsLoading(false);
        return;
      }
    }

    try {
      // Formater le rapport d'intervention
      const structuredReport = `[DIAGNOSTIC / CAUSE DE PANNE]\n${data.diagnosis}\n\n[TRAVAIL EFFECTUÉ]\n${data.workDone}${data.notes ? `\n\n[OBSERVATIONS COMPLÉMENTAIRES]\n${data.notes}` : ''}`;

      // Étape 2 : Mettre à jour l'ordre de travail
      const { error: woError } = await supabase
        .from('work_orders')
        .update({
          status: 'Terminé',
          closed_at: new Date().toISOString(),
          completed_by: user.id,
          time_spent_minutes: data.timeSpent,
          equipment_operational: data.isOperational,
          intervention_report: structuredReport
        })
        .eq('id', workOrder.id);

      if (woError) throw woError;

      // Étape 3 : Créer l'intervention dans le journal général pour alimenter la fiche de vie
      const { data: newIntervention, error: interventionError } = await supabase
        .from('interventions')
        .insert({
          user_id: user.id,
          technician_id: workOrder.assigned_to || user.id,
          asset_id: workOrder.asset_id,
          rit_number: `RIT-${Math.floor(100000 + Math.random() * 900000)}`,
          title: `Clôture OT : ${workOrder.title}`,
          description: structuredReport,
          maintenance_type: workOrder.maintenance_type || 'Corrective',
          intervention_date: new Date().toISOString().split('T')[0],
          start_date: workOrder.started_at || new Date().toISOString(),
          end_date: new Date().toISOString(),
          total_cost: 0,
          intervention_place: 'Sur Site',
        })
        .select('id')
        .single();

      if (interventionError) throw interventionError;

      // Lier l'intervention_id dans le work_order originel
      await supabase
        .from('work_orders')
        .update({ intervention_id: newIntervention.id })
        .eq('id', workOrder.id);

      // Étape 4 : Décompte des pièces de rechange et historique des mouvements
      for (const item of selectedParts) {
        const matched = spareParts.find(p => p.id === item.partId);
        if (matched) {
          const newStock = Math.max(0, matched.current_stock - item.quantity);
          
          // Décrémenter le stock physique
          await supabase
            .from('spare_parts')
            .update({ current_stock: newStock })
            .eq('id', item.partId);

          // Créer l'enregistrement de liaison d'intervention
          await supabase.from('intervention_parts').insert({
            intervention_id: newIntervention.id,
            part_id: item.partId,
            quantity: item.quantity
          });

          // Mouvement de stock principal (stock_movements)
          await supabase.from('stock_movements').insert({
            part_id: item.partId,
            movement_type: 'OUT',
            quantity: item.quantity,
            reference_type: 'Intervention',
            reference_id: newIntervention.id
          });

          // Mouvement de stock secondaire (spare_part_movements)
          await supabase.from('spare_part_movements').insert({
            part_id: item.partId,
            user_id: user.id,
            quantity: item.quantity,
            type: 'OUT',
            reason: `Utilisé pour clôture OT : ${workOrder.title}`
          });
        }
      }

      // Étape 5 : Mettre à jour également le statut de l'asset si nécessaire
      const targetAssetStatus = data.isOperational ? 'Opérationnel' : 'En Panne';
      await supabase
        .from('assets')
        .update({ status: targetAssetStatus })
        .eq('id', workOrder.asset_id);

      showSuccess("Rapport de clôture enregistré et pièces décomptées avec succès !");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erreur clôture d'intervention:", err);
      showError(`Erreur lors de la validation: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase text-slate-900 tracking-tight flex items-center">
            <CheckCircle2 className="mr-2 text-green-600" /> Clôturer l'intervention
          </DialogTitle>
          <DialogDescription>
            Remplissez ce compte-rendu technique de maintenance terrain pour finaliser la tâche de {workOrder?.assets?.name}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-500">Diagnostic / Cause de la panne <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Précisez le diagnostic technique initial..." 
                      className="rounded-xl h-18 resize-none text-xs" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workDone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-500">Travaux réalisés <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Saisissez de manière exhaustive les actions de dépannage..." 
                      className="rounded-xl h-24 resize-none text-xs" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 items-center">
              <FormField
                control={form.control}
                name="timeSpent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Temps Passé (minutes) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" min="1" className="rounded-xl h-10 font-bold" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOperational"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border bg-slate-50 p-3 h-[68px] mt-4">
                    <div>
                      <FormLabel className="text-xs font-bold uppercase text-slate-700 block">Appareil Opérationnel</FormLabel>
                      <span className="text-[10px] text-muted-foreground">État fonctionnel final</span>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* PIÈCES UTILISÉES */}
            <div className="border rounded-2xl p-4 bg-slate-50 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
                  <Box size={14} className="text-blue-600" />
                  Pièces détachées remplacées
                </h4>
                <Button 
                  type="button" 
                  onClick={handleAddPartRow}
                  size="sm" 
                  variant="outline" 
                  className="rounded-xl h-8 border-blue-200 text-blue-600 hover:bg-blue-50 text-[10px]"
                >
                  <Plus size={12} className="mr-1" /> Associer pièce
                </Button>
              </div>

              {selectedParts.length > 0 ? (
                <div className="space-y-3">
                  {selectedParts.map((item, index) => {
                    const matchedPart = spareParts.find(p => p.id === item.partId);
                    const maxStock = matchedPart ? matchedPart.current_stock : 0;
                    return (
                      <div key={index} className="flex gap-2 items-end bg-white p-3 rounded-xl border">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Pièce détachée</label>
                          <Select onValueChange={(val) => handlePartChange(index, val)} value={item.partId}>
                            <SelectTrigger className="h-9 rounded-lg text-xs">
                              <SelectValue placeholder="Choisir la référence" />
                            </SelectTrigger>
                            <SelectContent>
                              {spareParts.map(p => (
                                <SelectItem key={p.id} value={p.id} disabled={p.current_stock <= 0}>
                                  {p.name} (Ref: {p.reference}) [Stock: {p.current_stock}]
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-20 space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Qté</label>
                          <Input 
                            type="number" 
                            min="1" 
                            max={maxStock || 1} 
                            value={item.quantity} 
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            className="h-9 rounded-lg text-xs text-center font-bold"
                          />
                        </div>

                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemovePartRow(index)}
                          className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-4 text-xs text-slate-400 italic bg-white rounded-xl border border-dashed">
                  Aucune pièce de rechange n'a été utilisée lors du dépannage.
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-500">Observations (Optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Commentaires additionnels sur l'environnement, l'alimentation, etc..." 
                      className="rounded-xl h-16 resize-none text-xs" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold uppercase text-sm mt-4 shadow-lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Valider et Archiver l'intervention
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CloseInterventionDialog;