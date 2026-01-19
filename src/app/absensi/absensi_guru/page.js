"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import DashboardLayout from "@/app/components/DashboardLayout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AbsensiGuru() {
  const [activeTab, setActiveTab] = useState("absensi"); 
  const [guru, setGuru] = useState([]);
  const [loadingGuru, setLoadingGuru] = useState(true);
  
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  
  // State untuk menyimpan data absensi per guru
  const [absensiData, setAbsensiData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // State untuk rekap absensi
  const [rekapTanggal, setRekapTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [rekapData, setRekapData] = useState([]);
  const [loadingRekap, setLoadingRekap] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // 🔥 FETCH DATA GURU DARI SUPABASE
  const fetchGuru = useCallback(async () => {
    setLoadingGuru(true);
    const { data, error } = await supabase
      .from("guru")
      .select("id, nama, nip")
      .order("nama", { ascending: true });

    if (!error) setGuru(data);
    setLoadingGuru(false);
  }, [supabase]);

  useEffect(() => {
    fetchGuru();
  }, [fetchGuru]);

  // 🔥 FETCH DATA REKAP ABSENSI BERDASARKAN TANGGAL
  const fetchRekap = async () => {
    if (!rekapTanggal) {
      alert("Silakan pilih tanggal!");
      return;
    }
    
    setLoadingRekap(true);
    try {
      const { data, error } = await supabase
        .from("absensi_guru")
        .select("id, guru_id, tanggal, status")
        .eq("tanggal", rekapTanggal);

      if (error) {
        console.error("Error fetching rekap:", error);
        setRekapData([]);
      } else {
        // Map dengan nama guru
        const rekapArray = (data || []).map((item) => {
          const guruData = guru.find((g) => String(g.id) === String(item.guru_id));
          return {
            ...item,
            guru_nama: guruData?.nama || "-",
            guru_nip: guruData?.nip || "-",
          };
        });

        setRekapData(rekapArray);
      }
    } catch (err) {
      console.error("Error:", err);
      setRekapData([]);
    } finally {
      setLoadingRekap(false);
    }
  };

  // 🔄 Handle perubahan status absensi
  const handleAbsensiChange = (guruId, status) => {
    setAbsensiData((prev) => ({
      ...prev,
      [guruId]: status,
    }));
  };

  // 💾 Simpan absensi ke Supabase
  const handleSimpanAbsensi = async () => {
    // Validasi
    if (!tanggal) {
      alert("Silakan pilih tanggal!");
      return;
    }
    
    // Cek apakah semua guru sudah diisi absensinya
    const guruIds = guru.map((g) => g.id);
    const guruBelumDiisi = guruIds.filter((id) => !absensiData[id]);
    
    if (guruBelumDiisi.length > 0) {
      alert(`Masih ada ${guruBelumDiisi.length} guru yang belum diisi absensinya. Harap isi semua absensi!`);
      return;
    }

    setSaving(true);

    try {
      // Buat array data absensi untuk di-insert
      const dataToInsert = guruIds.map((guruId) => ({
        guru_id: guruId,
        tanggal: tanggal,
        status: absensiData[guruId],
      }));

      const { error } = await supabase
        .from("absensi_guru")
        .insert(dataToInsert);

      if (error) {
        console.error("Error menyimpan absensi:", error);
        alert("Gagal menyimpan absensi: " + error.message);
      } else {
        alert("Absensi guru berhasil disimpan!");
        // Reset form
        setAbsensiData({});
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Terjadi kesalahan saat menyimpan absensi.");
    } finally {
      setSaving(false);
    }
  };

  // ===========================
  //         RENDER PAGE
  // ===========================
  const renderContent = () => {
    // ===========================
    //         ABSENSI GURU
    // ===========================
    if (activeTab === "absensi") {
      return (
        <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 w-full max-w-3xl">
          <h1 className="text-lg sm:text-xl font-semibold text-teal-800 mb-3 sm:mb-4">Absensi Guru</h1>

          {/* Input tanggal */}
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="border p-2 rounded mb-3 w-full sm:w-40 text-sm"
          />

          {loadingGuru ? (
            <p className="text-center py-4">Memuat data guru...</p>
          ) : guru.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Belum ada data guru.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full border text-xs sm:text-sm min-w-[500px]">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="p-1.5 sm:p-2 border">No</th>
                    <th className="p-1.5 sm:p-2 border text-left">Nama Guru</th>
                    <th className="p-1.5 sm:p-2 border text-left hidden sm:table-cell">NIP</th>
                    <th className="p-1.5 sm:p-2 border">Hadir</th>
                    <th className="p-1.5 sm:p-2 border">Izin</th>
                    <th className="p-1.5 sm:p-2 border">Sakit</th>
                    <th className="p-1.5 sm:p-2 border">Alpha</th>
                  </tr>
                </thead>
                <tbody>
                  {guru.map((g, index) => (
                    <tr key={g.id} className="border-b hover:bg-gray-50">
                      <td className="p-1.5 sm:p-2 border text-center">{index + 1}</td>
                      <td className="p-1.5 sm:p-2 border">{g.nama}</td>
                      <td className="p-1.5 sm:p-2 border hidden sm:table-cell">{g.nip || "-"}</td>
                      {["hadir", "izin", "sakit", "alpha"].map((status) => (
                        <td key={status} className="p-1.5 sm:p-2 border text-center">
                          <input
                            type="radio"
                            name={`absensi-${g.id}`}
                            checked={absensiData[g.id] === status}
                            onChange={() => handleAbsensiChange(g.id, status)}
                            className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tombol Simpan */}
          <button
            onClick={handleSimpanAbsensi}
            disabled={saving}
            className={`mt-4 px-4 sm:px-6 py-2 rounded text-white text-sm sm:text-base w-full sm:w-auto ${
              saving ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {saving ? "Menyimpan..." : "Simpan Absensi"}
          </button>
        </div>
      );
    }

    // ===========================
    //         REKAP ABSENSI
    // ===========================
    if (activeTab === "rekap") {
      return (
        <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 w-full max-w-4xl">
          <h1 className="text-lg sm:text-xl font-semibold text-teal-800 mb-3 sm:mb-4">Rekap Absensi Guru</h1>

          {/* Input tanggal rekap */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 items-stretch sm:items-center">
            <input
              type="date"
              value={rekapTanggal}
              onChange={(e) => setRekapTanggal(e.target.value)}
              className="border p-2 rounded w-full sm:w-40 text-sm"
            />
            <button
              onClick={fetchRekap}
              disabled={loadingRekap}
              className={`px-4 py-2 rounded text-white text-sm ${
                loadingRekap ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {loadingRekap ? "Memuat..." : "Tampilkan Rekap"}
            </button>
          </div>

          {loadingRekap ? (
            <p className="text-center py-4">Memuat data rekap...</p>
          ) : rekapData.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">
              Belum ada data absensi untuk tanggal ini.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full border text-xs sm:text-sm">
                  <thead className="bg-teal-700 text-white">
                    <tr>
                      <th className="p-1.5 sm:p-2 border">No</th>
                      <th className="p-1.5 sm:p-2 border text-left">Nama Guru</th>
                      <th className="p-1.5 sm:p-2 border text-left hidden sm:table-cell">NIP</th>
                      <th className="p-1.5 sm:p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapData.map((r, index) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="p-1.5 sm:p-2 border text-center">{index + 1}</td>
                        <td className="p-1.5 sm:p-2 border">{r.guru_nama}</td>
                        <td className="p-1.5 sm:p-2 border hidden sm:table-cell">{r.guru_nip}</td>
                        <td className="p-1.5 sm:p-2 border text-center">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-semibold ${
                            r.status === "hadir" ? "bg-green-100 text-green-700" :
                            r.status === "izin" ? "bg-blue-100 text-blue-700" :
                            r.status === "sakit" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Tombol Export PDF */}
              <button
                onClick={() => {
                  const doc = new jsPDF();
                  
                  // Header
                  doc.setFontSize(16);
                  doc.text("Rekap Absensi Guru", 14, 20);
                  doc.setFontSize(11);
                  doc.text(`Tanggal: ${rekapTanggal}`, 14, 28);
                  
                  // Table
                  const tableData = rekapData.map((r, index) => [
                    index + 1,
                    r.guru_nama,
                    r.guru_nip,
                    r.status.charAt(0).toUpperCase() + r.status.slice(1),
                  ]);
                  
                  autoTable(doc, {
                    startY: 35,
                    head: [["No", "Nama Guru", "NIP", "Status"]],
                    body: tableData,
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [13, 148, 136] },
                  });
                  
                  doc.save(`rekap-absensi-guru-${rekapTanggal}.pdf`);
                }}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </>
          )}
        </div>
      );
    }
  };

  return (
    <DashboardLayout>
      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => setActiveTab("absensi")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base ${
            activeTab === "absensi"
              ? "bg-teal-700 text-white"
              : "bg-white text-teal-700 border border-teal-700"
          }`}
        >
          Input Absensi
        </button>
        <button
          onClick={() => setActiveTab("rekap")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base ${
            activeTab === "rekap"
              ? "bg-teal-700 text-white"
              : "bg-white text-teal-700 border border-teal-700"
          }`}
        >
          Rekap Absensi
        </button>
      </div>

      {/* Content */}
      {renderContent()}
    </DashboardLayout>
  );
}
