import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Loader2, 
  Globe, 
  FileType, 
  Download, 
  Filter, 
  Factory, 
  Plus, 
  Trash2, 
  Calendar, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const ITEMS_PER_PAGE = 12;

// Catégories de documentation normalisées
export const DOCUMENT_CATEGORIES = [
  "Manuel Technique",
  "Schéma / Plan",
  "Certificat de conformité",
  "Procédure d'utilisation",
  "Autre"
] as const;

const DocumentationPage: React.FC = () => {
  const [docs, setDocs] = useState<AssetDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modales & Alertes
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<AssetDoc | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<AssetDoc | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchDocs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('asset_documents')
      .select('*, assets(name, location)')
      .order('created_at', { ascending: false });

    if (!error) setDocs(data || []);
    setIsLoading(false);
  };

  useEffect(() => { 
    fetchDocs(); 
  }, []);

  const uniqueAssets = useMemo(() => {
    const list = docs.map(d => d.assets?.name).filter(Boolean);
    return Array.from(new Set(list));
  }, [docs]);

  // Statistiques calculées par useMemo avec les nouvelles catégories normalisées
  const stats = useMemo(() => {
    const total = docs.length;
    const manuals = docs.filter(d => d.category === "Manuel Technique").length;
    const schemas = docs.filter(d => d.category === "Schéma / Plan").length;
    const certificates = docs.filter(d => d.category === "Certificat de conformité" || d.category === "Procédure d'utilisation").length;
    const externalLinks = docs.filter(d => !d.file_url.includes('supabase.co/storage')).length;

    return { total, manuals, schemas, certificates, externalLinks };
  }, [docs]);

  // Filtrage combiné optimisé par useMemo
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      const matchesSearch = 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.assets?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
      const matchesAsset = selectedAsset === "all" || doc.assets?.name === selectedAsset;

      return matchesSearch && matchesCategory && matchesAsset;
    });
  }, [docs, searchTerm, selectedCategory, selectedAsset]);

  // Pagination dynamique
  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);
  const paginatedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDocs, currentPage]);

  // Réinitialiser la page si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedAsset]);

  // Gestion de la suppression sécurisée
  const handleDeleteRequest = (doc: AssetDoc) => {
    setDocToDelete(doc);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      if (docToDelete.file_url.includes('supabase.co/storage')) {
        // L'Edge function a impérativement besoin que l'enregistrement existe encore
        // pour récupérer son file_url. On l'appelle donc en premier.
        await supabase.functions.invoke('delete-storage-file', {
          body: { recordId: docToDelete.id, tableName: 'asset_documents' }
        });
      }
      
      const { error } = await supabase.from('asset_documents').delete().eq('id', docToDelete.id);
      if (error) throw error;
      
      showSuccess("Document supprimé avec succès.");
      fetchDocs();
    } catch (err) { 
      showError("Erreur lors de la suppression."); 
    } finally {
      setDocToDelete(null);
      setIsDeleteAlertOpen(false);
    }
  };

  // Déterminer de manière ultra-robuste le type de prévisualisation (Priority 1)
  const getPreviewType = (url: string): 'pdf' | 'image' | 'unsupported' => {
    if (!url) return 'unsupported';
    try {
      const parsedUrl = new URL(url);
      const cleanPath = parsedUrl.pathname.toLowerCase();
      if (cleanPath.endsWith('.pdf')) return 'pdf';
      if (cleanPath.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) return 'image';
    } catch (e) {
      // Fallback si l'URL est malformée ou relative
      const cleanUrl = url.toLowerCase().split('?')[0];
      if (cleanUrl.endsWith('.pdf')) return 'pdf';
      if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) return 'image';
    }
    return 'unsupported';
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Documentation Technique</h1>
            <p className="text-lg text-muted-foreground">Gestion centralisée et traçabilité des manuels, schémas et procédures.</p>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 px-6 font-bold shrink-0">
              <Plus className="mr-2 h-5 w-5" /> Ajouter Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Nouveau Document</DialogTitle>
              <DialogDescription>Associez un fichier technique ou un lien externe à un équipement médical.</DialogDescription>
            </DialogHeader>
            <CreateDocumentForm onSuccess={() => { setIsAddOpen(false); fetchDocs(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* DASHBOARD STATISTIQUE */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-sm border border-slate-100 bg-white p-4 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Documents</span>
          <span className="text-2xl font-black text-slate-800 mt-2">{stats.total}</span>
        </Card>
        <Card className="shadow-sm border border-slate-100 bg-white p-4 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Manuels</span>
          <span className="text-2xl font-black text-blue-600 mt-2">{stats.manuals}</span>
        </Card>
        <Card className="shadow-sm border border-slate-100 bg-white p-4 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Procédures / Guides</span>
          <span className="text-2xl font-black text-purple-600 mt-2">{stats.certificates}</span>
        </Card>
        <Card className="shadow-sm border border-slate-100 bg-white p-4 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Schémas / Plans</span>
          <span className="text-2xl font-black text-emerald-600 mt-2">{stats.schemas}</span>
        </Card>
        <Card className="shadow-sm border border-slate-100 bg-white p-4 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Liens Externes</span>
          <span className="text-2xl font-black text-amber-600 mt-2">{stats.externalLinks}</span>
        </Card>
      </div>

      {/* FILTRES AVANCÉS */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Rechercher par document, équipement, catégorie..." 
            className="pl-10 rounded-xl h-11 border-slate-200" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-56">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="rounded-xl h-11 border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter size={14} />
                <SelectValue placeholder="Toutes les catégories" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {DOCUMENT_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-56">
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger className="rounded-xl h-11 border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Factory size={14} />
                <SelectValue placeholder="Tous les équipements" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les équipements</SelectItem>
              {uniqueAssets.map(assetName => (
                <SelectItem key={assetName} value={assetName}>{assetName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* NOMBRE DE RÉSULTATS */}
      <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider px-1">
        <span>Résultats : {filteredDocs.length} document(s)</span>
        {totalPages > 1 && <span>Page {currentPage} sur {totalPages}</span>}
      </div>

      {/* GRILLE DE DOCUMENTS */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedDocs.length > 0 ? (
              paginatedDocs.map((doc) => {
                const isExternal = !doc.file_url.includes('supabase.co/storage');
                return (
                  <Card key={doc.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden border-none bg-white flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b bg-slate-50/50">
                      <div className="flex justify-between items-start">
                        <div className={cn(
                          "p-2 rounded-xl",
                          isExternal ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {isExternal ? <Globe size={18} /> : <FileType size={18} />}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white text-slate-600 border-slate-200">
                            {doc.category}
                          </Badge>
                          <span className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            ID: {doc.id.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Designation équipement */}
                        <div className="flex items-center text-[10px] text-blue-600 font-black uppercase mb-1">
                          <Factory size={12} className="mr-1.5 shrink-0" />
                          <span className="truncate">{doc.assets?.name || "Appareil inconnu"}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight h-10">{doc.name}</h4>
                        
                        <div className="mt-3 space-y-1 pt-3 border-t text-[10px] text-slate-400">
                          <div className="flex items-center">
                            <Calendar size={11} className="mr-1.5 shrink-0 text-slate-400" />
                            <span>Ajouté le {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-2 border-t">
                        <Button 
                          variant="secondary"
                          onClick={() => { setPreviewDoc(doc); setIsPreviewOpen(true); }}
                          className="flex-1 rounded-xl h-10 font-bold text-xs bg-slate-50 hover:bg-slate-100 text-slate-700"
                        >
                          <Eye size={14} className="mr-1.5" />
                          Aperçu
                        </Button>

                        <Button 
                          asChild 
                          className="rounded-xl h-10 font-bold text-xs bg-blue-600 hover:bg-blue-700 w-20 shadow-sm shrink-0 text-white"
                        >
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download size={14} />
                          </a>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl shrink-0" 
                          onClick={() => handleDeleteRequest(doc)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <FileText className="mx-auto h-12 w-12 text-slate-200 mb-2" />
                <p className="text-slate-400 font-medium">Aucun document ne correspond à vos filtres.</p>
              </div>
            )}
          </div>

          {/* CONTROLE DE PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6 border-t border-slate-100">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 h-9 font-bold"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} className="mr-1" /> Précédent
              </Button>
              <span className="text-xs font-black text-slate-500 uppercase">Page {currentPage} / {totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 h-9 font-bold"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODALE DE PRÉVISUALISATION PDF & IMAGES */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl bg-white border-none shadow-2xl">
          {previewDoc && (
            <>
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-left">
                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{previewDoc.category}</span>
                    <DialogTitle className="text-lg font-bold leading-tight mt-0.5">{previewDoc.name}</DialogTitle>
                    <DialogDescription className="text-xs mt-1">Équipement : <strong>{previewDoc.assets?.name || 'Inconnu'}</strong></DialogDescription>
                  </div>
                  <Button asChild variant="outline" className="rounded-xl shrink-0 h-9 text-xs border-slate-200">
                    <a href={previewDoc.file_url} target="_blank" rel="noopener noreferrer">
                      <Download size={14} className="mr-1.5" /> Télécharger
                    </a>
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col items-center justify-center">
                {getPreviewType(previewDoc.file_url) === 'pdf' ? (
                  <iframe 
                    src={`${previewDoc.file_url}#toolbar=0`} 
                    className="w-full h-[60vh] rounded-xl border border-slate-200 shadow-sm"
                    title="Prévisualisation PDF"
                  />
                ) : getPreviewType(previewDoc.file_url) === 'image' ? (
                  <div className="border border-slate-200 bg-white rounded-xl overflow-hidden p-2 shadow-sm max-w-full">
                    <img 
                      src={previewDoc.file_url} 
                      alt={previewDoc.name} 
                      className="max-h-[60vh] object-contain rounded-lg mx-auto" 
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl max-w-md space-y-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-inner">
                      <AlertCircle size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Prévisualisation non supportée</h4>
                      <p className="text-xs text-slate-500 leading-normal mt-1.5">
                        Ce format de fichier (Word, Excel, ZIP ou lien de redirection) ne peut pas être rendu directement dans l'application. Veuillez utiliser le bouton de téléchargement ci-dessus pour le consulter localement.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMATION DE SUPPRESSION */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le document technique <strong>{docToDelete?.name}</strong> ? Cette action est définitive et retirera également le fichier physique de l'hébergement cloud (Supabase Storage).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentationPage;