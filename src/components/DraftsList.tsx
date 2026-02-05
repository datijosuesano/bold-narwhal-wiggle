import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTodo, Plus, Trash2, CalendarPlus, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from '@/utils/toast';

interface Draft {
  id: string;
  title: string;
  note: string;
}

const initialDrafts: Draft[] = [
  { id: 'D1', title: 'Vérifier compresseur salle 4', note: 'Le client signale une chauffe' },
  { id: 'D2', title: 'Peinture salle bloc', note: 'À faire lors de la fermeture annuelle' },
];

interface DraftsListProps {
  onSchedule: (draft: Draft) => void;
}

const DraftsList: React.FC<DraftsListProps> = ({ onSchedule }) => {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [newDraftTitle, setNewDraftTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDraft = () => {
    if (newDraftTitle.trim().length < 5) {
      showError("Le titre du brouillon doit contenir au moins 5 caractères.");
      return;
    }
    setIsAdding(true);
    setTimeout(() => {
      const newId = `D${Date.now()}`;
      const newDraft: Draft = {
        id: newId,
        title: newDraftTitle.trim(),
        note: "Note rapide ajoutée.",
      };
      setDrafts(prev => [newDraft, ...prev]);
      setNewDraftTitle('');
      setIsAdding(false);
      showSuccess("Idée notée dans les brouillons.");
    }, 500);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    showSuccess("Brouillon supprimé.");
  };

  return (
    <Card className="shadow-lg border-none bg-slate-50 dark:bg-slate-900/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase flex items-center">
            <ListTodo size={16} className="mr-2 text-blue-600" /> Brouillons
          </CardTitle>
          <Badge variant="outline" className="rounded-full">{drafts.length}</Badge>
        </div>
        <CardDescription className="text-xs">Tâches à programmer plus tard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.map(draft => (
          <div key={draft.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm hover:border-blue-500 transition-colors group">
            <h5 className="text-sm font-bold mb-1">{draft.title}</h5>
            <p className="text-[10px] text-muted-foreground line-clamp-2">{draft.note}</p>
            <div className="mt-2 flex justify-end gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full text-red-500 hover:bg-red-50"
                onClick={() => handleDeleteDraft(draft.id)}
                title="Supprimer"
              >
                <Trash2 size={14} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full text-blue-600 hover:bg-blue-50"
                onClick={() => onSchedule(draft)}
                title="Programmer"
              >
                <CalendarPlus size={14} />
              </Button>
            </div>
          </div>
        ))}
        
        <div className="space-y-2 pt-2">
          <Input 
            placeholder="Noter une idée rapide..." 
            className="rounded-xl"
            value={newDraftTitle}
            onChange={(e) => setNewDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAdding) {
                handleAddDraft();
              }
            }}
          />
          <Button 
            variant="outline" 
            className="w-full border-dashed rounded-xl hover:bg-blue-50"
            onClick={handleAddDraft}
            disabled={isAdding || newDraftTitle.trim().length < 5}
          >
            {isAdding ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Plus size={16} className="mr-2"/>
            )}
            Noter une idée
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DraftsList;