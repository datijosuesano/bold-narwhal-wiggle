"use client";

import React, { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Factory,
  User,
  AlertTriangle,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  FileText,
  PlusCircle,
  Printer,
} from "lucide-react";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import AddPastInterventionForm from "@/components/Interventions/AddPastInterventionForm";
import AssetDocuments from "./AssetDocuments";
import AssetLifeSheet from "./AssetLifeSheet";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useReactToPrint } from "react-to-print";
import { QRCodeSVG } from "qrcode.react";

/* =========================
   TYPES
========================= */

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: "Opérationnel" | "Maintenance" | "En Panne";
  serialNumber: string;
  model: string;
  manufacturer: string;
  commissioningDate: Date;
  expiryDate?: Date | null;
  purchaseCost: number;
  image_url?: string;
  assigned_to?: string | null;
  description?: string;
}

/* =========================
   COMPONENT
========================= */

const AssetDetailView: React.FC<{ asset: Asset }> = ({ asset }) => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(["admin", "technicien_biomedical"]);

  const [activeTab, setActiveTab] = useState("details");
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [assigneeName, setAssigneeName] = useState<string | null>(null);
  const [stats, setStats] = useState({
    breakdownCount: 0,
    totalCost: 0,
    lastIntervention: null as Date | null,
    frequency: 0,
  });
  const printRef = useRef<HTMLDivElement>(null);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [lifeHistory, setLifeHistory] = useState<{ id: string; title: string; date: string; type: string; source: string; status: string }[]>([]);
  const baseUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
  const portalUrl = portalToken ? `${baseUrl}/portal?token=${portalToken}` : "";

  const printAssetSheet = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Fiche_${asset.name.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    pageStyle: `
      @page { size: A4; margin: 12mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .asset-print-sheet { position: static !important; left: auto !important; top: auto !important; }
    `,
  });

  const handlePrintAssetSheet = () => printAssetSheet();

  const handleExportAssetPdf = () => {
    // Native printing renders the complete standalone document. It avoids the
    // blank PDFs produced by html2canvas when the equipment dialog is open.
    handlePrintAssetSheet();
  };


  /* =========================
     FETCH DATA
  ========================= */
