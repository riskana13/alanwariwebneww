"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DataPelanggaran() {
  const [data, setData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("pelanggaran") || "[]");
    setData(stored);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-teal-700 mb-4">Data Pelanggaran Siswa</h2>
      
      {data.length === 0 ? (
        <p className="text-gray-500 mb-4">Belum ada data pelanggaran.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 bg-white shadow-md mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2">Nama/NIS</th>
              <th className="border px-3 py-2">Kelas</th>
              <th className="border px-3 py-2">Pelanggaran</th>
              <th className="border px-3 py-2">Poin</th>
              <th className="border px-3 py-2">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="border px-3 py-2">{item.nama}</td>
                <td className="border px-3 py-2">{item.kelas}</td>
                <td className="border px-3 py-2">{item.pelanggaran}</td>
                <td className="border px-3 py-2 text-center">{item.poin}</td>
                <td className="border px-3 py-2">{item.tanggal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 🔘 Tombol navigasi */}
      <div className="flex gap-4">
        <button
          onClick={() => router.push("/pelanggaran")}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          + Tambah Pelanggaran
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          ⬅ Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
