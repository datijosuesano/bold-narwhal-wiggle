"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, User, Building2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { ASSET_STATUS } from "@/utils/constants";

// Imports de la nouvelle architecture
import { assetService } from "./assetService";
import { AssetSchema, AssetFormValues } from "./schema";

export interface Asset {
  id: string;
  name: string;
  category: string;
  client_id?: string;
  location: string;
  status: string;
  serial_number: string;
  model: string;
  brand?: string;
  manufacturer: string;
  manufacturing_date?: string | Date | null;
  commissioning_date: string | Date;
  expiry_date?: string | Date | null;
  purchase_cost: number;
  description?: string;
  assigned_to?: string | null;
  image_url?: string;
}

interface EditAssetFormProps {
  asset: Asset;
  onSuccess: () => void;
}

const EditAssetForm: React.FC<EditAssetFormProps> = ({ asset, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [techs, setTechs] = useState<{id: string, name: string}[]>([]);

  // Traducteur automatique des anciennes valeurs de la BDD vers le sélecteur
  const normalizeInitialStatus = (status: string): string => {
    const s = (status || "").toLowerCase().trim();
    if (s === "opérationnel" || s === "en service") return "Opérationnel";
    if (s === "en panne") return "En panne";
    if (s === "en maintenance" || s === "maintenance" || s === "maintenance en cours") return "Maintenance en cours";
    if (s === "réformé") return "Réformé";
    return "Opérationnel";
  };

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(AssetSchema),
    defaultValues: {
      name: asset.name,
      category: asset.category || "autre",
      status: normalizeInitialStatus(asset.status),
      description: asset.description || "",
      serial_number: asset.serial_number || "",
      model: asset.model || "",
      brand: asset.brand || "",
      manufacturer: asset.manufacturer || "",
      client_id: asset.client_id || "", 
      location: asset.location || "",
      assigned_to: asset.assigned_to || "none",
      manufacturing_date: asset.manufacturing_date ? new Date(asset.manufacturing_date) : null,
      commissioning_date: asset.commissioning_date ? new Date(asset.commissioning_date) : new Date(),
      expiry_date: asset.expiry_date ? new Date(asset.expiry_date) : null,
      purchase_cost: asset.purchase_cost || 0,
      image_url: asset.image_url || "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientData = await assetService.getClients();
        setClients(clientData || []);
        
        const techData = await assetService.getTechnicians();
        setTechs(techData?.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })) || []);
      } catch (err) {
        console.error("Erreur de chargement des dépendances", err);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: AssetFormValues) => {
    setIsLoading(true);

    // Sécurité : Alignement strict avec l'ENUM PostgreSQL
    let dbStatus = "Opérationnel";
    const currentStatus = data.status.toLowerCase().trim();
    
    if (currentStatus === "en panne") {
      dbStatus = "En panne";
    } else if (currentStatus === "maintenance en cours" || currentStatus === "en maintenance" || currentStatus === "maintenance") {
      dbStatus = "Maintenance en cours";
    } else if (currentStatus === "réformé") {
      dbStatus = "Réformé";
    } else if (currentStatus === "opérationnel" || currentStatus === "en service") {
      dbStatus = "Opérationnel";
    }

    try {
      const payload = {
        name: data.name,
        category: data.category,
        status: dbStatus,
        description: data.description,
        serial_number: data.serial_number,
        model: data.model,
        brand: data.brand,
        manufacturer: data.manufacturer,
        client_id: data.client_id, 
        location: data.location,   
        assigned_to: data.assigned_to === "none" ? null : data.assigned_to,
        manufacturing_date: data.manufacturing_date ? format(data.manufacturing_date, 'yyyy-MM-dd') : null,
        commissioning_date: format(data.commissioning_date, 'yyyy-MM-dd'),
        expiry_date: data.expiry_date ? format(data.expiry_date, 'yyyy-MM-dd') : null,
        purchase_cost: data.purchase_cost,
        image_url: data.image_url,
      };

      await assetService.updateAsset(asset.id, payload);

      showSuccess("Mise à jour réussie !");
      onSuccess();
    } catch (error: any) {
      console.error("Update error:", error);
      showError(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {ASSET_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <FormField control={form.control} name="client_id" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Building2 size={14} className="mr-1 text-blue-600" /> Client Propriétaire</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger className="rounded-xl border-blue-200"><SelectValue placeholder="Choisir un client" /></SelectTrigger></FormControl>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Localisation (Salle/Site)</FormLabel>
              <FormControl><Input placeholder="Ex: Laboratoire central..." {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem>
              <FormLabel>Marque</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="serial_number" render={({ field }) => (
            <FormItem>
              <FormLabel>N° de Série</FormLabel>
              <FormControl><Input {...field} className="rounded-xl font-mono uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem>
              <FormLabel>Modèle</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        <FormField control={form.control} name="assigned_to" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center"><User size={14} className="mr-1" /> Responsable Actuel</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || "none"}>
              <FormControl>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Non assigné" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">-- Aucun --</SelectItem>
                {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea {...field} className="rounded-xl resize-none" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <FormField control={form.control} name="manufacturing_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date de fabrication</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  className="rounded-xl" 
                  value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ""}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="commissioning_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Mise en service</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  className="rounded-xl" 
                  value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ""}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4">
          <FormField control={form.control} name="expiry_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Péremption / Expire</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  className="rounded-xl" 
                  value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ""}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="purchase_cost" render={({ field }) => (
            <FormItem>
              <FormLabel>Coût (FCFA)</FormLabel>
              <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} className="rounded-xl font-bold" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4 h-12 font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} 
          Enregistrer les modifications
        </Button>
      </form>
    </Form>
  );
};

export default EditAssetForm;