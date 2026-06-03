"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send,
  CheckCircle2,
  Loader2,
  Factory,
  ShieldAlert,
  User,
  Camera,
  Video,
  X,
  ShieldCheck,
  Clock,
  Wrench,
  History,
  FileText,
  BadgeAlert,
  ClipboardCheck
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineItem {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  source: 'OT' | 'Intervention';
  description?: string;
}

const ClientPortal: React.FC = () => {
  const [searchParams] = useSearchParams();

  // ✅ FIX IMPORTANT
  const tokenFromUrl = searchParams.get('token');

  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'declare' | 'details' | 'history'>('declare');
  const [step, setStep] = useState<'loading' | 'scan' | 'form' | 'success' | 'error'>('loading');
  const [isLoading, setIsLoading] = useState(false);

  const [asset, setAsset] = useState<any>(null);
  const [associatedContract, setAssociatedContract] = useState<any>(null);
  const [lastMaintenance, setLastMaintenance] = useState<any>(null);
  const [nextMaintenance, setNextMaintenance] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [recentBreakdowns, setRecentBreakdowns] = useState<any[]>([]);

  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [priority, setPriority] = useState<"Moyenne" | "Critique">("Moyenne");

  const [errorMessage, setErrorMessage] = useState("");

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // ✅ FIX useEffect (IMPORTANT)
  useEffect(() => {
    if (tokenFromUrl) {
      loadPortalDataFromToken(tokenFromUrl);
    } else {
      setStep('scan');
    }
  }, [tokenFromUrl]);

  // 🔐 TOKEN → ASSET
  const loadPortalDataFromToken = async (token: string) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('portal_access_tokens')
        .select('asset_id')
        .eq('token', token)
        .eq('active', true)
        .maybeSingle();

      if (error || !data) {
        setErrorMessage("Lien invalide ou expiré.");
        setStep('error');
        return;
      }

      await loadPortalData(data.asset_id);

    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur serveur.");
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 📦 LOAD ASSET (TON CODE ORIGINAL CONSERVÉ)
  const loadPortalData = async (id: string) => {
    setIsLoading(true);

    try {
      const { data: assetData, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !assetData) {
        setErrorMessage("Équipement introuvable.");
        setStep('error');
        return;
      }

      setAsset(assetData);

      const { data: contract } = await supabase
        .from('contracts')
        .select('*')
        .eq('clinic', assetData.location)
        .eq('status', 'Active')
        .maybeSingle();

      setAssociatedContract(contract);

      const { data: lastMaint } = await supabase
        .from('interventions')
        .select('*')
        .eq('asset_id', id)
        .eq('maintenance_type', 'Préventive')
        .order('intervention_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setLastMaintenance(lastMaint);

      const { data: nextMaint } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', id)
        .eq('maintenance_type', 'Preventive')
        .eq('status', 'Ouvert')
        .order('due_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextMaintenance(nextMaint);

      const [ots, interventions] = await Promise.all([
        supabase.from('work_orders').select('*').eq('asset_id', id),
        supabase.from('interventions').select('*').eq('asset_id', id)
      ]);

      const timelineMerged: TimelineItem[] = [
        ...(ots.data || []).map(o => ({
          id: o.id,
          title: o.title,
          date: o.due_date,
          type: o.maintenance_type,
          status: o.status,
          source: 'OT' as const,
          description: o.description
        })),
        ...(interventions.data || []).map(i => ({
          id: i.id,
          title: i.title,
          date: i.intervention_date,
          type: i.maintenance_type,
          status: 'Terminé',
          source: 'Intervention' as const,
          description: i.description
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTimeline(timelineMerged);

      const { data: breakdowns } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', id)
        .not('reporter_name', 'is', null);

      setRecentBreakdowns(breakdowns || []);

      setStep('form');

    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur de chargement.");
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 📤 SUBMIT (inchangé)
  const handleSubmit = async () => {
    if (!reporterName || !description) {
      showError("Champs obligatoires manquants");
      return;
    }

    setIsLoading(true);

    try {
      await supabase.from('work_orders').insert({
        title: `PANNE SIGNALÉE : ${asset.name}`,
        description,
        reporter_name: reporterName,
        asset_id: asset.id,
        priority,
        status: 'Ouvert',
        maintenance_type: 'Corrective',
        user_id: user?.id || null
      });

      showSuccess("Signalement envoyé !");
      setStep('success');

      await loadPortalData(asset.id);

    } catch (err) {
      showError("Erreur envoi");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔁 UI (IDENTIQUE À TON CODE)
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="p-6 text-center">
        <ShieldAlert className="mx-auto text-red-500" size={40} />
        <p>{errorMessage}</p>
        <Button onClick={() => setStep('scan')}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50/50 pb-10 flex flex-col">

      {asset && (
        <div className="bg-slate-900 text-white p-6 rounded-b-[2rem]">
          <h1 className="font-bold">{asset.name}</h1>
          <p>{asset.location}</p>
        </div>
      )}

      {step === 'form' && activeTab === 'declare' && (
        <Card>
          <CardHeader>
            <CardTitle>Déclarer un dysfonctionnement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">

            <Input
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Nom"
            />

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />

            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              Envoyer
            </Button>

          </CardContent>
        </Card>
      )}

      {step === 'success' && (
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-green-500" size={50} />
          <p>Signalement envoyé</p>
        </div>
      )}

    </div>
  );
};

export default ClientPortal;