"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Loader2, Search, Filter, Eye, Edit2, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';

const InterventionsPage: React.FC = () => {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any | null>(null);

  const fetchInterventions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('interventions')
      .select('*, assets(name, location)')
      .order('intervention_date', { ascending: false });

    if (error) {
      console.error("Erreur Supabase:", error);
      showError("Erreur de chargement");
    } else {
      setInterventions(data || []);
      console.log("Données chargées:", data);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchInterventions(); }, []);

  const filtered = useMemo(() => {
    return interventions.filter(i => 
      (i.title?.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (i.rit_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [interventions, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Interventions</h1>
        <Button onClick={fetchInterventions} variant="outline">Actualiser</Button>
      </div>

      <Input 
        placeholder="Rechercher..." 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="p-4 text-left">RIT</th>
                <th className="p-4 text-left">Équipement</th>
                <th className="p-4 text-left">Objet</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-4 font-mono">{item.rit_number || "---"}</td>
                  <td className="p-4">{item.assets?.name || "N/A"}</td>
                  <td className="p-4">{item.title}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedIntervention(item); setIsEditOpen(true); }}>
                      <Edit2 size={16} />
                    </Button>
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
            <AddPastInterventionForm 
              initialData={selectedIntervention} 
              onSuccess={() => { setIsEditOpen(false); fetchInterventions(); }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterventionsPage;