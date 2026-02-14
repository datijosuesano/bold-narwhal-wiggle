import React, { useState, useEffect } from 'react';
import { Hammer, Plus, Search, Loader2, UserCheck, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateToolForm from '@/components/CreateToolForm';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  name: string;
  serial_number: string;
  category: string;
  status: string;
  assigned_to: string | null;
}

interface Tech {
  id: string;
  first_name: string;
  last_name: string;
}

const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    const { data: toolsData } = await supabase.from('tools').select('*').order('name');
    const { data: profilesData } = await supabase.from('profil').select('id, first_name, last_name');
    
    setTools(toolsData || []);
    setTechs(profilesData || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (toolId: string, techId: string) => {
    const status = techId === "null" ? 'Disponible' : 'Attribué';
    const assignedValue = techId === "null" ? null : techId;

    console.log(`[ToolsPage] Tentative d'attribution de l'outil ${toolId} au technicien ${assignedValue}`);

    const { error } = await supabase
      .from('tools')
      .update({ 
        assigned_to: assignedValue, 
        status: status 
      })
      .eq('id', toolId);

    if (error) {
      console.error("[ToolsPage] Erreur Supabase détaillée:", error);
      showError(`Erreur lors de l'attribution: ${error.message}`);
    } else {
      showSuccess("Mise à jour effectuée.");
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tools').delete().eq('id', id);
    if (error) showError("Erreur suppression.");
    else {
      showSuccess("Outil supprimé.");
      fetchData();
    }
  };

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl"><Hammer className="h-8 w-8 text-blue-600" /></div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Outils de Travail</h1>
            <p className="text-lg text-muted-foreground">Inventaire et affectation de l'outillage.</p>
          </div>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 rounded-xl shadow-md"><Plus className="mr-2 h-4 w-4" /> Nouvel Outil</Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader><DialogTitle>Enregistrer un outil</DialogTitle></DialogHeader>
            <CreateToolForm onSuccess={fetchData} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher un outil ou n° de série..." 
          className="pl-10 rounded-xl" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map(tool => (
            <Card key={tool.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">{tool.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{tool.serial_number}</CardDescription>
                  </div>
                  <Badge className={cn(
                    "rounded-full",
                    tool.status === 'Disponible' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {tool.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Affectation :</div>
                <Select 
                  defaultValue={tool.assigned_to || "null"} 
                  onValueChange={(val) => handleAssign(tool.id, val)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Attribuer à..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">-- Aucun (Disponible) --</SelectItem>
                    {techs.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.first_name} {tech.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex justify-end pt-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(tool.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredTools.length === 0 && (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <Hammer className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <p className="text-muted-foreground">Aucun outil trouvé.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolsPage;