import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  QrCode, 
  Send, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  Factory, 
  ShieldAlert, 
  User, 
  Camera, 
  Video, 
  Film, 
  Image as ImageIcon, 
  X, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Wrench, 
  History, 
  MapPin, 
  FileText,
  BadgeAlert,
  ClipboardCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineItem {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  source: 'OT' | 'Intervention';
  description?: string;
  technician?: string;
}

const ClientPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'declare' | 'details' | 'history'>('declare');
  const [step, setStep] = useState<'loading' | 'scan' | 'form' | 'success' | 'error'>('loading');
  const [isLoading, setIsLoading] = useState(false);
  
  // Données de l'appareil et associés
  const [asset, setAsset] = useState<any>(null);
  const [associatedContract, setAssociatedContract] = useState<any>(null);
  const [lastMaintenance, setLastMaintenance] = useState<any>(null);
  const [nextMaintenance, setNextMaintenance] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [recentBreakdowns, setRecentBreakdowns] = useState<any[]>([]);

  // Formulaire de déclaration
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [priority, setPriority] = useState<"Moyenne" | "Critique">("Moyenne");
  const [errorMessage, setErrorMessage] = useState("");

  // Médias
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    if (assetIdFromUrl) {
      loadPortalData(assetIdFromUrl);
    } else {
      setStep('scan');
    }
  }, [assetIdFromUrl]);

  const loadPortalData = async (id: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Asset
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (assetError) throw assetError;

      if (!assetData) {
        setErrorMessage("Cet équipement n'existe pas dans notre base de données.");
        setStep('error');
        setIsLoading(false);
        return;
      }

      setAsset(assetData);

      // 2. Fetch Contrat Associé (via la clinique du site)
      const { data: contractData } = await supabase
        .from('contracts')
        .select('*')
        .eq('clinic', assetData.location)
        .eq('status', 'Active')
        .maybeSingle();
      
      setAssociatedContract(contractData);

      // 3. Fetch Dernière Maintenance Préventive
      const { data: lastMaintData } = await supabase
        .from('interventions')
        .select('*')
        .eq('asset_id', id)
        .eq('maintenance_type', 'Préventive')
        .order('intervention_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setLastMaintenance(lastMaintData);

      // 4. Fetch Prochaine Maintenance Planifiée (OT préventive ouvert)
      const { data: nextMaintData } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', id)
        .eq('maintenance_type', 'Preventive')
        .eq('status', 'Ouvert')
        .order('due_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextMaintenance(nextMaintData);

      // 5. Fetch Historique Complet (Timeline)
      const [otsRes, interventionsRes] = await Promise.all([
        supabase.from('work_orders').select('*').eq('asset_id', id),
        supabase.from('interventions').select('*').eq('asset_id', id)
      ]);

      const combinedTimeline: TimelineItem[] = [
        ...(otsRes.data?.map(ot => ({
          id: ot.id,
          title: ot.title,
          date: ot.due_date,
          type: ot.maintenance_type,
          status: ot.status,
          source: 'OT' as const,
          description: ot.description
        })) || []),
        ...(interventionsRes.data?.map(i => ({
          id: i.id,
          title: i.title,
          date: i.intervention_date,
          type: i.maintenance_type,
          status: 'Terminé',
          source: 'Intervention' as const,
          description: i.description
        })) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTimeline(combinedTimeline);

      // 6. Fetch Pannes récentes signalées
      const { data: breakdownsData } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', id)
        .not('reporter_name', 'is', null)
        .order('created_at', { ascending: false });

      setRecentBreakdowns(breakdownsData || []);
      setStep('form');

    } catch (err: any) {
      console.error("Erreur chargement portail:", err);
      setErrorMessage("Impossible de charger les données de cet appareil.");
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      setIsUploadingMedia(true);

      const file = event.target.files[0];
      const isVideo = file.type.startsWith('video/');
      const fileExt = file.name.split('.').pop();
      const fileName = `portal-${Date.now()}.${fileExt}`;
      const filePath = `portal-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("asset-documents")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(filePath);

      setMediaUrl(urlData.publicUrl);
      setMediaType(isVideo ? 'video' : 'image');
      showSuccess(isVideo ? "Vidéo chargée avec succès !" : "Photo chargée avec succès !");
    } catch (error: any) {
      console.error("Media upload error:", error);
      showError("Impossible de charger le fichier média.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!reporterName.trim()) {
      showError("Veuillez indiquer votre nom.");
      return;
    }
    if (!description.trim()) {
      showError("Veuillez décrire le problème rencontré.");
      return;
    }

    setIsLoading(true);

    let finalDescription = description;
    if (mediaUrl) {
      finalDescription = `[Médias de la panne: ${mediaUrl}]\n\n${description}`;
    }

    try {
      const { error } = await supabase.from('work_orders').insert({
        title: `PANNE SIGNALÉE : ${asset.name}`,
        description: finalDescription,
        reporter_name: reporterName,
        asset_id: asset.id,
        priority: priority,
        status: 'Ouvert',
        maintenance_type: 'Corrective',
        user_id: user?.id || null
      });

      if (error) throw error;

      showSuccess("Signalement de panne envoyé !");
      setStep('success');
      // Re-charger les données pour afficher la panne dans la liste après succès si besoin
      loadPortalData(asset.id);
    } catch (err: any) {
      showError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-muted-foreground font-medium">Chargement de la fiche équipement...</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center px-4 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center shadow-sm">
          <ShieldAlert size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 uppercase">Erreur de Scan</h2>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
        <Button onClick={() => setStep('scan')} variant="outline" className="w-full rounded-xl h-12 border-slate-200">
          Réessayer le scan
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50/50 pb-10 flex flex-col">
      {/* Header Fiche Technique Collée */}
      {asset && (
        <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl">
                <Factory size={24} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-400">BioPulse Connect</span>
                <h1 className="text-lg font-black leading-tight truncate max-w-[200px]">{asset.name}</h1>
              </div>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
              asset.status === 'Opérationnel' ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              {asset.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 text-xs border-t border-slate-800 text-slate-400">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Site / Clinique</p>
              <p className="font-bold text-slate-200 truncate mt-0.5">{asset.location}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Numéro de série</p>
              <p className="font-mono text-slate-200 truncate mt-0.5">{asset.serial_number || 'SANS S/N'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Onglets */}
      {step !== 'success' && asset && (
        <div className="px-4 mt-6">
          <div className="grid grid-cols-3 bg-white p-1 rounded-2xl border shadow-sm text-center">
            <button 
              onClick={() => setActiveTab('declare')}
              className={cn("py-2.5 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1", activeTab === 'declare' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700")}
            >
              <Wrench size={14} /> Signalement
            </button>
            <button 
              onClick={() => setActiveTab('details')}
              className={cn("py-2.5 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1", activeTab === 'details' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700")}
            >
              <FileText size={14} /> Fiche & Contrat
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn("py-2.5 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1", activeTab === 'history' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700")}
            >
              <History size={14} /> Historique
            </button>
          </div>
        </div>
      )}

      {/* Contenu de l'onglet actif */}
      <div className="px-4 mt-6 flex-1">
        {step === 'form' && activeTab === 'declare' && (
          <Card className="shadow-xl rounded-3xl border-none overflow-hidden bg-white animate-in fade-in duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black">Déclarer un dysfonctionnement</CardTitle>
              <CardDescription>Votre demande sera immédiatement affectée à un technicien biomédical.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 flex items-center">
                  <User size={14} className="mr-1.5 text-blue-500" /> Votre Nom / Service
                </label>
                <Input 
                  placeholder="Ex: Dr. Martin / Service Radiologie" 
                  className="rounded-xl h-11 bg-slate-50 border-none focus-visible:ring-blue-500"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500">Urgence de la panne</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    className={cn(
                      "rounded-xl h-11 font-black text-xs transition-all border",
                      priority === 'Moyenne' 
                        ? "bg-amber-500 text-white border-amber-500 shadow-md" 
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                    onClick={() => setPriority('Moyenne')}
                  >MOYENNE</button>
                  <button 
                    type="button"
                    className={cn(
                      "rounded-xl h-11 font-black text-xs transition-all border",
                      priority === 'Critique' 
                        ? "bg-red-600 text-white border-red-600 shadow-md animate-pulse" 
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                    onClick={() => setPriority('Critique')}
                  >CRITIQUE (Bloquant)</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500">Symptômes constatés</label>
                <Textarea 
                  placeholder="Décrivez précisément la panne ou le code erreur affiché..." 
                  className="rounded-xl min-h-[100px] bg-slate-50 border-none focus-visible:ring-blue-500 resize-none text-xs" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Téléversement photo / vidéo */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 block">Preuve Visuelle (Photo / Vidéo)</label>
                
                {mediaUrl ? (
                  <div className="relative border rounded-2xl overflow-hidden bg-slate-100 aspect-video flex items-center justify-center group animate-in zoom-in-95">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={mediaUrl} alt="Panne" className="w-full h-full object-contain" />
                    )}
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 rounded-full h-8 w-8"
                      onClick={removeMedia}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all bg-slate-50/50">
                    {isUploadingMedia ? (
                      <div className="flex flex-col items-center text-blue-600 font-bold text-xs animate-pulse">
                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                        Chargement du média...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground text-center px-4">
                        <div className="flex gap-2 mb-1 text-slate-400">
                          <Camera size={18} />
                          <Video size={18} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Ajouter une photo ou vidéo</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Pour aider le technicien à préparer ses pièces</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,video/*" 
                      onChange={handleMediaUpload} 
                      disabled={isUploadingMedia} 
                    />
                  </label>
                )}
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || isUploadingMedia}
                className="w-full bg-blue-600 h-14 rounded-2xl font-black text-base shadow-lg mt-2 uppercase tracking-wide"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />} 
                Signaler la Panne
              </Button>
            </CardContent>
          </Card>
        )}

        {/* DETAILS ET CONTRAT DE MAINTENANCE */}
        {activeTab === 'details' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Contrat de Maintenance Associé */}
            <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-green-400" /> Contrat de Maintenance
                </span>
                {associatedContract ? (
                  <span className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full font-black uppercase">COUVERT</span>
                ) : (
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase">SANS CONTRAT</span>
                )}
              </div>
              <CardContent className="p-4">
                {associatedContract ? (
                  <div className="space-y-2">
                    <p className="font-bold text-sm text-slate-800">{associatedContract.name}</p>
                    <p className="text-xs text-slate-500">Prestataire : <strong className="text-slate-700">{associatedContract.provider}</strong></p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t">
                      <span>Début : {format(new Date(associatedContract.start_date), 'dd/MM/yyyy')}</span>
                      <span>Échéance : {format(new Date(associatedContract.end_date), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs italic">
                    Aucun contrat actif pour cet établissement.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suivi des Maintenances Préventives */}
            <div className="grid grid-cols-2 gap-4">
              {/* Dernière Maintenance */}
              <Card className="border-none shadow-sm rounded-2xl bg-white p-4 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ClipboardCheck size={12} className="text-green-500" /> Dernier Préventif
                </p>
                {lastMaintenance ? (
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">
                      {format(new Date(lastMaintenance.intervention_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">{lastMaintenance.title}</p>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">Aucune fiche</p>
                )}
              </Card>

              {/* Prochaine Maintenance */}
              <Card className="border-none shadow-sm rounded-2xl bg-white p-4 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock size={12} className="text-blue-500" /> Prochain RDV
                </p>
                {nextMaintenance ? (
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">
                      {format(new Date(nextMaintenance.due_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">{nextMaintenance.title}</p>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">Non planifié</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* TIMELINE HISTORIQUE & PANNES */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Pannes Signalées en cours */}
            {recentBreakdowns.length > 0 && (
              <Card className="border-none shadow-sm rounded-2xl bg-white p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5 mb-3">
                  <BadgeAlert size={14} className="text-red-500 animate-pulse" /> Pannes en cours de traitement ({recentBreakdowns.filter(b => b.status !== 'Terminé' && b.status !== 'Completed').length})
                </h4>
                <div className="space-y-2">
                  {recentBreakdowns.map(b => (
                    <div key={b.id} className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{b.title}</p>
                        <p className="text-[10px] text-slate-500">Déclaré par {b.reporter_name} le {format(new Date(b.created_at), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                        b.status === 'Ouvert' ? "bg-red-100 text-red-700 border-red-200" : "bg-blue-100 text-blue-700 border-blue-200"
                      )}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Historique chronologique complet */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
                <History size={14} /> Historique complet des travaux ({timeline.length})
              </h4>

              {timeline.length > 0 ? (
                <div className="space-y-3 border-l-2 border-slate-200 ml-3 pl-4 pt-1">
                  {timeline.map((item, index) => (
                    <div key={item.id} className="relative space-y-1">
                      {/* Puce d'historique */}
                      <span className={cn(
                        "absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow",
                        item.source === 'Intervention' ? "bg-green-500" : "bg-blue-500"
                      )} />
                      
                      <div className="text-[10px] text-slate-400 font-bold">
                        {format(new Date(item.date), 'dd MMMM yyyy', { locale: fr })}
                      </div>
                      <div className="p-3 bg-white border rounded-xl shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-xs text-slate-900 leading-tight">{item.title}</p>
                          <Badge variant="outline" className="text-[8px] uppercase tracking-wider px-1">
                            {item.source}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-slate-500 leading-tight mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white border border-dashed rounded-2xl text-slate-400 text-xs italic">
                  Aucun historique technique enregistré pour cet appareil.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SÉLECTIONNER UN ÉQUIPEMENT (SANS QR CODE) */}
      {step === 'scan' && (
        <div className="px-4 text-center">
          <p className="text-xs text-slate-400">
            Ce portail est accessible en scannant le code QR collé sur l'appareil médical par le service BioPulse.
          </p>
        </div>
      )}

      {/* ÉCRAN DE SUCCÈS SIGNALEMENT */}
      {step === 'success' && (
        <div className="text-center space-y-6 animate-in zoom-in duration-300 py-12 px-6 flex-1 flex flex-col justify-center">
          <div className="mx-auto w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">C'EST ENVOYÉ !</h2>
            <p className="text-muted-foreground font-medium px-4">L'équipe technique BioPulse a été notifiée et interviendra dans les plus brefs délais.</p>
          </div>
          <Button onClick={() => setStep('form')} variant="outline" className="w-full rounded-xl h-12 border-slate-200 uppercase font-black tracking-wide text-xs">
            Retourner à la fiche
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientPortal; 