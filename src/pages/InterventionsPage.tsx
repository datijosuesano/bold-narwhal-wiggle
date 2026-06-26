"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Loader2, 
  Eye, 
  Plus, 
  FileSpreadsheet, 
  MapPin, 
  Calendar,
  Clock,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';
import InterventionDetailDialog from '@/components/InterventionDetailDialog';
import { useAuth } from '@/contexts/AuthContext';

const InterventionsPage = () => {
  const { hasRole } = useAuth();
  const canCreate = hasRole(['admin', 'technicien_biomedical']);

  const [interventions, setInterventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchInterventions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*, assets(name, location, brand)')
        .order('intervention_date', { ascending: false });

      if (error) throw error;
      setInterventions(data || []);
    } catch (err: any) {
      console.error(err);
      showError("Erreur lors du chargement des interventions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const filteredInterventions = useMemo(() => {
    return interventions.filter(inv => {
      const matchesSearch = 
        inv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.rit_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.assets?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "all" || inv.maintenance_type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [interventions, searchTerm, typeFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Wrench className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Historique des Interventions</h1>
            <p className="text-lg text-muted-foreground">Registre complet des rapports techniques (RIT).</p>
          </div>
        </div>

        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 px-6 font-bold">
                <Plus className="mr-2 h-4 w-4" /> Nouvelle Saisie
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Saisir une Intervention</DialogTitle>
                <DialogDescription>Enregistrez manuellement une fiche de travaux réalisés.</DialogDescription>
              </DialogHeader>
              <AddPastInterventionForm onSuccess={() => { setIsCreateOpen(false); fetchInterventions(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Rechercher par RIT, équipement ou objet..." 
            className="pl-10 rounded-xl h-11 border-slate-200" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-56">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="rounded-xl h-11 border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter size={14} />
                <SelectValue placeholder="Type de maintenance" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Préventive">Préventive</SelectItem>
              <SelectItem value="Corrective">Corrective</SelectItem>
              <SelectItem value="Curative">Curative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-xl border-none overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">N° RIT</th>
                  <th className="px-6 py-4">Équipement / Site</th>
                  <th className="px-6 py-4">Objet de l'intervention</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <Loader2 className="animate-spin mx-auto text-blue-600 h-10 w-10" />
                    </td>
                  </tr>
                ) : filteredInterventions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground italic">
                      Aucune intervention enregistrée.
                    </td>
                  </tr>
                ) : (
                  filteredInterventions.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-lg font-mono text-[11px]">
                          {inv.rit_number || 'SANS RIT'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-xs">{inv.assets?.name || 'Inconnu'}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center mt-1">
                          <MapPin size={10} className="mr-1 text-red-400" />
                          {inv.assets?.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-700 line-clamp-1 max-w-xs">{inv.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase bg-white">
                          {inv.maintenance_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{format(new Date(inv.intervention_date), 'dd/MM/yyyy')}</span>
                          <span className="text-[9px] text-muted-foreground flex items-center">
                            <Clock size={10} className="mr-1" />
                            {inv.start_date ? format(new Date(inv.start_date), 'HH:mm') : '--:--'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50" 
                          onClick={() => {
                            setSelectedIntervention(inv);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye size={18} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <InterventionDetailDialog 
        intervention={selectedIntervention} 
        isOpen={isDetailOpen} 
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedIntervention(null);
        }} 
      />
    </div>
  );
};

export default InterventionsPage;