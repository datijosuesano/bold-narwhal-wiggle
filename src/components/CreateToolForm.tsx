import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

type ToolCondition =
  | "excellent"
  | "bon"
  | "moyen"
  | "critique"
  | "hors_service";

interface CreateToolFormProps {
  onSuccess: () => void;
}

const CreateToolForm: React.FC<CreateToolFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    serial_number: "",
    category: "",
    status: "Disponible",
    supplier: "",
    location: "",
    condition: "bon" as ToolCondition,
    purchase_date: "",
    calibration_due_date: "",
    maintenance_due_date: "",
    notes: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("tools").insert([
        {
          name: form.name,
          serial_number: form.serial_number,
          category: form.category,
          status: form.status,
          supplier: form.supplier || null,
          location: form.location || null,
          condition: form.condition,
          purchase_date: form.purchase_date || null,
          calibration_due_date: form.calibration_due_date || null,
          maintenance_due_date: form.maintenance_due_date || null,
          notes: form.notes || null,
        },
      ]);

      if (error) throw error;

      showSuccess("Outil créé avec succès");
      onSuccess();

      // reset form
      setForm({
        name: "",
        serial_number: "",
        category: "",
        status: "Disponible",
        supplier: "",
        location: "",
        condition: "bon",
        purchase_date: "",
        calibration_due_date: "",
        maintenance_due_date: "",
        notes: "",
      });
    } catch (error: any) {
      showError(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* NOM */}
      <div className="space-y-1">
        <Label>Nom de l'outil</Label>
        <Input
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
      </div>

      {/* SERIAL */}
      <div className="space-y-1">
        <Label>Numéro de série</Label>
        <Input
          value={form.serial_number}
          onChange={(e) => handleChange("serial_number", e.target.value)}
          required
        />
      </div>

      {/* CATEGORY */}
      <div className="space-y-1">
        <Label>Catégorie</Label>
        <Input
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
        />
      </div>

      {/* SUPPLIER + LOCATION */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Fournisseur</Label>
          <Input
            value={form.supplier}
            onChange={(e) => handleChange("supplier", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Localisation</Label>
          <Input
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>
      </div>

      {/* DATES */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Date d'achat</Label>
          <Input
            type="date"
            value={form.purchase_date}
            onChange={(e) => handleChange("purchase_date", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Calibration</Label>
          <Input
            type="date"
            value={form.calibration_due_date}
            onChange={(e) => handleChange("calibration_due_date", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Maintenance</Label>
          <Input
            type="date"
            value={form.maintenance_due_date}
            onChange={(e) => handleChange("maintenance_due_date", e.target.value)}
          />
        </div>
      </div>

      {/* CONDITION */}
      <div className="space-y-1">
        <Label>État de l'équipement</Label>
        <Select
          value={form.condition}
          onValueChange={(val) => handleChange("condition", val)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="bon">Bon</SelectItem>
            <SelectItem value="moyen">Moyen</SelectItem>
            <SelectItem value="critique">Critique</SelectItem>
            <SelectItem value="hors_service">Hors service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* NOTES */}
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Observations techniques..."
        />
      </div>

      {/* BUTTON */}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Création..." : "Créer l'outil"}
      </Button>
    </form>
  );
};

export default CreateToolForm;