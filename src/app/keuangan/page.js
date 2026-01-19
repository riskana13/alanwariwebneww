"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Wallet } from "lucide-react";
import DashboardLayout from "@/app/components/DashboardLayout";

export default function KeuanganPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // --- State form / UI ---
  const [activeForm, setActiveForm] = useState(null);
  const [tanggal, setTanggal] = useState("");
  const [siswa, setSiswa] = useState(""); // menyimpan NAMA siswa sesuai permintaan
  const [bulanPembayaran, setBulanPembayaran] = useState("");
  const [jenisTagihan, setJenisTagihan] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [message, setMessage] = useState("");
  const [keteranganLainnya, setKeteranganLainnya] = useState("");


  // list siswa diambil dari supabase; array of {id, nama}
  const [siswaList, setSiswaList] = useState([]);

  // --- Saldo ---
  const [saldo, setSaldo] = useState(0);
  const [loadingSaldo, setLoadingSaldo] = useState(true);

  // --- Nominal default untuk jenis tagihan ---
  const nominalTagihan = {
    SPP: 600000,
  "Daftar Ulang": 300000,
  "PPDB Putra": 3235000,
  "PPDB Putri": 3335000,
  PTS: 100000,
  "Buku Kelas 12": 711000,
  "Buku Kelas 11": 731000,
  "Buku Kelas 10": 714000,
  Kalender: 100000,
  };

  // --- Fetch siswa dari Supabase pada mount ---
  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        const { data, error } = await supabase
          .from("siswa")
          .select("id, nama")
          .order("nama", { ascending: true });

        if (error) {
          console.error("Gagal mengambil data siswa:", error);
          setMessage("Gagal mengambil daftar siswa.");
          return;
        }

        setSiswaList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error saat fetch siswa:", err);
        setMessage("Terjadi kesalahan mengambil data siswa.");
      }
    };

    fetchSiswa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // hanya sekali saat mount

  // --- Fetch dan hitung saldo (total pemasukan - total pengeluaran) ---
  const fetchSaldo = async () => {
    setLoadingSaldo(true);
    try {
      // Ambil total pemasukan
      const { data: pemasukanData, error: pemasukanError } = await supabase
        .from("pemasukan")
        .select("jumlah");

      if (pemasukanError) {
        console.error("Gagal mengambil data pemasukan:", pemasukanError);
        return;
      }

      // Ambil total pengeluaran
      const { data: pengeluaranData, error: pengeluaranError } = await supabase
        .from("pengeluaran")
        .select("jumlah");

      if (pengeluaranError) {
        console.error("Gagal mengambil data pengeluaran:", pengeluaranError);
        return;
      }

      const totalPemasukan = pemasukanData?.reduce((acc, item) => acc + (Number(item.jumlah) || 0), 0) || 0;
      const totalPengeluaran = pengeluaranData?.reduce((acc, item) => acc + (Number(item.jumlah) || 0), 0) || 0;

      setSaldo(totalPemasukan - totalPengeluaran);
    } catch (err) {
      console.error("Error saat menghitung saldo:", err);
    } finally {
      setLoadingSaldo(false);
    }
  };

  useEffect(() => {
    fetchSaldo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Utility ---
  const resetForm = () => {
    setTanggal("");
    setSiswa("");
    setBulanPembayaran("");
    setJenisTagihan("");
    setJumlah("");
    setKeterangan("");
    setMessage("");
  };

  // Ketika memilih jenis tagihan, tentukan nominal otomatis (kecuali "Lainnya")
  const handleJenisTagihanChange = (value) => {
    setJenisTagihan(value);
    if (value === "Lainnya") {
      setJumlah("");
    } else {
      setJumlah(nominalTagihan[value] !== undefined ? String(nominalTagihan[value]) : "");
    }
  };

  // --- Cek apakah SPP siswa di bulan yang sama sudah dibayar ---
const cekDuplikatSPP = async ({ siswa, bulanPembayaran }) => {
  const { data, error } = await supabase
    .from("pemasukan")
    .select("id")
    .eq("siswa", siswa)
    .eq("jenis_tagihan", "SPP")
    .eq("bulan_pembayaran", bulanPembayaran)
    .limit(1);

  if (error) {
    console.error("Error cek duplikat SPP:", error);
    return false;
  }

  return data && data.length > 0;
};


  // Submit pemasukan / pengeluaran
  const handleSubmit = async (type) => {
  setMessage("");

  console.log("📝 Submit dimulai untuk tipe:", type);

  // Validasi
  if (type === "pemasukan") {
    if (!tanggal || !siswa || !jenisTagihan || !jumlah) {
      console.warn("⚠️ Validasi gagal: kolom wajib belum lengkap");
      setMessage("Harap isi semua kolom wajib!");
      return;
    }
    if (jenisTagihan === "SPP" && !bulanPembayaran) {
      console.warn("⚠️ Validasi gagal: bulan pembayaran SPP belum dipilih");
      setMessage("Untuk SPP, pilih bulan pembayaran.");
      return;
    }
  } else {
    if (!tanggal || !jumlah || !keterangan) {
      console.warn("⚠️ Validasi gagal: kolom pengeluaran belum lengkap");
      setMessage("Harap isi semua kolom wajib!");
      return;
    }
  }

  // 🔒 CEK DOUBLE INPUT SPP
if (jenisTagihan === "SPP") {
  const sudahAda = await cekDuplikatSPP({
    siswa,
    bulanPembayaran,
  });

  if (sudahAda) {
    setMessage(
      `SPP bulan ${bulanPembayaran} untuk siswa ${siswa} sudah dibayar.`
    );
    return;
  }
}


  const table = type === "pemasukan" ? "pemasukan" : "pengeluaran";

  // Susun data sesuai tipe
  const payload =
    type === "pemasukan"
      ? {
          tanggal,
          siswa,
          bulan_pembayaran: jenisTagihan === "SPP" ? bulanPembayaran : null,
          jenis_tagihan: jenisTagihan === "Lainnya" ? keterangan : jenisTagihan,
          jumlah: Number(jumlah) || 0,
          keterangan:
            jenisTagihan === "Lainnya"
              ? `Pembayaran lainnya: ${keterangan}`
              : keterangan || null,
        }
        : {
          tanggal,
          jumlah: Number(jumlah) || 0,
          keterangan:
            keterangan === "Lainnya"
              ? keteranganLainnya
              : keterangan,
        };

  console.log("📦 Payload yang dikirim:", payload);

  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert([payload])
      .select("id")
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      setMessage("Gagal menyimpan data: " + error.message);
      return;
    }

    console.log("✅ Data berhasil disimpan ke tabel:", table);
    console.log("🆔 ID hasil insert:", result.id);

    // Update saldo setelah transaksi berhasil
    await fetchSaldo();

    // sukses
    if (type === "pemasukan") {
      // router.push(`/buktibayar/${result.id}`);
      setMessage("Data pemasukan berhasil disimpan! Saldo bertambah.");
      resetForm();
    } else {
      setMessage("Data pengeluaran berhasil disimpan! Saldo berkurang.");
      resetForm();
    }
  } catch (err) {
    console.error("🔥 Error saat menyimpan:", err);
    setMessage("Terjadi kesalahan saat menyimpan data.");
  }
};

