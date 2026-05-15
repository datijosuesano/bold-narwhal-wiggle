"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

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
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const PasswordSchema = z.object({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof PasswordSchema>;

const ChangePasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;

      showSuccess("Mot de passe mis à jour avec succès !");
      form.reset();
    } catch (err: any) {
      showError(`Erreur : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mb-2">
          <ShieldCheck className="text-blue-600 mt-0.5" size={18} />
          <p className="text-xs text-blue-800 leading-relaxed">
            Pour garantir la sécurité de votre compte, choisissez un mot de passe robuste mélangeant lettres, chiffres et symboles.
          </p>
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nouveau mot de passe</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showPass ? "text" : "password"} 
                    {...field} 
                    className="rounded-xl pr-10" 
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <Input 
                  type={showPass ? "text" : "password"} 
                  {...field} 
                  className="rounded-xl" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl h-11 font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Lock className="mr-2 h-4 w-4" />}
          Mettre à jour le mot de passe
        </Button>
      </form>
    </Form>
  );
};

export default ChangePasswordForm;