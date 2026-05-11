"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { 
  Wrench, CarFront, FileText, Calendar, Clock, MapPin, 
  ArrowRight, Save, ShieldAlert, Plus, Trash2 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { showSuccess, showError, showConfirm } from "@/lib/sweetalert";
import { getMaintenanceFormData, saveMaintenance, getLatestCarMileage } from "./actions";
import { useSession } from "next-auth/react";
import flatpickr from "flatpickr";
import { useRef } from "react";
import "flatpickr/dist/flatpickr.min.css";

export default function MaintenancePage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Master Data State
  const [masterData, setMasterData] = useState<{
    cars: any[];
    drivers: any[];
    causes: any[];
    treats: any[];
  }>({
    cars: [],
    drivers: [],
    causes: [],
    treats: [],
  });

  // Form State
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [selectedCause, setSelectedCause] = useState<any>(null);
  const [causeDetail, setCauseDetail] = useState("");
  const [selectedTreats, setSelectedTreats] = useState<any[]>([]);
  
  const [needReplacement, setNeedReplacement] = useState(false);
  
  // Maintenance Details State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState(new Date().toTimeString().slice(0, 5));
  const [entryMileage, setEntryMileage] = useState("");
  
  const [exitDate, setExitDate] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [exitMileage, setExitMileage] = useState("");
  
  const [serviceLocation, setServiceLocation] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [vatPercent, setVatPercent] = useState<string>("7");

  // Spare Items State
  const [spareItems, setSpareItems] = useState<any[]>([
    { name: "", amount: 1, price: 0, hasVat: true }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const entryDateRef = useRef<HTMLInputElement>(null);
  const exitDateRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMaintenanceFormData();
        setMasterData(data);
      } catch (error) {
        console.error("Error fetching master data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Initialize Flatpickr
  useEffect(() => {
    let fpEntry: any;
    let fpExit: any;

    if (entryDateRef.current) {
      fpEntry = flatpickr(entryDateRef.current, {
        enableTime: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i",
        defaultDate: new Date(),
        onChange: (dates) => {
          if (dates && dates.length > 0) {
            const d = dates[0];
            const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const isoTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            setEntryDate(isoDate);
            setEntryTime(isoTime);
          }
        },
      });
    }

    if (exitDateRef.current) {
      fpExit = flatpickr(exitDateRef.current, {
        enableTime: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i",
        onChange: (dates) => {
          if (dates && dates.length > 0) {
            const d = dates[0];
            const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const isoTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            setExitDate(isoDate);
            setExitTime(isoTime);
          }
        },
      });
    }

    return () => {
      fpEntry?.destroy();
      fpExit?.destroy();
    };
  }, [isLoading]); // Re-init after loading master data to ensure refs are attached

  const addSpareItem = () => {
    setSpareItems([...spareItems, { name: "", amount: 1, price: 0, hasVat: true }]);
  };

  const removeSpareItem = (index: number) => {
    const newItems = spareItems.filter((_, i) => i !== index);
    setSpareItems(newItems.length ? newItems : [{ name: "", amount: 1, price: 0, hasVat: true }]);
  };

  const handleCarChange = async (val: any) => {
    setSelectedCar(val);
    if (val) {
      try {
        const res = await getLatestCarMileage(parseInt(val.value));
        if (res.success) {
          setEntryMileage(String(res.mile_end || ""));
        }
      } catch (error) {
        console.error("Error fetching mileage:", error);
      }
    } else {
      setEntryMileage("");
    }
  };

  const updateSpareItem = (index: number, field: string, value: any) => {
    const newItems = [...spareItems];
    newItems[index][field] = value;
    setSpareItems(newItems);
  };

  // Calculations
  const subtotal = spareItems.reduce((acc, item) => acc + (parseFloat(item.price || 0) * parseInt(item.amount || 0)), 0);
  const vatableSubtotal = spareItems.reduce((acc, item) => {
    if (item.hasVat) {
      return acc + (parseFloat(item.price || 0) * parseInt(item.amount || 0));
    }
    return acc;
  }, 0);
  
  const vatAmount = (vatableSubtotal * parseFloat(vatPercent || "0")) / 100;
  const grandTotal = subtotal + vatAmount;

  // React-Select custom styles
  const reactSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: "0.75rem",
      padding: "0.25rem",
      borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      cursor: "pointer",
      "&:hover": { borderColor: "#3b82f6" },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? "#eff6ff" : state.isFocused ? "#f8fafc" : "#ffffff",
      color: "#000000",
      cursor: "pointer",
      fontWeight: "bold",
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "#eff6ff",
      borderRadius: "0.5rem",
      padding: "2px 4px",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "#1e40af",
      fontWeight: "bold",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#000000",
      fontWeight: "bold",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#000000",
      fontWeight: "bold",
      opacity: 0.6,
    }),
    input: (base: any) => ({
      ...base,
      color: "#000000",
      fontWeight: "bold",
    }),
  };

  const resetForm = () => {
    setSelectedCar(null);
    setSelectedCause(null);
    setCauseDetail("");
    setNeedReplacement(false);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryTime(new Date().toTimeString().slice(0, 5));
    setEntryMileage("");
    setExitDate("");
    setExitTime("");
    setExitMileage("");
    setSelectedTreats([]);
    setServiceLocation("");
    setSelectedDriver(null);
    setVatPercent("7");
    setSpareItems([{ name: "", amount: 1, price: 0, hasVat: true }]);
    
    // Clear flatpickr inputs
    if (entryDateRef.current) (entryDateRef.current as any)._flatpickr?.setDate(new Date());
    if (exitDateRef.current) (exitDateRef.current as any)._flatpickr?.clear();
  };

  const handleSubmit = async () => {
    if (!selectedCar) {
      showError("กรุณาเลือกยานพาหนะที่ต้องการแจ้งซ่อม");
      return;
    }
    
    if (!selectedCause && !causeDetail) {
      showError("กรุณาระบุเหตุเสีย");
      return;
    }

    if (!needReplacement) {
      if (!entryDate || !entryMileage || !serviceLocation || !selectedDriver) {
        showError("กรุณากรอกข้อมูลการซ่อมบำรุงให้ครบถ้วน");
        return;
      }
    }

    const confirmed = await showConfirm("ยืนยันการบันทึกข้อมูลการแจ้งซ่อม?");
    if (!confirmed) return;

    setIsSubmitting(true);
    
    const treatIds = selectedTreats.map(t => parseInt(t.value));

    const res = await saveMaintenance({
      car_id: parseInt(selectedCar.value),
      maintenance_date: entryDate,
      start_time: entryTime,
      emp_id: selectedDriver ? parseInt(selectedDriver.value) : 0,
      station_name: serviceLocation,
      cause_id: selectedCause?.value && selectedCause.value !== "other" ? parseInt(selectedCause.value) : undefined,
      cause_detail: causeDetail,
      treat_ids: treatIds,
      mile_car_in: parseInt(entryMileage || "0"),
      mile_car_out: exitMileage ? parseInt(exitMileage) : undefined,
      finish_date: exitDate,
      finish_time: exitTime,
      vat: parseFloat(vatPercent),
      spare_items: spareItems.filter(item => item.name.trim() !== "").map(item => ({
        name: item.name,
        amount: parseInt(item.amount),
        price: parseFloat(item.price)
      })),
      cre_by: session?.user?.name || "SYSTEM",
    });

    setIsSubmitting(false);

    if (res.success) {
      showSuccess("บันทึกข้อมูลสำเร็จ!");
      if (needReplacement) {
        router.push("/replace-car");
      } else {
        resetForm();
        router.refresh();
      }
    } else {
      showError("เกิดข้อผิดพลาด: " + res.error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Section 1: Vehicle & Breakdown Info */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-6 text-black">
            <CarFront size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold">1. ข้อมูลยานพาหนะและเหตุเสีย</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-black block">ยานพาหนะ (ทะเบียน) <span className="text-rose-500">*</span></label>
              <Select
                options={masterData.cars}
                value={selectedCar}
                onChange={handleCarChange}
                placeholder="ค้นหาหรือเลือกทะเบียนรถ..."
                styles={reactSelectStyles}
                isClearable
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-black block">สาเหตุการซ่อม / การเข้าศูนย์ <span className="text-rose-500">*</span></label>
              <Select
                options={[...masterData.causes, { value: "other", label: "+ อื่นๆ (ระบุเอง)" }]}
                value={selectedCause}
                onChange={(val: any) => {
                  setSelectedCause(val);
                  if (val?.value !== "other") setCauseDetail("");
                }}
                placeholder="เลือกสาเหตุการซ่อม..."
                styles={reactSelectStyles}
                isClearable
              />
            </div>

            {(selectedCause?.value === "other" || !selectedCause) && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-black block">ระบุรายละเอียดสาเหตุ <span className="text-rose-500">*</span></label>
                <textarea
                  value={causeDetail}
                  onChange={(e) => setCauseDetail(e.target.value)}
                  placeholder="ระบุอาการผิดปกติ หรือเหตุผลที่ต้องส่งซ่อม..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  rows={3}
                />
              </div>
            )}
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
                <h3 className="text-base font-bold text-black">ต้องการขอใช้งานรถทดแทนหรือไม่?</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">หากต้องการ ระบบจะนำคุณไปยังหน้าฟอร์มกรอกขอรถทดแทนหลังจากบันทึกข้อมูลนี้</p>
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
              <span className="ml-3 text-sm font-bold text-black">{needReplacement ? 'ต้องการรถทดแทน' : 'ไม่ต้องการ'}</span>
            </label>
          </div>
        </div>

        {/* Section 3: Maintenance Details (Shown if NOT needReplacement) */}
        {!needReplacement && (
          <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-6 text-black">
              <FileText size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold">2. ข้อมูลการซ่อมบำรุง</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Entry Info */}
              <div className="space-y-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-black flex items-center gap-2 border-b border-blue-100 pb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">IN</span>
                  นำรถเข้าซ่อม
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-black uppercase opacity-60">วันเวลาที่นำรถเข้า</label>
                    <div className="relative">
                      <input 
                        ref={entryDateRef}
                        type="text" 
                        placeholder="วัน/เดือน/ปี --:--" 
                        readOnly
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm" 
                      />
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black uppercase opacity-60">เลขไมล์ก่อนซ่อม</label>
                  <input type="number" value={entryMileage} onChange={(e) => setEntryMileage(e.target.value)} placeholder="เช่น 150000" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Exit Info */}
              <div className="space-y-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <h3 className="font-bold text-black flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">OUT</span>
                  นำรถออกจากซ่อม
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-black uppercase opacity-60">วันเวลาที่นำรถออก (ถ้ามี)</label>
                    <div className="relative">
                      <input 
                        ref={exitDateRef}
                        type="text" 
                        placeholder="วัน/เดือน/ปี --:--" 
                        readOnly
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm" 
                      />
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black uppercase opacity-60">เลขไมล์หลังซ่อม (ถ้ามี)</label>
                  <input type="number" value={exitMileage} onChange={(e) => setExitMileage(e.target.value)} placeholder="เช่น 150050" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              
              {/* Other Details */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-black block">การบำรุงรักษาที่ได้รับ (เลือกได้หลายรายการ) <span className="text-rose-500">*</span></label>
                  <Select
                    isMulti
                    options={masterData.treats}
                    value={selectedTreats}
                    onChange={(vals: any) => setSelectedTreats(vals || [])}
                    placeholder="เลือกการบำรุงรักษา..."
                    styles={reactSelectStyles}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-black block">สถานที่ให้บริการซ่อม <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={serviceLocation} 
                      onChange={(e) => setServiceLocation(e.target.value)} 
                      placeholder="เช่น อู่สมชายการช่าง..." 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-black block">พนักงานขับรถที่นำไปซ่อม <span className="text-rose-500">*</span></label>
                  <Select
                    options={masterData.drivers}
                    value={selectedDriver}
                    onChange={setSelectedDriver}
                    placeholder="เลือกพนักงานขับรถ..."
                    styles={reactSelectStyles}
                    isClearable
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-black block">ภาษี VAT (%)</label>
                  <input 
                    type="number" 
                    value={vatPercent} 
                    onChange={(e) => setVatPercent(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Spare Parts */}
            <div className="mt-8 border-t border-slate-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-black">
                  <Wrench size={20} className="text-blue-600" />
                  <h2 className="text-lg font-bold">3. รายการอะไหล่ / ค่าบริการ</h2>
                </div>
                <button 
                  type="button"
                  onClick={addSpareItem}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-lg cursor-pointer"
                >
                  <Plus size={16} />
                  เพิ่มรายการ
                </button>
              </div>

              <div className="space-y-4">
                {spareItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="md:col-span-5 space-y-1.5">
                      <label className="text-xs font-bold text-black uppercase opacity-60">ชื่ออะไหล่ / บริการ</label>
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => updateSpareItem(index, "name", e.target.value)}
                        placeholder="เช่น น้ำมันเครื่อง..." 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-black uppercase opacity-60">จำนวน</label>
                      <input 
                        type="number" 
                        value={item.amount} 
                        onChange={(e) => updateSpareItem(index, "amount", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-xs font-bold text-black uppercase opacity-60">ราคาต่อหน่วย</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                        <input 
                          type="number" 
                          value={item.price} 
                          onChange={(e) => updateSpareItem(index, "price", e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1 flex flex-col items-center justify-center space-y-1.5">
                      <label className="text-xs font-bold text-black uppercase opacity-60">VAT</label>
                      <input 
                        type="checkbox" 
                        checked={item.hasVat} 
                        onChange={(e) => updateSpareItem(index, "hasVat", e.target.checked)}
                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button 
                        type="button"
                        onClick={() => removeSpareItem(index)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-bold text-sm cursor-pointer"
                      >
                        <Trash2 size={18} />
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex flex-col md:flex-row justify-end items-end gap-4">
                <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-black min-w-[200px]">
                  <p className="text-xs font-bold opacity-60 uppercase tracking-wider mb-1">รวมราคา (ไม่รวม VAT)</p>
                  <p className="text-xl font-bold">฿{subtotal.toLocaleString()}</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-black min-w-[200px]">
                  <p className="text-xs font-bold opacity-60 uppercase tracking-wider mb-1">ภาษี VAT ({vatPercent}%)</p>
                  <p className="text-xl font-bold text-blue-600">฿{vatAmount.toLocaleString()}</p>
                </div>

                <div className="bg-blue-600 px-8 py-5 rounded-3xl text-white shadow-xl shadow-blue-200 min-w-[250px]">
                  <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">ยอดรวมทั้งสิ้น (รวม VAT)</p>
                  <p className="text-3xl font-black">
                    ฿{grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer Actions */}
        <div className="p-6 bg-slate-900 flex justify-end items-center gap-4">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-500/20 cursor-pointer ${needReplacement ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
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
