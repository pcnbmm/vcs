"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { 
  Wrench, CarFront, FileText, Calendar, Clock, MapPin, 
  ArrowRight, Save, ShieldAlert, Plus, Trash2, History,
  Eye, X, Info, Edit2, Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { showSuccess, showError, showConfirm } from "@/lib/sweetalert";
import { getMaintenanceFormData, saveMaintenance, getLatestCarMileage, getMaintenanceHistory } from "./actions";
import { useSession } from "next-auth/react";
import flatpickr from "flatpickr";
import { useRef } from "react";
import "flatpickr/dist/flatpickr.min.css";
import { DataTable } from "@/components/ui/DataTable";

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
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  
  // Maintenance Details State
  const [entryDate, setEntryDate] = useState("");
  const [entryTime, setEntryTime] = useState("");
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

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Incident State
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState(new Date().toTimeString().slice(0, 5));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const entryDateRef = useRef<HTMLInputElement>(null);
  const exitDateRef = useRef<HTMLInputElement>(null);
  const incidentDateRef = useRef<HTMLInputElement>(null);

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

  const fetchHistory = async () => {
    if (!session?.user?.name) return;
    setIsLoading(true);
    const res = await getMaintenanceHistory(session.user.name);
    if (res.success) {
      setHistoryData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const filteredHistory = historyData.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const carNo = (item.vc_car_master?.car_number || "").toLowerCase();
    const carBrand = (item.vc_car_master?.vc_car_brand?.car_brand_name || "").toLowerCase();
    const cause = (item.vc_maintenance_cause?.cause_detail || item.cause_detail || "").toLowerCase();
    return carNo.includes(q) || carBrand.includes(q) || cause.includes(q);
  });

  // Initialize Flatpickr
  useEffect(() => {
    let fpIncident: any;
    let fpEntry: any;
    let fpExit: any;

    if (incidentDateRef.current) {
      fpIncident = flatpickr(incidentDateRef.current, {
        enableTime: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i",
        defaultDate: incidentDate ? new Date(`${incidentDate}T${incidentTime || "00:00"}`) : new Date(),
        onChange: (dates) => {
          if (dates && dates.length > 0) {
            const d = dates[0];
            const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const isoTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            setIncidentDate(isoDate);
            setIncidentTime(isoTime);
          }
        },
      });
    }

    if (entryDateRef.current) {
      fpEntry = flatpickr(entryDateRef.current, {
        enableTime: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i",
        defaultDate: entryDate ? new Date(`${entryDate}T${entryTime || "00:00"}`) : undefined,
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
        defaultDate: exitDate ? new Date(`${exitDate}T${exitTime || "00:00"}`) : undefined,
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
      fpIncident?.destroy();
      fpEntry?.destroy();
      fpExit?.destroy();
    };
  }, [isLoading, activeTab]);

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
      if (!val.isRental) {
        setNeedReplacement(false);
      }
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
  const subtotal = spareItems.reduce((acc, item) => acc + (parseFloat(item.price || 0) * parseInt(item.amount || 1)), 0);
  const vatableSubtotal = spareItems.reduce((acc, item) => {
    if (item.hasVat) {
      return acc + (parseFloat(item.price || 0) * parseInt(item.amount || 1));
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
    setIncidentDate(new Date().toISOString().split('T')[0]);
    setIncidentTime(new Date().toTimeString().slice(0, 5));
    setSelectedCause(null);
    setCauseDetail("");
    setSelectedTreats([]);
    setNeedReplacement(false);
    setEntryDate("");
    setEntryTime("");
    setEntryMileage("");
    setExitDate("");
    setExitTime("");
    setExitMileage("");
    setServiceLocation("");
    setSelectedDriver(null);
    setVatPercent("7");
    setSpareItems([{ name: "", amount: 1, price: 0, hasVat: true }]);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setIsEditing(true);
    setEditingId(item.maintenance_item_id);
    setActiveTab("form");
    
    setSelectedCar({
      value: item.car_id.toString(),
      label: `${item.vc_car_master?.car_number} (${item.vc_car_master?.vc_car_brand?.car_brand_name || ""})`
    });

    if (item.incident_date) {
      setIncidentDate(new Date(item.incident_date).toISOString().split('T')[0]);
      setIncidentTime(item.incident_time || "");
    }

    if (item.vc_maintenance_cause) {
      setSelectedCause({
        value: item.cause_id.toString(),
        label: item.vc_maintenance_cause.cause_detail
      });
    }

    const treats = item.vc_maintenance_treat?.map((t: any) => ({
      value: t.treat_id.toString(),
      label: t.vc_treat?.treat_name
    })) || [];
    setSelectedTreats(treats);

    if (item.maintenance_date) {
      setEntryDate(new Date(item.maintenance_date).toISOString().split('T')[0]);
      setEntryTime(item.start_time || "");
      setEntryMileage(item.mile_car_in?.toString() || "");
    }

    setServiceLocation(item.station_name || "");
    
    if (item.emp_id) {
       const driver = masterData.drivers.find(d => d.value === item.emp_id.toString());
       setSelectedDriver(driver || null);
    }

    if (item.finish_date) {
      setExitDate(new Date(item.finish_date).toISOString().split('T')[0]);
      setExitTime(item.finish_time || "");
      setExitMileage(item.mile_car_out?.toString() || "");
    }

    if (item.vc_maintenance_spare_item?.length > 0) {
      setSpareItems(item.vc_maintenance_spare_item.map((s: any) => ({
        name: s.spare_item_name,
        amount: s.spare_amount,
        price: s.spare_price,
        hasVat: true
      })));
    } else {
      setSpareItems([{ name: "", amount: 1, price: 0, hasVat: true }]);
    }

    setVatPercent(item.vat?.toString() || "7");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCar) return showError("กรุณาเลือกยานพาหนะ");
    if (!incidentDate || !incidentTime) return showError("กรุณาระบุวันเวลาที่เกิดเหตุเสีย");
    if (!selectedCause && !causeDetail) return showError("กรุณาระบุสาเหตุการซ่อม");

    setIsSubmitting(true);
    try {
      const res = await saveMaintenance({
        maintenance_item_id: editingId || undefined,
        car_id: parseInt(selectedCar.value),
        incident_date: incidentDate,
        incident_time: incidentTime,
        maintenance_date: entryDate || undefined,
        start_time: entryTime || undefined,
        emp_id: selectedDriver ? parseInt(selectedDriver.value) : undefined,
        station_name: serviceLocation || undefined,
        cause_id: selectedCause ? parseInt(selectedCause.value) : undefined,
        cause_detail: causeDetail || undefined,
        treat_ids: selectedTreats.map(t => parseInt(t.value)),
        mile_car_in: entryMileage ? parseInt(entryMileage) : undefined,
        mile_car_out: exitMileage ? parseInt(exitMileage) : undefined,
        finish_date: exitDate || undefined,
        finish_time: exitTime || undefined,
        vat: parseFloat(vatPercent || "0"),
        spare_items: spareItems.filter(i => i.name.trim()),
        cre_by: session?.user?.name || "Unknown",
      });

      if (res.success) {
        showSuccess(isEditing ? "แก้ไขข้อมูลสำเร็จ" : "บันทึกข้อมูลสำเร็จ");
        resetForm();
        if (needReplacement && !isEditing) {
          router.push(`/replacement?car_id=${selectedCar.value}&maintenance_id=${res.maintenance_id}`);
        }
      } else {
        showError(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error(error);
      showError("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && masterData.cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">กำลังโหลดข้อมูลระบบ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-200">
            <Wrench size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">ระบบแจ้งซ่อมและบำรุงรักษา</h1>
            <p className="text-slate-500 font-medium mt-1">จัดการรายการส่งซ่อมและประวัติการบำรุงรักษายานพาหนะ</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit mb-8">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "form" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Plus size={18} />
          แจ้งซ่อมใหม่
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <History size={18} />
          ประวัติการแจ้งซ่อม
        </button>
      </div>

      {activeTab === "form" ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section 1: Vehicle & Breakdown Info */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-6 text-black">
              <CarFront size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold">1. ข้อมูลยานพาหนะและเหตุเสีย</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CarFront size={14} className="text-blue-500" />
                  ยานพาหนะ (ทะเบียน) <span className="text-rose-500">*</span>
                </label>
                <Select
                  options={masterData.cars}
                  value={selectedCar}
                  onChange={handleCarChange}
                  placeholder="ค้นหาหรือเลือกทะเบียนรถ..."
                  styles={reactSelectStyles}
                  isClearable
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock size={14} className="text-blue-500" />
                  วันเวลาที่เกิดเหตุเสีย <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={incidentDateRef}
                    type="text"
                    placeholder="เลือกวันเวลาที่เกิดเหตุเสีย..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
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

          {/* Toggle Section: Visible only for Rental Cars */}
          {selectedCar?.isRental && (
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${needReplacement ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black">ใช้งานรถทดแทนหรือไม่?</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {needReplacement 
                        ? "ระบบจะข้ามส่วนการซ่อม และพาคุณไปหน้าขอรถทดแทนทันทีหลังบันทึก" 
                        : "หากต้องการ ระบบจะนำคุณไปยังหน้าฟอร์มกรอกขอรถทดแทนหลังจากบันทึกข้อมูลนี้"}
                    </p>
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
                  <span className="ml-3 text-sm font-bold text-black">{needReplacement ? 'ใช้งานรถทดแทน' : 'ไม่ใช้งานรถทดแทน'}</span>
                </label>
              </div>
            </div>
          )}

          {!needReplacement && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              {/* Section 2: Maintenance Details */}
              <div className="p-8 border-b border-slate-100">
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
              </div>

              {/* Section 3: Spare Parts */}
              <div className="p-8">
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
          
          {/* Footer Actions: Always Visible */}
          <div className="p-6 bg-slate-900 flex justify-end items-center gap-4">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                ยกเลิกการแก้ไข
              </button>
            )}
            <button 
              type="submit"
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
              {isEditing ? "ยืนยันการแก้ไขข้อมูล" : (needReplacement ? 'บันทึก และขอรถทดแทน' : 'บันทึกข้อมูลการซ่อม')}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-black">ประวัติการแจ้งซ่อมและบำรุงรักษา</h2>
              <p className="text-sm text-slate-500 font-medium">รายการแจ้งซ่อมทั้งหมดในระบบ</p>
            </div>
            <button 
              onClick={fetchHistory}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              title="Refresh"
            >
              <History size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-slate-50 bg-white">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาทะเบียนรถ, ยี่ห้อ, หรือสาเหตุการเสีย..."
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="p-4">
            <DataTable
              columns={[
                {
                  header: "ทะเบียนรถ",
                  cell: (row) => (
                    <div>
                      <p className="font-bold text-black">{row.vc_car_master?.car_number}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{row.vc_car_master?.vc_car_brand?.car_brand_name}</p>
                    </div>
                  )
                },
                {
                  header: "วันเวลาที่แจ้งเหตุ",
                  cell: (item: any) => (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">
                        {item.incident_date ? new Date(item.incident_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{item.incident_time || "-"} น.</span>
                    </div>
                  )
                },
                {
                  header: "วันเวลานำเข้าซ่อม",
                  cell: (item: any) => (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-600">
                        {item.maintenance_date ? new Date(item.maintenance_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                      </span>
                      <span className="text-xs text-slate-400">{item.start_time || "-"} น.</span>
                    </div>
                  )
                },
                {
                  header: "ยอดรวม",
                  cell: (row) => {
                    const subtotal = row.vc_maintenance_spare_item?.reduce((sum: number, item: any) => sum + ((item.spare_amount || 0) * (item.spare_price || 0)), 0) || 0;
                    const vat = row.vat || 0;
                    const total = subtotal + (subtotal * vat / 100);
                    return (
                      <span className="font-bold text-blue-600">
                        ฿{total.toLocaleString()}
                      </span>
                    );
                  }
                },
                {
                  header: "สถานะ",
                  cell: (row) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.finish_date ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {row.finish_date ? 'เสร็จสิ้น' : 'กำลังซ่อม'}
                    </span>
                  )
                },
                {
                  header: "จัดการ",
                  className: "text-right",
                  cell: (item: any) => (
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedHistoryItem(item)}
                        className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  )
                }
              ]}
              data={filteredHistory}
              isLoading={isLoading}
              rowKey={(row) => row.maintenance_item_id}
            />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedHistoryItem(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">รายละเอียดการแจ้งซ่อม</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    ID: #{selectedHistoryItem.maintenance_item_id} • {selectedHistoryItem.vc_car_master?.car_number}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedHistoryItem(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
              {/* Car & Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ทะเบียนรถ</p>
                  <p className="text-sm font-bold text-black">{selectedHistoryItem.vc_car_master?.car_number} ({selectedHistoryItem.vc_car_master?.vc_car_brand?.car_brand_name})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">วันที่แจ้งซ่อม</p>
                  <p className="text-sm font-bold text-black">
                    {selectedHistoryItem.maintenance_date ? new Date(selectedHistoryItem.maintenance_date).toLocaleDateString("th-TH") : "-"}
                    <span className="ml-2 text-slate-400">{selectedHistoryItem.start_time} น.</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สาเหตุ/อาการ</p>
                  <p className="text-sm font-bold text-slate-700">{selectedHistoryItem.vc_maintenance_cause?.cause_detail || selectedHistoryItem.cause_detail || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สถานที่ส่งซ่อม</p>
                  <p className="text-sm font-bold text-slate-700">{selectedHistoryItem.station_name || "-"}</p>
                </div>
              </div>

              {/* Maintenance Tasks (Treats) */}
              {selectedHistoryItem.vc_maintenance_treat?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-black uppercase tracking-widest flex items-center gap-2">
                    <Wrench size={14} className="text-blue-600" />
                    การบำรุงรักษาที่ได้รับ
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHistoryItem.vc_maintenance_treat.map((t: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                        {t.vc_treat?.treat_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Spare Items Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-black uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} className="text-blue-600" />
                  รายการอะไหล่และค่าบริการ
                </h4>
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">รายการ</th>
                        <th className="px-4 py-3 text-center">จำนวน</th>
                        <th className="px-4 py-3 text-right">ราคา/หน่วย</th>
                        <th className="px-4 py-3 text-right">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedHistoryItem.vc_maintenance_spare_item?.map((item: any, i: number) => (
                        <tr key={i} className="text-slate-700 font-bold">
                          <td className="px-4 py-3">{item.spare_item_name}</td>
                          <td className="px-4 py-3 text-center">{item.spare_amount}</td>
                          <td className="px-4 py-3 text-right">฿{item.spare_price?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">฿{(item.spare_amount * item.spare_price).toLocaleString()}</td>
                        </tr>
                      ))}
                      {(!selectedHistoryItem.vc_maintenance_spare_item || selectedHistoryItem.vc_maintenance_spare_item.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">ไม่มีรายการอะไหล่</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end pt-4">
                <div className="space-y-2 min-w-[200px]">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>ราคาสินค้า/บริการ:</span>
                    <span>฿{selectedHistoryItem.vc_maintenance_spare_item?.reduce((sum: number, item: any) => sum + (item.spare_amount * item.spare_price), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>ภาษี VAT ({selectedHistoryItem.vat}%):</span>
                    <span>
                      ฿{(selectedHistoryItem.vc_maintenance_spare_item?.reduce((sum: number, item: any) => sum + (item.spare_amount * item.spare_price), 0) * (selectedHistoryItem.vat || 0) / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-blue-600 border-t border-slate-100 pt-2 mt-2">
                    <span>ยอดรวมสุทธิ:</span>
                    <span>
                      ฿{(
                        selectedHistoryItem.vc_maintenance_spare_item?.reduce((sum: number, item: any) => sum + (item.spare_amount * item.spare_price), 0) * 
                        (1 + (selectedHistoryItem.vat || 0) / 100)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedHistoryItem(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
