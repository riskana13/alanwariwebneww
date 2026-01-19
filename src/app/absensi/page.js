"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";

export default function Absensi() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <DashboardLayout>
      <h1 className="text-xl sm:text-2xl font-bold text-teal-800 mb-4 sm:mb-6">Absensi</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Link href={"/absensi/absensi_siswa"}>
          <div className="bg-white shadow-md rounded-xl p-6 sm:p-10 text-center text-teal-700 font-semibold cursor-pointer hover:scale-105 transition text-sm sm:text-base">
            Absensi Siswa
          </div>
        </Link>
        <Link href={"/absensi/absensi_guru"}>
          <div className="bg-white shadow-md rounded-xl p-6 sm:p-10 text-center text-teal-700 font-semibold cursor-pointer hover:scale-105 transition text-sm sm:text-base">
            Absensi Guru
          </div>
        </Link>
      </div>
    </DashboardLayout>
  );
}
