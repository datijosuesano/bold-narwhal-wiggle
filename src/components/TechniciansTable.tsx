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
import { Eye, Edit2, Phone, Mail, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { showSuccess } from "@/utils/toast";

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  status: 'Available' | 'InIntervention' | 'OnLeave';
  activeOrders: number;
  phone: string;
  email: string;
}

interface TechniciansTableProps {
  technicians: Technician[];
  onEdit: (tech: Technician) => void;
}

const getStatusBadge = (status: Technician['status']) => {
  switch (status) {
    case 'Available': return <Badge className="bg-green-600 hover:bg-green-700 rounded-full">Disponible</Badge>;
    case 'InIntervention': return <Badge className="bg-amber-500 hover:bg-amber-600 rounded-full">En Intervention</Badge>;
    case 'OnLeave': return <Badge variant="secondary" className="rounded-full">Congés</Badge>;
  }
};

const TechniciansTable: React.FC<TechniciansTableProps> = ({ technicians, onEdit }) => {
  
  const handleCall = (tech: Technician) => {
    showSuccess(`Appel de ${tech.name} au ${tech.phone}...`);
  };

  const handleShowOT = (tech: Technician) => {
    if (tech.activeOrders > 0) {
      showSuccess(`${tech.name} travaille sur ${tech.activeOrders} ordres de travail actuellement.`);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border shadow-md bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Technicien</TableHead>
            <TableHead className="font-semibold">Spécialité</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
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
                      <div className="text-xs text-muted-foreground font-mono">{tech.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-xl border-blue-200 text-blue-700 bg-blue-50">
                    {tech.specialty}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(tech.status)}</TableCell>
                <TableCell className="text-center">
                  <button 
                    onClick={() => handleShowOT(tech)}
                    className={cn(
                      "inline-flex items-center justify-center h-8 w-8 rounded-full font-bold transition-transform hover:scale-110",
                      tech.activeOrders > 2 ? "bg-red-100 text-red-700" : tech.activeOrders > 0 ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
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
                      onClick={() => handleCall(tech)}
                      title="Appeler"
                    >
                      <Phone size={16} />
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