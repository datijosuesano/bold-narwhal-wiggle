"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useRoles } from "@/hooks/useRoles";

// Importations modulaires
import { Technician } from "./TechniciansTable";
import { TechnicianSchema, TechnicianFormValues } from "./schema";
import { technicianService } from "./technicianService";

interface EditTechnicianFormProps {
  technician: Technician;
  onSuccess: () => void;
}

const EditTechnicianForm: React.FC<EditTechnicianFormProps> = ({ technician, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { roles, isLoading: isRolesLoading } = useRoles();

  const nameParts = technician.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const form = useForm<TechnicianFormValues>({
    resolver: zodResolver(TechnicianSchema),
    defaultValues: {
      first_name: firstName,
      last_name: lastName,
      email: technician.email === 'N/A' ? '' : technician.email,
      telephone: technician.phone === 'N/A' ? '' : technician.phone,
      specialite: technician.specialty,
      role: technician.role_name || "user", 
    },
  });

  const onSubmit = async (data: TechnicianFormValues) => {
    setIsSubmitting(true);
    try {
      await technicianService.updateTechnician(technician.id, data);
      showSuccess(`Profil mis à jour avec succès.`);
      onSuccess();
    } catch (error: any) {
      showError(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* ... (Tes champs FormField restent inchangés ici) ... */}
        
        {/* Assure-toi juste que le bouton utilise bien isSubmitting */}
        <div className="sticky bottom-0 bg-background pt-2 pb-1">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 font-bold" disabled={isSubmitting || isRolesLoading}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
            Mettre à jour le profil
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditTechnicianForm;