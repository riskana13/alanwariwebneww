"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const pelanggaranList = [
  { kategori: "Tingkat 1", deskripsi: "Terlambat datang ke kelas / madrasah 1 – 15 menit", poin: 2 }, 
  { kategori: "Tingkat 1", deskripsi: "Tidak memakai atribut pada seragam sekolah", poin: 2 }, 
  { kategori: "Tingkat 1", deskripsi: "Berpenampilan tidak sopan dan tidak islami, berdandan tidak rapi, seperti berambut panjang (khusus pria), makeup berlebihan, berpakaian ketat di madrasah", poin: 2 }, 
  { kategori: "Tingkat 1", deskripsi: "Terlambat datang ke kelas / madrasah 15 – 30 menit", poin: 4 },

  { kategori: "Tingkat 2", deskripsi: "Siswa yang terlambat lebih dari 30 menit", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Tidak memakai seragam yang telah ditentukan", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Tidak mengikuti apel/baris dengan alasan yang tidak jelas", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Memasuki area madrasah tidak melalui gerbang utama", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Membuat keributan atau kegaduhan di dalam kelas sehingga mengganggu suasana belajar", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Tidak mengikuti shalat Zuhur berjamaah di mushalla madrasah", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Memindahkan dan mengubah alat – alat laboratorium atau madrasah yang telah terpasang tanpa izin", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Menggunakan fasilitas madrasah tidak pada waktunya", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Meninggalkan pelajaran tanpa alasan yang jelas", poin: 5 }, 
  { kategori: "Tingkat 2", deskripsi: "Mengkonsumsi rokok / vape saat memakai seragam", poin: 5 },

  { kategori: "Tingkat 3", deskripsi: "Mengadakan kegiatan dengan orang luar tanpa izin", poin: 10 }, 
  { kategori: "Tingkat 3", deskripsi: "Vandalisme atau merusak fasilitas", poin: 10 }, 
  { kategori: "Tingkat 3", deskripsi: "Menggunakan barang bukan milik sendiri tanpa izin", poin: 10 }, 
  { kategori: "Tingkat 3", deskripsi: "Membawa barang elektronik yang dilarang (speaker, iPod, dsb)", poin: 10 }, 
  { kategori: "Tingkat 3", deskripsi: "Melakukan bullying sesama teman", poin: 15 },

  { kategori: "Tingkat 4", deskripsi: "Bullying guru atau karyawan", poin: 25 }, 
  { kategori: "Tingkat 4", deskripsi: "Merokok/vape di lingkungan madrasah", poin: 25 }, 
  { kategori: "Tingkat 4", deskripsi: "Berkelahi", poin: 25 }, 
  { kategori: "Tingkat 4", deskripsi: "Mengancam secara lisan/tulisan", poin: 25 }, 
  { kategori: "Tingkat 4", deskripsi: "Membawa konten pornografi", poin: 25 }, 
  { kategori: "Tingkat 4", deskripsi: "Berduaan dengan bukan mahram secara mencurigakan", poin: 25 }, 
  { kategori: "Tingkat 4", deskripsi: "Chat mengandung unsur asusila", poin: 50 },

  { kategori: "Tingkat 5", deskripsi: "Menyebarkan konten pornografi", poin: 75 }, 
  { kategori: "Tingkat 5", deskripsi: "Memalsukan tanda tangan atau dokumen resmi", poin: 100 }, 
  { kategori: "Tingkat 5", deskripsi: "Menggunakan/membawa narkoba, alkohol, atau barang terlarang", poin: 100 }, 
  { kategori: "Tingkat 5", deskripsi: "Melakukan tindakan asusila", poin: 100 }, 
  { kategori: "Tingkat 5", deskripsi: "Membawa senjata tajam/berbahaya", poin: 100 }, 
  { kategori: "Tingkat 5", deskripsi: "Berjudi atau mabuk-mabukan", poin: 100 }, 
  { kategori: "Tingkat 5", deskripsi: "Melakukan tindak pidana", poin: 100 }, 
  { kategori: "Tingkat 5", deskripsi: "Menyebarkan ajaran yang menyimpang", poin: 100 },
];