React.useEffect(() => {
  const fetchData = async () => {
    /* -------- ASSIGNE -------- */
    if (asset.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", asset.assigned_to)
        .single();

      if (data) {
        setAssigneeName(`${data.first_name} ${data.last_name}`);
      }
    }

    /* -------- STATS VIA RPC -------- */
    const { data, error } = await supabase.rpc("get_asset_stats", {
      aid: asset.id,
    });

    if (error) {
      console.error(error);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;

    setStats({
  breakdownCount: row?.breakdown_count ?? 0,
  totalCost: Number(row?.total_cost ?? 0),
  lastIntervention: row?.last_intervention
    ? new Date(row.last_intervention)
    : null,
  frequency: row?.frequency ?? 0,
});
  };

  fetchData();
}, [asset.id, asset.assigned_to, refreshTrigger]);

  React.useEffect(() => {
    const loadPrintData = async () => {
      const [tokenResult, workOrdersResult, interventionsResult] = await Promise.all([
        supabase.rpc("get_portal_token_for_asset", { requested_asset_id: asset.id }).maybeSingle(),
        supabase.from("work_orders").select("id, title, due_date, maintenance_type, status").eq("asset_id", asset.id),
        supabase.from("interventions").select("id, title, intervention_date, maintenance_type").eq("asset_id", asset.id),
      ]);

      setPortalToken(tokenResult.data?.token ?? null);
      const history = [
        ...(workOrdersResult.data ?? []).map((item) => ({ id: item.id, title: item.title || "Ordre de travail", date: item.due_date, type: item.maintenance_type || "—", source: "OT", status: item.status || "—" })),
        ...(interventionsResult.data ?? []).map((item) => ({ id: item.id, title: item.title || "Intervention", date: item.intervention_date, type: item.maintenance_type || "—", source: "Intervention", status: "Terminée" })),
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setLifeHistory(history);
    };

    loadPrintData();
  }, [asset.id, refreshTrigger]);

  /* =========================
     LOGIC
  ========================= */

  const isUnreliable = useMemo(
    () => stats.breakdownCount >= 3,
    [stats.breakdownCount]
  );

  const getStatusStyle = (status: Asset["status"]) => {
    switch (status) {
      case "Opérationnel":
        return "bg-green-500 text-white";
      case "Maintenance":
        return "bg-amber-500 text-white";
      case "En Panne":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border overflow-hidden">
            {asset.image_url ? (
              <img
                src={asset.image_url}
                className="h-full w-full object-cover"
              />
            ) : (
              <Factory className="h-6 w-6" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold">{asset.name}</h3>
            <p className="text-sm text-muted-foreground">
              {asset.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="print:hidden rounded-xl" onClick={handleExportAssetPdf}>
            <Printer className="mr-1.5 h-4 w-4" /> Fiche de vie - Imprimer / PDF
          </Button>
        <span
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold",
            getStatusStyle(asset.status)
          )}
        >
          {asset.status}
        </span>
        </div>
      </div>

      {/* ALERT */}
      {isUnreliable && (
        <Card className="bg-red-50 border-red-200 text-red-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <p className="font-bold">Équipement critique</p>
              <p className="text-xs">
                {stats.breakdownCount} pannes détectées.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">

          <TabsList>
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
            <TabsTrigger value="life">Fiche de Vie</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
          </TabsList>

          {/* ACTION */}
          {canEdit && (
            <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600">
                  <PlusCircle className="mr-2" size={16} />
                  Action
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle intervention</DialogTitle>
                </DialogHeader>

                <AddPastInterventionForm
                  assetId={asset.id}
                  onSuccess={() => {
                    setIsActionOpen(false);
                    setRefreshTrigger((p) => p + 1);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* DETAILS */}
        <TabsContent value="details" className="space-y-4">

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <User />
              {assigneeName || "Non assigné"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.description || "Aucune description"}
            </CardContent>
          </Card>

        </TabsContent>

        {/* ANALYSIS */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-2 gap-4">

            <Card>
              <CardContent>Pannes: {stats.breakdownCount}</CardContent>
            </Card>

            <Card>
              <CardContent>
                Fréquence: {stats.frequency} jours
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                Coût: {stats.totalCost.toLocaleString()} F
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                Dernière:{" "}
                {stats.lastIntervention
                  ? format(stats.lastIntervention, "dd/MM/yy", {
                      locale: fr,
                    })
                  : "---"}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* LIFE SHEET */}
        <TabsContent value="life">
          <AssetLifeSheet asset={asset} refreshTrigger={refreshTrigger} />
        </TabsContent>

        {/* DOCS */}
        <TabsContent value="docs">
          <AssetDocuments assetId={asset.id} />
        </TabsContent>
      </Tabs>

      <div ref={printRef} className="asset-print-sheet absolute -left-[10000px] top-0 w-[794px] bg-white p-10 text-slate-900">
        <header className="flex items-start justify-between border-b-4 border-blue-600 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">BioPulse GMAO</p>
            <h1 className="mt-1 text-3xl font-black">Fiche de vie équipement</h1>
            <p className="mt-1 text-sm text-slate-600">{asset.name} · S/N {asset.serialNumber || "Non renseigné"}</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            {portalUrl ? <QRCodeSVG value={portalUrl} size={104} level="H" includeMargin /> : <div className="flex h-[104px] w-[104px] items-center justify-center text-center text-xs text-slate-500">QR indisponible</div>}
            <p className="mt-1 text-[9px] font-bold text-blue-700">PORTAIL CLIENT</p>
          </div>
        </header>

        {asset.image_url && (
          <section className="mt-5 flex justify-center">
            <img src={asset.image_url} alt={`Photo de ${asset.name}`} className="max-h-52 max-w-full rounded-lg border object-contain" />
          </section>
        )}

        <section className="mt-6 grid grid-cols-2 gap-3 text-sm">
          {[["Fabricant", asset.manufacturer], ["Modèle", asset.model], ["Catégorie", asset.category], ["Localisation", asset.location], ["Statut", asset.status], ["Mise en service", asset.commissioningDate && !Number.isNaN(new Date(asset.commissioningDate).getTime()) ? format(new Date(asset.commissioningDate), "dd/MM/yyyy") : "Non renseignée"]].map(([label, value]) => <div key={label} className="rounded border border-slate-300 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-semibold">{value || "Non renseigné"}</p></div>)}
        </section>

        <section className="mt-6"><h2 className="border-b pb-2 text-lg font-black">Description</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{asset.description || "Aucune description renseignée."}</p></section>

        <section className="mt-6">
          <h2 className="border-b pb-2 text-lg font-black">Historique des actions</h2>
          <table className="mt-3 w-full border-collapse text-left text-xs"><thead><tr className="bg-slate-100"><th className="border p-2">Action</th><th className="border p-2">Type</th><th className="border p-2">Date</th><th className="border p-2">Source</th><th className="border p-2">Statut</th></tr></thead><tbody>{lifeHistory.length ? lifeHistory.map((item) => <tr key={`${item.source}-${item.id}`}><td className="border p-2">{item.title}</td><td className="border p-2">{item.type}</td><td className="border p-2">{item.date ? format(new Date(item.date), "dd/MM/yyyy") : "—"}</td><td className="border p-2">{item.source}</td><td className="border p-2">{item.status}</td></tr>) : <tr><td colSpan={5} className="border p-4 text-center text-slate-500">Aucune action enregistrée.</td></tr>}</tbody></table>
        </section>

        <footer className="mt-8 border-t pt-3 text-[10px] text-slate-500">Fiche générée le {format(new Date(), "dd/MM/yyyy à HH:mm")}</footer>
      </div>
    </div>
  );
};

export default AssetDetailView;
