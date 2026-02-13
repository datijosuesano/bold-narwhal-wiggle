import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, Loader2, AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import CreatePartForm from '@/components/CreatePartForm';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Part {
  id: string;
  name: string;
  reference: string;
  current_stock: number;
  min_stock: number;
  category: string;
}

const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchParts = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('spare_parts').select('*').order('name');
    setParts(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchParts(); }, []);

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl"><Box className="h-8 w-8 text-blue-600" /></div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Pièces de Rechange</h1>
            <p className="text-lg text-muted-foreground">Gestion du stock technique.</p>
          </div>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 rounded-xl shadow-md"><Plus className="mr-2 h-4 w-4" /> Ajouter Pièce</Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>Enregistrer une nouvelle pièce</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous pour ajouter une référence au stock.
              </DialogDescription>
            </DialogHeader>
            <CreatePartForm onSuccess={fetchParts} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher une pièce..." 
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
            <Card key={part.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">{part.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{part.reference}</CardDescription>
                  </div>
                  <Badge variant={part.current_stock <= part.min_stock ? "destructive" : "secondary"} className="rounded-full">
                    {part.current_stock <= part.min_stock ? "Stock Bas" : "En Stock"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground flex items-center">
                    <Package size={16} className="mr-2" /> Quantité disponible :
                  </div>
                  <div className={cn(
                    "text-2xl font-black",
                    part.current_stock <= part.min_stock ? "text-red-600" : "text-blue-600"
                  )}>
                    {part.current_stock}
                  </div>
                </div>
                {part.current_stock <= part.min_stock && (
                  <div className="p-2 bg-red-50 text-red-700 rounded-lg text-xs flex items-center">
                    <AlertTriangle size={14} className="mr-2" /> Attention : Seuil d'alerte ({part.min_stock}) atteint.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {filteredParts.length === 0 && (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed text-muted-foreground">
              Aucune pièce trouvée.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;