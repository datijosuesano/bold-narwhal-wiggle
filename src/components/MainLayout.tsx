import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { MadeWithDyad } from "./made-with-dyad";

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
        <div className="mt-8">
          <MadeWithDyad />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;