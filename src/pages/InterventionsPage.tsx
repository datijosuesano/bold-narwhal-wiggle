import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Search, Filter, CheckCircle2, AlertCircle, Loader2, Calendar, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';

interface Intervention {
  id: string;
  title: string;
  maintenance_type: string;
  due_date: string;
  status: string;
  description: string;
  asset_id: string;
  assets: {
    name: string;
    location: string;
  } | null;
}

const InterventionsPage: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLogOpen, setIsLogOpen] = useState(false);

  const fetchInterventions = async () => {
    setIsLoading(true);
    // On récupère uniquement les OT terminés (qui sont donc des interventions réalisées)
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, assets(name, location)')
      .eq('status', 'Completed')
      .order('due_date', { ascending: false });

    if (error) {
      showError("Erreur lors du chargement de l'historique.");
    } else {
      setInterventions(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const filteredInterventions = interventions.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.assets?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.assets?.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-2xl">
            <Wrench className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Interventions</h1>
            <p className="text-lg text-muted-foreground">Journal historique des opérations réalisées.</p>
          </div>
        </div>
        
        <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Enregistrer Intervention
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nouvelle Intervention</DialogTitle>
              <CardDescription>Enregistrez une maintenance déjà effectuée pour mettre à jour l'historique et le stock.</CardDescription>
            </DialogHeader>
            {/* On réutilise le formulaire existant qui gère bien l'équipement et les pièces */}
            <AddPastInterventionForm 
                assetId="" // On va devoir modifier le formulaire pour permettre le choix de l'équipement si non fourni
                onSuccess={() => { setIsLogOpen(false); fetchInterventions(); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground text-xs">Total Réalisé</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{interventions.length} Actions</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground text-xs">Ce Mois-ci</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">12 Interventions</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground text-xs">Dernière Opération</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">
              {interventions[0]?.title || "Aucune"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle>Historique des Interventions</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Chercher par objet, site, équipement..." 
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
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Équipement & Site</th>
                  <th className="px-6 py-4">Objet de l'intervention</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" />
                    </td>
                  </tr>
                ) : filteredInterventions.length > 0 ? (
                  filteredInterventions.map(item => (
                    <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-muted-foreground" />
                          {format(new Date(item.due_date), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{item.assets?.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <MapPin size={10} className="mr-1" /> {item.assets?.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium line-clamp-1">{item.title}</div>
                        <div className="text-[10px] text-muted-foreground italic truncate max-w-xs">{item.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn(
                          "rounded-full text-[10px]",
                          item.maintenance_type === 'Preventive' ? "border-green-500 text-green-700 bg-green-50" : "border-red-500 text-red-700 bg-red-50"
                        )}>
                          {item.maintenance_type === 'Preventive' ? 'Préventive' : 'Corrective'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge className="bg-green-600 text-white rounded-full">Terminé</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-muted-foreground">
                      Aucune intervention trouvée.
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

export default InterventionsPage;