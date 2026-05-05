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
import { Edit2, MessageCircle, Trash2, Eye, Clock } from 'lucide-react';
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
}

interface TechniciansTableProps {
  technicians: Technician[];
  onEdit: (tech: Technician) => void;
  onShowTasks: (tech: Technician) => void;
  onDelete: (tech: Technician) => void;
  canManage?: boolean;
}

const getStatusBadge = (status: Technician['status']) => {
  switch (status) {
    case 'Available': return <Badge className="bg-green-600 hover:bg-green-700 rounded-full">Disponible</Badge>;
    case 'InIntervention': return <Badge className="bg-amber-500 hover:bg-amber-600 rounded-full">En Intervention</Badge>;
    case 'OnLeave': return <Badge variant="secondary" className="rounded-full">Congés</Badge>;
  }
};

const TechniciansTable: React.FC<TechniciansTableProps> = ({ technicians, onEdit, onShowTasks, onDelete, canManage = false }) => {
  
  const handleWhatsApp = (tech: Technician) => {
    const cleanNumber = tech.phone.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('0') ? '33' + cleanNumber.substring(1) : cleanNumber;
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  return (
    <div className="overflow-x-auto rounded-xl border shadow-md bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Technicien</TableHead>
            <TableHead className="font-semibold">Spécialité</TableHead>
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
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                        {tech.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">{tech.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{tech.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-xl border-blue-200 text-blue-700 bg-blue-50">
                    {tech.specialty}
                  </Badge>
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
                    title="Voir les tâches"
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
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Aucun technicien trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TechniciansTable;