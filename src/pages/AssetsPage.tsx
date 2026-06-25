"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Loader2,
  Filter,
  QrCode,
  Printer,
  FileCheck2,
  Building2
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import CreateAssetForm from "@/components/CreateAssetForm";
import EditAssetForm from "@/components/EditAssetForm";
import AssetDetailView from "@/components/AssetDetailView";
import AssetQRCode from "@/components/AssetQRCode";

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AssetsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'technician', 'technicien_biomedical']);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, clientsRes] = await Promise.all([
        supabase
          .from('assets')
          .select('*, clients(id, name)')
          .order('name'),
        supabase
          .from('clients')
          .select('id, name')
          .order('name')
      ]);

      if (assetsRes.error) throw assetsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setEquipments(assetsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (err: any) {
      console.error("Erreur chargement données:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Récupération du nom du client sélectionné pour le filtre
  const targetClientObj = useMemo(() => {
    return clients.find(c => c.id === selectedClient);
  }, [selectedClient, clients]);

  const filteredEquipments = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return equipments.filter(item => {
      const name = (item.name || "").toLowerCase();
      const location = (item.location || "").toLowerCase();
      const sn = (item.serial_number || "").toLowerCase();
      const model = (item.model || "").toLowerCase();
      
      const matchesSearch =
        name.includes(lowerCaseSearch) ||
        location.includes(lowerCaseSearch) ||
        model.includes(lowerCaseSearch) ||
        sn.includes(lowerCaseSearch);

      // Logique de filtrage hybride (Vrai ID ou texte dans Localisation pour l'ancien parc)
      const matchesClient =
        selectedClient === "all" ||
        item.client_id === selectedClient ||
        (!item.client_id && targetClientObj && location.includes(targetClientObj.name.toLowerCase()));

      return matchesSearch && matchesClient;
    });
  }, [equipments, searchTerm, selectedClient, targetClientObj]);

  const selectedClientName = useMemo(() => {
    return targetClientObj ? targetClientObj.name : "Tous les clients";
  }, [targetClientObj]);

  const handleConfirmPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Inventaire_Equipements_${format(new Date(), "yyyy-MM-dd")}`,
    onAfterPrint: () => setIsPreviewOpen(false),
    pageStyle: `
      @page {
        size: landscape;
        margin: 15mm;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            Gestion des Équipements
          </h1>
          <p className="text-lg text-muted-foreground">
            Suivez l'état technique et l'attribution de votre parc.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={() => setIsPreviewOpen(true)} 
            variant="outline" 
            className="rounded-xl border-slate-200 font-bold h-11 hover:bg-slate-50 flex-1 md:flex-none"
          >
            <FileCheck2 size={16} className="mr-1.5 text-blue-600" /> Aperçu & Exporter
          </Button>

          {canEdit && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md h-11 flex-1 md:flex-none">
                  <Plus className="mr-2 h-4 w-4" /> Ajouter Équipement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Nouvel Équipement</DialogTitle>
                  <DialogDescription>Enregistrez un nouvel appareil médical dans l'inventaire.</DialogDescription>
                </DialogHeader>
                <CreateAssetForm onSuccess={() => { setIsCreateModalOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* TABLE CARD */}
      <Card className="shadow-lg border-none rounded-2xl">
        <CardContent className="p-0">

          {/* FILTERS */}
          <div className="p-4 border-b flex flex-col md:flex-row gap-4 bg-slate-50/50 rounded-t-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, modèle ou S/N..."
                className="pl-10 rounded-xl bg-white border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-72">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="rounded-xl bg-white border-slate-200">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filtrer par client" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABLE DATA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-black text-slate-500 bg-slate-50 border-b tracking-wider">
                <tr>
                  <th className="px-6 py-4">Équipement & S/N</th>
                  <th className="px-6 py-4">Client Propriétaire</th>
                  <th className="px-6 py-4">Localisation interne</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
                      <p className="text-sm text-slate-500">Chargement des équipements...</p>
                    </td>
                  </tr>
                ) : filteredEquipments.length > 0 ? (
                  filteredEquipments.map((item) => {
                    // Si l'appareil a un vrai client lié, on prend son nom, sinon on prend le texte de localisation temporairement
                    const hasRealClient = !!item.client_id;
                    const displayClientName = hasRealClient ? item.clients?.name : item.location;
                    const displayLocation = hasRealClient ? item.location : "À préciser (Ancien lot)";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            S/N: <span className="font-semibold text-slate-500">{item.serial_number || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold">
                          {hasRealClient ? (
                            <span className="text-slate-800">{displayClientName}</span>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-flex items-center">
                              ⚠️ {displayClientName}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 italic">
                          {displayLocation}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={item.status === 'Opérationnel' || item.status === 'En service' ? 'default' : 'destructive'} 
                            className={item.status === 'Opérationnel' || item.status === 'En service' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : ''}
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50" onClick={() => { setSelectedAsset(item); setIsQrOpen(true); }}>
                              <QrCode size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedAsset(item); setIsDetailModalOpen(true); }}>
                              <Eye size={14} />
                            </Button>
                            {canEdit && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100" onClick={() => { setSelectedAsset(item); setIsEditOpen(true); }}>
                                <Edit2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-muted-foreground italic">
                      Aucun équipement trouvé pour ces critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODALE D'APERÇU WYSIWYG & EXPORT */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col rounded-2xl p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="p-6 bg-white border-b shrink-0 shadow-sm z-10">
            <DialogTitle className="flex items-center text-xl font-black text-slate-800">
              <Eye className="w-5 h-5 mr-2 text-blue-600" /> Aperçu de l'Inventaire du Parc
            </DialogTitle>
            <DialogDescription>
              Vérifiez la liste filtrée avant d'exporter en PDF ou d'imprimer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center custom-scrollbar">
            <div ref={printRef} className="bg-white p-10 shadow-lg border w-full max-w-[1100px] min-h-[700px]">
              
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
                <div>
                  <h1 className="text-2xl font-black uppercase text-black tracking-tight">Inventaire Équipements Médicaux</h1>
                  <p className="text-sm font-bold text-gray-700 mt-1">Filtre sélectionné : <span className="text-blue-600">{selectedClientName}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-blue-600 uppercase">BioPulse GMAO</p>
                  <p className="text-xs font-mono mt-1 text-gray-500">Édité le {format(new Date(), 'dd/MM/yyyy à HH:mm')}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 border-b-2 border-black">
                  <tr>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Appareil & Modèle</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">N° de Série</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Client / Structure</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Localisation Interne</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {filteredEquipments.length > 0 ? (
                    filteredEquipments.map((item) => {
                      const hasRealClient = !!item.client_id;
                      const displayClientName = hasRealClient ? item.clients?.name : item.location;
                      const displayLocation = hasRealClient ? item.location : "À préciser";

                      return (
                        <tr key={item.id}>
                          <td className="py-3 px-3 border border-gray-300">
                            <div className="font-bold text-black text-sm">{item.name}</div>
                            <div className="text-[10px] text-gray-600">{item.model || '---'}</div>
                          </td>
                          <td className="py-3 px-3 border border-gray-300 text-xs font-mono text-gray-800">
                            {item.serial_number || 'N/A'}
                          </td>
                          <td className="py-3 px-3 border border-gray-300 text-xs font-bold text-black">
                            {displayClientName}
                          </td>
                          <td className="py-3 px-3 border border-gray-300 text-xs text-gray-700">
                            {displayLocation}
                          </td>
                          <td className="py-3 px-3 border border-gray-300 text-xs font-bold text-gray-800 uppercase">
                            {item.status}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 italic">Aucun équipement disponible.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <p>Total : {filteredEquipments.length} équipement(s) répertorié(s).</p>
                <p>Document officiel BioPulse GMAO.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-white border-t shrink-0 flex items-center justify-between">
            <p className="text-xs text-slate-500 italic hidden sm:block">
              * Astuce : Choisissez "Enregistrer au format PDF" dans les options de votre navigateur.
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="ghost" className="rounded-xl font-medium" onClick={() => setIsPreviewOpen(false)}>Annuler</Button>
              <Button onClick={() => handleConfirmPrint()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">
                <Printer className="w-4 h-4 mr-2" /> Valider & Imprimer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Aperçu de l'Équipement</DialogTitle>
            <DialogDescription>Consultez les détails techniques et l'historique de cet appareil.</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <AssetDetailView
              asset={{
                ...selectedAsset,
                serialNumber: selectedAsset.serial_number,
                commissioningDate: selectedAsset.commissioning_date ? new Date(selectedAsset.commissioning_date) : null,
                purchaseCost: selectedAsset.purchase_cost,
                expiryDate: selectedAsset.expiry_date ? new Date(selectedAsset.expiry_date) : null
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Modifier l'Équipement</DialogTitle>
            <DialogDescription>Mettez à jour les informations de l'appareil sélectionné.</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <EditAssetForm
              asset={{
                ...selectedAsset,
                serialNumber: selectedAsset.serial_number,
                commissioningDate: selectedAsset.commissioning_date ? new Date(selectedAsset.commissioning_date) : null,
                purchaseCost: selectedAsset.purchase_cost,
                expiryDate: selectedAsset.expiry_date ? new Date(selectedAsset.expiry_date) : null
              }}
              onSuccess={() => { setIsEditOpen(false); fetchData(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QR MODAL */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>QR Code Équipement</DialogTitle>
            <DialogDescription>Scanner pour créer une demande d’intervention.</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <AssetQRCode
              assetId={selectedAsset.id}
              assetName={selectedAsset.name}
              serialNumber={selectedAsset.serial_number || 'N/A'}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AssetsPage;