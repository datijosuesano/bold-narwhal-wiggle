import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Search, CheckCircle2, Loader2, Calendar, MapPin, Edit2, Trash2, FileText, Receipt, CheckCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';
import CreateReportForm from '@/components/CreateReportForm';
import { useAuth } from '@/contexts/AuthContext';

interface Intervention {
  id: string;
  title: string;
  maintenance_type: string;
  intervention_date: string;
  description: string;
  asset_id: string;
  invoice_status: string;
  invoice_number: string;
  assets: {
    name: string;
    location: string;
  } | null;
}

const InterventionsPage: React.FC = () => {
  const { hasRole, role } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);
  const isSec = role === 'secretaire';

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const fetchInterventions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('interventions')
      .select('*, assets(name, location)')
      .order('intervention_date', { ascending: false });

    if (error) showError("Erreur lors du chargement de l'historique.");
    else setInterventions(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchInterventions(); }, []);

  const handleValidateInvoice = async (id: string) => {
    const { error } = await supabase
      .from('interventions')
      .update({ 
        invoice_status: 'Déposée',
        invoice_deposited_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) showError("Erreur lors de la validation.");
    else {
      showSuccess("Facture marquée comme déposée.");
      fetchInterventions();
    }
  };

  const handleDelete = async () => {
    if (!selectedIntervention) return;
    const { error } = await supabase.from('interventions').delete().eq('id', selectedIntervention.id);
    if (error) showError("Erreur lors de la suppression.");
    else {
      showSuccess("Intervention supprimée.");
      fetchInterventions();
    }
    setIsDeleteOpen(false);
  };

  const filteredInterventions = interventions.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.assets?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.assets?.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-2xl"><Wrench className="h-8 w-8 text-green-600" /></div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Interventions</h1>
            <p className="text-lg text-muted-foreground">Journal historique et suivi facturation.</p>
          </div>
        </div>
        
        {canEdit && (
          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 rounded-xl shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Enregistrer Intervention
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-xl">
              <DialogHeader><DialogTitle>Nouvelle Intervention</DialogTitle></DialogHeader>
              <AddPastInterventionForm onSuccess={() => { setIsLogOpen(false); fetchInterventions(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher par objet, site, équipement..." 
          className="pl-10 rounded-xl" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Équipement & Site</th>
                  <th className="px-6 py-4">Objet</th>
                  <th className="px-6 py-4">Facture</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" /></td></tr>
                ) : filteredInterventions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-20 text-muted-foreground italic">Aucune intervention enregistrée.</td></tr>
                ) : filteredInterventions.map(item => (
                  <tr key={item.id} className="hover:bg-accent/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center"><Calendar size={14} className="mr-2 text-muted-foreground" />{format(new Date(item.intervention_date), 'dd/MM/yyyy')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{item.assets?.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center"><MapPin size={10} className="mr-1" /> {item.assets?.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium line-clamp-1">{item.title}</div>
                      <Badge variant="outline" className="mt-1 rounded-full text-[9px] uppercase">{item.maintenance_type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "rounded-full text-[10px] font-bold",
                        item.invoice_status === 'Déposée' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        <Receipt size={10} className="mr-1" /> {item.invoice_status || 'Non déposée'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {isSec && item.invoice_status !== 'Déposée' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-full text-[10px] font-bold border-green-200 text-green-600 hover:bg-green-50"
                            onClick={() => handleValidateInvoice(item.id)}
                          >
                            <CheckCircle size={12} className="mr-1" /> Valider Facture
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => { setSelectedIntervention(item); setIsReportOpen(true); }}
                          title="Générer Rapport"
                        >
                          <FileText size={16} />
                        </Button>
                        
                        {canEdit && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                              onClick={() => { setSelectedIntervention(item); setIsEditOpen(true); }}
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:bg-red-50"
                              onClick={() => { setSelectedIntervention(item); setIsDeleteOpen(true); }}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader><DialogTitle>Modifier l'intervention</DialogTitle></DialogHeader>
          {selectedIntervention && (
            <AddPastInterventionForm 
              initialData={selectedIntervention} 
              onSuccess={() => { setIsEditOpen(false); fetchInterventions(); }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Générer Rapport */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader><DialogTitle>Générer un Rapport Administratif</DialogTitle></DialogHeader>
          {selectedIntervention && (
            <CreateReportForm 
              initialData={{
                ...selectedIntervention,
                due_date: selectedIntervention.intervention_date
              }} 
              onSuccess={() => { setIsReportOpen(false); }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Alerte Suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'intervention ?</AlertDialogTitle>
            <AlertDialogDescription>Cela retirera cette action de l'historique et de la fiche de vie de l'équipement.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InterventionsPage;