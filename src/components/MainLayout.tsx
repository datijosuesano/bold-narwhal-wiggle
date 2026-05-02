import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Barre latérale de navigation */}
      <Sidebar />

      {/* Zone de contenu principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;