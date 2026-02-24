import React from 'react';
import { UserCircle } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-end px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-700">เจี๊ยบตัดยางน้อยหน่าทำไม</p>
          <p className="text-xs text-slate-500">Dev</p>
        </div>
        <UserCircle size={32} className="text-slate-400" />
      </div>
    </header>
  );
}