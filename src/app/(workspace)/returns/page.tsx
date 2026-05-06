"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import TimeInput24hr from "@/components/ui/TimeInput24hr";
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
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setDispatchers(result.data);
    }
  };

  const filteredOrders = returnOrders.filter((order) => {
    let matchFilter = true;
    if (selectedFilter === "กำลังใช้งาน (In Use)")
      matchFilter = order.status_use_id === 4;
    else if (selectedFilter === "คืนแล้ว (Returned)") {
      matchFilter =
        order.status_use_id === 5 && order.vc_use && order.vc_use.length > 0;
    }

    if (!matchFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const reqStr =
        `req-${String(order.request_id).padStart(4, "0")}`.toLowerCase();
      const reqStrNum = String(order.request_id).toLowerCase();
      const carPlate = (order.vc_car_master?.car_number || "").toLowerCase();
      const userFull =
        `${order.vc_user?.firstname || ""} ${order.vc_user?.lastname || ""}`.toLowerCase();
      return (
        reqStr.includes(q) ||
        reqStrNum.includes(q) ||
        carPlate.includes(q) ||
        userFull.includes(q)
      );
    }
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.status_use_id === 4 && b.status_use_id !== 4) return -1;
    if (a.status_use_id !== 4 && b.status_use_id === 4) return 1;

    const getJourneyDt = (order: any) => {
      const dateStr = order.journey_date
        ? new Date(order.journey_date).toISOString().split("T")[0]
        : "1970-01-01";
      let timeStr = order.journey_time ? order.journey_time.trim() : "00:00:00";
      if (timeStr.split(":").length === 2) timeStr += ":00";
      const dt = new Date(`${dateStr}T${timeStr}`).getTime();
      return isNaN(dt) ? 0 : dt;
    };

    if (a.status_use_id === 4) {
      return getJourneyDt(a) - getJourneyDt(b);
    } else {
      return b.request_id - a.request_id;
    }
  });

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    fetchData();
    fetchDispatchers();
  }, []);

  const handleOpenViewModal = (item: any) => {
    setSelectedItem(item);
    setModalMode("view");

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
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาเลขที่คำขอ, ทะเบียนรถ, ชื่อผู้เดินทาง..."
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
                    setCurrentPage(1);
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
        <DataTable
          columns={[
            {
              header: "ID / ทะเบียนรถ",
              cell: (item) => (
                <div className="align-top">
                  <p className="font-semibold text-slate-900 italic tracking-tighter">
                    REQ-{String(item.request_id).padStart(4, "0")}
                  </p>
                  <p className="text-sm text-emerald-600 font-bold mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-lg border border-emerald-100">
                    {item.vc_car_master?.car_number || "ยังไม่ระบุ"}
                  </p>
                </div>
              ),
            },
            {
              header: "ผู้เดินทาง / หน่วยงาน",
              cell: (item) => (
                <div className="align-top">
                  <p className="font-bold text-slate-800">
                    {item.vc_user?.firstname} {item.vc_user?.lastname}
                  </p>
                  <p className="text-[13px] text-slate-500 mt-1 font-medium italic">
                    {item.use_div_name || "-"}
                  </p>
                </div>
              ),
            },
            {
              header: "พนักงานขับ / ประเภทรถ",
              cell: (item) => (
                <div className="align-top">
                  <p className="font-bold text-slate-800">
                    {item.self_drive
                      ? item.vc_user?.firstname
                        ? `${item.vc_user.firstname} ${item.vc_user.lastname || ""}`
                        : "-"
                      : item.vc_driver?.vc_users?.firstname
                        ? `${item.vc_driver.vc_users.firstname} ${item.vc_driver.vc_users.lastname || ""}`
                        : "-"}
                  </p>
                  <p className="text-[13px] text-slate-500 mt-1 font-semibold uppercase tracking-wide">
                    {item.vc_car_master?.vc_car_spec?.car_spec_name ||
                      item.vc_car_spec?.car_spec_name ||
                      "-"}
                  </p>
                </div>
              ),
            },
            {
              header: "สถานะการคืน",
              cell: (item) => (
                <div className="align-top">
                  {item.status_use_id === 5 ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 italic">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      คืนรถแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase bg-blue-50 text-blue-600 border border-blue-100 italic">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      กำลังใช้งาน
                    </span>
                  )}
                </div>
              ),
            },
            {
              header: "จัดการ",
              className: "text-center",
              cell: (item) => (
                <div className="flex items-center justify-center gap-2 align-top">
                  <button
                    onClick={() => handleOpenViewModal(item)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="ดูรายละเอียด"
                  >
                    <Eye size={18} />
                  </button>
                  {item.status_use_id !== 5 && (
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                    >
                      <FileEdit size={14} />
                      บันทึกรับคืน
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={paginatedOrders}
          isLoading={loading}
          rowKey={(row) => row.request_id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          modalMode === "view"
            ? `รายละเอียดคำขอ REQ-${String(selectedItem?.request_id).padStart(4, "0")}`
            : "บันทึกการส่งคืนยานพาหนะ"
        }
        maxWidth="3xl"
        accentColor="bg-blue-600"
        footer={
          <>
            <button
              onClick={handleCloseModal}
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              {modalMode === "view" ? "ปิดหน้าต่าง" : "ยกเลิก"}
            </button>
            {modalMode === "edit" && (
              <button
                onClick={handleSaveReturn}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการรับคืน"}
              </button>
            )}
          </>
        }
      >
        <div className="space-y-8">
          {/* ข้อมูลพื้นฐาน */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-800">
                ข้อมูลการเดินทาง (Journey Info)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ต้นทาง</p>
                <p className="text-sm font-bold text-slate-700">{selectedItem?.vc_start_place?.start_place_name || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ปลายทาง</p>
                <p className="text-sm font-bold text-slate-700">{selectedItem?.journey_place || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ผู้ขอใช้รถ</p>
                <p className="text-sm font-bold text-slate-700">
                  {selectedItem?.vc_user?.firstname} {selectedItem?.vc_user?.lastname}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ทะเบียนรถ</p>
                <p className="text-sm font-bold text-blue-600">{selectedItem?.vc_car_master?.car_number || "-"}</p>
              </div>
            </div>
          </section>

          {/* ระยะทาง */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-800">
                บันทึกเลขไมล์ (Mileage Record)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">เลขไมล์เริ่มต้น</label>
                <div className="relative">
                  <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="number"
                    readOnly
                    value={returnFormData.mile_begin}
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-lg font-bold text-slate-600 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KM</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-600 uppercase">เลขไมล์สิ้นสุด <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                  <input
                    type="number"
                    min="1"
                    readOnly={modalMode === "view"}
                    value={returnFormData.mile_end}
                    onChange={(e) => setReturnFormData({ ...returnFormData, mile_end: e.target.value })}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-lg font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400">KM</span>
                </div>
              </div>
            </div>
            {Number(returnFormData.mile_end) > 0 && (
              <div className="bg-blue-600 rounded-xl p-4 flex justify-between items-center text-white shadow-lg shadow-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">ระยะทางรวม</span>
                <span className="text-xl font-bold italic">
                  {Math.max(0, (Number(returnFormData.mile_end) || 0) - (Number(returnFormData.mile_begin) || 0)).toLocaleString()} กม.
                </span>
              </div>
            )}
          </section>

          {/* วันเวลาคืนจริง */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-800">
                วันและเวลาที่คืนจริง (Actual Return)
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {modalMode === "view" ? (
                <div className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold">
                  {returnFormData.return_real_date ? new Date(returnFormData.return_real_date).toLocaleDateString("th-TH", {
                    day: "numeric", month: "long", year: "numeric"
                  }) : "-"} - {returnFormData.return_real_time || "00:00"} น.
                </div>
              ) : (
                <TimeInput24hr
                  value={`${returnFormData.return_real_date}T${returnFormData.return_real_time}`}
                  onChange={(val) => {
                    const [date, time] = val.split("T");
                    setReturnFormData(prev => ({ ...prev, return_real_date: date, return_real_time: time }));
                  }}
                  showDate
                />
              )}
            </div>
          </section>

          {/* หมายเหตุ */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-800">
                หมายเหตุเพิ่มเติม (Return Note)
              </h3>
            </div>
            <textarea
              readOnly={modalMode === "view"}
              value={returnFormData.note}
              onChange={(e) => setReturnFormData(prev => ({ ...prev, note: e.target.value.substring(0, 100) }))}
              placeholder="ระบุปัญหาที่พบหรือหมายเหตุการคืนรถ (ถ้ามี)..."
              rows={3}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </section>
        </div>
      </Modal>
    </div>
  );
}
