"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User, Users, Book, GraduationCap } from "lucide-react";
import DashboardLayout from "@/app/components/DashboardLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalMapel, setTotalMapel] = useState(0);
  const [siswaHadir, setSiswaHadir] = useState(0);
  const [guruHadir, setGuruHadir] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Data untuk grafik
  const [absensiSiswaChart, setAbsensiSiswaChart] = useState([]);
  const [absensiGuruChart, setAbsensiGuruChart] = useState([]);
  
  const supabase = createClient();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  // Warna untuk pie chart
  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch total siswa
        const { data: siswaData, error: siswaError } = await supabase
          .from("siswa")
          .select("id", { count: "exact" });
        if (!siswaError) setTotalSiswa(siswaData?.length || 0);

        // Fetch total guru
        const { data: guruData, error: guruError } = await supabase
          .from("guru")
          .select("id", { count: "exact" });
        if (!guruError) setTotalGuru(guruData?.length || 0);

        // Fetch total mata pelajaran
        const { data: mapelData, error: mapelError } = await supabase
          .from("mata_pelajaran")
          .select("id", { count: "exact" });
        if (!mapelError) setTotalMapel(mapelData?.length || 0);

        // Fetch absensi siswa hari ini untuk statistik
        const { data: absensiSiswaData, error: absensiSiswaError } = await supabase
          .from("absensi_siswa")
          .select("status")
          .eq("tanggal", today);
        
        if (!absensiSiswaError && absensiSiswaData) {
          const hadirCount = absensiSiswaData.filter(a => a.status === "hadir").length;
          setSiswaHadir(hadirCount);
          
          // Hitung statistik per status untuk chart
          const statusCount = {
            hadir: absensiSiswaData.filter(a => a.status === "hadir").length,
            izin: absensiSiswaData.filter(a => a.status === "izin").length,
            sakit: absensiSiswaData.filter(a => a.status === "sakit").length,
            alpha: absensiSiswaData.filter(a => a.status === "alpha").length,
          };
          
          setAbsensiSiswaChart([
            { name: "Hadir", value: statusCount.hadir },
            { name: "Izin", value: statusCount.izin },
            { name: "Sakit", value: statusCount.sakit },
            { name: "Alpha", value: statusCount.alpha },
          ]);
        }

        // Fetch absensi guru hari ini untuk statistik
        const { data: absensiGuruData, error: absensiGuruError } = await supabase
          .from("absensi_guru")
          .select("status")
          .eq("tanggal", today);
        
        if (!absensiGuruError && absensiGuruData) {
          const hadirCount = absensiGuruData.filter(a => a.status === "hadir").length;
          setGuruHadir(hadirCount);
          
          // Hitung statistik per status untuk chart
          const statusCount = {
            hadir: absensiGuruData.filter(a => a.status === "hadir").length,
            izin: absensiGuruData.filter(a => a.status === "izin").length,
            sakit: absensiGuruData.filter(a => a.status === "sakit").length,
            alpha: absensiGuruData.filter(a => a.status === "alpha").length,
          };
          
          setAbsensiGuruChart([
            { name: "Hadir", value: statusCount.hadir },
            { name: "Izin", value: statusCount.izin },
            { name: "Sakit", value: statusCount.sakit },
            { name: "Alpha", value: statusCount.alpha },
          ]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Data gabungan untuk bar chart
  const barChartData = [
    {
      name: "Hadir",
      Siswa: absensiSiswaChart.find(d => d.name === "Hadir")?.value || 0,
      Guru: absensiGuruChart.find(d => d.name === "Hadir")?.value || 0,
    },
    {
      name: "Izin",
      Siswa: absensiSiswaChart.find(d => d.name === "Izin")?.value || 0,
      Guru: absensiGuruChart.find(d => d.name === "Izin")?.value || 0,
    },
    {
      name: "Sakit",
      Siswa: absensiSiswaChart.find(d => d.name === "Sakit")?.value || 0,
      Guru: absensiGuruChart.find(d => d.name === "Sakit")?.value || 0,
    },
    {
      name: "Alpha",
      Siswa: absensiSiswaChart.find(d => d.name === "Alpha")?.value || 0,
      Guru: absensiGuruChart.find(d => d.name === "Alpha")?.value || 0,
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-4 sm:mb-6">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <p className="text-lg">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* Statistik Cards - Total Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-100 flex items-center gap-3 sm:gap-4">
              <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-500 text-sm sm:text-base">Total Siswa</p>
                <h2 className="text-xl sm:text-2xl font-bold text-teal-800 truncate">{totalSiswa} Orang</h2>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-100 flex items-center gap-3 sm:gap-4">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-500 text-sm sm:text-base">Total Guru</p>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800 truncate">{totalGuru} Orang</h2>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-100 flex items-center gap-3 sm:gap-4 sm:col-span-2 lg:col-span-1">
              <Book className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-500 text-sm sm:text-base">Total Mata Pelajaran</p>
                <h2 className="text-xl sm:text-2xl font-bold text-purple-800 truncate">{totalMapel} Mapel</h2>
              </div>
            </div>
          </div>

          {/* Statistik Cards - Kehadiran Hari Ini */}
          <h2 className="text-lg sm:text-xl font-semibold text-teal-700 mb-3 sm:mb-4">Kehadiran Hari Ini ({today})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-100 flex items-center gap-3 sm:gap-4">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-500 text-sm sm:text-base">Siswa Hadir</p>
                <h2 className="text-xl sm:text-2xl font-bold text-green-800 truncate">{siswaHadir} Orang</h2>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-100 flex items-center gap-3 sm:gap-4">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-500 text-sm sm:text-base">Guru Hadir</p>
                <h2 className="text-2xl font-bold text-green-800">{guruHadir} Orang</h2>
              </div>
            </div>
          </div>

          {/* Grafik */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {/* Bar Chart - Perbandingan Absensi */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border">
              <h3 className="text-base sm:text-lg font-semibold text-teal-800 mb-3 sm:mb-4">Grafik Absensi Hari Ini</h3>
              {barChartData.some(d => d.Siswa > 0 || d.Guru > 0) ? (
                <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Bar dataKey="Siswa" fill="#14B8A6" />
                    <Bar dataKey="Guru" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-gray-400 text-sm">
                  Belum ada data absensi hari ini
                </div>
              )}
            </div>

            {/* Pie Chart - Absensi Siswa */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border">
              <h3 className="text-base sm:text-lg font-semibold text-teal-800 mb-3 sm:mb-4">Distribusi Absensi Siswa</h3>
              {absensiSiswaChart.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <PieChart>
                    <Pie
                      data={absensiSiswaChart}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {absensiSiswaChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} orang`, name]} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{fontSize: '12px'}}
                      formatter={(value, entry) => {
                        const item = absensiSiswaChart.find(d => d.name === value);
                        return `${value}: ${item?.value || 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-400 text-sm">
                  Belum ada data absensi siswa hari ini
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
