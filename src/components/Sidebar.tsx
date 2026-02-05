import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wrench, Factory, Menu, CalendarDays, ShieldCheck, Users, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Tableau de bord" },
    { to: "/work-orders", icon: <Wrench size={20} />, label: "Ordres de Travail" },
    { to: "/assets", icon: <Factory size={20} />, label: "Équipements" },
    { to: "/planning", icon: <CalendarDays size={20} />, label: "Planification" },
    { to: "/contracts", icon: <ShieldCheck size={20} />, label: "Contrats" },
    { to: "/technicians", icon: <Users size={20} />, label: "Techniciens" },
    { to: "/reports", icon: <ClipboardList size={20} />, label: "Rapports" },
  ];

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="text-2xl font-extrabold text-sidebar-primary-foreground mb-6 text-center">
        GMAO Dyad
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
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
      <div className="pt-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/70 text-center">
          Version 1.2
        </p>
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
        <SheetContent side="left" className="p-0 w-64 bg-sidebar">
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