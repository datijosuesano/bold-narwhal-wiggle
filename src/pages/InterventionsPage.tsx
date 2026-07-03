"use client";

import React, { useState, useEffect, useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Plus, Search, Loader2, Edit2, Trash2, Eye, Clock } from "lucide-react";

import { showSuccess, showError } from "@/utils/toast";

import { interventionService } from "@/components/interventions/interventionService";

import AddPastIntervention from "@/components/interventions/AddPastInterventionForm";
import InterventionDetailDialog from "@/components/interventions/InterventionDetailDialog";

/* =========================================================
   PAGE
========================================================= */

const InterventionsPage = () => {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedEdit, setSelectedEdit] = useState<any | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  /* ========================= FETCH ========================= */

  const fetchInterventions = async () => {
    setLoading(true);

    try {
      const data = await interventionService.getAll();
      setInterventions(data || []);
    } catch (err) {
      showError("Erreur chargement interventions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  /* ========================= SEARCH ========================= */

  const filtered = useMemo(() => {
    const s = search.toLowerCase();

    return interventions.filter((i) => {
      return (
        i.title?.toLowerCase().includes(s) ||
        i.rit_number?.toLowerCase().includes(s) ||
        i.physical_rit_number?.toString()?.toLowerCase().includes(s)
      );
    });
  }, [interventions, search]);

  /* ========================= DURATION ========================= */

  const duration = (start?: string, end?: string) => {
    if (!start || !end) return null;

    const diff = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(diff / 60000);

    if (mins <= 0) return null;

    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  /* ========================= DELETE ========================= */

  const handleDelete = async (id: string) => {
    const backup = interventions;

    setInterventions((prev) => prev.filter((i) => i.id !== id));

    try {
      await interventionService.delete(id);
      showSuccess("Supprimé");
    } catch (err) {
      setInterventions(backup);
      showError("Erreur suppression");
    }
  };

  /* ========================= RENDER ========================= */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Interventions</h1>
          <p className="text-slate-500">
            Gestion des maintenances biomédicales
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedEdit(null);
            setEditOpen(true);
          }}
        >
          <Plus className="mr-2" size={16} />
          Ajouter
        </Button>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />

        <Input
          className="pl-10"
          placeholder="Recherche RIT / titre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">

          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="p-4">RIT</th>
                  <th className="p-4">Équipement</th>
                  <th className="p-4">Objet</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>

                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-400">
                      Aucune intervention
                    </td>
                  </tr>

                ) : (
                  filtered.map((i) => (
                    <tr key={i.id} className="border-t">

                      {/* RIT */}
                      <td className="p-4 font-mono font-bold">
                        {i.rit_number || "---"}
                      </td>

                      {/* ASSET */}
                      <td className="p-4">
                        {i.assets?.name || "---"}
                      </td>

                      {/* TITLE */}
                      <td className="p-4">
                        <div className="font-semibold">{i.title}</div>

                        {duration(i.start_date, i.end_date) && (
                          <Badge className="mt-1 flex w-fit items-center gap-1">
                            <Clock size={12} />
                            {duration(i.start_date, i.end_date)}
                          </Badge>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedDetail(i);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye size={16} />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedEdit(i);
                              setEditOpen(true);
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDelete(i.id)}
                          >
                            <Trash2 size={16} />
                          </Button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>
          </div>

        </CardContent>
      </Card>

      {/* EDIT */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEdit ? "Modifier intervention" : "Nouvelle intervention"}
            </DialogTitle>
          </DialogHeader>

          <AddPastIntervention
            initialData={selectedEdit}
            onSuccess={() => {
              setEditOpen(false);
              setSelectedEdit(null);
              fetchInterventions();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* DETAIL */}
      <InterventionDetailDialog
        intervention={selectedDetail}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

    </div>
  );
};

export default InterventionsPage;