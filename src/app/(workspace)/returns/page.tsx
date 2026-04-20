"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import {
  Car,
  Search,
  Filter,
  Eye,
  FileEdit,
  X,
  Navigation,
  User,
  Clock,
  Gauge,
  UserCircle,
  Save,
  Loader2,
} from "lucide-react";
import {
  getOrdersForReturn,
  saveReturnRecord,
  getDispatchers,
  getLatestCarMileage,
} from "./actions";

export default function ReturnsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("แสดงทุกสถานะ");
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [returnOrders, setReturnOrders] = useState<any[]>([]);
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [returnFormData, setReturnFormData] = useState({
    mile_begin: "" as string | number,
    mile_end: "" as string | number,
    return_real_date: new Date().toISOString().split("T")[0],
    return_real_time: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    approved_by: 0,
    note: "",
    drive_type: "staff",
  });

  const filterOptions = [
    "แสดงทุกสถานะ",
    "กำลังใช้งาน (In Use)",
    "คืนแล้ว (Returned)",
  ];

  const fetchData = async () => {
    setLoading(true);
    const result = await getOrdersForReturn();
    if (result.success && result.data) {
      setReturnOrders(result.data);
    }
    setLoading(false);
  };

  const fetchDispatchers = async () => {
    const result = await getDispatchers();
    if (result.success && result.data) {
      console.log("dispatchers:", result.data);
      setDispatchers(result.data);
    }
  };

  const filteredOrders = returnOrders.filter((order) => {
    if (selectedFilter === "กำลังใช้งาน (In Use)")
      return order.status_use_id === 4;
    if (selectedFilter === "คืนแล้ว (Returned)") {
      // คืนแล้วต้องมีข้อมูลใน vc_use ด้วยถึงจะนับ (ตามที่ user สงสัยเรื่องจำนวน)
      return (
        order.status_use_id === 5 && order.vc_use && order.vc_use.length > 0
      );
    }
    return true; // "แสดงทุกสถานะ"
  });

  useEffect(() => {
    fetchData();
    fetchDispatchers();
  }, []);

  const handleOpenViewModal = (item: any) => {
    setSelectedItem(item);
    setModalMode("view");

    // ดึงข้อมูลจาก vc_use (ถ้ามี) มาแสดงผลในหน้าดีเทล
    const usage = item.vc_use?.[0];
    setReturnFormData({
      mile_begin: usage?.mile_begin ?? "",
      mile_end: usage?.mile_end ?? "",
      return_real_date: usage?.return_real_date
        ? new Date(usage.return_real_date).toISOString().split("T")[0]
        : item.return_date
          ? new Date(item.return_date).toISOString().split("T")[0]
          : "",
      return_real_time: usage?.return_real_time ?? "",
      approved_by: usage?.approved_by ?? 0,
      note: usage?.note ?? "",
      drive_type: usage?.drive_type ?? (item.self_drive ? "self" : "staff"),
    });

    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item: any) => {
    setSelectedItem(item);
    setModalMode("edit");

    // Fetch latest mileage for this car
    let lastMileEnd = 0;
    if (item.car_id) {
      const res = await getLatestCarMileage(item.car_id);
      if (res.success) {
        lastMileEnd = res.mile_end || 0;
      }
    }

    setReturnFormData({
      mile_begin: lastMileEnd || "",
      mile_end: "",
      return_real_date: new Date().toISOString().split("T")[0],
      return_real_time: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      approved_by: session?.user?.id ? parseInt(session.user.id) : 0,
      note: "",
      drive_type: item.self_drive ? "self" : "staff",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveReturn = async () => {
    if (!selectedItem) return;
    if (Number(returnFormData.mile_end) <= 0) {
      showWarning("กรุณาระบุเลขไมล์สิ้นสุด");
      return;
    }
    if (returnFormData.approved_by <= 0) {
      showWarning("กรุณาเลือกผู้อนุมัติ (นายเวร)");
      return;
    }

    const isConfirmed = await showConfirm("ยืนยันการรับคืนยานพาหนะ");
    if (!isConfirmed) return;

    setIsSubmitting(true);
    try {
      const result = await saveReturnRecord({
        request_id: selectedItem.request_id,
        car_id: selectedItem.car_id,
        drive_type: returnFormData.drive_type,
        approved_by: returnFormData.approved_by,
        journey_real_time: selectedItem.journey_time || "00:00",
        return_real_time: returnFormData.return_real_time,
        return_real_date: returnFormData.return_real_date,
        mile_begin: Number(returnFormData.mile_begin) || 0,
        mile_end: Number(returnFormData.mile_end) || 0,
        driver_id: selectedItem.driver_id,
        note: returnFormData.note,
      });

      if (result.success) {
        showSuccess("บันทึกการคืนรถสำเร็จ!");
        handleCloseModal();
        fetchData();
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-6 pt-4 pb-10 relative animate-in fade-in duration-500">
      {/* Search Bar */}
      <div className="bg-white rounded-full p-2 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 px-4 py-2">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบขอใช้รถ, ทะเบียนรถ, ชื่อผู้เดินทาง..."
            className="flex-1 outline-none text-slate-600 placeholder:text-slate-400 bg-transparent w-full text-sm"
          />
        </div>
        <div className="w-px h-8 bg-slate-200"></div>

        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-6 py-2 rounded-full hover:bg-slate-50 transition-colors text-slate-600 text-sm font-medium"
          >
            <Filter size={18} />
            <span>{selectedFilter}</span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-20">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelectedFilter(option);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedFilter === option
                      ? "bg-emerald-600 text-white"
                      : "text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-[11px] tracking-widest uppercase border-b border-slate-100">
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  ID / ทะเบียนรถ
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  ผู้เดินทาง / หน่วยงาน
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  พนักงานขับ / ประเภทรถ
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  สถานะการคืน
                </th>
                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                  จัดการรายการ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      <p className="text-slate-400 font-medium italic text-sm">
                        กำลังโหลดข้อมูล...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((item, index) => (
                  <tr
                    key={index}
                    className="bg-white hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-slate-900 italic tracking-tighter">
                        REQ-{String(item.request_id).padStart(4, "0")}
                      </p>
                      <p className="text-sm text-emerald-600 font-bold mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-lg border border-emerald-100">
                        {item.vc_car_master?.car_number || "ยังไม่ระบุ"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-bold text-slate-800">
                        {item.vc_user?.firstname} {item.vc_user?.lastname}
                      </p>
                      <p className="text-[13px] text-slate-500 mt-1 font-medium italic">
                        {item.use_div_name || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-bold text-slate-800">
                        {item.self_drive
                          ? "(ขับเอง)"
                          : item.vc_driver?.vc_users?.firstname
                            ? `นาย ${item.vc_driver.vc_users.firstname}`
                            : "-"}
                      </p>
                      <p className="text-[13px] text-slate-500 mt-1 font-semibold uppercase tracking-wide">
                        {item.vc_car_spec?.car_spec_name || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.status_use_id === 5 ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 italic">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          คืนรถแล้ว (เสร็จสิ้น)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase bg-blue-50 text-blue-600 border border-blue-100 italic">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                          อนุมัติให้ใช้งาน (รอส่งคืน)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenViewModal(item)}
                          className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={20} />
                        </button>
                        {item.status_use_id !== 5 && (
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                          >
                            <FileEdit size={18} />
                            บันทึกรับคืน
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="text-slate-200" size={32} />
                    </div>
                    <p className="text-slate-400 font-bold italic">
                      ยังไม่มีข้อมูลรายการรอส่งคืนรถในขณะนี้
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-white border-2">
            <div className="bg-[#1a2332] px-6 py-4 flex items-center justify-between text-white rounded-xl">
              <div className="flex items-center gap-5">
                <div className="bg-emerald-500 p-3 rounded-lg shadow-lg ring-4 ring-emerald-500/20">
                  <Car size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight leading-none">
                    {modalMode === "view"
                      ? "VIEW TRIP RECORD"
                      : "RECORD VEHICLE RETURN"}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-2 font-semibold uppercase tracking-widest opacity-60">
                    เลขที่คำขอ: REQ-
                    {String(selectedItem?.request_id).padStart(4, "0")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="ปิด"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 space-y-12 bg-white custom-scrollbar mt-4">
              {/* 1. ข้อมูลเส้นทาง */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm uppercase tracking-widest">
                    ข้อมูลเส้นทาง (ROUTE INFO)
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      เอาจากไหน (ORIGIN)
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900 transition-all group-hover:border-slate-200">
                      {selectedItem?.vc_start_place?.start_place_name ||
                        "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      ไปกลับ (DESTINATION)
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900 transition-all group-hover:border-slate-200">
                      {selectedItem?.journey_place || "-"}
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. ผู้รับผิดชอบ */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm uppercase tracking-widest">
                    ผู้รับผิดชอบ (PERSONNEL)
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      ผู้ขอใช้รถ (REQUESTER)
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900 group-hover:border-slate-200">
                      {selectedItem?.vc_user?.firstname
                        ? `${selectedItem.vc_user.bname || ""} ${selectedItem.vc_user.firstname} ${selectedItem.vc_user.lastname}`.trim()
                        : "(ไม่มีข้อมูล)"}
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1 italic">
                      ใครอนุมัติใช้รถตอนแรก (APPROVER)
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900 group-hover:border-slate-200">
                      {selectedItem?.approver_name || "(ไม่มีข้อมูลในระบบ)"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      ลักษณะการขับขี่ที่ใช้จริง
                    </label>
                    <div className="flex bg-slate-100 border border-slate-100 p-1.5 rounded-md shadow-inner">
                      {[
                        { id: "self", label: "ขับเอง", color: "indigo" },
                        { id: "staff", label: "มีคนขับ", color: "emerald" },
                        { id: "taxi", label: "Taxi", color: "amber" },
                      ].map((type) => (
                        <button
                          key={type.id}
                          disabled={true}
                          className={`
                            flex-1 text-center py-2.5 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all cursor-not-allowed
                            ${
                              returnFormData.drive_type === type.id
                                ? `bg-white text-${type.color}-600 shadow-md ring-1 ring-slate-200`
                                : "text-slate-400 opacity-50"
                            }
                          `}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      ใครขับ (DRIVER)
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900 group-hover:border-slate-200">
                      {selectedItem?.self_drive
                        ? `ผู้ขอขับเอง${selectedItem?.vc_user?.firstname ? ` (${selectedItem.vc_user.firstname} ${selectedItem.vc_user.lastname || ""})` : ""}`
                        : selectedItem?.vc_driver?.vc_users?.firstname
                          ? `นาย ${selectedItem.vc_driver.vc_users.firstname} ${selectedItem.vc_driver.vc_users.lastname || ""}`
                          : "ไม่ระบุพนักงานขับรถ"}
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      ทะเบียน / ประเภทรถ ที่ใช้จริง
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900 group-hover:border-slate-200 overflow-hidden text-ellipsis whitespace-nowrap">
                      {selectedItem?.vc_car_master?.car_number || "-"} •{" "}
                      {selectedItem?.vc_car_spec?.car_spec_name}
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. วันเวลาเดินทาง */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm uppercase tracking-widest">
                    วันเวลาเดินทาง (TRIP DATE &amp; TIME)
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      วันที่ออกเดินทางตามแผน
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900">
                      {selectedItem?.journey_date
                        ? new Date(
                            selectedItem.journey_date,
                          ).toLocaleDateString("th-TH")
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      เวลาออกตามแผน
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900">
                      {selectedItem?.journey_time || "00:00"} น.
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      วันที่คืนรถตามแผน
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900">
                      {selectedItem?.return_date
                        ? new Date(selectedItem.return_date).toLocaleDateString(
                            "th-TH",
                          )
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      เวลาคืนรถตามแผน (PLANNED RETURN)
                    </label>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900">
                      {selectedItem?.return_time || "00:00"} น.
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-slate-100 my-4 pt-4"></div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-3 px-1">
                      วันที่คืนรถจริง (ACTUAL RETURN DATE) *
                    </label>
                    <input
                      type="date"
                      readOnly={modalMode === "view"}
                      value={returnFormData.return_real_date}
                      onChange={(e) =>
                        setReturnFormData((prev) => ({
                          ...prev,
                          return_real_date: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-emerald-800 outline-none focus:border-emerald-500 transition-all focus:bg-white focus:ring-4 focus:ring-emerald-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-3 px-1">
                      เวลากลับจริง (ACTUAL RETURN TIME) *
                    </label>
                    <input
                      type="time"
                      readOnly={modalMode === "view"}
                      value={returnFormData.return_real_time}
                      onChange={(e) =>
                        setReturnFormData((prev) => ({
                          ...prev,
                          return_real_time: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-emerald-800 outline-none focus:border-emerald-500 transition-all focus:bg-white focus:ring-4 focus:ring-emerald-50"
                    />
                  </div>
                </div>
              </section>

              {/* 4. เลขไมล์ */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm uppercase tracking-widest">
                    เลขไมล์ (MILEAGE RECORD)
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-8 ring-4 ring-emerald-50/50 p-6 rounded-xl bg-emerald-50/20">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-emerald-700 uppercase tracking-widest mb-1 ml-1">
                      เลขไมล์เริ่มต้น (ก่อนใช้)
                    </label>
                    <div className="relative">
                      <Gauge
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"
                        size={20}
                      />
                      <input
                        type="number"
                        min="1"
                        readOnly={modalMode === "view"}
                        value={returnFormData.mile_begin}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E")
                            e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setReturnFormData((prev) => ({
                            ...prev,
                            mile_begin: val,
                          }));
                        }}
                        placeholder="ระบุเลขไมล์เริ่มต้น"
                        className="w-full bg-white border border-emerald-100 rounded-lg py-4 pl-16 pr-6 text-2xl font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all shadow-sm"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-300 uppercase">
                        KM
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-emerald-700 uppercase tracking-widest mb-1 ml-1">
                      เลขไมล์สิ้นสุด (หลังใช้) *
                    </label>
                    <div className="relative">
                      <Gauge
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400"
                        size={20}
                      />
                      <input
                        type="number"
                        min="1"
                        readOnly={modalMode === "view"}
                        value={returnFormData.mile_end}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E")
                            e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setReturnFormData((prev) => ({
                            ...prev,
                            mile_end: val,
                          }));
                        }}
                        placeholder="ระบุเลขไมล์สิ้นสุด"
                        className="w-full bg-white border border-emerald-500/30 rounded-lg py-4 pl-16 pr-6 text-2xl font-bold text-emerald-800 outline-none focus:border-emerald-500 transition-all shadow-md focus:ring-4 focus:ring-emerald-50"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-emerald-400 uppercase">
                        KM
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="bg-emerald-600 rounded-lg p-4 flex justify-between items-center text-white shadow-xl shadow-emerald-100">
                      <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                        ระยะทางรวมทั้งสิ้น (TOTAL DISTANCE)
                      </span>
                      <span className="text-xl font-semibold tracking-tighter">
                        {Math.max(
                          0,
                          (Number(returnFormData.mile_end) || 0) -
                            (Number(returnFormData.mile_begin) || 0),
                        ).toLocaleString()}{" "}
                        <span className="text-xs">กม.</span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. ผู้บันทึก */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm uppercase tracking-widest">
                    การตรวจรับและบันทึก (RECORDER)
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      นายเวรผู้อนุมัติรับคืนรถ (APPROVED BY) *
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900">
                        {dispatchers.find(
                          (d) => d.userid === returnFormData.approved_by,
                        )?.firstname || "-"}{" "}
                        {dispatchers.find(
                          (d) => d.userid === returnFormData.approved_by,
                        )?.lastname || ""}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900">
                        {modalMode === "edit"
                          ? (() => {
                              const d = dispatchers.find(
                                (d) =>
                                  d.userid ===
                                  (session?.user?.id
                                    ? parseInt(session.user.id)
                                    : 0),
                              );
                              return d
                                ? `${d.bname || ""} ${d.firstname || ""} ${d.lastname || ""}`.trim()
                                : "-";
                            })()
                          : (() => {
                              const d = dispatchers.find(
                                (d) => d.userid === returnFormData.approved_by,
                              );
                              return d
                                ? `${d.bname || ""} ${d.firstname || ""} ${d.lastname || ""}`.trim()
                                : "-";
                            })()}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 mt-4">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                      หมายเหตุบรรยาย (RETURN NOTE)
                    </label>
                    <textarea
                      readOnly={modalMode === "view"}
                      value={returnFormData.note}
                      onChange={(e) =>
                        setReturnFormData((prev) => ({
                          ...prev,
                          note: e.target.value.substring(0, 64),
                        }))
                      }
                      placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-100/50 rounded-lg px-6 py-4 text-base font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Footer ของ Modal */}
            <div className="px-6 py-6 bg-slate-50 flex items-center justify-end gap-6 rounded-b-xl">
              {modalMode === "view" ? (
                <button
                  onClick={handleCloseModal}
                  className="px-8 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-all active:scale-95"
                >
                  Close Detail
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCloseModal}
                    className="px-8 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                  >
                    Discard Change
                  </button>
                  <button
                    onClick={handleSaveReturn}
                    disabled={isSubmitting}
                    className="flex items-center gap-3 px-12 py-4 text-sm font-semibold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-all shadow-2xl shadow-emerald-200 ring-4 ring-emerald-50 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    {isSubmitting
                      ? "Processing..."
                      : "Finish Task & Save Record"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tailwind & Custom Utility */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
