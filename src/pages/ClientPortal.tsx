import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, Send, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

const ClientPortal: React.FC = () => {
  const [step, setStep] = useState<'scan' | 'form' | 'success'>('scan');

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-blue-700">PORTAIL SERVICE</h1>
        <p className="text-muted-foreground font-medium">Déclaration rapide de panne biomédicale</p>
      </div>

      {step === 'scan' && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
          <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
            <div className="p-6 bg-white rounded-3xl shadow-xl">
              <QrCode size={80} className="text-blue-600" />
            </div>
            <div className="space-y-2">
              <CardTitle>Scanner l'équipement</CardTitle>
              <CardDescription>Scannez le QR Code sur l'appareil pour l'identifier automatiquement.</CardDescription>
            </div>
            <Button onClick={() => setStep('form')} className="w-full bg-blue-600 rounded-xl h-12 font-bold">
              Scanner maintenant
            </Button>
            <Button variant="ghost" onClick={() => setStep('form')} className="text-xs text-blue-600 underline">
              Saisir manuellement
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'form' && (
        <Card className="shadow-2xl rounded-3xl border-none">
          <CardHeader>
            <CardTitle>Détails du problème</CardTitle>
            <CardDescription>Appareil identifié : Scialytique Bloc 2</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Urgence</label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-xl border-amber-200 text-amber-700 bg-amber-50">Moyenne</Button>
                <Button variant="outline" className="rounded-xl border-red-200 text-red-700 bg-red-50">Critique</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Description</label>
              <Textarea placeholder="Décrivez la panne constatée..." className="rounded-xl min-h-[120px]" />
            </div>
            <Button onClick={() => setStep('success')} className="w-full bg-blue-600 h-14 rounded-2xl font-black text-lg shadow-lg">
              <Send className="mr-2" /> ENVOYER L'ALERTE
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'success' && (
        <div className="text-center space-y-6 animate-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Demande enregistrée !</h2>
            <p className="text-muted-foreground">Un technicien a été notifié. Numéro de suivi : #OT-8829</p>
          </div>
          <Button onClick={() => setStep('scan')} variant="outline" className="rounded-xl">Nouvelle déclaration</Button>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;