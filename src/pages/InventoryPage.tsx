import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreatePartForm from '@/components/CreatePartForm';
import { supabase } from '@/integrations/supabase/client';

const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParts = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('lab_reagents').select('*');
    setParts(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchParts(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl"><Box className="h-8 w-8 text-blue-600" /></div>
          <h1 className="text-4xl font-extrabold text-primary">Inventaire</h1>
        </div>
        <Dialog onOpenChange={(open) => !open && fetchParts()}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 rounded-xl"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent><CreatePartForm onSuccess={() => {}} /></DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader><CardTitle className="text-xs uppercase text-muted-foreground">Articles en stock</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{parts.length} Références</div></CardContent>
        </Card>
      </div>

      {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
        <Card className="shadow-lg p-0">
          <div className="p-8 text-center text-muted-foreground">
            {parts.length > 0 ? "Liste des pièces..." : "Votre inventaire est vide."}
          </div>
        </Card>
      )}
    </div>
  );
};

export default InventoryPage;