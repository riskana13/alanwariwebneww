"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/DashboardLayout";

export default function GuruPage() {
  const supabase = createClient();
  const router = useRouter();

  // State untuk form input
  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [editId, setEditId] = useState(null);

  // Data dari database
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch guru
        const { data: guruData, error: guruError } = await supabase
          .from("guru")
          .select("id, nama, nip")
          .order("nama", { ascending: true });

        if (guruError) {
          console.error("Error guru:", guruError);
          setGuruList([]);
        } else {
          console.log("Data guru:", guruData);
          setGuruList(guruData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Tambah / Update Data ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nama) {
      alert("Nama wajib diisi!");
      return;
    }

    let result;

    try {
      if (editId) {
        // UPDATE
        result = await supabase
          .from("guru")
          .update({ 
            nama: nama.trim(), 
            nip: nip.trim() || null
          })
          .eq("id", editId)
          .select("*");
      } else {
        // INSERT
        result = await supabase
          .from("guru")
          .insert([{ 
            nama: nama.trim(), 
            nip: nip.trim() || null
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
        setGuruList(
          guruList.map((g) =>
            g.id === editId ? newData : g
          )
        );
      } else {
        setGuruList([...guruList, newData]);
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
    setNip("");
    setEditId(null);
  };

  // --- Hapus Data ---
  const handleDelete = async (id) => {
    if (!confirm("Hapus guru ini?")) return;

    try {
      const { error } = await supabase.from("guru").delete().eq("id", id);

      if (error) {
        alert("Gagal menghapus data: " + error.message);
        return;
      }

      setGuruList(guruList.filter((g) => g.id !== id));
      alert("Data berhasil dihapus");
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    }
  };

  // --- Edit Data (prefill form) ---
  const handleEdit = (g) => {
    setEditId(g.id);
    setNama(g.nama);
    setNip(g.nip || "");
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-4 sm:mb-6">Data Guru</h1>

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
                <label className="block text-gray-700 mb-2">Nama</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Masukkan nama guru"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">NIP (Opsional)</label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Masukkan NIP"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded transition duration-200"
              >
                {editId ? "Update Data" : "Tambah Guru"}
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
            <h2 className="text-base sm:text-lg font-semibold mb-4">Daftar Guru</h2>

            {guruList.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="w-full border-collapse border text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-teal-700 text-white">
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">No</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">Nama</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-left">NIP</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 border text-center">Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {guruList.map((g, i) => (
                        <tr key={g.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{i + 1}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{g.nama}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 border">{g.nip || "-"}</td>

                          <td className="py-2 sm:py-3 px-2 sm:px-4 border text-center">
                            <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
                              <button
                                onClick={() => handleEdit(g)}
                                className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm transition duration-200"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDelete(g.id)}
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
                <p>Belum ada data guru.</p>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}