// --- Opsi keterangan pengeluaran ---
const opsiPengeluaran = [
  "Pembelian ATK",
  "Pembayaran Listrik",
  "Pembayaran Air",
  "Pembayaran Internet",
  "Biaya Kegiatan",
  "Perbaikan Sarana",
  "Honor / Upah",
  "Lainnya",
];

  return (
    <DashboardLayout>
      <div className="flex flex-col justify-center items-center gap-4 px-2 sm:px-0">
        {/* Kartu Saldo */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg rounded-xl p-4 sm:p-6 w-full max-w-lg text-white">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Wallet className="w-6 h-6 sm:w-8 sm:h-8" />
            <h2 className="text-base sm:text-lg font-semibold">Saldo Saat Ini</h2>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">
            {loadingSaldo ? (
              <span className="text-white/70">Memuat...</span>
            ) : (
              `Rp ${saldo.toLocaleString("id-ID")}`
            )}
          </p>
          <p className="text-xs sm:text-sm text-white/80 mt-1">
            Total pemasukan dikurangi total pengeluaran
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-4 sm:p-8 w-full max-w-lg text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-5">Manajemen Keuangan</h1>

          {!activeForm ? (
            <div className="flex justify-around flex-wrap gap-3 sm:gap-4 mb-6">
              <div
                className="bg-blue-100 p-4 sm:p-6 rounded-xl w-full sm:w-40 cursor-pointer hover:bg-blue-200 transition"
                onClick={() => {
                  setActiveForm("pemasukan");
                  resetForm();
                }}
              >
                <h2 className="text-base sm:text-lg font-semibold text-blue-900">Pemasukan</h2>
                <p className="text-xs sm:text-sm text-blue-800">Tambah uang masuk</p>
              </div>

              <div
                className="bg-cyan-100 p-4 sm:p-6 rounded-xl w-full sm:w-40 cursor-pointer hover:bg-cyan-200 transition"
                onClick={() => {
                  setActiveForm("pengeluaran");
                  resetForm();
                }}
              >
                <h2 className="text-base sm:text-lg font-semibold text-cyan-900">Pengeluaran</h2>
                <p className="text-xs sm:text-sm text-cyan-800">Tambah uang keluar</p>
              </div>
            </div>
          ) : (
            <>
              {/* FORM PEMASUKAN */}
              {activeForm === "pemasukan" && (
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setActiveForm(null)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-800"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                  </div>

                  <h2 className="text-lg font-semibold mb-2">Form Pemasukan</h2>

                  <label className="block text-sm text-gray-700">Tanggal:</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  />

                  <label className="block text-sm text-gray-700">Nama Siswa:</label>
                  <select
                    value={siswa}
                    onChange={(e) => setSiswa(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {siswaList.map((s) => (
                      <option key={s.id} value={s.nama}>
                        {s.nama}
                      </option>
                    ))}
                  </select>

                  <label className="block text-sm text-gray-700">Jenis Tagihan:</label>
                  <select
                    value={jenisTagihan}
                    onChange={(e) => handleJenisTagihanChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  >
                    <option value="">-- Pilih Tagihan --</option>
                    {Object.keys(nominalTagihan).map((tagihan) => (
                    <option key={tagihan} value={tagihan}>
                      {tagihan}
                    </option>
                  ))}
                  <option value="Lainnya">Lainnya</option>
                  </select>

                  {/* Jika SPP, tampilkan bulan */}
                  {jenisTagihan === "SPP" && (
                    <>
                      <label className="block text-sm text-gray-700">Bulan Pembayaran:</label>
                      <select
                        value={bulanPembayaran}
                        onChange={(e) => setBulanPembayaran(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                      >
                        <option value="">-- Pilih Bulan --</option>
                        {[
                          "Januari","Februari","Maret","April","Mei","Juni",
                          "Juli","Agustus","September","Oktober","November","Desember",
                        ].map((bulan) => (
                          <option key={bulan} value={bulan}>{bulan}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {/* Jika "Lainnya", tampilkan input keterangan (jenis) */}
                  {jenisTagihan === "Lainnya" && (
                    <>
                      <label className="block text-sm text-gray-700">Keterangan Pembayaran:</label>
                      <input
                        type="text"
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        placeholder="Masukkan jenis pembayaran lainnya"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                      />
                    </>
                  )}

                  <label className="block text-sm text-gray-700">Jumlah (Rp):</label>
                  <input
                    type="number"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    placeholder="Nominal"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  />

                  <button
                    onClick={() => handleSubmit("pemasukan")}
                    className="bg-blue-700 text-white w-full py-2 rounded-lg hover:bg-blue-800 transition"
                  >
                    Simpan Pemasukan
                  </button>

                  {message && (
                    <p className="mt-3 text-center font-medium text-blue-700">
                      {message}
                    </p>
                  )}
                </div>
              )}

              {/* FORM PENGELUARAN */}
              {activeForm === "pengeluaran" && (
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setActiveForm(null)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-cyan-800"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                  </div>

                  <h2 className="text-lg font-semibold mb-2">Form Pengeluaran</h2>

                  <label className="block text-sm text-gray-700">Tanggal:</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  />

                  <label className="block text-sm text-gray-700">Jumlah Pengeluaran (Rp):</label>
                  <input
                    type="number"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    placeholder="Nominal pengeluaran"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  />

                  <label className="block text-sm text-gray-700">Keterangan:</label>
                  <select
                    value={keterangan}
                    onChange={(e) => {
                      setKeterangan(e.target.value);
                      if (e.target.value !== "Lainnya") {
                        setKeteranganLainnya("");
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                  >
                    <option value="">-- Pilih Keterangan --</option>
                    {opsiPengeluaran.map((opsi) => (
                      <option key={opsi} value={opsi}>
                        {opsi}
                      </option>
                    ))}
                  </select>


                  {keterangan === "Lainnya" && (
                    <input
                      type="text"
                      value={keteranganLainnya}
                      onChange={(e) => setKeteranganLainnya(e.target.value)}
                      placeholder="Masukkan keterangan lainnya"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                    />
                  )}


                  <button
                    onClick={() => handleSubmit("pengeluaran")}
                    className="bg-red-600 text-white w-full py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Simpan Pengeluaran
                  </button>

                  {message && (
                    <p className="mt-3 text-center font-medium text-red-600">{message}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
