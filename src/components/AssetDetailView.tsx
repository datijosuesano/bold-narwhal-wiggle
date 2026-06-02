"use client";

import React, { useState, useMemo } from "react";
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

import AddPastInterventionForm from "./AddPastInterventionForm";
import AssetDocuments from "./AssetDocuments";
import AssetLifeSheet from "./AssetLifeSheet";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const canEdit = hasRole(["admin", "technicien biomedical"]);

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
    ? new Date(row.last_intervention + "T00:00:00")
    : null,
  frequency: 0,
});
  };

  fetchData();
}, [asset.id, asset.assigned_to, refreshTrigger]);

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

        <span
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold",
            getStatusStyle(asset.status)
          )}
        >
          {asset.status}
        </span>
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
    </div>
  );
};

export default AssetDetailView;