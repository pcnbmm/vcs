"use client";
import React from "react";
import { Car } from "lucide-react"; //Import ไอคอนรถจาก lucide-react

export default function AssignPage() {
  const pendingCount = 0;

  return (
    // กำหนดความกว้างสูงสุดและจัดให้อยู่ตรงกลางจอ พร้อมเว้นระยะห่างด้านล่าง (space-y-8)
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Square*/}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-6">
        {/* icon */}
        <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
          <Car className="text-white" size={32} />
        </div>

        {/* text */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            จัดรถและคนขับ (Dispatch)
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            มอบหมายรถและคนขับจากนายเวร
          </p>
        </div>
      </div>

      {/* --- (PENDING ASSIGNMENT) --- */}
      <section>
        {/* หัวข้อ Section */}
        <div className="flex items-center gap-3 mb-4 px-2">
          {/* ขีดสีน้ำเงินแนวตั้ง */}
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>

          <h2 className="text-lg font-bold text-slate-900">
            รายการรอจัดสรร (PENDING ASSIGNMENT)
          </h2>

          {/* ตัวเลข Badge สีน้ำเงิน */}
          <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-sm font-bold">
            {pendingCount}
          </span>
        </div>

        {/* กล่องแสดงข้อความ "ไม่มีรายการรอจัดสรร" (Empty State) */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-12 flex items-center justify-center shadow-sm">
          <p className="text-slate-400">ไม่มีรายการรอจัดสรร</p>
        </div>
      </section>
      {/* --- (ASSIGNED CARDS) --- */}
      <section>
        {/* หัวข้อ Section */}
        <div className="flex items-center gap-3 mb-4 px-2">
          {/* ขีดสีน้ำเงินแนวตั้ง */}
          <div className="w-1.5 h-6 bg-green-600 rounded-full"></div>

          <h2 className="text-lg font-bold text-slate-900">แจ้งผลผู้ใช้งาน</h2>

          {/* ตัวเลข Badge สีน้ำเงิน */}
          <span className="bg-green-100 text-green-700 px-3 py-0.5 rounded-full text-sm font-bold">
            {pendingCount}
          </span>
        </div>

        {/* (Empty State) */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-12 flex items-center justify-center shadow-sm">
          <p className="text-slate-400">ไม่มีรายการรอจัดสรร</p>
        </div>
      </section>
    </div>
  );
}
