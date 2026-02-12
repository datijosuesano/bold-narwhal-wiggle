import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Filter, AlertCircle, CheckCircle2, Settings, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateAssetForm from "@/components/CreateAssetForm";
import EditAssetForm from "@/components/EditAssetForm"; 
import AssetDetailView from "@/components/AssetDetailView"; 
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Opérationnel' | 'Maintenance' | 'En Panne';
  serial_number: string;
  model: string;
  manufacturer: string;
  commissioning_date: string;
  purchase_cost: number;
  image_url?: string;
}

const AssetsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [equipments, setEquipments] = useState<Asset[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('assets').select('*');
    if (error) {
      showError("Erreur lors du chargement des équipements.");
    } else {
      setEquipments(data as Asset[]);
    }
    setIsLoading(false);
  };
  
  useEffect(() => { fetchAssets(); }, []);

  const filteredEquipments = useMemo(() => {
    if (!searchTerm) return equipments;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return equipments.filter(item =>
      item.name.toLowerCase().includes(lowerCaseSearch) ||
      item.location.toLowerCase().includes(lowerCaseSearch) ||
      item.category.toLowerCase().includes(lowerCaseSearch)
    );
  }, [equipments, searchTerm]);

  const getStatusStyle = (status: Asset['status']) => {
    switch (status) {
      case 'Opérationnel': return 'bg-green-100 text-green-700 border-green-200';
      case 'Maintenance': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'En Panne': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">Gestion des Équipements</h1>
          <p className="text-lg text-muted-foreground">Suivez l'état visuel et technique de votre parc.</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"><Plus className="mr-2 h-4 w-4" /> Ajouter Équipement</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nouvel Équipement</DialogTitle>
            </DialogHeader>
            <CreateAssetForm onSuccess={() => { setIsCreateModalOpen(false); fetchAssets(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="p-4 border-b flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Rechercher..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-6 py-3">Photo</th>
                  <th className="px-6 py-3">Équipement</th>
                  <th className="px-6 py-3">Localisation</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : filteredEquipments.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{item.location}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getStatusStyle(item.status))}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { setSelectedAsset(item); setIsDetailModalOpen(true); }}><Eye size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { setSelectedAsset(item); setIsEditModalOpen(true); }}><Edit2 size={16} /></Button>
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
          {selectedAsset && (
            <AssetDetailView 
              asset={{
                ...selectedAsset,
                serialNumber: selectedAsset.serial_number,
                commissioningDate: new Date(selectedAsset.commissioning_date),
                purchaseCost: selectedAsset.purchase_cost,
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsPage;