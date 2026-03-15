import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wrench, Factory, Menu, CalendarDays, ShieldCheck, Users, ClipboardList, Box, Building2, FlaskConical, LogOut, Hammer, Shield, FileText, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "./ui/badge";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, isMobile, onClick }) => {
  const baseClasses = "flex items-center p-3 rounded-xl transition-all duration-200 font-medium";
  const activeClasses = "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg";
  const inactiveClasses = "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        baseClasses,
        isActive ? activeClasses : inactiveClasses,
        isMobile ? "w-full justify-start" : "w-full",
      )}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </Link>
  );
};

const SidebarContent: React.FC<{ closeSheet?: () => void }> = ({ closeSheet }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, role, signOut, hasRole } = useAuth();

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Tableau de bord", roles: ['any'] },
    { to: "/work-orders", icon: <ClipboardList size={20} />, label: "Ordres de Travail", roles: ['any'] },
    { to: "/interventions", icon: <Wrench size={20} />, label: "Interventions", roles: ['any'] },
    { to: "/assets", icon: <Factory size={20} />, label: "Parc Équipements", roles: ['any'] },
    { to: "/planning", icon: <CalendarDays size={20} />, label: "Planification", roles: ['any'] },
    { to: "/documentation", icon: <Library size={20} />, label: "Documentation", roles: ['any'] },
    { to: "/clients", icon: <Building2 size={20} />, label: "Clients & Sites", roles: ['any'] },
    { to: "/inventory", icon: <Box size={20} />, label: "Pièces de Rechange", roles: ['any'] },
    { to: "/reagents", icon: <FlaskConical size={20} />, label: "Réactifs Labo", roles: ['any'] },
    { to: "/tools", icon: <Hammer size={20} />, label: "Outillage Technique", roles: ['any'] },
    { to: "/contracts", icon: <ShieldCheck size={20} />, label: "Contrats Maintenance", roles: ['any'] },
    { to: "/technicians", icon: <Users size={20} />, label: "Équipe Technique", roles: ['any'] },
    { to: "/reports", icon: <FileText size={20} />, label: "Rapports & Audits", roles: ['any'] },
  ];
  
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex flex-col items-center mb-6">
        <div className="text-2xl font-black text-sidebar-primary-foreground">GMAO Dyad</div>
        {user && (
          <Badge className="mt-2 bg-sidebar-accent text-[10px] rounded-full uppercase tracking-tighter">
            <Shield size={10} className="mr-1" /> {role || 'Utilisateur'}
          </Badge>
        )}
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {navItems
          .filter(item => item.roles.includes('any') || hasRole(item.roles as any))
          .map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.to}
              isMobile={isMobile}
              onClick={closeSheet}
            />
          ))}
      </nav>

      <div className="pt-4 border-t border-sidebar-border space-y-2">
        <Button 
          onClick={signOut} 
          variant="secondary" 
          className="w-full rounded-xl bg-slate-700 hover:bg-slate-800 text-white border-none h-11"
        >
          <LogOut size={18} className="mr-2" /> Déconnexion
        </Button>
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm border border-border rounded-full shadow-lg"
          >
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-none">
          <SidebarContent closeSheet={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground shadow-2xl hidden md:block">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;