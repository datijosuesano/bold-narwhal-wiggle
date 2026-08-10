import React, { useState, useEffect, useMemo } from 'react';
import { Box, Plus, Search, Loader2, AlertTriangle, Package, Edit2, Trash2, MapPin, DollarSign, ListOrdered, History, ShieldAlert, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CreatePartForm from '@/components/Parts/CreatePartForm';
import EditPartForm from '@/components/Parts/EditPartForm';
import PartStockAdjustment from '@/components/Parts/PartStockAdjustment';
import PartHistoryDialog from '@/components/Parts/PartHistoryDialog';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface Part {
  id: string;
  name: string;
  reference: string;
  current_stock: number;
  min_stock: number;
  location: string;
  category: string;
  purchase_cost?: number;
  supplier?: string;
  compatible_equipment?: string;
}

const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  
  // États d'ouverture de modales
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [historyPart, setHistoryPart] = useState<{id: string, name: string} | null>(null);

  const fetchParts = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('spare_parts').select('*').order('name');
    setParts(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchParts(); }, []);

  const handleDelete = async () => {
    if (!selectedPart) return;
    const { error } = await supabase.from('spare_parts').delete().eq('id', selectedPart.id);
    if (error) showError("Erreur lors de la suppression.");
    else {
      showSuccess("Pièce supprimée.");
      fetchParts();
    }
    setIsDeleteOpen(false);
  };

  // Filtrage intelligent
  const filteredParts = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return parts.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.reference.toLowerCase().includes(search) ||
      (p.supplier || "").toLowerCase().includes(search) ||
      (p.compatible_equipment || "").toLowerCase().includes(search)
    );
  }, [parts, searchTerm]);

  // Calcul analytique performant des KPIs d'inventaire
  const kpiStats = useMemo(() => {
    const totalRefs = parts.length;
    let criticalStock = 0;
    let outOfStock = 0;
    let totalQty = 0;
    let totalValuation = 0;

    parts.forEach(part => {
      totalQty += part.current_stock;
      totalValuation += part.current_stock * (part.purchase_cost || 0);
      
      if (part.current_stock === 0) {
        outOfStock++;
      } else if (part.current_stock <= part.min_stock) {
        criticalStock++;
      }
    });

    return { totalRefs, criticalStock, outOfStock, totalQty, totalValuation };
  }, [parts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      currencyDisplay: 'symbol'
    }).format(amount).replace('XOF', 'FCFA');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl"><Box className="h-8 w-8 text-blue-600" /></div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Pièces de Rechange</h1>
            <p className="text-lg text-muted-foreground">Gestion du stock technique biomédical et valorisation.</p>
          </div>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 rounded-xl shadow-md"><Plus className="mr-2 h-4 w-4" /> Ajouter Pièce</Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>Enregistrer une nouvelle pièce</DialogTitle>
              <DialogDescription>Remplissez les informations pour ajouter une référence au stock.</DialogDescription>
            </DialogHeader>
            <CreatePartForm onSuccess={fetchParts} />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI DASHBOARD */}
      {!isLoading && (
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-5">
          <Card className="shadow-sm border-l-4 border-l-blue-600 transition hover:scale-[1.01] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                <Box size={14} className="text-blue-600" /> Réf. uniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-800">{kpiStats.totalRefs}</div>
              <p className="text-[10px] text-muted-foreground">Références distinctes</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-amber-500 transition hover:scale-[1.01] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                <ShieldAlert size={14} className="text-amber-500" /> Stock critique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600">{kpiStats.criticalStock}</div>
              <p className="text-[10px] text-muted-foreground">Seuil d'alerte atteint</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-rose-600 transition hover:scale-[1.01] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                <AlertTriangle size={14} className="text-rose-600" /> Ruptures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-red-600">{kpiStats.outOfStock}</div>
              <p className="text-[10px] text-muted-foreground">Stock égal à 0</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-emerald-600 transition hover:scale-[1.01] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                <ListOrdered size={14} className="text-emerald-600" /> Volume de Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600">{kpiStats.totalQty}</div>
              <p className="text-[10px] text-muted-foreground">Unités physiques totales</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-indigo-600 transition hover:scale-[1.01] bg-white col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                <DollarSign size={14} className="text-indigo-600" /> Valorisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-black text-indigo-700 truncate">{formatCurrency(kpiStats.totalValuation)}</div>
              <p className="text-[10px] text-muted-foreground">Valeur globale d'achat</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* RECHERCHE */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher nom, réf, fournisseur, compatibilité..." 
          className="pl-10 rounded-xl" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredParts.map(part => (
            <Card key={part.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between bg-white border">
              <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">{part.name}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="mr-2 text-[10px] uppercase font-bold tracking-wider">{part.category || 'Maintenance'}</Badge>
                      <span className="font-mono text-xs">{part.reference}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedPart(part); setIsEditOpen(true); }}><Edit2 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50" onClick={() => { setSelectedPart(part); setIsDeleteOpen(true); }}><Trash2 size={14} /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-muted-foreground flex items-center">
                      <Package size={16} className="mr-2" /> Stock :
                    </div>
                    <div className={cn("text-2xl font-black", part.current_stock <= part.min_stock ? "text-red-600" : "text-blue-600")}>
                      {part.current_stock}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Emplacement :</span>
                      <span className="font-bold">{part.location || "Non localisé"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Fournisseur :</span>
                      <span className="font-bold truncate max-w-[150px]">{part.supplier || "Non spécifié"}</span>
                    </div>
                    {part.purchase_cost ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">P.U. d'achat :</span>
                        <span className="font-mono font-bold text-slate-700">{formatCurrency(part.purchase_cost)}</span>
                      </div>
                    ) : null}
                  </div>

                  {part.compatible_equipment && (
                    <div className="pt-2 border-t text-[11px] text-slate-500 leading-tight">
                      <span className="font-bold text-slate-600 block mb-0.5">Équipements compatibles :</span>
                      {part.compatible_equipment}
                    </div>
                  )}

                  {part.current_stock <= part.min_stock && (
                    <Badge variant="destructive" className="w-full justify-center rounded-lg py-1 mt-2 text-[10px] font-black uppercase">
                      <AlertTriangle size={12} className="mr-2" /> Seuil d'alerte atteint ({part.min_stock})
                    </Badge>
                  )}
                </div>

                {/* MODULES DE STOCK ET TRACABILITE */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t">
                  <PartStockAdjustment 
                    partId={part.id} 
                    currentStock={part.current_stock} 
                    partName={part.name} 
                    onSuccess={fetchParts} 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-xl text-blue-600 hover:bg-blue-50 shrink-0" 
                    title="Voir l'historique"
                    onClick={() => setHistoryPart({ id: part.id, name: part.name })}
                  >
                    <History size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader><DialogTitle>Modifier la pièce</DialogTitle></DialogHeader>
          {selectedPart && <EditPartForm part={selectedPart} onSuccess={() => { setIsEditOpen(false); fetchParts(); }} />}
        </DialogContent>
      </Dialog>

      {/* Dialogue d'historique de traçabilité des mouvements */}
      <PartHistoryDialog 
        partId={historyPart?.id || null} 
        partName={historyPart?.name || null}
        isOpen={!!historyPart}
        onClose={() => setHistoryPart(null)}
      />

      {/* Alerte de Suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette pièce ?</AlertDialogTitle>
            <AlertDialogDescription>Voulez-vous vraiment retirer <strong>{selectedPart?.name}</strong> du stock ?</AlertDialogDescription>
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

export default InventoryPage;