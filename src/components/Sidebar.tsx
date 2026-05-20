import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wrench, 
  Factory, 
  Menu, 
  CalendarDays, 
  ShieldCheck, 
  Users, 
  ClipboardList, 
  Box, 
  Building2, 
  FlaskConical, 
  LogOut, 
  Shield, 
  FileText, 
  BookOpen, 
  AlertTriangle, 
  BarChart3, 
  User,
  Hammer,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "./ui/badge";

const SidebarContent: React.FC<{ closeSheet?: () => void }> = ({ closeSheet }) => {
  const location = useLocation();
  const { role, signOut, hasRole } = useAuth();

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Tableau de bord", roles: ['admin', 'technicien biomedical', 'secretaire', 'gestionnaire de stock'] },
    { to: "/chat", icon: <MessageSquare size={20} />, label: "Discussions", roles: ['admin', 'technicien biomedical', 'secretaire', 'gestionnaire de stock'] },
    { to: "/statistics", icon: <BarChart3 size={20} />, label: "Statistiques", roles: ['admin', 'technicien biomedical'] },
    { to: "/reported-breakdowns", icon: <AlertTriangle size={20} />, label: "Pannes Signalées", roles: ['admin', 'technicien biomedical', 'secretaire'] },
    { to: "/assets", icon: <Factory size={20} />, label: "Équipements", roles: ['admin', 'technicien biomedical', 'secretaire', 'gestionnaire de stock'] },
    { to: "/work-orders", icon: <ClipboardList size={20} />, label: "Ordres de Travail", roles: ['admin', 'technicien biomedical', 'secretaire'] },
    { to: "/interventions", icon: <Wrench size={20} />, label: "Interventions", roles: ['admin', 'technicien biomedical', 'secretaire'] },
    { to: "/planning", icon: <CalendarDays size={20} />, label: "Planification", roles: ['admin', 'technicien biomedical'] },
    { to: "/inventory", icon: <Box size={20} />, label: "Pièces Détachées", roles: ['admin', 'gestionnaire de stock'] },
    { to: "/reagents", icon: <FlaskConical size={20} />, label: "Réactifs Labo", roles: ['admin', 'gestionnaire de stock'] },
    { to: "/tools", icon: <Hammer size={20} />, label: "Outils de Travail", roles: ['admin', 'technicien biomedical'] },
    { to: "/clients", icon: <Building2 size={20} />, label: "Clients & Sites", roles: ['admin', 'secretaire'] },
    { to: "/contracts", icon: <ShieldCheck size={20} />, label: "Contrats", roles: ['admin', 'secretaire'] },
    { to: "/reports", icon: <FileText size={20} />, label: "Rapports", roles: ['admin', 'technicien biomedical', 'secretaire'] },
    { to: "/documentation", icon: <BookOpen size={20} />, label: "Documentation", roles: ['admin', 'technicien biomedical', 'secretaire', 'gestionnaire de stock'] },
    { to: "/technicians", icon: <Users size={20} />, label: "Équipe", roles: ['admin'] },
    { to: "/profile", icon: <User size={20} />, label: "Mon Profil", roles: ['admin', 'technicien biomedical', 'secretaire', 'gestionnaire de stock'] },
  ];

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex flex-col items-center mb-6">
        <div className="text-2xl font-black text-sidebar-primary-foreground">GMAO Dyad</div>
        <Badge className="mt-2 bg-sidebar-accent text-[10px] rounded-full uppercase py-1 px-3">
          <Shield size={10} className="mr-1" /> {role}
        </Badge>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {navItems
          .filter(item => hasRole(item.roles))
          .map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeSheet}
              className={cn(
                "flex items-center p-3 rounded-xl transition-all font-medium",
                location.pathname === item.to ? "bg-sidebar-primary text-white shadow-lg" : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
      </nav>

      <Button onClick={signOut} variant="secondary" className="w-full rounded-xl bg-slate-700 text-white h-11">
        <LogOut size={18} className="mr-2" /> Déconnexion
      </Button>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild><Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 bg-white rounded-full shadow-lg"><Menu size={24} /></Button></SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-none"><SidebarContent closeSheet={() => setIsOpen(false)} /></SheetContent>
      </Sheet>
    );
  }
  return <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground shadow-2xl hidden md:block"><SidebarContent /></aside>;
};

export default Sidebar;