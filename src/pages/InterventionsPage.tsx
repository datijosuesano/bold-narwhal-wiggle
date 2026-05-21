import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Search, CheckCircle2, Loader2, Calendar, MapPin, Edit2, Trash2, FileText, Receipt, ChevronDown, XCircle, ShieldCheck, ShieldAlert, Warehouse, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';
import CreateReportForm from '@/components/CreateReportForm';
import InterventionDetailDialog from '@/components/InterventionDetailDialog';
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
  intervention_place: string;
  accessories_received?: string | null;
  client_signature_url?: string | null;
  assets: {
    name: string;
    location: string;
  } | null;
}

const InterventionsPage: React.FC = () => {
  const { hasRole, role } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);
  const isSec = role === 'secretaire' || role === 'admin';

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
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

  const handleUpdateInvoiceStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('interventions')
      .update({ 
        invoice_status: status,
        invoice_deposited_at: status === 'Facture déposée' ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (error) {
      console.error("Erreur statut:", error);
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Statut mis à jour : ${status}`);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Facture déposée': return <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full"><CheckCircle2 size={10} className="mr-1" /> Déposée</Badge>;
      case 'Sous garantie': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full"><ShieldCheck size={10} className="mr-1" /> Garantie</Badge>;
      case 'Sous contrat': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 rounded-full"><ShieldAlert size={10} className="mr-1" /> Contrat</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full"><XCircle size={10} className="mr-1" /> Non déposée</Badge>;
    }
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
            <p className="text-lg text-muted-foreground">Journal historique et suivi administratif.</p>
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
              <DialogHeader>
                <DialogTitle>Nouvelle Intervention</DialogTitle>
                <DialogDescription>Saisissez les détails de l'action technique réalisée.</DialogDescription>
              </DialogHeader>
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
                  <th className="px-6 py-4">Équipement & Lieu</th>
                  <th className="px-6 py-4">Objet</th>
                  <th className="px-6 py-4">Statut Admin</th>
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn(
                          "text-[9px] uppercase border-none",
                          item.intervention_place === "Sur Site" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                        )}>
                          {item.intervention_place === "Sur Site" ? <MapPin size={8} className="mr-1" /> : <Warehouse size={8} className="mr-1" />}
                          {item.intervention_place}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">• {item.assets?.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium line-clamp-1">{item.title}</div>
                      <Badge variant="outline" className="mt-1 rounded-full text-[9px] uppercase">{item.maintenance_type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.invoice_status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {isSec && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-full text-[10px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                Changer Statut <ChevronDown size={12} className="ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(item.id, 'Facture déposée')} className="text-green-600 font-bold cursor-pointer">
                                <CheckCircle2 size={14} className="mr-2" /> Facture déposée
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(item.id, 'Sous garantie')} className="text-blue-600 font-bold cursor-pointer">
                                <ShieldCheck size={14} className="mr-2" /> Sous garantie
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(item.id, 'Sous contrat')} className="text-purple-600 font-bold cursor-pointer">
                                <ShieldAlert size={14} className="mr-2" /> Sous contrat
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(item.id, 'Facture non déposée')} className="text-red-600 font-bold cursor-pointer">
                                <XCircle size={14} className="mr-2" /> Non déposée
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => { setSelectedIntervention(item); setIsDetailOpen(true); }}
                          title="Voir Détails"
                        >
                          <Eye size={16} />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:bg-slate-50"
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

      {/* Dialog Détails complets de l'intervention */}
      <InterventionDetailDialog 
        intervention={selectedIntervention} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />

      {/* Dialog Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>Modifier l'intervention</DialogTitle>
            <DialogDescription>Mettez à jour les informations de l'intervention sélectionnée.</DialogDescription>
          </DialogHeader>
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
          <DialogHeader>
            <DialogTitle>Générer un Rapport Administratif</DialogTitle>
            <DialogDescription>Créez un document officiel basé sur cette intervention.</DialogDescription>
          </DialogHeader>
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