import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Phone, Heart } from "lucide-react";

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Barre latérale de navigation */}
      <Sidebar />

      {/* Zone de contenu principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 custom-scrollbar flex flex-col justify-between">
        <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500 flex-1">
          <Outlet />
        </div>
        
        {/* Bas de page professionnel */}
        <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-medium">
              © {new Date().getFullYear()} <span className="font-bold text-blue-600">BioPulse</span>. Tous droits réservés.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
              <p className="flex items-center gap-1">
                Développé avec <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" /> par <span className="font-bold text-slate-800 dark:text-slate-200">TEDJE ANGE LETICIA</span>
              </p>
              <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                <Phone size={12} className="text-blue-600" />
                <span>01 52 52 28 31 / 07 19 69 94 10</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default MainLayout;