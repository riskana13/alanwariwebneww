import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-100 px-6">
      <div className="bg-white shadow-lg rounded-2xl p-10 max-w-2xl text-center border border-gray-200">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logoma.png" // simpan di folder public/logo.png
            alt="Logo Al Anwari"
            width={150}
            height={150}
            className="rounded-full shadow-md"
          />
        </div>

        {/* Judul */}
        <h1 className="text-4xl md:text-5xl font-bold text-teal-700 mb-4">
          Selamat Datang di <br />
          <span className="text-teal-900">MA Unggulan Al Anwari</span>
        </h1>
        <p className="text-gray-600 text-lg md:text-xl mb-8">
          Sistem Informasi Sekolah — Absensi, Keuangan, dan Pelanggaran
        </p>
      </div>
    </main>
  );
}
