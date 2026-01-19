"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import DashboardLayout from "@/app/components/DashboardLayout";

export default function SiswaPage() {
  const supabase = createClient();

  // State untuk form input
  const [nama, setNama] = useState("");
  const [nis, setNis] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [editId, setEditId] = useState(null);

  // Data dari database
  const [siswaList, setSiswaList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch kelas terlebih dahulu
      const { data: classData, error: classError } = await supabase
        .from("kelas")
        .select("id, kelas_id, kelas")
        .order("kelas_id", { ascending: true });

      if (classError) {
        console.error("Error kelas:", classError);
        setClassList([]);
      } else {
        console.log("Data kelas:", classData); // Debug
        setClassList(classData || []);
      }

      // Fetch siswa
      const { data: siswaData, error: siswaError } = await supabase
        .from("siswa")
        .select("id, nama, nis, kelas_id")
        .order("nama", { ascending: true });

      if (siswaError) {
        console.error("Error siswa:", siswaError);
        setSiswaList([]);
      } else {
        console.log("Data siswa:", siswaData); // Debug
        
        // Map berdasarkan kelas_id (bukan id)
        const siswaWithClass = (siswaData || []).map((s) => {
          const kelas = classData?.find((c) => String(c.kelas_id) === String(s.kelas_id));
          return {
            ...s,
            // Tampilkan kolom kelas
            kelas_nama: kelas ? kelas.kelas : "-"
          };
        });

        setSiswaList(siswaWithClass);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Tambah / Update Data ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nama || !nis || !kelasId) {
      alert("Semua field wajib diisi!");
      return;
    }

    let result;

    try {
      if (editId) {
        // UPDATE
        result = await supabase
          .from("siswa")
          .update({ 
            nama: nama.trim(), 
            nis: nis.trim(), 
            kelas_id: kelasId
          })
          .eq("id", editId)
          .select("*");
      } else {
        // INSERT
        result = await supabase
          .from("siswa")
          .insert([{ 
            nama: nama.trim(), 
            nis: nis.trim(), 
            kelas_id: parseInt(kelasId)
          }])
          .select("*");
      }

      if (result.error) {
        alert("Error: " + result.error.message);
        return;
      }

      alert(editId ? "Data berhasil diupdate" : "Data berhasil ditambahkan");

      // Refresh data dengan mapping yang benar
      const newData = result.data[0];
      
      // Cari berdasarkan kelas_id (bukan id)
      const kelasMatch = classList.find((c) => String(c.kelas_id) === String(kelasId));

      if (editId) {
        setSiswaList(
          siswaList.map((s) =>
            s.id === editId
              ? { 
                  ...newData, 
                  // Tampilkan kolom kelas
                  kelas_nama: kelasMatch ? kelasMatch.kelas : "-"
                }
              : s
          )
        );
      } else {
        setSiswaList([
          ...siswaList,
          { 
            ...newData, 
            // Tampilkan kolom kelas
            kelas_nama: kelasMatch ? kelasMatch.kelas : "-"
          },
        ]);
      }

      // Reset Form
      resetForm();
      
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    }
  };

  // --- Reset Form ---
  const resetForm = () => {
    setNama("");
    setNis("");
    setKelasId("");
    setEditId(null);
  };

  // --- Hapus Data ---
  const handleDelete = async (id) => {
    if (!confirm("Hapus siswa ini?")) return;

    try {
      const { error } = await supabase.from("siswa").delete().eq("id", id);

      if (error) {
        alert("Gagal menghapus data: " + error.message);
        return;
      }

      setSiswaList(siswaList.filter((s) => s.id !== id));
      alert("Data berhasil dihapus");
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    }
  };

  // --- Edit Data (prefill form) ---
  const handleEdit = (s) => {
    setEditId(s.id);
    setNama(s.nama);
    setNis(s.nis);
    setKelasId(String(s.kelas_id));
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-4 sm:mb-6">Data Siswa</h1>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <p className="text-lg">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md border mb-6 sm:mb-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Nama</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Masukkan nama siswa"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">NIS</label>
                <input
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Masukkan NIS"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Kelas</label>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {classList.map((k) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      {k.kelas}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded transition duration-200"
              >
                {editId ? "Update Data" : "Tambah Siswa"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition duration-200"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>

          {/* TABLE */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Daftar Siswa</h2>

            {siswaList.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="w-full border-collapse border text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-teal-700 text-white">
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">No</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">Nama</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">NIS</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">Kelas</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-center">Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {siswaList.map((s, i) => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{i + 1}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{s.nama}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{s.nis}</td>
                          {/* PERUBAHAN: Tampilkan angka kelas saja */}
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{s.kelas_nama}</td>

                          <td className="py-2 sm:py-3 px-2 sm:px-4 border text-center">
                            <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
                              <button
                                onClick={() => handleEdit(s)}
                                className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm transition duration-200"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDelete(s.id)}
                                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm transition duration-200"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada data siswa.</p>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}