import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Plus, Search, AlertTriangle, TrendingUp, TrendingDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import CreateReagentForm from '@/components/CreateReagentForm';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Reagent {
  id: string;
  name: string;
  reference: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  supplier: string | null;
  purchase_cost: number;
}

const ReagentsPage: React.FC = () => {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Reagent, direction: 'ascending' | 'descending' } | null>(null);

  const fetchReagents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('lab_reagents')
      .select('*');

    if (error) {
      console.error("Error fetching reagents:", error);
      showError("Erreur lors du chargement des réactifs.");
    } else {
      setReagents(data as Reagent[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReagents();
  }, []);

  const handlePartCreationSuccess = () => {
    setIsCreateOpen(false);
    fetchReagents();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      currencyDisplay: 'symbol'
    }).format(amount).replace('XOF', 'FCFA');
  };

  const sortedReagents = useMemo(() => {
    let sortableItems = [...reagents];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    return sortableItems;
  }, [reagents, sortConfig]);

  const filteredAndSortedReagents = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return sortedReagents.filter(part =>
      part.name.toLowerCase().includes(lowerCaseSearch) ||
      part.reference.toLowerCase().includes(lowerCaseSearch) ||
      (part.supplier?.toLowerCase().includes(lowerCaseSearch) ?? false)
    );
  }, [sortedReagents, searchTerm]);

  const requestSort = (key: keyof Reagent) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getClassNamesFor = (key: keyof Reagent) => {
    if (!sortConfig) return;
    return sortConfig.key === key ? (sortConfig.direction === 'ascending' ? 'rotate-180' : '') : 'opacity-50';
  };

  const reagentsInAlert = reagents.filter(p => p.current_stock <= p.min_stock).length;
  const totalReagents = reagents.length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <FlaskConical className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Réactifs de Laboratoire</h1>
            <p className="text-lg text-muted-foreground">Gestion des stocks et suivi des consommations.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Ajouter Réactif
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Ajouter un nouveau Réactif</DialogTitle>
              <DialogDescription>Enregistrez une nouvelle référence de produit chimique ou biologique.</DialogDescription>
            </DialogHeader>
            <CreateReagentForm onSuccess={handlePartCreationSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground text-xs">Total Réactifs</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalReagents} Références</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground text-xs">Alerte Stock Bas</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">{reagentsInAlert} Alertes</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground text-xs">Réactif le plus consommé</CardTitle>
          </CardHeader>
          <CardContent><div className="text-lg font-bold">Acide Sulfurique (Mock)</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle>Stock de Réactifs</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Chercher par nom, réf, fournisseur..." 
                className="pl-10 rounded-xl" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 cursor-pointer" onClick={() => requestSort('name')}>
                    <div className="flex items-center">Désignation <ArrowUpDown size={14} className={cn("ml-1 transition-transform", getClassNamesFor('name'))} /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer" onClick={() => requestSort('reference')}>
                    <div className="flex items-center">Référence <ArrowUpDown size={14} className={cn("ml-1 transition-transform", getClassNamesFor('reference'))} /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer" onClick={() => requestSort('current_stock')}>
                    <div className="flex items-center">Stock <ArrowUpDown size={14} className={cn("ml-1 transition-transform", getClassNamesFor('current_stock'))} /></div>
                  </th>
                  <th className="px-6 py-4">Fournisseur</th>
                  <th className="px-6 py-4 text-right">Coût Unitaire</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                      Chargement des réactifs...
                    </td>
                  </tr>
                ) : filteredAndSortedReagents.length > 0 ? (
                  filteredAndSortedReagents.map(reagent => (
                    <tr key={reagent.id} className="hover:bg-accent/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{reagent.name}</div>
                        <div className="text-xs text-muted-foreground">{reagent.supplier}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">{reagent.reference}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={cn(
                            "text-lg font-black mr-2",
                            reagent.current_stock <= reagent.min_stock ? "text-red-600" : "text-foreground"
                          )}>
                            {reagent.current_stock}
                          </span>
                          <span className="text-xs text-muted-foreground">{reagent.unit} / {reagent.min_stock} min</span>
                        </div>
                        {reagent.current_stock <= reagent.min_stock && (
                          <Badge variant="destructive" className="mt-1 rounded-full text-[10px] flex items-center w-fit">
                            <AlertTriangle size={10} className="mr-1" /> Réapprovisionner
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{reagent.supplier || 'N/A'}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(reagent.purchase_cost)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="rounded-xl text-blue-600"><ArrowUpDown size={14} className="mr-1"/> Mouvement</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun réactif trouvé correspondant à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReagentsPage;