import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wrench, Factory, Menu, CalendarDays, ShieldCheck, Users, ClipboardList, Box, Building2, FlaskConical, LogOut, Hammer, Shield } from "lucide-react";
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
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Tableau de bord", roles: ['admin', 'technician', 'secretary', 'user', 'stock_manager'] },
    { to: "/work-orders", icon: <ClipboardList size={20} />, label: "Ordres de Travail", roles: ['admin', 'technician', 'secretary'] },
    { to: "/interventions", icon: <Wrench size={20} />, label: "Interventions", roles: ['admin', 'technician'] },
    { to: "/assets", icon: <Factory size={20} />, label: "Équipements", roles: ['admin', 'technician', 'secretary'] },
    { to: "/planning", icon: <CalendarDays size={20} />, label: "Planification", roles: ['admin', 'technician', 'secretary'] },
    { to: "/clients", icon: <Building2 size={20} />, label: "Clients & CRM", roles: ['admin', 'secretary'] },
    { to: "/inventory", icon: <Box size={20} />, label: "Pièces de Rechange", roles: ['admin', 'stock_manager', 'technician'] },
    { to: "/reagents", icon: <FlaskConical size={20} />, label: "Réactifs Labo", roles: ['admin', 'stock_manager'] },
    { to: "/tools", icon: <Hammer size={20} />, label: "Outils de Travail", roles: ['admin', 'technician', 'stock_manager'] },
    { to: "/contracts", icon: <ShieldCheck size={20} />, label: "Contrats", roles: ['admin', 'secretary'] },
    { to: "/technicians", icon: <Users size={20} />, label: "Techniciens", roles: ['admin'] },
    { to: "/reports", icon: <FileText size={20} />, label: "Rapports", roles: ['admin', 'secretary', 'technician'] },
  ];
  
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex flex-col items-center mb-6">
        <div className="text-2xl font-black text-sidebar-primary-foreground">GMAO Dyad</div>
        {user && (
          <Badge className="mt-2 bg-sidebar-accent text-[10px] rounded-full uppercase tracking-tighter">
            <Shield size={10} className="mr-1" /> {role}
          </Badge>
        )}
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {navItems
          .filter(item => hasRole(item.roles as any))
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
        {user && (
          <div className="px-2 mb-2">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-bold">Session active</p>
            <p className="text-xs text-sidebar-foreground font-medium truncate" title={user.email || ''}>
              {user.email}
            </p>
          </div>
        )}
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

const FileText = ({ size }: { size: number }) => <ClipboardList size={size} />;

export default Sidebar;