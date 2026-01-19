"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "guru", // default role
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("login")
        .insert([
          {
            username: form.username,
            password: form.password, // masih plaintext
            role: form.role,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          setError("Username sudah digunakan, coba yang lain.");
        } else {
          setError("Gagal mendaftar: " + error.message);
        }
        return;
      }

      setSuccess("Pendaftaran berhasil! Silakan login.");
      setForm({ username: "", password: "", role: "guru" });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Register error:", err);
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 via-white to-teal-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md border border-gray-200 animate-fadeIn"
      >
        {/* Judul */}
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-center text-teal-700">
          Daftar Akun
        </h1>
        <p className="text-gray-500 text-center mb-6 text-sm sm:text-base">
          Buat akun baru untuk masuk ke sistem
        </p>

        {/* Username */}
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          required
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          required
        />

        {/* Role */}
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="guru">Guru</option>
          <option value="admin">Admin</option>
        </select>

        {/* Error & Success */}
        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3 text-center">{success}</p>}

        {/* Tombol */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium py-2 rounded-lg shadow-md hover:from-teal-600 hover:to-teal-700 transition"
        >
          {loading ? "Mendaftar..." : " Daftar"}
        </button>

        {/* Link ke login */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Sudah punya akun?{" "}
          <a href="/login" className="text-teal-600 font-medium hover:underline">
            Login di sini
          </a>
        </p>
      </form>
    </main>
  );
}
