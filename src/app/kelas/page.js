"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import DashboardLayout from "@/app/components/DashboardLayout";

export default function KelasPage() {
  const supabase = createClient();

  // State untuk form input
  const [kelas, setKelas] = useState("");
  const [editId, setEditId] = useState(null);

  // Data dari database
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: kelasData, error: kelasError } = await supabase
        .from("kelas")
        .select("id, kelas_id, kelas, created_at")
        .order("kelas_id", { ascending: true });

      if (kelasError) {
        console.error("Error kelas:", kelasError);
        setKelasList([]);
      } else {
        console.log("Data kelas:", kelasData);
        setKelasList(kelasData || []);
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

    if (!kelas) {
      alert("Field kelas wajib diisi!");
      return;
    }

    let result;

    try {
      if (editId) {
        // UPDATE
        result = await supabase
          .from("kelas")
          .update({ 
            kelas: kelas.trim()
          })
          .eq("id", editId)
          .select("*");
      } else {
        // INSERT - kelas_id akan auto-generate
        // Ambil kelas_id tertinggi untuk generate yang baru
        const { data: maxKelasData } = await supabase
          .from("kelas")
          .select("kelas_id")
          .order("kelas_id", { ascending: false })
          .limit(1);

        const nextKelasId = maxKelasData && maxKelasData.length > 0 
          ? maxKelasData[0].kelas_id + 1 
          : 10; // Mulai dari 10 jika belum ada data

        result = await supabase
          .from("kelas")
          .insert([{ 
            kelas_id: nextKelasId,
            kelas: kelas.trim()
          }])
          .select("*");
      }

      if (result.error) {
        alert("Error: " + result.error.message);
        return;
      }

      alert(editId ? "Data berhasil diupdate" : "Data berhasil ditambahkan");

      // Refresh data
      const newData = result.data[0];

      if (editId) {
        setKelasList(
          kelasList.map((k) =>
            k.id === editId ? newData : k
          )
        );
      } else {
        setKelasList([...kelasList, newData]);
      }

      // Reset Form
      resetForm();
      
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    }
  };

  // --- Reset Form ---
  const resetForm = () => {
    setKelas("");
    setEditId(null);
  };

  // --- Hapus Data ---
  const handleDelete = async (id) => {
    if (!confirm("Hapus kelas ini? Pastikan tidak ada siswa atau mapel yang menggunakan kelas ini.")) return;

    try {
      const { error } = await supabase.from("kelas").delete().eq("id", id);

      if (error) {
        alert("Gagal menghapus data: " + error.message);
        return;
      }

      setKelasList(kelasList.filter((k) => k.id !== id));
      alert("Data berhasil dihapus");
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    }
  };

  // --- Edit Data (prefill form) ---
  const handleEdit = (k) => {
    setEditId(k.id);
    setKelas(k.kelas);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-4 sm:mb-6">Data Kelas</h1>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Nama Kelas</label>
                <input
                  type="text"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Contoh: KELAS X 1, KELAS XI IPA 2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Kelas ID akan di-generate otomatis
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded transition duration-200"
              >
                {editId ? "Update Data" : "Tambah Kelas"}
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
            <h2 className="text-base sm:text-lg font-semibold mb-4">Daftar Kelas</h2>

            {kelasList.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="w-full border-collapse border text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-teal-700 text-white">
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">No</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">Kelas ID</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">Nama Kelas</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kelasList.map((k, idx) => (
                        <tr key={k.id} className="hover:bg-gray-50">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{idx + 1}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{k.kelas_id}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{k.kelas}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border text-center">
                            <div className="flex justify-center gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEdit(k)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition duration-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(k.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition duration-200"
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
              <p className="text-center py-4 text-gray-500">Belum ada data kelas.</p>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
