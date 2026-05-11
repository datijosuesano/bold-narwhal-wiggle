import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { QrCode, Send, CheckCircle2, Loader2, AlertTriangle, Factory, ShieldAlert, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';

const ClientPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const assetIdFromUrl = searchParams.get('assetId');
  const { user } = useAuth();

  const [step, setStep] = useState<'loading' | 'scan' | 'form' | 'success' | 'error'>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [asset, setAsset] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [priority, setPriority] = useState<"Moyenne" | "Critique">("Moyenne");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (assetIdFromUrl) {
      fetchAsset(assetIdFromUrl);
    } else {
      setStep('scan');
    }
  }, [assetIdFromUrl]);

  const fetchAsset = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('id, name, location, serial_number')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErrorMessage("Cet équipement n'existe pas dans notre base de données.");
        setStep('error');
      } else {
        setAsset(data);
        setStep('form');
      }
    } catch (err: any) {
      console.error("Erreur fetch asset:", err);
      setErrorMessage("Impossible de récupérer les informations de l'appareil.");
      setStep('error');
    } finally {
      setIsLoading(false);
    }
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
    try {
      const { error } = await supabase.from('work_orders').insert({
        title: `PANNE SIGNALÉE : ${asset.name}`,
        description: description,
        reporter_name: reporterName,
        asset_id: asset.id,
        priority: priority,
        status: 'Ouvert',
        maintenance_type: 'Corrective',
        user_id: user?.id || null
      });

      if (error) throw error;

      showSuccess("Signalement envoyé !");
      setStep('success');
    } catch (err: any) {
      showError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'loading' || (isLoading && step === 'form')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-muted-foreground font-medium">Chargement en cours...</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="max-w-md mx-auto pt-20 px-4 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center">
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
    <div className="max-w-md mx-auto space-y-6 pt-4 px-4 pb-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-blue-700">PORTAIL SERVICE</h1>
        <p className="text-muted-foreground font-medium">Déclaration rapide de panne</p>
      </div>

      {step === 'scan' && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-3xl">
          <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
            <div className="p-6 bg-white rounded-3xl shadow-xl">
              <QrCode size={80} className="text-blue-600" />
            </div>
            <div className="space-y-2">
              <CardTitle>Scanner l'équipement</CardTitle>
              <CardDescription>Utilisez l'appareil photo pour scanner le code QR collé sur l'appareil.</CardDescription>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'form' && asset && (
        <Card className="shadow-2xl rounded-3xl border-none overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-blue-600 p-4 text-white flex items-center gap-3">
            <Factory size={24} />
            <div>
              <p className="text-[10px] font-black uppercase opacity-80">Appareil identifié</p>
              <p className="font-bold leading-tight">{asset.name}</p>
            </div>
          </div>
          <CardHeader className="pb-2">
            <CardDescription>Site : {asset.location} • S/N : {asset.serial_number}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500 flex items-center">
                <User size={14} className="mr-1" /> Votre Nom / Service
              </label>
              <Input 
                placeholder="Ex: Dr. Martin / Bloc 2" 
                className="rounded-xl h-11 bg-slate-50 border-none focus-visible:ring-blue-500"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Urgence de l'intervention</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={priority === 'Moyenne' ? 'default' : 'outline'} 
                  className={cn("rounded-xl h-11 font-bold", priority === 'Moyenne' ? "bg-amber-500 hover:bg-amber-600" : "border-amber-200 text-amber-700")}
                  onClick={() => setPriority('Moyenne')}
                >Moyenne</Button>
                <Button 
                  variant={priority === 'Critique' ? 'default' : 'outline'} 
                  className={cn("rounded-xl h-11 font-bold", priority === 'Critique' ? "bg-red-600 hover:bg-red-700" : "border-red-200 text-red-700")}
                  onClick={() => setPriority('Critique')}
                >Critique</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Description du problème</label>
              <Textarea 
                placeholder="Ex: L'écran ne s'allume plus, fuite d'eau..." 
                className="rounded-xl min-h-[100px] bg-slate-50 border-none focus-visible:ring-blue-500" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="w-full bg-blue-600 h-14 rounded-2xl font-black text-lg shadow-lg"
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />} 
              ENVOYER L'ALERTE
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'success' && (
        <div className="text-center space-y-6 animate-in zoom-in duration-300 py-10">
          <div className="mx-auto w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">C'EST ENVOYÉ !</h2>
            <p className="text-muted-foreground font-medium px-6">L'équipe technique a été notifiée et interviendra dans les plus brefs délais.</p>
          </div>
          <Button onClick={() => window.location.href = '/portal'} variant="outline" className="rounded-xl h-12 px-8 border-slate-200">
            Terminer
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;