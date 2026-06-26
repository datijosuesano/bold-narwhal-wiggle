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
    const { data } = await supabase.from('interventions').select('*, assets(name, location)').order('created_at', { ascending: false });
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
    setInterventions(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from('interventions').delete().eq('id', id);
    if (error) { showError("Erreur"); setInterventions(original); }
    else showSuccess("Supprimé");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Interventions</h1>
            <p className="text-slate-500">Gestion et suivi technique</p>
        </div>
        <Button onClick={() => { setSelected(null); setIsEditOpen(true); }}>
            <Plus className="mr-2" size={16} /> Ajouter
        </Button>
      </div>

      <Input placeholder="Rechercher par RIT ou Objet..." onChange={(e) => setSearchTerm(e.target.value)} />

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-left text-xs uppercase">RIT & Date</th>
                <th className="p-4 text-left text-xs uppercase">Équipement</th>
                <th className="p-4 text-left text-xs uppercase">Objet / Durée</th>
                <th className="p-4 text-right text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody key={interventions.length}>
              {isLoading ? <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr> : 
               filtered.map(item => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-mono font-bold">{item.rit_number}</div>
                    <div className="text-xs text-slate-500">{item.intervention_date}</div>
                  </td>
                  <td className="p-4">{item.assets?.name || "---"}</td>
                  <td className="p-4">
                    <div className="font-medium">{item.title}</div>
                    {getDurationString(item.start_date, item.end_date) && (
                        <Badge variant="secondary" className="mt-1"><Clock size={10} className="mr-1" /> {getDurationString(item.start_date, item.end_date)}</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setIsDetailOpen(true); }}><Eye size={16}/></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setIsEditOpen(true); }}><Edit2 size={16}/></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 size={16}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
            {/* Le formulaire gère automatiquement l'insert ou l'update */}
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