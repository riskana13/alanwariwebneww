"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-teal-700 text-white px-4 py-3 flex items-center gap-3 shadow-md">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1 hover:bg-teal-600 rounded"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-sm truncate">MA Unggulan Al-Anwari</h1>
        </div>
        
        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
