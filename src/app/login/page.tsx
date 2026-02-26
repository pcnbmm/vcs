"use client";
import React, { useState } from "react";
import { Car, User, Lock, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react"; // 1. นำเข้า signIn
import { useRouter } from "next/navigation"; // 2. นำเข้า useRouter

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // 3. สร้าง State สำหรับเก็บค่าจากฟอร์ม
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 4. ฟังก์ชันจัดการการ Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false, // เราจะคุมการย้ายหน้าเอง
    });

    if (res?.error) {
      setError("รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    } else {
      router.push("/dashboard"); // หรือหน้าอื่นที่คุณต้องการ
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* ซ้าย: แบรนดิ้ง (คงเดิม) */}
      <div className="hidden md:flex w-1/2 bg-[#1a2332] flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="z-10 flex flex-col items-center text-center space-y-6">
          <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Car className="text-white" size={48} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-wide">VCS System</h1>
            <p className="text-blue-600 font-medium tracking-widest text-sm mt-2 uppercase">Enterprise Edition</p>
          </div>
        </div>
      </div>

      {/* ขวา: ฟอร์ม Login */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900">Welcome</h2>
            <p className="text-sm text-slate-500 mt-2">กรุณาเข้าสู่ระบบด้วยรหัสพนักงาน</p>
          </div>

          {/* 5. แสดง Error Message ถ้า Login พลาด */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-700">รหัสพนักงาน (Username)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username} // 6. เชื่อมค่า State
                  onChange={(e) => setUsername(e.target.value)} // 7. อัปเดต State
                  placeholder="กรอกรหัสพนักงาน (เช่น DEV)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-700">รหัสผ่าน (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password} // 8. เชื่อมค่า State
                  onChange={(e) => setPassword(e.target.value)} // 9. อัปเดต State
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button พร้อมสถานะ Loading */}
            <button
              type="submit"
              disabled={loading} // 10. ป้องกันการกดซ้ำตอนกำลังโหลด
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  เข้าสู่ระบบ (LOGIN)
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}