"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import React from "react";
import DashboardLayout from "@/app/components/DashboardLayout";

const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);

export default function LaporanPage() {
  const router = useRouter();
  const supabase = createClient();

  const [laporan, setLaporan] = useState([]);
  const [pengeluaran, setPengeluaran] = useState([]);
  const [kelasData, setKelasData] = useState([]);
  const [siswaData, setSiswaData] = useState([]);
  const [pemasukanData, setPemasukanData] = useState([]);
  const [pelanggaranData, setPelanggaranData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("pelanggaran");

  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [searchKeuangan, setSearchKeuangan] = useState("");
  const [monthFilterKeuangan, setMonthFilterKeuangan] = useState("");
  const [yearFilterKeuangan, setYearFilterKeuangan] = useState("");
  const [jenisTagihanFilter, setJenisTagihanFilter] = useState("");

  const [expandedRows, setExpandedRows] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch laporan
      const { data: dataLaporan, error: errorLaporan } = await supabase.from("laporan").select("*");
      if (errorLaporan) throw new Error(errorLaporan.message);
      setLaporan(dataLaporan || []);

      // Fetch pengeluaran
      const { data: dataPengeluaran, error: errorPengeluaran } = await supabase.from("pengeluaran").select("*");
      if (errorPengeluaran) setPengeluaran([]);
      else setPengeluaran(dataPengeluaran || []);

      // Fetch kelas
      const { data: dataKelas, error: errorKelas } = await supabase.from("kelas").select("id, kelas_id, kelas, created_at").order("kelas_id", { ascending: true });
      if (errorKelas) throw new Error(errorKelas.message);
      setKelasData(dataKelas || []);

      const { data: dataPelanggaran, error: errorPelanggaran } = await supabase.from("pelanggaran").select("*");
      if (errorPelanggaran) throw new Error(errorPelanggaran.message);
      setPelanggaranData(dataPelanggaran || []);

      // Fetch pemasukan
      const { data: dataPemasukan, error: errorPemasukan } = await supabase.from("pemasukan").select("*").order("tanggal", { ascending: false });
      if (errorPemasukan) setPemasukanData([]);
      else setPemasukanData(dataPemasukan || []);

      // Fetch siswa
      const { data: dataSiswa, error: errorSiswa } = await supabase.from("siswa").select("id, nama, nis, kelas_id, created_at").order("nama", { ascending: true });
      if (errorSiswa) setSiswaData([]);
      else setSiswaData(dataSiswa || []);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getNamaKelas = (kelasIdFromLaporan, nisFromLaporan) => {
    // Prioritaskan data dari tabel siswa jika ada NIS
    if (nisFromLaporan) {
      const siswa = siswaData.find(s => String(s.nis) === String(nisFromLaporan));
      if (siswa && siswa.kelas_id) {
        // Cari nama kelas dari tabel kelas berdasarkan kelas_id
        const kelasObj = kelasData?.find(k => String(k.kelas_id) === String(siswa.kelas_id));
        return kelasObj ? kelasObj.kelas : String(siswa.kelas_id);
      }
    }

    // Fallback ke kelas_id dari laporan
    if (kelasIdFromLaporan) {
      const kelasObj = kelasData?.find(k => String(k.kelas_id) === String(kelasIdFromLaporan));
      return kelasObj ? kelasObj.kelas : String(kelasIdFromLaporan);
    }
    
    return "-";
  };

  // Hapus mapping kompleks, gunakan data langsung
  const kelasOptions = useMemo(() => {
    // Ambil kelas unik dari kombinasi laporan + siswa
    const kelasSet = new Set();
    
    laporan.forEach(item => {
      const kelas = getNamaKelas(item.kelas_id, item.nis);
      if (kelas && kelas !== "-") {
        kelasSet.add(kelas);
      }
    });
    
    // Convert ke array dan urutkan
    return Array.from(kelasSet)
      .sort()
      .map(kelas => ({ id: kelas, nama: kelas }));
  }, [laporan, siswaData]);

  // HANYA SATU visibleLaporan - gunakan versi yang sederhana
  const visibleLaporan = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    const kelasQ = (kelasFilter || "").trim();
    const monthQ = (monthFilter || "").trim();
    const yearQ = (yearFilter || "").trim();

    return laporan.filter(r => {
      const nama = String(r?.nama ?? "").toLowerCase();
      const nis = String(r?.nis ?? "").toLowerCase();
      const tgl = String(r?.tgl_pelanggaran ?? "");
      
      // Dapatkan nama kelas yang konsisten
      const namaKelas = getNamaKelas(r.kelas_id, r.nis);
      
      const matchSearch = !q || 
        nama.includes(q) || 
        nis.includes(q) || 
        namaKelas.includes(q);

      // Filter kelas - bandingkan langsung dengan namaKelas
      const matchKelas = !kelasQ || namaKelas === kelasQ;

      const matchMonth = !monthQ || (tgl && tgl.slice(0,7) === monthQ);
      const matchYear = !yearQ || (tgl && tgl.slice(0,4) === yearQ);

      return matchSearch && matchKelas && matchMonth && matchYear;
    });
  }, [laporan, search, kelasFilter, monthFilter, yearFilter, siswaData]);

  // Debug: Tambahkan console log untuk troubleshooting
  useEffect(() => {
    console.log('Kelas Options:', kelasOptions);
    console.log('Kelas Filter:', kelasFilter);
    console.log('Visible Laporan count:', visibleLaporan.length);
    if (visibleLaporan.length > 0) {
      console.log('Sample data:', visibleLaporan.slice(0, 3).map(r => ({
        nama: r.nama,
        kelas_id: r.kelas_id,
        nis: r.nis,
        namaKelas: getNamaKelas(r.kelas_id, r.nis)
      })));
    }
  }, [kelasOptions, kelasFilter, visibleLaporan]);

  const jenisTagihanOptions = useMemo(() => {
    const jenisSet = new Set(pemasukanData.map(p => p.jenis_tagihan).filter(Boolean));
    return Array.from(jenisSet);
  }, [pemasukanData]);

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(laporan.map(l => l?.tgl_pelanggaran?.slice(0, 4)).filter(Boolean))).sort((a,b)=>b-a);
    return years.length > 0 ? years : [new Date().getFullYear().toString()];
  }, [laporan]);

  const yearOptionsKeuangan = useMemo(() => {
    const years = Array.from(new Set(pemasukanData.map(l => l?.bulan_pembayaran?.slice(0,4)).filter(Boolean))).sort((a,b)=>b-a);
    return years.length > 0 ? years : [new Date().getFullYear().toString()];
  }, [pemasukanData]);
  
  const visiblePemasukan = useMemo(() => {
    const q = (searchKeuangan || "").toLowerCase().trim();
    const monthQ = (monthFilterKeuangan || "").trim();
    const yearQ = (yearFilterKeuangan || "").trim();
    const jenisQ = (jenisTagihanFilter || "").trim();

    return pemasukanData.filter(r => {
      const nama = String(r?.siswa ?? "").toLowerCase();
      const bulan = String(r?.bulan_pembayaran ?? "");
      const tanggal = String(r?.tanggal ?? "");
      const jenis = String(r?.jenis_tagihan ?? "");

      return (!q || nama.includes(q)) &&
            (!monthQ || (bulan.includes(monthQ) || tanggal.includes(monthQ))) &&
            (!yearQ || (bulan.startsWith(yearQ) || tanggal.startsWith(yearQ))) &&
            (!jenisQ || jenis === jenisQ);
    });
  }, [pemasukanData, searchKeuangan, monthFilterKeuangan, yearFilterKeuangan, jenisTagihanFilter]);

  const visiblePengeluaran = useMemo(() => {
    const q = (searchKeuangan || "").toLowerCase().trim();
    const monthQ = (monthFilterKeuangan || "").trim();
    const yearQ = (yearFilterKeuangan || "").trim();

    return pengeluaran.filter(r => {
      const tanggal = String(r?.tanggal ?? "");
      const nama = String(r?.siswa ?? "").toLowerCase();
      return (!q || nama.includes(q)) && (!monthQ || tanggal.includes(monthQ)) && (!yearQ || tanggal.startsWith(yearQ));
    });
  }, [pengeluaran, searchKeuangan, monthFilterKeuangan, yearFilterKeuangan]);

  const exportExcel = (data, filename) => {
    const formattedData = data.map(item => ({ ...item, kelas: getNamaKelas(item.kelas_id, item.nis) }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, filename);
  };

  const exportPDF = async (columns, data, filename) => {
    const jsPDFModule = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDFModule.jsPDF();
    const formattedData = data.map(item => ({ ...item, kelas: getNamaKelas(item.kelas_id, item.nis) }));

    autoTable(doc, {
      head: [columns],
      body: formattedData.map(row => columns.map(col => row[col] ?? "")),
    });

    doc.save(filename);
  };

  const retryFetch = () => fetchData();

  const toggleRow = (nis) => {
    setExpandedRows(prev => 
      prev.includes(nis) ? prev.filter(n => n !== nis) : [...prev, nis]
    );
  };

  return (
    <DashboardLayout>
      <div className="overflow-x-auto">
        <h1 className="text-2xl font-bold text-teal-800 mb-6">Laporan Siswa</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <button onClick={retryFetch} className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Coba Lagi</button>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <button onClick={() => setActiveTab("pelanggaran")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === "pelanggaran" ? "bg-red-600 text-white" : "bg-white border text-gray-700"}`}>Pelanggaran</button>
          <button onClick={() => setActiveTab("keuangan")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === "keuangan" ? "bg-blue-600 text-white" : "bg-white border text-gray-700"}`}>Keuangan</button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8"><p className="text-lg">Memuat data...</p></div>
        ) : (
          <>
            {/* Tab Pelanggaran */}
            {activeTab === "pelanggaran" && (
              <>
                {/* Filter */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <input type="text" placeholder="Cari nama / NIS / kelas..." className="border px-3 py-2 rounded w-64" value={search} onChange={e => setSearch(e.target.value)} />
                  <select className="border px-3 py-2 rounded" value={kelasFilter} onChange={e => setKelasFilter(e.target.value)}>
                    <option value="">Semua Kelas</option>
                    {kelasOptions.map(k => (<option key={k.id} value={k.id}>{k.nama}</option>))}
                  </select>
                  
                </div>


                {/* Tabel Pelanggaran */}
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm">
                    <thead className="bg-red-600 text-white">
                      <tr>
                        <th className="border px-2 py-1">No</th>
                        <th className="border px-2 py-1">Siswa</th>
                        <th className="border px-2 py-1">NIS</th>
                        <th className="border px-2 py-1">Kelas</th>
                        <th className="border px-2 py-1">Total Pelanggaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLaporan.length > 0 ? visibleLaporan.map((r, i) => {
                        const isExpanded = expandedRows.includes(r.nis);
                        const totalPelanggaran = pelanggaranData.filter(p => p.siswa_id === r.siswa_id).length;

                        return (
                          <React.Fragment key={r.nis}>
                            <tr className="hover:bg-gray-100 cursor-pointer" onClick={() => toggleRow(r.nis)}>
                              <td className="border px-2 py-1">{i + 1}</td>
                              <td className="border px-2 py-1">
                                <button
                                  onClick={() => router.push(`/laporan/${r.nis}`)}
                                  className="text-blue-600 hover:underline"
                                >
                                  {r.nama}
                                </button>
                              </td>

                              <td className="border px-2 py-1">{r.nis}</td>
                              <td className="border px-2 py-1">{getNamaKelas(r.kelas_id, r.nis)}</td>
                              <td className="border px-2 py-1">{totalPelanggaran}</td>
                            </tr>
                            {isExpanded && pelanggaranData.filter(p => p.siswa_id === r.siswa_id).map((d, idx) => (
                          <tr key={`${d.id}-${idx}`} className="bg-gray-50">
                            <td colSpan={5} className="border px-2 py-1">
                              <strong>Tanggal:</strong> {d.tgl_pelanggaran} <br />
                              <strong>Jenis Pelanggaran:</strong> {d.jenis_pelanggaran}
                            </td>
                          </tr>
                        ))}

                          </React.Fragment>
                        );
                      }) : (
                        <tr>
                          <td colSpan={5} className="text-center py-4">Tidak ada data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Tab Keuangan */}
            {activeTab === "keuangan" && (
              <>
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <input type="text" placeholder="Cari nama siswa..." className="border px-3 py-2 rounded w-64" value={searchKeuangan} onChange={e => setSearchKeuangan(e.target.value)} />
                  <input type="month" className="border px-3 py-2 rounded" value={monthFilterKeuangan} onChange={e => setMonthFilterKeuangan(e.target.value)} />
                  <select className="border px-3 py-2 rounded" value={yearFilterKeuangan} onChange={e => setYearFilterKeuangan(e.target.value)}>
                    <option value="">Semua Tahun</option>
                    {yearOptionsKeuangan.map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                  <select 
                    className="border px-3 py-2 rounded" 
                    value={jenisTagihanFilter} 
                    onChange={e => setJenisTagihanFilter(e.target.value)}
                  >
                    <option value="">Semua Jenis Tagihan</option>
                    {jenisTagihanOptions.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>

                  <button onClick={() => { setSearchKeuangan(""); setMonthFilterKeuangan(""); setYearFilterKeuangan(""); setJenisTagihanFilter(""); }} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Reset</button>
                </div>

                <div className="flex gap-2 mb-4">
                  <button onClick={() => exportExcel(visiblePemasukan, "laporan_pemasukan.xlsx")} className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600">Export Excel Pemasukan</button>
                  <button onClick={() => exportExcel(visiblePengeluaran, "laporan_pengeluaran.xlsx")} className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">Export Excel Pengeluaran</button>
                  <button onClick={() => window.print()} className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Print</button>
                </div>

                <div className="overflow-x-auto">
                  <h2 className="text-lg font-semibold text-teal-800 mb-2">Pemasukan</h2>
                  <table className="w-full border text-sm mb-6">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="border px-2 py-1">No</th>
                        <th className="border px-2 py-1">Siswa</th>
                        <th className="border px-2 py-1">Jenis Tagihan</th>
                        <th className="border px-2 py-1">Bulan</th>
                        <th className="border px-2 py-1">Tanggal</th>
                        <th className="border px-2 py-1">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePemasukan.length > 0 ? visiblePemasukan.map((r, i) => (
                        <tr key={r.id} className="hover:bg-gray-100">
                          <td className="border px-2 py-1">{i + 1}</td>
                          <td className="border px-2 py-1">{r.siswa}</td>
                          <td className="border px-2 py-1">{r.jenis_tagihan || "-"}</td>
                          <td className="border px-2 py-1">{r.bulan_pembayaran}</td>
                          <td className="border px-2 py-1">{r.tanggal}</td>
                          <td className="border px-2 py-1">{formatRupiah(r.jumlah)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="text-center py-4">Tidak ada data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <h2 className="text-lg font-semibold text-teal-800 mb-2">Pengeluaran</h2>
                  <table className="w-full border text-sm">
                    <thead className="bg-red-600 text-white">
                      <tr>
                        <th className="border px-2 py-1">No</th>
                        <th className="border px-2 py-1">Deskripsi</th>
                        <th className="border px-2 py-1">Tanggal</th>
                        <th className="border px-2 py-1">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePengeluaran.length > 0 ? visiblePengeluaran.map((r, i) => (
                        <tr key={r.id} className="hover:bg-gray-100">
                          <td className="border px-2 py-1">{i + 1}</td>
                          <td className="border px-2 py-1">{r.keterangan}</td>
                          <td className="border px-2 py-1">{r.tanggal}</td>
                          <td className="border px-2 py-1">{formatRupiah(r.jumlah)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4">Tidak ada data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}