export default function InputPelanggaran() {
  const supabase = createClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    nis: "",
    siswa: "",
    kelas: "",
    jenis_pelanggaran: "",
    poin: "",
    tanggal: "",
  });

  const [totalPoin, setTotalPoin] = useState(0);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // Fetch data siswa berdasarkan NIS
  useEffect(() => {
    const fetchSiswa = async () => {
      if (!formData.nis) {
        setFormData(prev => ({ ...prev, siswa: "", kelas: "" }));
        setTotalPoin(0);
        setDebugInfo("NIS kosong");
        return;
      }

      setLoading(true);
      setDebugInfo(`Mencari siswa dengan NIS: ${formData.nis}`);

      try {
        // Cari siswa berdasarkan NIS
        const { data: siswaData, error } = await supabase
          .from("siswa")
          .select("id, nama, kelas_id")
          .eq("nis", formData.nis.trim())
          .single();

        console.log("Siswa Data:", siswaData);
        console.log("Siswa Error:", error);

        if (error || !siswaData) {
          setDebugInfo(`Siswa dengan NIS ${formData.nis} tidak ditemukan`);
          setFormData(prev => ({ ...prev, siswa: "", kelas: "" }));
          setTotalPoin(0);
          return;
        }

        setDebugInfo(`Siswa ditemukan: ${siswaData.nama}, kelas_id: ${siswaData.kelas_id}`);

        // PERBAIKAN: Cari kelas berdasarkan kelas_id (bukan id)
        // Karena siswa.kelas_id merujuk ke kelas.kelas_id
        const { data: kelasData, error: kelasError } = await supabase
          .from("kelas")
          .select("kelas_id, kelas")
          .eq("kelas_id", siswaData.kelas_id)  // PERUBAHAN PENTING: eq("kelas_id", ...)
          .single();

        console.log("Kelas Data:", kelasData);
        console.log("Kelas Error:", kelasError);

        if (kelasError || !kelasData) {
          setDebugInfo(`Kelas dengan kelas_id ${siswaData.kelas_id} tidak ditemukan`);
          setFormData(prev => ({
            ...prev,
            siswa: siswaData.nama,
            kelas: "Kelas tidak ditemukan",
          }));
        } else {
          setDebugInfo(`Kelas ditemukan: ${kelasData.kelas}`);
          setFormData(prev => ({
            ...prev,
            siswa: siswaData.nama,
            kelas: kelasData.kelas,
          }));
        }

        // Hitung total poin pelanggaran siswa
        const { data: pelData } = await supabase
          .from("pelanggaran")
          .select("poin")
          .eq("siswa_id", siswaData.id);

        const total = pelData?.reduce((sum, row) => sum + Number(row.poin), 0) || 0;
        setTotalPoin(total);
        setDebugInfo(prev => prev + `, Total poin: ${total}`);
        
      } catch (error) {
        console.error("Error fetching siswa:", error);
        setDebugInfo(`Error: ${error.message}`);
        setFormData(prev => ({ ...prev, siswa: "", kelas: "" }));
        setTotalPoin(0);
      } finally {
        setLoading(false);
      }
    };

    // Debounce untuk menghindari request berlebihan
    const timeoutId = setTimeout(() => {
      fetchSiswa();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.nis]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePelanggaranChange = (e) => {
    const selected = pelanggaranList.find((p) => p.deskripsi === e.target.value);

    if (selected) {
      setFormData({
        ...formData,
        jenis_pelanggaran: selected.deskripsi,
        poin: selected.poin,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nis || !formData.siswa || !formData.kelas || !formData.tanggal || !formData.jenis_pelanggaran) {
      alert("⚠️ Semua field wajib diisi!");
      return;
    }

    const { data: siswaData } = await supabase
      .from("siswa")
      .select("id")
      .eq("nis", formData.nis)
      .single();

    const payload = {
      siswa_id: siswaData.id,
      jenis_pelanggaran: formData.jenis_pelanggaran,
      poin: formData.poin,
      tgl_pelanggaran: formData.tanggal,
    };

    const { error } = await supabase.from("pelanggaran").insert([payload]);
    if (error) {
      console.error(error);
      alert("❌ Gagal menyimpan data");
      return;
    }

    alert(`✅ Pelanggaran berhasil dicatat!`);
    router.push("/pelanggaran/list");
  };

  const kategoriUnik = [...new Set(pelanggaranList.map((p) => p.kategori))];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-teal-700 mb-4 sm:mb-6 text-center">Input Data Pelanggaran</h1>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

          {/* Input NIS */}
          <div>
            <label className="block text-gray-700 mb-2">NIS</label>
            <input
              type="text"
              name="nis"
              placeholder="Ketik NIS siswa"
              value={formData.nis}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
            {loading && <p className="text-sm text-gray-500 mt-1">Mencari data siswa...</p>}
          </div>

          {/* Nama Siswa (Auto-filled) */}
          <div>
            <label className="block text-gray-700 mb-2">Nama Siswa</label>
            <input
              type="text"
              name="siswa"
              placeholder="Nama Siswa"
              value={formData.siswa}
              readOnly
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>

          {/* Kelas (Auto-filled) */}
          <div>
            <label className="block text-gray-700 mb-2">Kelas</label>
            <input
              type="text"
              name="kelas"
              placeholder="Kelas"
              value={formData.kelas}
              readOnly
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>

          {/* Total Poin */}
          {totalPoin > 0 && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <strong>Total Poin Pelanggaran Saat Ini:</strong> {totalPoin} poin
              </p>
            </div>
          )}

          {/* Jenis Pelanggaran */}
          <div>
            <label className="block text-gray-700 mb-2">Jenis Pelanggaran</label>
            <select
              name="jenis_pelanggaran"
              value={formData.jenis_pelanggaran}
              onChange={handlePelanggaranChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value="">-- Pilih Pelanggaran --</option>
              {kategoriUnik.map((kategori) => (
                <optgroup key={kategori} label={kategori}>
                  {pelanggaranList
                    .filter((p) => p.kategori === kategori)
                    .map((p, idx) => (
                      <option key={idx} value={p.deskripsi}>
                        {p.deskripsi} ({p.poin} poin)
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Poin */}
          <div>
            <label className="block text-gray-700 mb-2">Poin</label>
            <input
              type="number"
              name="poin"
              placeholder="Akan terisi otomatis"
              value={formData.poin}
              readOnly
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-gray-700 mb-2">Tanggal Pelanggaran</label>
            <input
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6 justify-center">
            <button
              type="submit"
              className="bg-teal-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-teal-700 transition text-sm sm:text-base"
            >
              Simpan
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="bg-gray-500 text-white px-4 sm:px-6 py-2 rounded hover:bg-gray-600 transition text-sm sm:text-base"
            >
              ⬅ Kembali
            </button>

            <button
              type="button"
              onClick={() => router.push("/pelanggaran/list")}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Tampilan List
            </button>
          </div>

        </form>

    
      </div>
    </div>
  );
}