"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  ShieldAlert,
  Briefcase,
  ShieldCheck,
  UserCheck,
  Clock,
  Filter,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Skeleton } from "@/components/ui/skeleton";

import TechniciansTable, { Technician } from "@/components/TechniciansTable";
import CreateTechnicianForm from "@/components/CreateTechnicianForm";
import EditTechnicianForm from "@/components/EditTechnicianForm";
import TechnicianTasksDialog from "@/components/TechnicianTasksDialog";

import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ITEMS_PER_PAGE = 8;

/* =========================
   HELPERS
========================= */

const normalize = (v: string | null | undefined) =>
  (v || "user").toLowerCase().trim();

const mapStatus = (status: string | null): any => {
  if (!status) return "Available";

  const s = status.toLowerCase().trim();

  if (["disponible", "available"].includes(s)) return "Available";
  if (["en intervention", "inintervention"].includes(s)) return "InIntervention";
  if (["en congé", "en conge", "onleave"].includes(s)) return "OnLeave";

  return "Available";
};

const isLoggedToday = (date?: string | null) => {
  if (!date) return false;

  const d = new Date(date);
  const n = new Date();

  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
};

/* =========================
   DYNAMIC ROLES HOOK
========================= */

const useRoles = () => {
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("roles").select("name");

      if (error || !data) {
        // fallback sécurisé basé sur ton système actuel
        setRoles([
          "admin",
          "technicien_biomedical",
          "gestionnaire_stock",
          "secretaire",
          "user",
        ]);
        return;
      }

      setRoles(data.map((r) => r.name));
    };

    load();
  }, []);

  return roles;
};

/* =========================
   PAGE
========================= */

const TechniciansPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);

  const roles = useRoles();

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Technician | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openTasks, setOpenTasks] = useState(false);

  const [deleting, setDeleting] = useState(false);

  /* =========================
     FETCH
  ========================= */

  const fetchTechnicians = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase.from("profiles").select("*");

    if (error) {
      showError(error.message);
      setLoading(false);
      return;
    }

    const mapped: Technician[] = (data || []).map((p) => ({
      id: p.id,
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email,
      email: p.email,
      phone: p.telephone || "N/A",
      specialty: p.specialite || "Non défini",
      status: mapStatus(p.status),
      last_login: p.last_login,
      activeOrders: 0,
      role: normalize(p.role),
    }));

    setTechnicians(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  /* =========================
     KPI (FIX BUG 0 TECHNICIEN)
  ========================= */

  const kpis = useMemo(() => {
    const count = (r: string) =>
      technicians.filter((t) => normalize(t.role) === r).length;

    return {
      total: technicians.length,
      admins: count("admin"),
      tech: count("technicien_biomedical"),
      stock: count("gestionnaire_stock"),
      activeToday: technicians.filter((t) => isLoggedToday(t.last_login)).length,
    };
  }, [technicians]);

  /* =========================
     FILTER
  ========================= */

  const filtered = useMemo(() => {
    return technicians.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase()) ||
        t.specialty.toLowerCase().includes(search.toLowerCase());

      const matchRole =
        roleFilter === "all" || normalize(t.role) === roleFilter;

      const matchStatus = statusFilter === "all" || t.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [technicians, search, roleFilter, statusFilter]);

  /* =========================
     PAGINATION
  ========================= */

  const pages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  /* =========================
     ACTIONS
  ========================= */

  const handleDelete = async () => {
    if (!selected) return;

    setDeleting(true);

    const { error } = await supabase.functions.invoke("delete-user", {
      body: { userId: selected.id },
    });

    setDeleting(false);
    setOpenDelete(false);

    if (error) {
      showError(error.message);
      return;
    }

    setTechnicians((prev) => prev.filter((t) => t.id !== selected.id));
    showSuccess("Utilisateur supprimé");
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Équipe biomédicale</h1>
          <p className="text-gray-500">Gestion des utilisateurs & rôles</p>
        </div>

        {isAdmin && (
          <Button onClick={() => setOpenCreate(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4">Total: {kpis.total}</CardContent></Card>
        <Card><CardContent className="p-4">Tech: {kpis.tech}</CardContent></Card>
        <Card><CardContent className="p-4">Stock: {kpis.stock}</CardContent></Card>
        <Card><CardContent className="p-4">Admins: {kpis.admins}</CardContent></Card>
        <Card><CardContent className="p-4">Actifs: {kpis.activeToday}</CardContent></Card>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2 h-4 w-4" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Rôles" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="Available">Disponible</SelectItem>
            <SelectItem value="InIntervention">Intervention</SelectItem>
            <SelectItem value="OnLeave">Congé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <TechniciansTable
              technicians={paginated}
              onEdit={(t) => {
                setSelected(t);
                setOpenEdit(true);
              }}
              onDelete={(t) => {
                setSelected(t);
                setOpenDelete(true);
              }}
              onShowTasks={(t) => {
                setSelected(t);
                setOpenTasks(true);
              }}
              canManage={isAdmin}
            />
          )}

          {/* pagination */}
          {pages > 1 && (
            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                Prev
              </Button>
              <span>{page} / {pages}</span>
              <Button onClick={() => setPage((p) => Math.min(p + 1, pages))}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DELETE */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
            <AlertDialogDescription>
              Action irréversible
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* TASKS */}
      <TechnicianTasksDialog
        technician={selected}
        isOpen={openTasks}
        onClose={() => setOpenTasks(false)}
      />
    </div>
  );
};

export default TechniciansPage;