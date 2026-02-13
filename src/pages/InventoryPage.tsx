import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, Loader2, AlertTriangle, Package, Edit2, Trash2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CreatePartForm from '@/components/CreatePartForm';
import EditPartForm from '@/components/EditPartForm';
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
}

const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
              <DialogDescription>Remplissez les informations pour ajouter une référence au stock.</DialogDescription>
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
            <Card key={part.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">{part.name}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="mr-2 text-[10px]">{part.category}</Badge>
                      <span className="font-mono">{part.reference}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedPart(part); setIsEditOpen(true); }}><Edit2 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50" onClick={() => { setSelectedPart(part); setIsDeleteOpen(true); }}><Trash2 size={14} /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground flex items-center">
                    <Package size={16} className="mr-2" /> Stock :
                  </div>
                  <div className={cn("text-2xl font-black", part.current_stock <= part.min_stock ? "text-red-600" : "text-blue-600")}>
                    {part.current_stock}
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin size={12} className="mr-1" /> {part.location || "Non localisé"}
                </div>

                {part.current_stock <= part.min_stock && (
                  <Badge variant="destructive" className="w-full justify-center rounded-lg py-1">
                    <AlertTriangle size={12} className="mr-2" /> Seuil critique ({part.min_stock})
                  </Badge>
                )}
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