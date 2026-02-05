import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Box, Plus, Search, MapPin, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import CreatePartForm from '@/components/CreatePartForm';

interface Part {
  id: string;
  name: string;
  reference: string;
  quantity: number;
  minQuantity: number;
  location: string;
  category: string;
}

const initialParts: Part[] = [
  { id: 'P-001', name: 'Filtre HEPA H14', reference: 'FLT-889', quantity: 12, minQuantity: 5, location: 'Rayon A-12', category: 'Filtration' },
  { id: 'P-002', name: 'Sonde Thermique T100', reference: 'SND-102', quantity: 2, minQuantity: 3, location: 'Rayon B-04', category: 'Capteurs' },
  { id: 'P-003', name: 'Carte Mère CPU-M1', reference: 'BRD-445', quantity: 1, minQuantity: 1, location: 'Coffre Fort', category: 'Electronique' },
];

const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredParts = useMemo(() => {
    if (!searchTerm) return parts;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return parts.filter(part =>
      part.name.toLowerCase().includes(lowerCaseSearch) ||
      part.reference.toLowerCase().includes(lowerCaseSearch) ||
      part.location.toLowerCase().includes(lowerCaseSearch)
    );
  }, [parts, searchTerm]);

  const handlePartCreationSuccess = () => {
    setIsCreateOpen(false);
    // En production, on rafraîchirait la liste ici.
  };

  const partsInAlert = parts.filter(p => p.quantity <= p.minQuantity).length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Box className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Inventaire</h1>
            <p className="text-lg text-muted-foreground">Gestion des pièces de rechange et du stockage.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Ajouter une pièce
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Ajouter une nouvelle Pièce</DialogTitle>
              <DialogDescription>Enregistrez une nouvelle référence dans votre stock.</DialogDescription>
            </DialogHeader>
            <CreatePartForm onSuccess={handlePartCreationSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground text-xs">Articles en stock</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{parts.length} Références</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground text-xs">Alerte Réappro.</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">{partsInAlert} Alertes</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle>Stock de Pièces</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Chercher par nom, réf..." 
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
                  <th className="px-6 py-4">Désignation</th>
                  <th className="px-6 py-4">Référence</th>
                  <th className="px-6 py-4">Quantité</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4"><div className="flex items-center"><MapPin size={14} className="mr-1"/> Lieu</div></th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredParts.length > 0 ? (
                  filteredParts.map(part => (
                    <tr key={part.id} className="hover:bg-accent/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{part.name}</div>
                        <div className="text-xs text-muted-foreground">{part.category}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">{part.reference}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={cn(
                            "text-lg font-black mr-2",
                            part.quantity <= part.minQuantity ? "text-red-600" : "text-foreground"
                          )}>
                            {part.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground">/ {part.minQuantity} min</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[100px] mx-auto">
                          <div 
                            className={cn("h-1.5 rounded-full", part.quantity <= part.minQuantity ? "bg-red-500" : "bg-green-500")}
                            style={{ width: `${Math.min((part.quantity / (part.minQuantity * 2)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{part.location}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="rounded-xl text-blue-600"><ArrowUpDown size={14} className="mr-1"/> Mouvement</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune pièce trouvée correspondant à votre recherche.
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

export default InventoryPage;