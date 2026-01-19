import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Al Anwari",
  description: "Sistem Informasi Sekolah",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-gray-100 text-gray-900 font-sans min-h-screen">
        {/* Navbar */}
        <header className="bg-teal-700 text-white shadow-md">
          <div className="container mx-auto flex justify-between items-center py-4 px-6">
            <h1 className="text-2xl font-semibold tracking-wide">
              MA Unggulan Al Anwari
            </h1>
            <nav className="space-x-6 text-base">
              <Link
                href="/"
                className="hover:text-gray-200 transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                href="/login"
                className="hover:text-gray-200 transition-colors duration-200"
              >
                Login
              </Link>
              <a
                href="/register"
                className="hover:text-gray-200 transition-colors duration-200"
              >
                Register
              </a>
            </nav>
          </div>
        </header>

        {/* Konten Utama */}
        <main className="container mx-auto py-10 px-6 max-w-5xl">
          <div className="bg-white shadow-sm rounded-lg p-8 min-h-[70vh] border border-gray-200">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-teal-700 text-white text-center py-4 mt-10">
          <p className="text-sm">
            © {new Date().getFullYear()} Web Al Anwari — Sistem Informasi
            Sekolah
          </p>
        </footer>
      </body>
    </html>
  );
}
