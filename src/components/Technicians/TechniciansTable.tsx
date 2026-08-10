import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, MessageCircle, Trash2, Eye, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  status: 'Available' | 'InIntervention' | 'OnLeave';
  activeOrders: number;
  phone: string;
  email: string;
  last_login?: string | null;
  role_name: string;
  role_label: string;
  role_color: string;
}

interface TechniciansTableProps {
  technicians: Technician[];
  onEdit: (tech: Technician) => void;
  onShowTasks: (tech: Technician) => void;
  onDelete: (tech: Technician) => void;
  canManage?: boolean;
}

const TechniciansTable: React.FC<TechniciansTableProps> = ({ technicians, onEdit, onShowTasks, onDelete, canManage = false }) => {
  
  const handleWhatsApp = (tech: Technician) => {
    const cleanNumber = tech.phone.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('0') ? '225' + cleanNumber.substring(1) : cleanNumber;
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  return (
    <div className="overflow-x-auto rounded-xl border shadow-md bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Membre</TableHead>
            <TableHead className="font-semibold">Rôle & Spécialité</TableHead>
            <TableHead className="font-semibold">Dernière Connexion</TableHead>
            <TableHead className="font-semibold text-center">OT Actifs</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {technicians.length > 0 ? (
            technicians.map((tech) => (
              <TableRow key={tech.id} className="hover:bg-accent/50 transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                        {tech.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-slate-900">{tech.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{tech.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      <div className={cn("w-2 h-2 rounded-full mr-2", tech.role_color || "bg-slate-400")} />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                        {tech.role_label}
                      </span>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-xl border-slate-200 text-slate-500 bg-slate-50 text-[10px]">
                      {tech.specialty}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {tech.last_login ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{format(new Date(tech.last_login), 'dd/MM/yyyy', { locale: fr })}</span>
                      <span className="text-[10px] text-blue-600 flex items-center">
                        <Clock size={10} className="mr-1" /> {format(new Date(tech.last_login), 'HH:mm')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Jamais connecté</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <button 
                    onClick={() => onShowTasks(tech)}
                    className={cn(
                      "inline-flex items-center justify-center h-8 w-8 rounded-full font-bold transition-all hover:scale-110 shadow-sm",
                      tech.activeOrders > 2 ? "bg-red-500 text-white" : tech.activeOrders > 0 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tech.activeOrders}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50"
                      onClick={() => onShowTasks(tech)}
                      title="Voir détails"
                    >
                      <Eye size={18} />
                    </Button>
                    
                    {canManage && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50"
                          onClick={() => handleWhatsApp(tech)}
                          title="WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                          onClick={() => onEdit(tech)}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50"
                          onClick={() => onDelete(tech)}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                Aucun membre d'équipe trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TechniciansTable;