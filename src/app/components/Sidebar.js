"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Users,
  ClipboardList,
  DollarSign,
  FileText,
  LogOut,
  Home,
  UserPlus,
  BookOpen,
  Book,
  Menu,
  X,
  Building,
} from "lucide-react";
import Link from "next/link";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Absensi", href: "/absensi", icon: Users },
    { name: "Pelanggaran", href: "/pelanggaran", icon: FileText },
    { name: "Keuangan", href: "/keuangan", icon: DollarSign },
    { name: "Laporan", href: "/laporan", icon: ClipboardList },
    { name: "Data Siswa", href: "/siswa", icon: UserPlus },
    { name: "Data Guru", href: "/guru", icon: BookOpen },
    { name: "Mata Pelajaran", href: "/mapel", icon: Book },
    { name: "Kelas", href: "/kelas", icon: Building },
  ];

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-teal-700 text-white p-4 sm:p-6 
        flex flex-col justify-between shadow-lg min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-1 hover:bg-teal-600 rounded"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-base sm:text-lg font-bold mb-6 text-center pr-8 lg:pr-0">
            Sistem Informasi <br /> MA Unggulan Al-Anwari
          </h2>

          <nav className="space-y-2 sm:space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex w-full items-center gap-2 px-2 py-2 sm:py-2.5 rounded text-sm sm:text-base transition-colors ${
                    isActive(item.href) ? "bg-teal-600" : "hover:bg-teal-600"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" /> 
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tombol Logout */}
        <button
          onClick={handleLogout}
          className="mt-8 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base transition-colors"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>
    </>
  );
}
