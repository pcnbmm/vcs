"use client";

import { UserCircle, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Navbar() {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10">
      {/* ซ้าย: ว่างไว้ก่อน */}
      <div />

      {/* ขวา: Profile + Logout */}
      <div className="flex items-center gap-3">
        {/* Profile */}
        <div className="flex items-center gap-3 p-2 rounded-lg">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">
              Name Surname
            </p>
            <p className="text-xs text-slate-500">Role</p>
          </div>
          <UserCircle size={32} className="text-slate-400" />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}
