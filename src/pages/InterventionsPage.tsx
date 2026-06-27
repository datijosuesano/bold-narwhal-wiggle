"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Search, CheckCircle2, Loader2, Edit2, Trash2, Eye, FileText, Clock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';
import InterventionDetailDialog from '@/components/InterventionDetailDialog';

const InterventionsPage = () => {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchInterventions = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('interventions')
      .select('*, assets(name, location)')
      .order('created_at', { ascending: false });
    setInterventions(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchInterventions(); }, []);

  // Fonction de calcul de durée
  const getDurationString = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(diff / 60000);
    return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : null;
  };

  const filtered = useMemo(() => {
    return interventions.filter(i => 
      i.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.rit_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [interventions, searchTerm]);

  const handleDelete = async (id: string) => {
    const original = [...interventions];
    // Suppression optimiste de l'affichage
    setInterventions(prev => prev.filter(i => i.id !== id));

    try {
      // Pour contourner le fait que PostgREST ne retourne pas d'erreur lors d'une violation d'accès RLS à la suppression,
      // on demande de retourner les lignes supprimées via `.select()`
      const { data, error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      // Si aucune ligne n'a été retournée par select(), cela signifie que l'utilisateur n'a pas les privilèges
      // pour supprimer cette ligne (règle de sécurité RLS PostgreSQL) ou que l'élément n'existe pas.
      if (!data || data.length === 0) {
        throw new Error("Droits de suppression insuffisants dans la base de données. Veuillez contacter un administrateur.");
      }

      showSuccess("L'intervention a été supprimée de la base de données.");
    } catch (err: any) {
      console.error("Erreur de suppression:", err);
      showError(err.message || "Impossible de supprimer l'intervention.");
      // Restauration de l'état d'origine si l'opération a échoué
      setInterventions(original);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Interventions</h1>
            <p className="text-slate-500">Gestion et suivi technique</p>
        </div>
        <Button onClick={() => { setSelected(null); setIsEditOpen(true); }} className="rounded-xl bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2" size={16} /> Ajouter une Intervention
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Rechercher par RIT ou Objet..." 
          className="rounded-xl pl-10 bg-white" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <Card className="rounded-2xl shadow-md border-none overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="p-4">RIT & Date</th>
                  <th className="p-4">Équipement</th>
                  <th className="p-4">Objet / Durée</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center">
                      <Loader2 className="animate-spin mx-auto text-blue-600" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400 italic">
                      Aucune intervention correspondante.
                    </td>
                  </tr>
                ) : (
                  filtered.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-all">
                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-800">{item.rit_number || "SANS RIT"}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.intervention_date}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-700">{item.assets?.name || "---"}</span>
                        {item.assets?.location && (
                          <div className="text-[10px] text-slate-400">{item.assets.location}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{item.title}</div>
                        {getDurationString(item.start_date, item.end_date) && (
                          <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600 hover:bg-slate-100 rounded-lg text-[10px]">
                            <Clock size={10} className="mr-1" /> {getDurationString(item.start_date, item.end_date)}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelected(item); setIsDetailOpen(true); }}><Eye size={16}/></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100" onClick={() => { setSelected(item); setIsEditOpen(true); }}><Edit2 size={16}/></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.id)}><Trash2 size={16}/></Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? "Modifier l'Intervention" : "Ajouter une Intervention"}</DialogTitle>
          </DialogHeader>
          <AddPastInterventionForm 
            initialData={selected} 
            onSuccess={() => { setIsEditOpen(false); fetchInterventions(); }} 
          />
        </DialogContent>
      </Dialog>

      <InterventionDetailDialog intervention={selected} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
    </div>
  );
};

export default InterventionsPage;