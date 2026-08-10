import React, { useEffect, useState } from "react";
import { interventionService } from "./interventionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface PartItem {
  part_id: string;
  quantity: number;
}

interface Props {
  value: PartItem[];
  onChange: (value: PartItem[]) => void;
}

export default function InterventionPartsSelector({ value, onChange }: Props) {
  const [parts, setParts] = useState<any[]>([]);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const data = await interventionService.getSpareParts();
        setParts(data || []);
      } catch (err) {
        console.error("Erreur chargement pièces :", err);
      }
    };
    fetchParts();
  }, []);

  const handleAdd = (partId: string) => {
    const exists = value.find((p) => p.part_id === partId);
    if (exists) {
      onChange(value.map((p) => p.part_id === partId ? { ...p, quantity: p.quantity + 1 } : p));
      return;
    }
    onChange([...value, { part_id: partId, quantity: 1 }]);
  };

  const handleRemove = (partId: string) => {
    onChange(value.filter((p) => p.part_id !== partId));
  };

  const handleQtyChange = (partId: string, qty: number) => {
    onChange(value.map((p) => p.part_id === partId ? { ...p, quantity: Math.max(1, qty) } : p));
  };

  return (
    <div className="space-y-4">
      {/* SELECTOR MODERNE */}
      <Select onValueChange={handleAdd}>
        <SelectTrigger className="w-full rounded-xl h-11">
          <SelectValue placeholder="Ajouter une pièce détachée..." />
        </SelectTrigger>
        <SelectContent>
          {parts.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name} (Stock: {p.current_stock})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* LISTE DES PIÈCES */}
      <div className="space-y-2">
        {value.map((p) => {
          const partInfo = parts.find((x) => x.id === p.part_id);
          return (
            <div key={p.part_id} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-800">{partInfo?.name || "Pièce inconnue"}</div>
                <div className="text-xs text-slate-500">Stock actuel: {partInfo?.current_stock ?? 0}</div>
              </div>
              
              <Input
                type="number"
                min={1}
                value={p.quantity}
                onChange={(e) => handleQtyChange(p.part_id, Number(e.target.value))}
                className="w-20 h-10 rounded-lg text-center"
              />

              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemove(p.part_id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X size={18} />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}