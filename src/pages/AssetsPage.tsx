import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Filter, AlertCircle, CheckCircle2, Settings, Loader2 } from 'lucide-react';
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

// Define Asset type based on DB structure
interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Opérationnel' | 'Maintenance' | 'En Panne';
  serial_number: string; // DB field name
  model: string;
  manufacturer: string;
  commissioning_date: string; // DB returns string/ISO date
  purchase_cost: number;
}

// Helper function to map DB fields to component props (if needed, but we adjust the component type)
// For simplicity, we will use the DB field names in this page component.

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
    const { data, error } = await supabase
      .from('assets')
      .select('*');

    if (error) {
      console.error("Error fetching assets:", error);
      showError("Erreur lors du chargement des équipements.");
      setEquipments([]); // Clear existing data on error
    } else {
      // Cast dates to Date objects for compatibility with sub-components if necessary, 
      // but for display and simple passing, string ISO date is often fine.
      setEquipments(data as Asset[]);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAssetCreationSuccess = () => {
    setIsCreateModalOpen(false);
    fetchAssets(); // Refresh list
  };

  const handleAssetEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedAsset(null);
    fetchAssets(); // Refresh list
  };

  const handleEditClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
  };
  
  const handleDetailClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };

  // 1. Implémentation de la logique de filtrage
  const filteredEquipments = useMemo(() => {
    if (!searchTerm) return equipments;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return equipments.filter(item =>
      item.name.toLowerCase().includes(lowerCaseSearch) ||
      item.id.toLowerCase().includes(lowerCaseSearch) ||
      item.location.toLowerCase().includes(lowerCaseSearch) ||
      item.category.toLowerCase().includes(lowerCaseSearch)
    );
  }, [equipments, searchTerm]);

  // 2. Logique de style pour le statut (couleurs)
  const getStatusStyle = (status: Asset['status']) => {
    switch (status) {
      case 'Opérationnel': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
      case 'Maintenance': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900';
      case 'En Panne': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-700';
    }
  };

  // KPI Data
  const totalAssets = equipments.length;
  const assetsInBreakdown = equipments.filter(a => a.status === 'En Panne').length;
  const assetsOperational = equipments.filter(a => a.status === 'Opérationnel').length;

  const kpiData = [
    { label: 'Total Actifs', value: totalAssets, icon: <Settings className="text-blue-600" />, color: 'border-blue-500' },
    { label: 'En Panne', value: assetsInBreakdown, icon: <AlertCircle className="text-red-500" />, color: 'border-red-500' },
    { label: 'En Service', value: assetsOperational, icon: <CheckCircle2 className="text-green-500" />, color: 'border-green-500' }
  ];


  return (
    <div className="space-y-8">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            Gestion des Équipements
          </h1>
          <p className="text-lg text-muted-foreground">
            Gérez et suivez l'état de votre parc matériel.
          </p>
        </div>
        
        {/* Add Asset Dialog */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Ajouter Équipement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Ajouter un nouvel Équipement</DialogTitle>
              <CardDescription>
                Remplissez les détails pour enregistrer un nouvel actif.
              </CardDescription>
            </DialogHeader>
            <CreateAssetForm onSuccess={handleAssetCreationSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {kpiData.map((kpi, i) => (
          <Card key={i} className={cn("shadow-lg transition-transform hover:scale-[1.02] border-l-4", kpi.color)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <div className="p-2 bg-accent rounded-full">{kpi.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Liste des Actifs</CardTitle>
          <CardDescription>
            Visualisez tous les équipements enregistrés.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Filters */}
          <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Rechercher par nom, ID ou localisation..." 
                className="w-full pl-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-xl">
              <Filter size={18} className="mr-2 h-4 w-4" />
              Filtres Avancés
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-6 py-3 font-semibold">Équipement</th>
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-6 py-3 font-semibold">Localisation</th>
                  <th className="px-6 py-3 font-semibold">Statut</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                      Chargement des équipements...
                    </td>
                  </tr>
                ) : filteredEquipments.length > 0 ? (
                  filteredEquipments.map((item) => (
                    <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{item.id}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.location}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium border",
                          getStatusStyle(item.status)
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-blue-600"
                            onClick={() => handleDetailClick(item)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditClick(item)} 
                          >
                            <Edit2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun équipement trouvé. Ajoutez-en un pour commencer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Asset Dialog (Requires data mapping for EditAssetForm) */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Modifier l'Équipement: {selectedAsset?.name}</DialogTitle>
            <CardDescription>
              Mettez à jour les informations de cet actif.
            </CardDescription>
          </DialogHeader>
          {selectedAsset && (
            <EditAssetForm 
              // Mapping des noms de champs de la DB vers les noms de props du formulaire
              asset={{
                ...selectedAsset,
                serialNumber: selectedAsset.serial_number,
                commissioningDate: new Date(selectedAsset.commissioning_date),
                purchaseCost: selectedAsset.purchase_cost,
              }} 
              onSuccess={handleAssetEditSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Asset Detail Dialog (Requires data mapping for AssetDetailView) */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Détails de l'Équipement</DialogTitle>
            <CardDescription>
              Informations complètes et historique de maintenance.
            </CardDescription>
          </DialogHeader>
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