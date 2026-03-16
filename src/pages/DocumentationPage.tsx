import React, { useState, useEffect } from 'react';
import { FileText, Search, Loader2, Globe, FileType, ExternalLink, Download, Filter, Factory, Plus, Trash2, Calendar, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import CreateDocumentForm from '@/components/CreateDocumentForm';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AssetDoc {
  id: string;
  name: string;
  file_url: string;
  category: string;
  created_at: string;
  asset_id: string;
  user_id: string;
  assets: {
    name: string;
    location: string;
  } | null;
}

const DocumentationPage: React.FC = () => {
  const [docs, setDocs] = useState<AssetDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchDocs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('asset_documents')
      .select('*, assets(name, location)')
      .order('created_at', { ascending: false });

    if (!error) setDocs(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      if (url.includes('supabase.co/storage')) {
        const path = url.split('asset-documents/')[1];
        if (path) await supabase.storage.from('asset-documents').remove([path]);
      }
      await supabase.from('asset_documents').delete().eq('id', id);
      showSuccess("Document supprimé.");
      fetchDocs();
    } catch (err) { showError("Erreur suppression."); }
  };

  const filteredDocs = docs.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.assets?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Documentation Technique</h1>
            <p className="text-lg text-muted-foreground">Gestion centralisée des manuels et schémas.</p>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 px-6 font-bold">
              <Plus className="mr-2 h-5 w-5" /> Ajouter Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Nouveau Document</DialogTitle>
              <DialogDescription>Associez un fichier ou un lien à un équipement du parc.</DialogDescription>
            </DialogHeader>
            <CreateDocumentForm onSuccess={() => { setIsAddOpen(false); fetchDocs(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Rechercher par manuel, appareil, site, ID..." 
            className="pl-10 rounded-xl bg-white shadow-sm h-12 border-none ring-1 ring-slate-200" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => {
              const isExternal = !doc.file_url.includes('supabase.co/storage');
              return (
                <Card key={doc.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden border-none bg-white">
                  <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "p-2 rounded-xl",
                        isExternal ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {isExternal ? <Globe size={20} /> : <FileType size={20} />}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white">
                          {doc.category}
                        </Badge>
                        <span className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                          ID: {doc.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 line-clamp-2 min-h-[2.5rem] leading-tight">{doc.name}</h4>
                      
                      <div className="mt-4 space-y-2 border-t pt-3">
                        <div className="flex items-center text-[10px] text-blue-600 font-bold uppercase">
                          <Factory size={12} className="mr-2 shrink-0" />
                          <span className="truncate">{doc.assets?.name || "Appareil inconnu"}</span>
                        </div>
                        
                        <div className="flex items-center text-[10px] text-slate-500 font-medium">
                          <Calendar size={12} className="mr-2 shrink-0" />
                          <span>Ajouté le {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                        </div>
                        
                        <div className="flex items-center text-[10px] text-slate-400">
                          <Hash size={12} className="mr-2 shrink-0" />
                          <span className="truncate">Lien: {doc.file_url.substring(0, 40)}...</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        asChild 
                        className={cn(
                          "flex-1 rounded-xl h-10 font-bold text-xs shadow-sm",
                          isExternal ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
                        )}
                      >
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          {isExternal ? <ExternalLink size={14} className="mr-2" /> : <Download size={14} className="mr-2" />}
                          {isExternal ? "Ouvrir Lien" : "Télécharger"}
                        </a>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl" 
                        onClick={() => handleDelete(doc.id, doc.file_url)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed">
              <FileText className="mx-auto h-12 w-12 text-slate-200 mb-2" />
              <p className="text-slate-400 font-medium">Aucun document trouvé.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentationPage;