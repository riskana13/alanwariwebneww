"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function BuktiBayarPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("pemasukan")
        .select("*")
        .eq("id", id)
        .single();
      if (!error) setData(data);
    };
    fetchData();
  }, [id, supabase]);

  if (!data) return <p className="text-center mt-10">Memuat data bukti pembayaran...</p>;

  const textWA = `
📘 *Bukti Pembayaran SPP*
----------------------------------
👤 Nama Siswa : ${data.siswa}
🗓️ Bulan : ${data.bulan_pembayaran}
📅 Tanggal : ${data.tanggal}
💰 Jumlah : Rp ${data.jumlah}
📝 Keterangan : ${data.keterangan || "-"}
----------------------------------
Terima kasih telah melakukan pembayaran 🙏
`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(textWA)}`;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-teal-50 p-6">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg">
        <button
          onClick={() => router.push("/keuangan")}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Keuangan
        </button>

        <h1 className="text-2xl font-bold text-center text-teal-800 mb-4">
          Bukti Pembayaran SPP
        </h1>

        <table className="w-full text-sm border border-gray-300">
          <tbody>
            <tr>
              <td className="border px-2 py-1 font-semibold">Nama Siswa</td>
              <td className="border px-2 py-1">{data.siswa}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Tanggal</td>
              <td className="border px-2 py-1">{data.tanggal}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Bulan</td>
              <td className="border px-2 py-1">{data.bulan_pembayaran}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Jumlah</td>
              <td className="border px-2 py-1">Rp {data.jumlah}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Keterangan</td>
              <td className="border px-2 py-1">{data.keterangan}</td>
            </tr>
          </tbody>
        </table>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
        >
          <MessageCircle className="w-5 h-5" /> Kirim via WhatsApp
        </a>
      </div>
    </main>
  );
}