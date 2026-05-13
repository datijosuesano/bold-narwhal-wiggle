import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import CreateAssetForm from "@/components/CreateAssetForm";
import EditAssetForm from "@/components/EditAssetForm";
import AssetDetailView from "@/components/AssetDetailView";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AssetsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('assets').select('*').order('name');
      if (error) throw error;
      setEquipments(data || []);
    } catch (err: any) {
      console.error("Erreur chargement assets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, [user]);

  const filteredEquipments = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return equipments.filter(item => {
      const name = (item.name || "").toLowerCase();
      const location = (item.location || "").toLowerCase();
      const sn = (item.serial_number || "").toLowerCase();
      return name.includes(lowerCaseSearch) || location.includes(lowerCaseSearch) || sn.includes(lowerCaseSearch);
    });
  }, [equipments, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">Gestion des Équipements</h1>
          <p className="text-lg text-muted-foreground">Suivez l'état technique de votre parc.</p>
        </div>
        {canEdit && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Ajouter Équipement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Nouvel Équipement</DialogTitle>
                <DialogDescription>Enregistrez un nouvel appareil médical dans l'inventaire.</DialogDescription>
              </DialogHeader>
              <CreateAssetForm onSuccess={() => { setIsCreateModalOpen(false); fetchAssets(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Rechercher par nom, site ou S/N..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-6 py-3">Équipement</th>
                  <th className="px-6 py-3">Localisation</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={4} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : filteredEquipments.length > 0 ? (
                  filteredEquipments.map((item) => (
                    <tr key={item.id} className="hover:bg-accent/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase">S/N: {item.serial_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.location || "Non localisé"}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="rounded-full text-[10px] uppercase font-bold">{item.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => { setSelectedAsset(item); setIsDetailModalOpen(true); }}>
                            <Eye size={16} />
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600" onClick={() => { setSelectedAsset(item); setIsEditOpen(true); }}>
                              <Edit2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center py-20 text-muted-foreground italic">Aucun équipement trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Aperçu de l'Équipement</DialogTitle>
            <DialogDescription>Consultez les détails techniques et l'historique de cet appareil.</DialogDescription>
          </DialogHeader>
          {selectedAsset && <AssetDetailView asset={{...selectedAsset, serialNumber: selectedAsset.serial_number, commissioningDate: new Date(selectedAsset.commissioning_date), purchaseCost: selectedAsset.purchase_cost, expiryDate: selectedAsset.expiry_date ? new Date(selectedAsset.expiry_date) : null}} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Modifier l'Équipement</DialogTitle>
            <DialogDescription>Mettez à jour les informations de l'appareil sélectionné.</DialogDescription>
          </DialogHeader>
          {selectedAsset && <EditAssetForm asset={{...selectedAsset, serialNumber: selectedAsset.serial_number, commissioningDate: new Date(selectedAsset.commissioning_date), purchaseCost: selectedAsset.purchase_cost, expiryDate: selectedAsset.expiry_date ? new Date(selectedAsset.expiry_date) : null}} onSuccess={() => { setIsEditOpen(false); fetchAssets(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsPage;