"use client";
import React from "react";
import { Construction, Layout } from "lucide-react";

export default function ขอใช้รถส่วนภูมิภาคPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-700">
      <div className="relative">
        <div className="absolute -inset-4 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <div className="relative p-8 bg-white rounded-3xl shadow-xl border border-blue-50 text-blue-600">
          <Layout size={48} className="animate-bounce" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          ขอใช้รถส่วนภูมิภาค
        </h1>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">
          หน้านี้กำลังอยู่ระหว่างการพัฒนา... คุณสามารถเริ่มแก้ไขไฟล์ที่ <br/>
          <code className="text-xs bg-slate-100 px-2 py-1 rounded mt-2 inline-block font-mono">
            src/app/(workspace)/bookinglocal/page.tsx
          </code>
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
        <Construction size={14} />
        UNDER CONSTRUCTION
      </div>
    </div>
  );
}
