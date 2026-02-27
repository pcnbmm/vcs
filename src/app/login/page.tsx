"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Car, User, Lock, Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* ซ้าย: แบรนดิ้ง (ซ่อนในมือถือ, แสดงครึ่งจอในแท็บเล็ต/คอม) */}
      <div className="hidden md:flex w-1/2 bg-[#1a2332] flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* วงกลมตกแต่งฉากหลัง */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="z-10 flex flex-col items-center text-center space-y-6">
          <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Car className="text-white" size={48} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-wide">
              VCS System
            </h1>
            <p className="text-blue-600 font-medium tracking-widest text-sm mt-2 uppercase">
              Enterprise Edition
            </p>
          </div>
        </div>
      </div>

      {/* ขวา: ฟอร์ม Login */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900">Welcome</h2>
            <p className="text-sm text-slate-500 mt-2">
              กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 flex justify-center rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-700">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-700">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-600 group-hover:text-slate-900 transition-colors">
                  จดจำฉันไว้
                </span>
              </label>
              <a
                href="#"
                className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-all"
              >
                ลืมรหัสผ่าน?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <LogIn size={20} />
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (LOGIN)"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
