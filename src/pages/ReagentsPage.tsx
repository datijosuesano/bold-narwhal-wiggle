import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Plus, Search, AlertTriangle, ArrowUpDown, Loader2, Calendar, Hash, History } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import CreateReagentForm from '@/components/CreateReagentForm';
import ReagentStockAdjustment from '@/components/ReagentStockAdjustment';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { format, differenceInDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Reagent {
  id: string;
  name: string;
  reference: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  supplier: string | null;
  purchase_cost: number;
  lot_number: string | null;
  expiry_date: string | null;
}

const ReagentsPage: React.FC = () => {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Reagent, direction: 'ascending' | 'descending' } | null>(null);

  const fetchReagents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('lab_reagents').select('*');
    if (error) showError("Erreur lors du chargement des réactifs.");
    else setReagents(data as Reagent[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchReagents(); }, []);

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const date = new Date(expiryDate);
    const daysLeft = differenceInDays(date, new Date());
    
    if (isBefore(date, new Date())) return { label: "EXPIRÉ", class: "bg-red-600", icon: <AlertTriangle size={10} /> };
    if (daysLeft <= 30) return { label: `Expire dans ${daysLeft}j`, class: "bg-amber-500", icon: <Calendar size={10} /> };
    return null;
  };

  const filteredReagents = useMemo(() => {
    return reagents.filter(part =>
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reagents, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl"><FlaskConical className="h-8 w-8 text-blue-600" /></div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Réactifs Labo</h1>
            <p className="text-lg text-muted-foreground">Gestion intelligente et traçabilité.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 rounded-xl shadow-md"><Plus className="mr-2 h-4 w-4" /> Ajouter Réactif</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <CreateReagentForm onSuccess={() => { setIsCreateOpen(false); fetchReagents(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg border-l-4 border-red-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Alertes Expiration</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {reagents.filter(r => r.expiry_date && isBefore(new Date(r.expiry_date), new Date())).length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Ruptures proches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reagents.filter(r => r.current_stock <= r.min_stock).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="border-b bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg">Inventaire Temps Réel</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Rechercher..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-4">Produit & Traçabilité</th>
                  <th className="px-6 py-4">Date Expiration</th>
                  <th className="px-6 py-4">Niveau de Stock</th>
                  <th className="px-6 py-4">Ajustement</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-10"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" /></td></tr>
                ) : filteredReagents.map(reagent => {
                  const expiry = getExpiryStatus(reagent.expiry_date);
                  return (
                    <tr key={reagent.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{reagent.name}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px] font-mono flex items-center bg-white">
                            <Hash size={8} className="mr-1" /> LOT: {reagent.lot_number || '---'}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] bg-white">REF: {reagent.reference}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">
                          {reagent.expiry_date ? format(new Date(reagent.expiry_date), 'dd/MM/yyyy') : '---'}
                        </div>
                        {expiry && (
                          <Badge className={cn("mt-1 rounded-full text-[9px] text-white", expiry.class)}>
                            {expiry.icon} <span className="ml-1">{expiry.label}</span>
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={cn(
                            "text-xl font-black mr-2",
                            reagent.current_stock <= reagent.min_stock ? "text-red-600" : "text-blue-600"
                          )}>
                            {reagent.current_stock}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase">{reagent.unit}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Seuil min: {reagent.min_stock}</div>
                      </td>
                      <td className="px-6 py-4">
                        <ReagentStockAdjustment 
                          reagentId={reagent.id} 
                          currentStock={reagent.current_stock} 
                          reagentName={reagent.name}
                          onSuccess={fetchReagents}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" title="Historique">
                          <History size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReagentsPage;