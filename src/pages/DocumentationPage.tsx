import React, { useState, useEffect } from 'react';
import { FileText, Search, Loader2, Globe, FileType, ExternalLink, Download, Filter, Factory } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AssetDoc {
  id: string;
  name: string;
  file_url: string;
  category: string;
  created_at: string;
  asset_id: string;
  assets: {
    name: string;
    location: string;
  } | null;
}

const DocumentationPage: React.FC = () => {
  const [docs, setDocs] = useState<AssetDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDocs = async () => {
    setIsLoading(true);
    // Jointure avec la table assets pour savoir à quel appareil appartient le document
    const { data, error } = await supabase
      .from('asset_documents')
      .select('*, assets(name, location)')
      .order('created_at', { ascending: false });

    if (!error) setDocs(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const filteredDocs = docs.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.assets?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
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
            <p className="text-lg text-muted-foreground">Accédez aux manuels et schémas de vos équipements.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Rechercher un manuel, un modèle d'appareil..." 
            className="pl-10 rounded-xl bg-white shadow-sm h-12" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-xl h-12 border-slate-200">
          <Filter className="mr-2 h-4 w-4" /> Filtrer par type
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white">
                        {doc.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 line-clamp-1">{doc.name}</h4>
                      <div className="flex items-center text-[10px] text-blue-600 font-bold uppercase mt-1">
                        <Factory size={12} className="mr-1" />
                        {doc.assets?.name || "Appareil inconnu"}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{doc.assets?.location}</p>
                    </div>

                    <Button 
                      asChild 
                      className={cn(
                        "w-full rounded-xl h-10 font-bold text-xs shadow-sm",
                        isExternal ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        {isExternal ? <ExternalLink size={14} className="mr-2" /> : <Download size={14} className="mr-2" />}
                        {isExternal ? "Consulter en ligne" : "Télécharger PDF"}
                      </a>
                    </Button>
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