"use client";

import React, { useState } from "react";
import Select from "react-select";
import { Wrench, CarFront, FileText, Calendar, Clock, MapPin, User, ArrowRight, Save, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { showSuccess, showError, showConfirm } from "@/lib/sweetalert";

// --- Mock Data ---
const MOCK_CARS = [
  { value: "1", label: "กท 1234 (Toyota Revo)", number: "กท 1234", brand: "Toyota" },
  { value: "2", label: "ขข 9999 (Honda City)", number: "ขข 9999", brand: "Honda" },
  { value: "3", label: "นค 5555 (Isuzu D-Max)", number: "นค 5555", brand: "Isuzu" },
];

const MOCK_DRIVERS = [
  { value: "1", label: "นาย สมชาย ใจดี" },
  { value: "2", label: "นาย สมศักดิ์ รักชาติ" },
  { value: "3", label: "นาย สมปอง ทองดี" },
];

const MAINTENANCE_TYPES = [
  { value: "electrical", label: "ระบบไฟฟ้า" },
  { value: "tires", label: "ยาง" },
  { value: "lighting", label: "ระบบส่องสว่าง" },
  { value: "suspension", label: "ช่วงล่าง" },
  { value: "horn", label: "แตร" },
  { value: "brakes", label: "ระบบเบรก" },
  { value: "wipers", label: "ใบปัดน้ำฝน" },
  { value: "battery", label: "แบตเตอรี่" },
  { value: "fluids", label: "ของเหลวต่างๆ" },
  { value: "ac", label: "ระบบปรับอากาศ" },
  { value: "body", label: "ตัวถัง" },
  { value: "radiator", label: "หม้อน้ำ" },
];

export default function MaintenancePage() {
  const router = useRouter();
  
  // Form State
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [breakdownReason, setBreakdownReason] = useState("");
  const [needReplacement, setNeedReplacement] = useState(false);
  
  // Maintenance Details State
  const [entryDate, setEntryDate] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [entryMileage, setEntryMileage] = useState("");
  
  const [exitDate, setExitDate] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [exitMileage, setExitMileage] = useState("");
  
  const [selectedMaintenances, setSelectedMaintenances] = useState<any[]>([]);
  const [serviceLocation, setServiceLocation] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // React-Select custom styles
  const reactSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: "0.75rem",
      padding: "0.25rem",
      borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": { borderColor: "#3b82f6" },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "#eff6ff",
      borderRadius: "0.5rem",
      padding: "2px",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "#1d4ed8",
      fontWeight: "600",
      fontSize: "0.75rem",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: "#1d4ed8",
      "&:hover": { backgroundColor: "#dbeafe", color: "#1e3a8a" },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? "#eff6ff" : state.isFocused ? "#f8fafc" : "#ffffff",
      color: "#0f172a",
      cursor: "pointer",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#0f172a",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#94a3b8",
    }),
  };

  const handleSubmit = async () => {
    if (!selectedCar) {
      showError("กรุณาเลือกยานพาหนะที่ต้องการแจ้งซ่อม");
      return;
    }
    if (!breakdownReason) {
      showError("กรุณาระบุเหตุเสีย");
      return;
    }

    // บังคับกรอกข้อมูลซ่อมบำรุงเพิ่มเติมเสมอ
    if (!entryDate || !entryMileage || selectedMaintenances.length === 0 || !serviceLocation || !selectedDriver) {
      showError("กรุณากรอกข้อมูลการซ่อมบำรุงให้ครบถ้วน");
      return;
    }

    const confirmed = await showConfirm("ยืนยันการบันทึกข้อมูลการแจ้งซ่อม?");
    if (!confirmed) return;

    setIsSubmitting(true);
    
    // Simulate API Call
    setTimeout(() => {
      setIsSubmitting(false);
      showSuccess("บันทึกข้อมูลสำเร็จ!");
      
      if (needReplacement) {
        // นำทางไปยังหน้าจัดการรถทดแทน (สมมติว่าเป็น /replace-car หรือ /replacement)
        router.push("/replace-car"); // URL นี้อาจต้องปรับตามที่มีอยู่จริง
      } else {
        // กลับไปหน้ารายการหรือล้างฟอร์ม
        router.push("/maintenance");
      }
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Section 1: Vehicle & Breakdown Info */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-6 text-slate-800">
            <CarFront size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold">1. ข้อมูลยานพาหนะและเหตุเสีย</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">ยานพาหนะ (ทะเบียน) <span className="text-rose-500">*</span></label>
              <Select
                options={MOCK_CARS}
                value={selectedCar}
                onChange={setSelectedCar}
                placeholder="ค้นหาหรือเลือกทะเบียนรถ..."
                styles={reactSelectStyles}
                isClearable
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 block">เหตุที่เสีย / อาการเบื้องต้น <span className="text-rose-500">*</span></label>
              <textarea
                value={breakdownReason}
                onChange={(e) => setBreakdownReason(e.target.value)}
                placeholder="ระบุอาการผิดปกติ หรือเหตุผลที่ต้องส่งซ่อม..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Replacement Vehicle Toggle */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div className="flex gap-4">
              <div className={`p-3 rounded-2xl transition-colors ${needReplacement ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ต้องการขอใช้งานรถทดแทนหรือไม่?</h3>
                <p className="text-sm text-slate-500 mt-1">หากต้องการ ระบบจะนำคุณไปยังหน้าฟอร์มกรอกขอรถทดแทนหลังจากบันทึกข้อมูลนี้</p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={needReplacement}
                onChange={(e) => setNeedReplacement(e.target.checked)}
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-bold text-slate-700">{needReplacement ? 'ต้องการรถทดแทน' : 'ไม่ต้องการ'}</span>
            </label>
          </div>
        </div>

        {/* Section 3: Maintenance Details */}
        <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
              <FileText size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold">2. ข้อมูลการซ่อมบำรุง</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Entry Info */}
              <div className="space-y-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-800 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">IN</span>
                  นำรถเข้าซ่อม
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">วันที่เข้า</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">เวลาเข้า</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">เลขไมล์ก่อนซ่อม</label>
                  <input type="number" value={entryMileage} onChange={(e) => setEntryMileage(e.target.value)} placeholder="เช่น 150000" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Exit Info */}
              <div className="space-y-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">OUT</span>
                  นำรถออกจากซ่อม
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">วันที่ออก (ถ้ามี)</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">เวลาออก (ถ้ามี)</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">เลขไมล์หลังซ่อม (ถ้ามี)</label>
                  <input type="number" value={exitMileage} onChange={(e) => setExitMileage(e.target.value)} placeholder="เช่น 150050" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              
              {/* Other Details */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 block">การบำรุงรักษาที่ได้รับ <span className="text-rose-500">*</span></label>
                  <Select
                    isMulti
                    options={MAINTENANCE_TYPES}
                    value={selectedMaintenances}
                    onChange={(val: any) => setSelectedMaintenances(val)}
                    placeholder="เลือกรายการซ่อมบำรุง (เลือกได้หลายรายการ)..."
                    styles={reactSelectStyles}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">สถานที่ให้บริการซ่อม <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={serviceLocation} 
                      onChange={(e) => setServiceLocation(e.target.value)} 
                      placeholder="เช่น อู่สมชายการช่าง, ศูนย์ Toyota รังสิต..." 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">พนักงานขับรถ <span className="text-rose-500">*</span></label>
                  <Select
                    options={MOCK_DRIVERS}
                    value={selectedDriver}
                    onChange={setSelectedDriver}
                    placeholder="เลือกพนักงานขับรถที่นำไปซ่อม..."
                    styles={reactSelectStyles}
                    isClearable
                  />
                </div>
              </div>
            </div>
          </div>
        
        {/* Footer Actions */}
        <div className="p-6 bg-slate-900 flex justify-end items-center gap-4">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-500/20 ${needReplacement ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : needReplacement ? (
              <ArrowRight size={20} />
            ) : (
              <Save size={20} />
            )}
            {needReplacement ? 'บันทึก และขอรถทดแทน' : 'บันทึกข้อมูลการซ่อม'}
          </button>
        </div>
      </div>
    </div>
  );
}
