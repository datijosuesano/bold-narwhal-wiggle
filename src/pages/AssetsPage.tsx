import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Loader2, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateAssetForm from "@/components/CreateAssetForm";
import EditAssetForm from "@/components/EditAssetForm";
import AssetDetailView from "@/components/AssetDetailView";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

const AssetsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAssets = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase.from('assets').select('*').order('name');
      if (error) throw error;
      setEquipments(data || []);
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, [user]);

  const filteredEquipments = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return equipments.filter(item => 
      item.name.toLowerCase().includes(lowerCaseSearch) ||
      item.location.toLowerCase().includes(lowerCaseSearch)
    );
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
              <DialogHeader><DialogTitle className="text-2xl font-bold">Nouvel Équipement</DialogTitle></DialogHeader>
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
              <Input placeholder="Rechercher..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                  <tr><td colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : filteredEquipments.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-sm">{item.location}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="rounded-full">{item.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { setSelectedAsset(item); setIsDetailModalOpen(true); }}>
                          <Eye size={16} />
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { setSelectedAsset(item); setIsEditModalOpen(true); }}>
                            <Edit2 size={16} />
                          </Button>
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

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl">
          <DialogHeader><DialogTitle>Aperçu de l'Équipement</DialogTitle></DialogHeader>
          {selectedAsset && <AssetDetailView asset={{...selectedAsset, serialNumber: selectedAsset.serial_number, commissioningDate: new Date(selectedAsset.commissioning_date), purchaseCost: selectedAsset.purchase_cost}} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader><DialogTitle className="text-2xl font-bold">Modifier l'Équipement</DialogTitle></DialogHeader>
          {selectedAsset && <EditAssetForm asset={{...selectedAsset, serialNumber: selectedAsset.serial_number, commissioningDate: new Date(selectedAsset.commissioning_date), purchaseCost: selectedAsset.purchase_cost}} onSuccess={() => { setIsEditModalOpen(false); fetchAssets(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsPage;