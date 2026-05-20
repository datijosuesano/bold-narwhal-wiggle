import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Loader2,
  Filter,
  QrCode
} from 'lucide-react';

import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
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

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AssetsPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  const canEdit = hasRole(['admin', 'technicien biomedical']);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isQrOpen, setIsQrOpen] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const [equipments, setEquipments] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const [assetsRes, clientsRes] = await Promise.all([
        supabase
          .from('assets')
          .select('*')
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

  const filteredEquipments = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();

    return equipments.filter(item => {
      const name = (item.name || "").toLowerCase();
      const location = (item.location || "").toLowerCase();
      const sn = (item.serial_number || "").toLowerCase();

      const matchesSearch =
        name.includes(lowerCaseSearch) ||
        location.includes(lowerCaseSearch) ||
        sn.includes(lowerCaseSearch);

      const matchesClient =
        selectedClient === "all" ||
        item.location === selectedClient;

      return matchesSearch && matchesClient;
    });
  }, [equipments, searchTerm, selectedClient]);

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            Gestion des Équipements
          </h1>

          <p className="text-lg text-muted-foreground">
            Suivez l'état technique de votre parc.
          </p>
        </div>

        {canEdit && (
          <Dialog
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter Équipement
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Nouvel Équipement
                </DialogTitle>

                <DialogDescription>
                  Enregistrez un nouvel appareil médical dans l'inventaire.
                </DialogDescription>
              </DialogHeader>

              <CreateAssetForm
                onSuccess={() => {
                  setIsCreateModalOpen(false);
                  fetchData();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* TABLE */}
      <Card className="shadow-lg">
        <CardContent className="p-0">

          {/* FILTERS */}
          <div className="p-4 border-b flex flex-col md:flex-row gap-4">

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />

              <Input
                placeholder="Rechercher par nom ou S/N..."
                className="pl-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-64">
              <Select
                value={selectedClient}
                onValueChange={setSelectedClient}
              >
                <SelectTrigger className="rounded-xl">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />

                    <SelectValue placeholder="Filtrer par client" />
                  </div>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Tous les clients
                  </SelectItem>

                  {clients.map(client => (
                    <SelectItem
                      key={client.id}
                      value={client.name}
                    >
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-6 py-3">Équipement</th>
                  <th className="px-6 py-3">Localisation</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {isLoading ? (

                  <tr>
                    <td colSpan={4} className="text-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    </td>
                  </tr>

                ) : filteredEquipments.length > 0 ? (

                  filteredEquipments.map((item) => (

                    <tr
                      key={item.id}
                      className="hover:bg-accent/50 transition-colors group"
                    >

                      {/* EQUIPMENT */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {item.name}
                        </div>

                        <div className="text-[10px] font-mono text-slate-400 uppercase">
                          S/N: {item.serial_number || 'N/A'}
                        </div>
                      </td>

                      {/* LOCATION */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {item.location || "Non localisé"}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="rounded-full text-[10px] uppercase font-bold"
                        >
                          {item.status}
                        </Badge>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">

                          {/* QR CODE */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-green-600 hover:bg-green-100"
                            onClick={() => {
                              setSelectedAsset(item);
                              setIsQrOpen(true);
                            }}
                          >
                            <QrCode size={16} />
                          </Button>

                          {/* VIEW */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-blue-600"
                            onClick={() => {
                              setSelectedAsset(item);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <Eye size={16} />
                          </Button>

                          {/* EDIT */}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600"
                              onClick={() => {
                                setSelectedAsset(item);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit2 size={16} />
                            </Button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))

                ) : (

                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-20 text-muted-foreground italic"
                    >
                      Aucun équipement trouvé.
                    </td>
                  </tr>

                )}

              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DETAIL MODAL */}
      <Dialog
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      >
        <DialogContent className="sm:max-w-[600px] rounded-xl max-h-[90vh] overflow-y-auto custom-scrollbar">

          <DialogHeader>
            <DialogTitle>
              Aperçu de l'Équipement
            </DialogTitle>

            <DialogDescription>
              Consultez les détails techniques et l'historique de cet appareil.
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <AssetDetailView
              asset={{
                ...selectedAsset,

                serialNumber: selectedAsset.serial_number,

                commissioningDate:
                  selectedAsset.commissioning_date
                    ? new Date(selectedAsset.commissioning_date)
                    : null,

                purchaseCost:
                  selectedAsset.purchase_cost,

                expiryDate:
                  selectedAsset.expiry_date
                    ? new Date(selectedAsset.expiry_date)
                    : null
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      >
        <DialogContent className="sm:max-w-lg rounded-xl">

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Modifier l'Équipement
            </DialogTitle>

            <DialogDescription>
              Mettez à jour les informations de l'appareil sélectionné.
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <EditAssetForm
              asset={{
                ...selectedAsset,

                serialNumber: selectedAsset.serial_number,

                commissioningDate:
                  selectedAsset.commissioning_date
                    ? new Date(selectedAsset.commissioning_date)
                    : null,

                purchaseCost:
                  selectedAsset.purchase_cost,

                expiryDate:
                  selectedAsset.expiry_date
                    ? new Date(selectedAsset.expiry_date)
                    : null
              }}

              onSuccess={() => {
                setIsEditOpen(false);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QR MODAL */}
      <Dialog
        open={isQrOpen}
        onOpenChange={setIsQrOpen}
      >
        <DialogContent className="sm:max-w-md rounded-xl">

          <DialogHeader>
            <DialogTitle>
              QR Code Équipement
            </DialogTitle>

            <DialogDescription>
              Scanner pour créer une demande d’intervention.
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <div className="flex flex-col items-center space-y-6 py-6">

              <div className="bg-white p-4 rounded-xl shadow">
                <QRCode
                  value={`${window.location.origin}/request/${selectedAsset.id}`}
                  size={220}
                />
              </div>

              <div className="text-center">
                <p className="font-bold text-lg">
                  {selectedAsset.name}
                </p>

                <p className="text-xs text-muted-foreground uppercase">
                  S/N: {selectedAsset.serial_number || 'N/A'}
                </p>

                <p className="text-sm text-slate-500 mt-2">
                  {selectedAsset.location || 'Non localisé'}
                </p>
              </div>

            </div>
          )}

        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AssetsPage;