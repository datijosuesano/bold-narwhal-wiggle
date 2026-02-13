import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreatePartForm from '@/components/CreatePartForm';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState([]);
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
          <h1 className="text-4xl font-extrabold text-primary">Inventaire Pièces</h1>
        </div>
        <Dialog onOpenChange={(open) => !open && fetchParts()}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 rounded-xl shadow-md"><Plus className="mr-2 h-4 w-4" /> Ajouter Pièce</Button>
          </DialogTrigger>
          <DialogContent><CreatePartForm onSuccess={() => {}} /></DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="Rechercher une pièce..." className="pl-10 rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div> : (
        <Card className="shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Désignation / Réf</th>
                <th className="px-6 py-4">Stock Actuel</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredParts.map(part => (
                <tr key={part.id} className="hover:bg-accent/50">
                  <td className="px-6 py-4">
                    <div className="font-bold">{part.name}</div>
                    <div className="text-xs text-muted-foreground">{part.reference}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-lg">{part.quantity}</td>
                  <td className="px-6 py-4">
                    {part.quantity <= part.min_quantity ? (
                      <Badge variant="destructive" className="rounded-full"><AlertTriangle size={12} className="mr-1" /> Stock Bas</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full">OK</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="rounded-xl text-blue-600">Détails</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default InventoryPage;