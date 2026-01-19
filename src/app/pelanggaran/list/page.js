"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function DaftarPelanggaran() {
  const supabase = createClient();
  const router = useRouter();
  const [pelanggaran, setPelanggaran] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulanFilter, setBulanFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchNama, setSearchNama] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("pelanggaran")
        .select(`
          id,
          jenis_pelanggaran,
          poin,
          tgl_pelanggaran,
          siswa!inner(
            nis,
            nama,
            kelas_id,
            kelas:kelas!fk_siswa_kelas(kelas_id, kelas)
          )
        `)
        .order("tgl_pelanggaran", { ascending: sortOrder === "asc" });

      if (error) {
        console.error("Gagal mengambil data:", error);
        setPelanggaran([]);
      } else {
        const mappedData = data.map((row) => ({
          id: row.id,
          nis: row.siswa.nis,
          siswa: row.siswa.nama,
          kelas: row.siswa.kelas?.kelas || "-", // nama kelas lengkap
          jenis_pelanggaran: row.jenis_pelanggaran,
          poin: row.poin,
          tanggal: row.tgl_pelanggaran,
        }));
        setPelanggaran(mappedData);
      }

      setLoading(false);
    };

    fetchData();
  }, [sortOrder]);

  // Total poin per siswa
  const totalPoinPerSiswa = pelanggaran.reduce((acc, row) => {
    if (!acc[row.nis]) acc[row.nis] = 0;
    acc[row.nis] += Number(row.poin);
    return acc;
  }, {});

  // Filter bulan & nama
  const filteredPelanggaran = pelanggaran.filter((row) => {
    const date = new Date(row.tanggal);
    const cocokBulan = bulanFilter
      ? date.getMonth() === new Date(bulanFilter + "-01").getMonth() &&
        date.getFullYear() === new Date(bulanFilter + "-01").getFullYear()
      : true;

    const cocokNama = searchNama
      ? row.siswa.toLowerCase().includes(searchNama.toLowerCase())
      : true;

    return cocokBulan && cocokNama;
  });

  const siswaSudahDitampilkan = new Set();

  const namaBulan = (value) => {
    if (!value) return "";
    const [year, month] = value.split("-");
    const bulanIndo = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    return `${bulanIndo[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="p-3 sm:p-5">
      <h1 className="text-xl sm:text-2xl font-bold text-teal-700 mb-4 sm:mb-5 text-center">
        Daftar Pelanggaran Siswa
      </h1>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <label className="text-gray-700 font-medium">Filter Bulan:</label>
          <input
            type="month"
            value={bulanFilter}
            onChange={(e) => setBulanFilter(e.target.value)}
            className="border border-gray-400 rounded px-3 py-2 text-gray-700"
          />
          {bulanFilter && (
            <button
              onClick={() => setBulanFilter("")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded"
            >✖</button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-gray-700 font-medium">Urutkan:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-400 rounded px-3 py-2 text-gray-700"
          >
            <option value="desc">Terbaru → Terlama</option>
            <option value="asc">Terlama → Terbaru</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-gray-700 font-medium">Cari Nama:</label>
          <input
            type="text"
            placeholder="Ketik nama siswa..."
            value={searchNama}
            onChange={(e) => setSearchNama(e.target.value)}
            className="border border-gray-400 rounded px-3 py-2 text-gray-700 w-52"
          />
          {searchNama && (
            <button
              onClick={() => setSearchNama("")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded"
            >✖</button>
          )}
        </div>
      </div>

      {(bulanFilter || searchNama) && (
        <p className="text-center text-teal-700 font-semibold mb-4">
          Menampilkan{" "}
          {bulanFilter && <>data bulan <span className="underline">{namaBulan(bulanFilter)}</span>{" "}</>}
          {searchNama && <>untuk nama &quot;<span className="underline">{searchNama}</span>&quot;</>}
          ({filteredPelanggaran.length} pelanggaran)
        </p>
      )}

      {loading ? (
        <p className="text-gray-600 text-center">Memuat data...</p>
      ) : filteredPelanggaran.length === 0 ? (
        <p className="text-gray-600 text-center">Tidak ada pelanggaran sesuai filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-teal-600 text-white">
              <tr>
                <th className="border px-3 py-2">No</th>
                <th className="border px-3 py-2">NIS</th>
                <th className="border px-3 py-2">Nama</th>
                <th className="border px-3 py-2">Kelas</th>
                <th className="border px-3 py-2">Jenis Pelanggaran</th>
                <th className="border px-3 py-2">Poin</th>
                <th className="border px-3 py-2">Total Poin</th>
                <th className="border px-3 py-2">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filteredPelanggaran.map((row, i) => {
                const sudahDitampilkan = siswaSudahDitampilkan.has(row.nis);
                if (!sudahDitampilkan) siswaSudahDitampilkan.add(row.nis);

                return (
                  <tr key={row.id} className="hover:bg-gray-100">
                    <td className="border px-3 py-2 text-center">{i + 1}</td>
                    <td className="border px-3 py-2 text-center">{row.nis}</td>
                    <td className="border px-3 py-2">{row.siswa}</td>
                    <td className="border px-3 py-2 text-center">{row.kelas}</td>
                    <td className="border px-3 py-2">{row.jenis_pelanggaran}</td>
                    <td className="border px-3 py-2 text-center">{row.poin}</td>
                    <td className="border px-3 py-2 text-center font-semibold text-teal-700">
                      {!sudahDitampilkan ? totalPoinPerSiswa[row.nis] : ""}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      {new Date(row.tanggal).toLocaleDateString("id-ID")}
                    </td>
                    
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={() => router.push("/pelanggaran")}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            >
              + Tambah Data
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              ⬅ Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
