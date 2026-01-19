"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("login")
        .select("*")
        .eq("username", form.username)
        .eq("password", form.password)
        .single();

      if (error || !data) {
        setErrorMsg("Username atau password salah");
      } else {
        localStorage.setItem("user", JSON.stringify(data));
        alert(`Login berhasil sebagai ${data.role}`);
        
        // Redirect berdasarkan role
        if (data.role === "guru") {
          window.location.href = "/guru-dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (err) {
      console.error("Login error:", err.message);
      setErrorMsg("Terjadi kesalahan koneksi");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 via-white to-teal-50 px-4 py-8">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md border border-gray-200 animate-fadeIn"
      >
        {/* Judul */}
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-center text-teal-700">
          Web MA Unggulan Al Anwari
        </h1>
        <p className="text-gray-500 text-center mb-6 text-sm sm:text-base">
          Silakan login untuk masuk ke sistem
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

        {/* Error */}
        {errorMsg && (
          <p className="text-red-500 text-sm mb-3 text-center">{errorMsg}</p>
        )}

        {/* Tombol */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium py-2 rounded-lg shadow-md hover:from-teal-600 hover:to-teal-700 transition"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        {/* Register Link */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Belum punya akun?{" "}
          <a href="/register" className="text-teal-600 font-medium hover:underline">
            Daftar di sini
          </a>
        </p>
      </form>
    </div>
  );
}
