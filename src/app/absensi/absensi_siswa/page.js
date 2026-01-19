"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import DashboardLayout from "@/app/components/DashboardLayout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Absensi() {
  const [activeTab, setActiveTab] = useState("absensi"); 
  const [siswa, setSiswa] = useState([]);
  const [loadingSiswa, setLoadingSiswa] = useState(true);
  
  // State untuk guru dan mapel
  const [guru, setGuru] = useState([]);
  const [mapel, setMapel] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [selectedMapel, setSelectedMapel] = useState("");
  const [selectedGuru, setSelectedGuru] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  
  // State untuk rekap per kelas
  const [rekapKelas, setRekapKelas] = useState("");
  
  // State untuk menyimpan data absensi per siswa
  const [absensiData, setAbsensiData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // State untuk rekap absensi
  const [rekapTanggal, setRekapTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [rekapData, setRekapData] = useState([]);
  const [loadingRekap, setLoadingRekap] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // 🔥 FETCH DATA SISWA DARI SUPABASE (sorted by kelas)
  const fetchSiswa = useCallback(async () => {
    setLoadingSiswa(true);
    const { data, error } = await supabase
      .from("siswa")
      .select("id, nama, kelas_id")
      .order("kelas_id", { ascending: true })
      .order("nama", { ascending: true });

    if (!error) setSiswa(data);
    setLoadingSiswa(false);
  }, [supabase]);

  // 🔥 FETCH DATA GURU DARI SUPABASE
  const fetchGuru = useCallback(async () => {
    const { data, error } = await supabase
      .from("guru")
      .select("id, nama")
      .order("nama", { ascending: true });  

    if (!error) setGuru(data);
  }, [supabase]);

  // 🔥 FETCH DATA MATA PELAJARAN DARI SUPABASE
  const fetchMapel = useCallback(async () => {
    const { data, error } = await supabase
      .from("mata_pelajaran")
      .select("id, nama, guru_id, kelas_id")
      .order("nama", { ascending: true });

    if (!error) setMapel(data);
  }, [supabase]);

  // 🔥 FETCH DATA KELAS DARI SUPABASE
  const fetchKelas = useCallback(async () => {
    const { data, error } = await supabase
      .from("kelas")
      .select("id, kelas_id, kelas")
      .order("kelas_id", { ascending: true });

    if (!error) setKelas(data);
  }, [supabase]);

  useEffect(() => {
    fetchSiswa();
    fetchGuru();
    fetchMapel();
    fetchKelas();
  }, [fetchSiswa, fetchGuru, fetchMapel, fetchKelas]);

  // 🔥 FETCH DATA REKAP ABSENSI BERDASARKAN TANGGAL DAN KELAS
  const fetchRekap = async () => {
    if (!rekapTanggal) {
      alert("Silakan pilih tanggal!");
      return;
    }
    if (!rekapKelas) {
      alert("Silakan pilih kelas!");
      return;
    }
    
    setLoadingRekap(true);
    try {
      // Dapatkan siswa di kelas yang dipilih
      const siswaKelas = siswa.filter((s) => String(s.kelas_id) === String(rekapKelas));
      const siswaIds = siswaKelas.map((s) => s.id);
      
      if (siswaIds.length === 0) {
        setRekapData([]);
        setLoadingRekap(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("absensi_siswa")
        .select("id, siswa_id, guru_id, tanggal, status")
        .eq("tanggal", rekapTanggal)
        .in("siswa_id", siswaIds);

      if (error) {
        console.error("Error fetching rekap:", error);
        setRekapData([]);
      } else {
        // Map data dengan nama siswa
        const rekapArray = (data || []).map((item) => {
          const siswaData = siswa.find((s) => String(s.id) === String(item.siswa_id));
          const kelasData = kelas.find((k) => String(k.kelas_id) === String(siswaData?.kelas_id));
          return {
            ...item,
            siswa_nama: siswaData?.nama || "-",
            kelas_nama: kelasData?.kelas || "-",
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

  // 🔄 Auto-fill guru saat mapel dipilih
  const handleMapelChange = (mapelId) => {
    setSelectedMapel(mapelId);
    const selectedMapelData = mapel.find((m) => String(m.id) === String(mapelId));
    if (selectedMapelData && selectedMapelData.guru_id) {
      setSelectedGuru(selectedMapelData.guru_id);
    } else {
      setSelectedGuru("");
    }
  };

  // 🔄 Reset mapel & guru saat kelas berubah
  const handleKelasChange = (kelasId) => {
    setSelectedKelas(kelasId);
    setSelectedMapel("");
    setSelectedGuru("");
  };

  // Cari id dari kelas yang dipilih berdasarkan kelas_id (nomor kelas)
  const selectedKelasData = kelas.find((k) => String(k.kelas_id) === String(selectedKelas));
  const selectedKelasDbId = selectedKelasData?.id; // id di database

  // Filter mapel berdasarkan kelas yang dipilih (gunakan id kelas, bukan kelas_id)
  const filteredMapel = selectedKelas
    ? mapel.filter((m) => String(m.kelas_id) === String(selectedKelasDbId))
    : mapel;

  // Filter siswa berdasarkan kelas yang dipilih dan tambahkan kelas_nama
  const filteredSiswa = (selectedKelas
    ? siswa.filter((s) => String(s.kelas_id) === String(selectedKelas))
    : siswa
  ).map((s) => {
    const kelasData = kelas.find((k) => String(k.kelas_id) === String(s.kelas_id));
    return {
      ...s,
      kelas_nama: kelasData ? kelasData.kelas : String(s.kelas_id)
    };
  });

  // 🔄 Handle perubahan status absensi
  const handleAbsensiChange = (siswaId, status) => {
    setAbsensiData((prev) => ({
      ...prev,
      [siswaId]: status,
    }));
  };

  // 💾 Simpan absensi ke Supabase
  const handleSimpanAbsensi = async () => {
    // Validasi
    if (!tanggal) {
      alert("Silakan pilih tanggal!");
      return;
    }
    if (!selectedMapel) {
      alert("Silakan pilih mata pelajaran!");
      return;
    }
    if (!selectedGuru) {
      alert("Silakan pilih guru!");
      return;
    }
    
    // Cek apakah semua siswa sudah diisi absensinya
    const siswaIds = filteredSiswa.map((s) => s.id);
    const siswaBelumDiisi = siswaIds.filter((id) => !absensiData[id]);
    
    if (siswaBelumDiisi.length > 0) {
      alert(`Masih ada ${siswaBelumDiisi.length} siswa yang belum diisi absensinya. Harap isi semua absensi!`);
      return;
    }

    setSaving(true);

    try {
      // Buat array data absensi untuk di-insert
      const dataToInsert = siswaIds.map((siswaId) => ({
        siswa_id: siswaId,
        guru_id: selectedGuru,
        tanggal: tanggal,
        status: absensiData[siswaId],
      }));

      const { error } = await supabase
        .from("absensi_siswa")
        .insert(dataToInsert);

      if (error) {
        console.error("Error menyimpan absensi:", error);
        alert("Gagal menyimpan absensi: " + error.message);
      } else {
        alert("Absensi berhasil disimpan!");
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
    //         ABSENSI SISWA
    // ===========================
    if (activeTab === "absensi") {
      return (
        <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 w-full max-w-3xl">
          <h1 className="text-lg sm:text-xl font-semibold text-teal-800 mb-3 sm:mb-4">Absensi Siswa</h1>

          {/* Input tanggal */}
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="border p-2 rounded mb-3 w-full sm:w-40 text-sm"
          />

          {/* Dropdown Kelas, Mapel & Guru */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            {/* Pilih Kelas */}
            <select 
              className="border p-2 rounded text-sm w-full sm:w-auto"
              value={selectedKelas}
              onChange={(e) => handleKelasChange(e.target.value)} 
            >
              <option value="">Semua Kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.kelas_id}>
                  {k.kelas}
                </option>
              ))}
            </select>

            {/* Pilih Mata Pelajaran (auto-fill guru) - filtered by kelas */}
            <select 
              className="border p-2 rounded text-sm w-full sm:w-auto"
              value={selectedMapel}
              onChange={(e) => handleMapelChange(e.target.value)}
            >
              <option value="">Pilih Mata Pelajaran</option>
              {filteredMapel.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama}
                </option>
              ))}
            </select>

            {/* Nama Guru (otomatis terisi) */}
            <select 
              className="border p-2 rounded bg-gray-100 text-sm w-full sm:w-auto"
              value={selectedGuru}
              onChange={(e) => setSelectedGuru(e.target.value)}
            >
              <option value="">Pilih Guru</option>
              {guru.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </div>

          {/* TABEL SISWA */}
          {loadingSiswa ? (
            <p className="text-center py-4">Memuat data siswa...</p>
          ) : filteredSiswa.length === 0 ? (
            <p className="text-center py-4 text-red-600 text-sm">Tidak ada data siswa ditemukan.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full border-collapse text-center text-xs sm:text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-1.5 sm:p-2">No</th>
                    <th className="border p-1.5 sm:p-2">Kelas</th>
                    <th className="border p-1.5 sm:p-2">Nama Santri</th>
                    <th className="border p-1.5 sm:p-2">Hadir</th>
                    <th className="border p-1.5 sm:p-2">Izin</th>
                    <th className="border p-1.5 sm:p-2">Sakit</th>
                    <th className="border p-1.5 sm:p-2">Alpha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSiswa.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border p-1.5 sm:p-2">{index + 1}</td>
                      <td className="border p-1.5 sm:p-2">{item.kelas_nama || "-"}</td>
                      <td className="border p-1.5 sm:p-2 text-left">{item.nama}</td>
                      <td className="border p-1.5 sm:p-2">
                        <input 
                          type="radio" 
                          name={`absensi-${item.id}`} 
                          value="hadir" 
                          checked={absensiData[item.id] === "hadir"}
                          onChange={() => handleAbsensiChange(item.id, "hadir")}
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                      </td>
                      <td className="border p-1.5 sm:p-2">
                        <input 
                          type="radio" 
                          name={`absensi-${item.id}`} 
                          value="izin" 
                          checked={absensiData[item.id] === "izin"}
                          onChange={() => handleAbsensiChange(item.id, "izin")}
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                      </td>
                      <td className="border p-1.5 sm:p-2">
                        <input 
                          type="radio" 
                          name={`absensi-${item.id}`} 
                          value="sakit" 
                          checked={absensiData[item.id] === "sakit"}
                          onChange={() => handleAbsensiChange(item.id, "sakit")}
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                      </td>
                      <td className="border p-1.5 sm:p-2">
                        <input 
                          type="radio" 
                          name={`absensi-${item.id}`} 
                          value="alpha" 
                          checked={absensiData[item.id] === "alpha"}
                          onChange={() => handleAbsensiChange(item.id, "alpha")}
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tombol Simpan */}
          <div className="flex justify-center">
            <button 
              onClick={handleSimpanAbsensi}
              disabled={saving}
              className="mt-4 bg-teal-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-teal-700 text-sm w-full sm:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      );
    }

    // ===========================
    //         REKAP ABSENSI
    // ===========================
    if (activeTab === "rekap") {
      const selectedKelasNama = kelas.find((k) => String(k.kelas_id) === String(rekapKelas))?.kelas || "";
      
      return (
        <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 w-full max-w-4xl">
          <h1 className="text-lg sm:text-xl font-semibold text-teal-800 mb-3 sm:mb-4">Rekap Absensi Siswa</h1>

          {/* Input tanggal, kelas dan tombol cari */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 items-stretch sm:items-center">
            <input
              type="date"
              value={rekapTanggal}
              onChange={(e) => setRekapTanggal(e.target.value)}
              className="border p-2 rounded w-full sm:w-40 text-sm"
            />
            <select 
              className="border p-2 rounded text-sm w-full sm:w-auto"
              value={rekapKelas}
              onChange={(e) => setRekapKelas(e.target.value)} 
            >
              <option value="">Pilih Kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.kelas_id}>
                  {k.kelas}
                </option>
              ))}
            </select>
            <button
              onClick={fetchRekap}
              disabled={loadingRekap}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm disabled:bg-gray-400"
            >
              {loadingRekap ? "Memuat..." : "Cari"}
            </button>
          </div>

          {/* Tabel Rekap */}
          {loadingRekap ? (
            <p className="text-center py-4">Memuat data rekap...</p>
          ) : rekapData.length === 0 ? (
            <p className="text-center py-4 text-gray-500 text-sm">Tidak ada data absensi pada tanggal dan kelas ini.</p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full border-collapse text-center text-xs sm:text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-1.5 sm:p-2">No</th>
                      <th className="border p-1.5 sm:p-2">Nama Siswa</th>
                      <th className="border p-1.5 sm:p-2">Kelas</th>
                      <th className="border p-1.5 sm:p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapData.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border p-1.5 sm:p-2">{index + 1}</td>
                        <td className="border p-1.5 sm:p-2 text-left">{item.siswa_nama}</td>
                        <td className="border p-1.5 sm:p-2">{item.kelas_nama}</td>
                        <td className="border p-1.5 sm:p-2">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-semibold ${
                            item.status === "hadir" ? "bg-green-100 text-green-700" :
                            item.status === "izin" ? "bg-blue-100 text-blue-700" :
                            item.status === "sakit" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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
                  doc.text("Rekap Absensi Siswa", 14, 20);
                  doc.setFontSize(11);
                  doc.text(`Tanggal: ${rekapTanggal}`, 14, 28);
                  doc.text(`Kelas: ${selectedKelasNama}`, 14, 35);
                  
                  // Table
                  const tableData = rekapData.map((item, index) => [
                    index + 1,
                    item.siswa_nama,
                    item.kelas_nama,
                    item.status.charAt(0).toUpperCase() + item.status.slice(1),
                  ]);
                  
                  autoTable(doc, {
                    startY: 42,
                    head: [["No", "Nama Siswa", "Kelas", "Status"]],
                    body: tableData,
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [13, 148, 136] },
                  });
                  
                  doc.save(`rekap-absensi-siswa-${selectedKelasNama}-${rekapTanggal}.pdf`);
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

    return null;
  };

  return (
    <DashboardLayout>
      {/* Tab buttons untuk Absensi dan Rekap */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => setActiveTab("absensi")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base ${
            activeTab === "absensi"
              ? "bg-teal-600 text-white"
              : "bg-white border text-gray-700 hover:bg-gray-100"
          }`}
        >
          Input Absensi
        </button>
        <button
          onClick={() => setActiveTab("rekap")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base ${
            activeTab === "rekap"
              ? "bg-teal-600 text-white"
              : "bg-white border text-gray-700 hover:bg-gray-100"
          }`}
        >
          Rekap Absensi
        </button>
      </div>

      {/* Content */}
      <div className="flex justify-center">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}
