import React, { useState, useMemo } from 'react';
import { Plus, Search, Eye, Edit2, Filter, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateAssetForm from "@/components/CreateAssetForm";
import EditAssetForm from "@/components/EditAssetForm"; // Import du nouveau composant
import { cn } from "@/lib/utils";

// Define Asset type based on mock data structure
interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Opérationnel' | 'Maintenance' | 'En Panne';
  // Ajout de champs pour l'édition (avec des valeurs par défaut pour la démo)
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  commissioningDate?: Date;
  purchaseCost?: number;
}

// Données fictives pour la démo
const initialEquipments: Asset[] = [
  { id: 'EQ-001', name: 'Compresseur Industriel V12', category: 'Production', location: 'Zone A', status: 'Opérationnel', serialNumber: 'SN-12345', model: 'V12-Turbo', manufacturer: 'AirTech', commissioningDate: new Date('2020-01-15'), purchaseCost: 45000.00 },
  { id: 'EQ-002', name: 'Groupe Électrogène 500kVA', category: 'Énergie', location: 'Extérieur', status: 'Maintenance', serialNumber: 'SN-67890', model: 'GenPower 500', manufacturer: 'ElectroGen', commissioningDate: new Date('2018-05-20'), purchaseCost: 80000.00 },
  { id: 'EQ-003', name: 'Pompe Hydraulique P-45', category: 'Logistique', location: 'Zone C', status: 'En Panne', serialNumber: 'SN-11223', model: 'HydroFlow P45', manufacturer: 'Fluidics', commissioningDate: new Date('2021-11-01'), purchaseCost: 12000.00 },
  { id: 'EQ-004', name: 'Convoyeur Principal', category: 'Production', location: 'Zone B', status: 'Opérationnel', serialNumber: 'SN-44556', model: 'ConveyMax', manufacturer: 'MoveCorp', commissioningDate: new Date('2019-03-10'), purchaseCost: 30000.00 },
  { id: 'EQ-005', name: 'Chariot Élévateur E-20', category: 'Logistique', location: 'Entrepôt', status: 'Opérationnel', serialNumber: 'SN-77889', model: 'LiftPro E20', manufacturer: 'ForkLift Inc', commissioningDate: new Date('2022-08-25'), purchaseCost: 22000.00 },
];

const AssetsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [equipments, setEquipments] = useState(initialEquipments); 

  const handleAssetCreationSuccess = () => {
    setIsCreateModalOpen(false);
    // En production, on rafraîchirait la liste ici.
  };

  const handleAssetEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedAsset(null);
    // En production, on rafraîchirait la liste ici.
  };

  const handleEditClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
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
                {filteredEquipments.length > 0 ? (
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-blue-600">
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditClick(item)} // Ajout de l'action de modification
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
                      Aucun équipement trouvé correspondant à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Asset Dialog (Separate Modal) */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Modifier l'Équipement: {selectedAsset?.name}</DialogTitle>
            <CardDescription>
              Mettez à jour les informations de cet actif.
            </CardDescription>
          </DialogHeader>
          {selectedAsset && (
            <EditAssetForm asset={selectedAsset} onSuccess={handleAssetEditSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsPage;