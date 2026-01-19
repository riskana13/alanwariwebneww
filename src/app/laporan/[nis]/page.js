"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import * as XLSX from "xlsx";

export default function DetailLaporanPage({ params }) {
  const router = useRouter();
  const supabase = createClient();

  // React.use() untuk unwrapping params pada Next.js
  const { nis } = use(params);

  const [laporan, setLaporan] = useState([]);
  const [siswa, setSiswa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Ambil data siswa
      const { data: siswaData, error: errorSiswa } = await supabase
        .from("siswa")
        .select("*")
        .eq("nis", nis)
        .single();

      if (errorSiswa) throw errorSiswa;
      setSiswa(siswaData);

      // Ambil pelanggaran dari tabel "pelanggaran"
      const { data: laporanData, error: errorLaporan } = await supabase
        .from("pelanggaran")
        .select("*")
        .eq("siswa_id", siswaData.id)
        .order("tgl_pelanggaran", { ascending: true });

      if (errorLaporan) throw errorLaporan;

      setLaporan(laporanData || []);
    } catch (err) {
      console.error("Error fetch detail:", err);
      setError(err.message || "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [nis]);

  // Export Excel
  const exportExcel = () => {
    if (!laporan || laporan.length === 0) return;

    const totalPoint = laporan.reduce(
      (sum, l) => sum + Number(l.poin || 0),
      0
    );

    const wsData = laporan.map((l, idx) => ({
      No: idx + 1,
      "Tanggal Pelanggaran": l.tgl_pelanggaran,
      "Jenis Pelanggaran": l.jenis_pelanggaran,
      "Poin": l.poin || 0,
    }));

    wsData.push({
      No: "",
      "Tanggal Pelanggaran": "",
      "Jenis Pelanggaran": "Total",
      "Poin": totalPoint,
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Detail");
    XLSX.writeFile(wb, `laporan_${nis}.xlsx`);
  };

  // Export PDF
  const exportPDF = async () => {
    if (!laporan || laporan.length === 0) return;

    // Dynamic import untuk mengurangi bundle size
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`LAPORAN PELANGGARAN SISWA`, 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Nama: ${siswa.nama}`, 14, 25);
    doc.text(`NIS: ${siswa.nis}`, 14, 32);
    doc.text(`Kelas: ${siswa.kelas_id}`, 14, 39);

    // Hitung total poin
    const totalPoint = laporan.reduce((sum, l) => sum + Number(l.poin || 0), 0);

    // Prepare data untuk tabel
    const tableData = laporan.map((l, index) => [
      index + 1,
      l.tgl_pelanggaran || '-',
      l.jenis_pelanggaran || '-',
      l.poin || 0
    ]);

    // Tambah row total
    tableData.push(['', '', 'TOTAL', totalPoint]);

    // Buat tabel
    autoTable(doc, {
      startY: 45,
      head: [['No', 'Tanggal Pelanggaran', 'Jenis Pelanggaran', 'Poin']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [220, 53, 69], // Warna merah
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: 40,
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      // Style untuk row total
      didDrawCell: function(data) {
        if (data.row.index === tableData.length - 1 && data.column.index === 2) {
          doc.setFont(undefined, 'bold');
        }
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} - Halaman ${i} dari ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`laporan_pelanggaran_${nis}.pdf`);
  };

  if (loading) return <p className="p-4">Memuat data...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!siswa) return <p className="p-4">Siswa tidak ditemukan.</p>;

  const totalPoint = laporan.reduce(
    (sum, l) => sum + Number(l.poin || 0),
    0
  );

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Laporan Detail: {siswa.nama}</h1>
      <p className="mb-1 sm:mb-2 text-sm sm:text-base">NIS: {siswa.nis}</p>
      <p className="mb-3 sm:mb-4 text-sm sm:text-base">Kelas: {siswa.kelas_id}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={exportExcel}
          className="bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-green-600 transition duration-200 text-xs sm:text-sm"
        >
          Export Excel
        </button>
        <button
          onClick={exportPDF}
          className="bg-red-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-red-600 transition duration-200 text-xs sm:text-sm"
        >
          Export PDF
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-gray-600 transition duration-200 text-xs sm:text-sm"
        >
          Print
        </button>
        <button
          onClick={() => router.back()}
          className="bg-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-blue-600 transition duration-200 text-xs sm:text-sm"
        >
          Kembali
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full border text-xs sm:text-sm">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="border px-2 py-1">No</th>
              <th className="border px-2 py-1">Tanggal Pelanggaran</th>
              <th className="border px-2 py-1">Jenis Pelanggaran</th>
              <th className="border px-2 py-1">Poin</th>
            </tr>
          </thead>
          <tbody>
            {laporan.length > 0 ? (
              <>
                {laporan.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-100">
                    <td className="border px-2 py-1 text-center">{i + 1}</td>
                    <td className="border px-2 py-1">{l.tgl_pelanggaran ?? "-"}</td>
                    <td className="border px-2 py-1">{l.jenis_pelanggaran ?? "-"}</td>
                    <td className="border px-2 py-1 text-center">{l.poin || 0}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-200">
                  <td className="border px-2 py-1"></td>
                  <td className="border px-2 py-1"></td>
                  <td className="border px-2 py-1 text-right">Total</td>
                  <td className="border px-2 py-1 text-center">{totalPoint}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  Tidak ada pelanggaran
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info tambahan */}
      {laporan.length > 0 && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800 mb-1 sm:mb-2 text-sm sm:text-base">Ringkasan:</h3>
          <p className="text-yellow-700 text-xs sm:text-sm">
            Total {laporan.length} pelanggaran dengan akumulasi {totalPoint} poin.
          </p>
        </div>
      )}
    </div>
  );
}