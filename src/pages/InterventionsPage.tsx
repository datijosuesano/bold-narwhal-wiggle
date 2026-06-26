"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';

const InterventionsPage: React.FC = () => {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any | null>(null);

  const fetchInterventions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('interventions').select('*, assets(name)').order('created_at', { ascending: false });
    if (error) showError("Erreur");
    else setInterventions(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchInterventions(); }, []);

  const handleDelete = async (id: string) => {
    const previous = [...interventions];
    setInterventions(prev => prev.filter(i => i.id !== id)); // Suppression visuelle immédiate
    const { error } = await supabase.from('interventions').delete().eq('id', id);
    if (error) { showError("Erreur"); setInterventions(previous); }
    else showSuccess("Supprimé");
  };

  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <tbody>
              {isLoading ? <tr><td className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr> : 
               interventions.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-4">{item.rit_number}</td>
                  <td className="p-4">{item.assets?.name || "---"}</td>
                  <td className="p-4">{item.title}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" onClick={() => { setSelectedIntervention(item); setIsEditOpen(true); }}><Edit2 size={16} /></Button>
                    <Button variant="ghost" onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 size={16} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          {selectedIntervention && (
            <AddPastInterventionForm initialData={selectedIntervention} onSuccess={() => { setIsEditOpen(false); fetchInterventions(); }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterventionsPage;