"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";
import TimeInput24hr from "@/components/ui/TimeInput24hr";
import React, { useState, useEffect } from "react";
import {
  Car,
  Settings,
  MapPin,
  Calendar,
  User,
  X,
  ChevronDown,
  Save,
  Bell,
  Edit2,
  Loader2,
  CheckCircle,
  Truck,
  Navigation,
  Check,
  AlertCircle,
  FileText,
  Eye,
  Search,
} from "lucide-react";
import {
  getPendingDispatch,
  getAvailableCars,
  getDrivers,
  assignResource,
  recordPickupResource,
  cancelBooking,
} from "./actions";
import { getCarSpecs } from "@/app/actions/carSpecActions";
import Select from "react-select";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";

// Types
type DispatchType = "with_driver" | "self_drive" | "taxi";

// Helper function
const isAssignExpired = (journeyDate: any, journeyTime: string | null) => {
  if (!journeyDate) return false;

  try {
    const d = new Date(journeyDate);
    if (isNaN(d.getTime())) return false;

    const dateStr =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");

    let timeStr = journeyTime
      ? journeyTime.replace(/[^0-9:]/g, "")
      : "23:59:59";
    if (!timeStr || timeStr.length < 4) timeStr = "23:59:59";

    if (timeStr.split(":").length === 2) {
      timeStr += ":00";
    }

    const dt = new Date(`${dateStr}T${timeStr}`);

    if (isNaN(dt.getTime())) {
      return d.getTime() < new Date().getTime();
    }

    return dt.getTime() < new Date().getTime();
  } catch (err) {
    return false;
  }
};

export default function AssignPage() {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      showWarning("กรุณาระบุเหตุผลที่ยกเลิก");
      return;
    }

    const isConfirmed = await showConfirm("ยืนยันการยกเลิกคำขอนี้?");
    if (!isConfirmed) return;

    setIsCancelSubmitting(true);
    try {
      const result = await cancelBooking({
        requestId: selectedCancelOrder.request_id,
        reason: cancelReason,
      });

      if (result.success) {
        showSuccess("ยกเลิกคำขอเรียบร้อยแล้ว");
        setIsCancelModalOpen(false);
        fetchData();
      } else {
        showError(result.error || "เกิดข้อผิดพลาดในการยกเลิก");
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsCancelSubmitting(false);
    }
  };

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("pending_assign");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dispatchType, setDispatchType] = useState<DispatchType>("with_driver");
  const [selectedCar, setSelectedCar] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carSpecs, setCarSpecs] = useState<any[]>([]);
  const [selectedSpecFilter, setSelectedSpecFilter] = useState<string>("all");
  const [taxiReason, setTaxiReason] = useState("");

  // States for Pickup Modal
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pickupStatus, setPickupStatus] = useState<string>("PICKED_UP");
  const [pickupDate, setPickupDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [pickupTime, setPickupTime] = useState<string>("");
  const [pickupMethod, setPickupMethod] = useState<string>("STAFF_DELIVERY");
  const [selectedPickupOrder, setSelectedPickupOrder] = useState<any>(null);
  const [isPickupSubmitting, setIsPickupSubmitting] = useState(false);

  // States for Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<any>(null);

  // React-Select styles mapping
  const reactSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: "0.5rem",
      padding: "0.1rem 0.2rem",
      borderColor: state.isFocused ? "#2563eb" : "#e2e8f0",
      backgroundColor: "#ffffff",
      boxShadow: state.isFocused ? "0 0 0 2px #dbeafe" : "none",
      borderWidth: "1px",
      cursor: "pointer",
      fontSize: "0.875rem",
      transition: "all 0.2s",
      "&:hover": {
        borderColor: "#2563eb",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#eff6ff"
        : state.isFocused
          ? "#f8fafc"
          : "#ffffff",
      color: "#1e293b",
      cursor: "pointer",
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#1e293b",
      fontWeight: "500",
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: "0.5rem",
      overflow: "hidden",
      zIndex: 100,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    }),
  };

  const formatCarOptionLabel = (option: any, { context }: any) => {
    if (context === "value") {
      return (
        <span className="font-bold text-slate-800">
          {option.number} ({option.brand || "ไม่ระบุ"})
        </span>
      );
    }
    return (
      <div className="flex flex-col gap-0.5 w-full">
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-800">{option.number}</span>
          {option.isRequestedSpec && (
            <span className="bg-emerald-50 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded border border-emerald-100">
              ตรงตามสเปคที่ขอ
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {option.brand || "ไม่ระบุ"} • {option.spec || "ไม่ระบุสเปค"}
        </span>
      </div>
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pending, driverList] = await Promise.all([
        getPendingDispatch(),
        getDrivers(),
      ]);
      setPendingOrders(pending);
      setDrivers(driverList);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const now = new Date();
    setPickupTime(now.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    if (dispatchType === "self_drive" && selectedOrder) {
      if (selectedOrder.self_drive) {
        if (selectedOrder.driver_id) {
          setSelectedDriver(String(selectedOrder.driver_id));
        } else {
          setSelectedDriver("self");
        }
      }
    }
  }, [dispatchType, selectedOrder]);

  const openAssignModal = async (order: any) => {
    setSelectedOrder(order);
    setSelectedCar(order.car_id ? String(order.car_id) : "");
    setSelectedDriver(order.driver_id ? String(order.driver_id) : "");
    setDispatchType(
      order.pickup_method === "TAXI"
        ? "taxi"
        : order.self_drive
          ? "self_drive"
          : "with_driver",
    );
    setTaxiReason("");
    setSelectedSpecFilter(
      order.car_spec_id ? String(order.car_spec_id) : "all",
    );

    const carList = await getAvailableCars(
      order.use_div_code ?? undefined,
      order.car_id ?? undefined,
    );
    setCars(carList);

    const specsRes = await getCarSpecs(order.use_div_code ?? undefined);
    if (specsRes.success && specsRes.data) {
      setCarSpecs(specsRes.data);
    } else {
      setCarSpecs([]);
    }

    setIsModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (dispatchType !== "taxi" && !selectedCar) {
      showWarning("กรุณาเลือกยานพาหนะ");
      return;
    }
    if (dispatchType !== "taxi" && !selectedDriver) {
      showWarning("กรุณาเลือกพนักงานขับรถ");
      return;
    }

    const finalCarId = parseInt(selectedCar);
    let finalDriverId: number | null = null;

    if (dispatchType === "self_drive") {
      finalDriverId =
        selectedDriver === "self" ? null : parseInt(selectedDriver);
    } else {
      finalDriverId = parseInt(selectedDriver);
    }

    const isConfirmed = await showConfirm("ยืนยันการจัดรถและแจ้งเตือนผู้ใช้งาน?");
    if (!isConfirmed) return;

    setIsSubmitting(true);
    try {
      const result = await assignResource({
        requestId: selectedOrder.request_id,
        carId: dispatchType === "taxi" ? null : finalCarId,
        driverId: dispatchType === "taxi" ? null : finalDriverId,
        isTaxi: dispatchType === "taxi",
        taxiReason: dispatchType === "taxi" ? taxiReason : undefined,
      });

      if (result.success) {
        showSuccess("จัดรถและส่งอีเมลแจ้งเตือนสำเร็จ!");
        setIsModalOpen(false);
        fetchData();
      } else {
        showError(result.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPickupModal = (order: any) => {
    setSelectedPickupOrder(order);
    setPickupStatus("PICKED_UP");
    setPickupDate(new Date().toISOString().split("T")[0]);

    const now = new Date();
    setPickupTime(now.toTimeString().slice(0, 5));

    if (order.pickup_method === "TAXI") {
      setPickupMethod("TAXI");
    } else if (order.driver_id) {
      setPickupMethod("STAFF_DELIVERY");
    } else {
      setPickupMethod("SELF_PICKUP");
    }

    setIsPickupModalOpen(true);
  };

  const handlePickupSubmit = async () => {
    if (pickupStatus === "PICKED_UP" && (!pickupDate || !pickupTime)) {
      showWarning("กรุณาระบุข้อมูลการรับรถให้ครบถ้วน");
      return;
    }
    const isConfirmed = await showConfirm("ยืนยันการบันทึกข้อมูล");
    if (!isConfirmed) return;

    setIsPickupSubmitting(true);
    try {
      const result = await recordPickupResource({
        requestId: selectedPickupOrder.request_id,
        pickupStatus: pickupStatus,
        pickupDate: pickupStatus === "NO_SHOW" ? undefined : pickupDate,
        pickupTime: pickupStatus === "NO_SHOW" ? undefined : pickupTime,
        pickupMethod: pickupStatus === "NO_SHOW" ? undefined : pickupMethod,
      });

      if (result.success) {
        showSuccess("บันทึกการรับรถเรียบร้อยแล้ว");
        setIsPickupModalOpen(false);
        fetchData();
      } else {
        showError(result.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsPickupSubmitting(false);
    }
  };

  const statusFilterOptions = [
    { value: "action_required", label: "รายการทั้งหมด" },
    { value: "pending_assign", label: "รอจัดรถ" },
    { value: "pending_pickup", label: "จัดรถแล้ว (รอยืนยัน)" },
    { value: "completed", label: "ดำเนินการเสร็จสิ้น (ยืนยันแล้ว)" },
    { value: "expired", label: "คำขอหมดอายุ" },
    { value: "cancelled", label: "ยกเลิกแล้ว/ไม่มารับรถ" },
  ];

  const filteredOrders = pendingOrders
    .filter((order) => {
      const isExpired = isAssignExpired(order.journey_date, order.journey_time);
      console.log(
        `REQ#${order.request_id} status=${order.status_use_id} pickup=${order.pickup_status} expired=${isExpired}`,
      );
      if (filterStatus === "action_required") {
        return true;
      }
      if (filterStatus === "expired") {
        return (
          isExpired &&
          order.status_use_id !== 5 &&
          order.status_use_id !== 6 &&
          order.status_use_id !== 3 &&
          order.pickup_status !== "PICKED_UP" &&
          order.pickup_status !== "TAXI_CALLED"
        );
      }
      if (filterStatus === "pending_assign")
        return order.status_use_id === 2 && !isExpired;
      if (filterStatus === "pending_pickup")
        return order.status_use_id === 4 && !order.pickup_status && !isExpired;
      if (filterStatus === "completed")
        return (
          (order.status_use_id === 4 &&
            (order.pickup_status === "PICKED_UP" ||
              order.pickup_status === "TAXI_CALLED")) ||
          order.status_use_id === 5
        );
      if (filterStatus === "cancelled") return order.status_use_id === 6 || order.status_use_id === 3;
      return true;
    })
    .filter((order) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const reqId = `REQ-${String(order.request_id).padStart(3, "0")}`.toLowerCase();
      const place = (order.journey_place || "").toLowerCase();
      const user = `${order.vc_user?.firstname || ""} ${order.vc_user?.lastname || ""}`.toLowerCase();
      const car = (order.vc_car_master?.car_number || "").toLowerCase();
      return reqId.includes(q) || place.includes(q) || user.includes(q) || car.includes(q);
    })
    .sort((a, b) => {
      // 0. ขอด่วน ขึ้นอันบนสุดเสมอ
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;

      // 1. เรียงตามวันเวลาเดินทาง (ล่าสุด -> เก่ากว่า)
      const getDT = (item: any) => {
        if (!item.journey_date) return 0;
        const d = new Date(item.journey_date);
        // แยกเวลา HH:mm มาใส่ใน Date object เพื่อการเปรียบเทียบที่แม่นยำ
        const [h, m] = (item.journey_time || "00:00").split(":").map(Number);
        d.setHours(h || 0, m || 0, 0, 0);
        return d.getTime();
      };
      
      const dtA = getDT(a);
      const dtB = getDT(b);
      
      if (dtB !== dtA) return dtB - dtA; // ใหม่กว่าอยู่บน

      // 2. ถ้าวันเวลาเดินทางเท่ากัน ให้เอาที่ส่งคำขอล่าสุดขึ้นก่อน (Request ID มากไปน้อย)
      return b.request_id - a.request_id;
    });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-8 pb-12">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-900">
              การจัดสรรทรัพยากร (ASSIGNMENT)
            </h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-sm font-bold">
              {filteredOrders.length}
            </span>
          </div>
          
          <div className="flex-1 max-w-sm relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาเลขที่คำขอ, สถานที่, ผู้ขอใช้, ทะเบียนรถ..."
              className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all"
            />
          </div>

          <div className="w-full sm:w-64">
            <Select
              options={statusFilterOptions}
              value={statusFilterOptions.find((o) => o.value === filterStatus)}
              onChange={(option: any) => {
                setFilterStatus(option.value);
                setCurrentPage(1);
              }}
              isSearchable={false}
              styles={reactSelectStyles}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <DataTable
            columns={[
              {
                header: "คำขอ",
                cell: (order) => (
                  <div className="relative">
                    <div className="bg-slate-50 border border-slate-100 w-14 h-14 rounded-lg flex flex-col items-center justify-center text-blue-600 font-bold">
                      <span className="text-[10px] text-slate-400">REQ</span>
                      <span className="text-sm">
                        {String(order.request_id).padStart(3, "0")}
                      </span>
                    </div>
                    {order.is_urgent && (
                      <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 ring-2 ring-white">
                        <AlertCircle size={8} strokeWidth={3} />
                        ขอใช้ด่วน
                      </div>
                    )}
                  </div>
                ),
              },
              {
                header: "จุดหมาย / สถานะ",
                cell: (order) => (
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {order.journey_place}
                    </h3>
                    <div className="mt-1">
                      {order.status_use_id === 4 && !order.pickup_status && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-100 uppercase tracking-tighter whitespace-nowrap">
                          จัดรถแล้ว (รอรับรถ)
                        </span>
                      )}
                      {order.status_use_id === 4 &&
                        (order.pickup_status === "PICKED_UP" ||
                          order.pickup_status === "TAXI_CALLED") && (
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200 uppercase tracking-tighter">
                            {order.pickup_status === "TAXI_CALLED"
                              ? "เรียก TAXI แล้ว"
                              : "ส่งมอบแล้ว"}
                          </span>
                        )}
                      {order.status_use_id === 2 && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-100 uppercase tracking-tighter whitespace-nowrap">
                          รอจัดรถ
                        </span>
                      )}
                      {(order.status_use_id === 6 || order.status_use_id === 3) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100 uppercase tracking-tighter">
                            {order.status_use_id === 3 ? "ไม่มารับรถ" : "ยกเลิกแล้ว"}
                          </span>
                          {order.dispatcher_reject_reason && (
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                              เหตุผล: {order.dispatcher_reject_reason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                header: "วันเวลา",
                cell: (order) => (
                  <div className="text-sm text-slate-600 font-medium">
                    <p>
                      {new Date(order.journey_date).toLocaleDateString("th-TH")}
                    </p>
                    <p className="text-xs text-slate-400 font-bold">
                      {order.journey_time
                        ? order.journey_time.slice(0, 5)
                        : "--:--"}{" "}
                      น.
                    </p>
                  </div>
                ),
              },
              {
                header: "ทรัพยากร",
                cell: (order) => (
                  <div className="flex flex-col gap-1">
                    {order.car_id ? (
                      <div className="flex items-center gap-1.5">
                        <Truck size={12} className="text-blue-500" />
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {order.vc_car_master?.car_number}
                        </span>
                      </div>
                    ) : order.pickup_method === "TAXI" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">🚕</span>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          TAXI
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        ยังไม่จัดรถ
                      </span>
                    )}
                    {(order.driver_id || order.self_drive) && (
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-emerald-500" />
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {order.self_drive
                            ? "ขอขับเอง"
                            : order.vc_driver?.vc_users?.firstname}
                        </span>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                header: "จัดการ",
                className: "text-right",
                cell: (order) => (
                  <div className="flex justify-end gap-2">
                    {/* ปุ่มหลัก */}
                    {((order.status_use_id === 4 && (order.pickup_status === "PICKED_UP" || order.pickup_status === "TAXI_CALLED")) || (order.status_use_id === 5 && order.pickup_method === "TAXI")) ? (
                      <button
                        disabled
                        className="bg-slate-100 text-slate-400 px-4 py-2 rounded-lg text-xs font-bold cursor-not-allowed"
                      >
                        เสร็จสิ้น
                      </button>
                    ) : (order.status_use_id === 6 || order.status_use_id === 3) ? (
                      <button
                        disabled
                        className="bg-rose-50 text-rose-400 px-4 py-2 rounded-lg text-xs font-bold border border-rose-100 cursor-not-allowed"
                      >
                        {order.status_use_id === 3 ? "ไม่มารับรถ" : "ยกเลิกแล้ว"}
                      </button>
                    ) : isAssignExpired(order.journey_date, order.journey_time) ? (
                      <button
                        disabled
                        className="bg-rose-50 text-rose-500 px-4 py-2 rounded-lg text-xs font-bold border border-rose-100"
                      >
                        หมดอายุ
                      </button>
                    ) : order.status_use_id === 4 && !order.pickup_status ? (
                      <button
                        onClick={() => openPickupModal(order)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                      >
                        รับรถ
                      </button>
                    ) : (
                      <button
                        onClick={() => openAssignModal(order)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-all shadow-md"
                      >
                        จัดสรรรถ
                      </button>
                    )}

                    {/* ปุ่มยกเลิก */}
                    {order.status_use_id !== 5 &&
                      order.status_use_id !== 6 &&
                      order.pickup_status !== "PICKED_UP" &&
                      order.pickup_status !== "TAXI_CALLED" &&
                      !isAssignExpired(
                        order.journey_date,
                        order.journey_time,
                      ) && (
                        <div className="flex gap-2">
                           {order.car_id || order.pickup_method === "TAXI" ? (
                              <button
                                onClick={() => {
                                  setSelectedDetailsOrder(order);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100"
                                title="ดูรายละเอียดการจัดรถ"
                              >
                                <Eye size={14} />
                              </button>
                           ) : (
                              <button
                                onClick={() => openAssignModal(order)}
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all border border-slate-200"
                                title="แก้ไขการจัดรถ"
                              >
                                <Edit2 size={14} />
                              </button>
                           )}
                          <button
                            onClick={() => {
                              setSelectedCancelOrder(order);
                              setIsCancelModalOpen(true);
                              setCancelReason("");
                            }}
                            className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-100 border border-rose-100 transition-all"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      )}
                  </div>
                ),
              },
            ]}
            data={paginatedOrders}
            isLoading={loading}
            rowKey={(row) => row.request_id}
            getRowClassName={(row) => row.is_urgent ? "bg-rose-50/30" : ""}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>

      {/* ASSIGNMENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="การจัดสรรทรัพยากร (Vehicle Assignment)"
        maxWidth="2xl"
        accentColor="bg-blue-600"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAssignSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              ยืนยันและแจ้งเตือน
            </button>
          </>
        }
      >
        <div className="space-y-8">
          {/* Dispatch Type */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-widest block">
              ประเภทการจัดส่ง
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: "with_driver",
                  label: "รถพร้อมคนขับ",
                  icon: Truck,
                  color: "blue",
                },
                {
                  id: "self_drive",
                  label: "ผู้ขอขับเอง",
                  icon: Navigation,
                  color: "indigo",
                },
                {
                  id: "taxi",
                  label: "แท็กซี่ (TAXI)",
                  icon: MapPin,
                  color: "amber",
                },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setDispatchType(type.id as DispatchType);
                    setSelectedDriver("");
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${dispatchType === type.id ? `border-${type.color}-600 bg-${type.color}-50 text-${type.color}-700 shadow-sm` : "border-slate-100 text-slate-400 hover:border-slate-200"}`}
                >
                  <type.icon size={20} />
                  <span className="text-[11px] font-bold">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {dispatchType !== "taxi" ? (
            <>
              {/* Vehicle Filter */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800">
                  กรองตามประเภทรถ
                </label>
                <Select
                  options={[
                    { value: "all", label: "แสดงรถทุกประเภท" },
                    ...carSpecs.map((s) => ({
                      value: String(s.car_spec_id),
                      label: s.car_spec_name,
                    })),
                  ]}
                  value={{
                    value: selectedSpecFilter,
                    label:
                      selectedSpecFilter === "all"
                        ? "แสดงรถทุกประเภท"
                        : carSpecs.find(
                            (s) => String(s.car_spec_id) === selectedSpecFilter,
                          )?.car_spec_name,
                  }}
                  onChange={(opt: any) => {
                    setSelectedSpecFilter(opt.value);
                    setSelectedCar("");
                  }}
                  styles={reactSelectStyles}
                />
              </div>

              {/* Car Select */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800">
                  เลือกยานพาหนะ <span className="text-rose-500">*</span>
                </label>
                <Select
                  options={cars
                    .filter(
                      (car) =>
                        selectedSpecFilter === "all" ||
                        String(car.car_spec_id) === selectedSpecFilter,
                    )
                    .map((car) => ({
                      value: String(car.car_id),
                      label: car.car_number,
                      number: car.car_number,
                      brand: car.vc_car_brand?.car_brand_name,
                      spec: car.vc_car_spec?.car_spec_name,
                      isRequestedSpec:
                        car.car_spec_id === selectedOrder?.car_spec_id,
                    }))}
                  value={
                    selectedCar
                      ? {
                          value: selectedCar,
                          label: cars.find(
                            (c) => String(c.car_id) === selectedCar,
                          )?.car_number,
                          number: cars.find(
                            (c) => String(c.car_id) === selectedCar,
                          )?.car_number,
                          brand: cars.find(
                            (c) => String(c.car_id) === selectedCar,
                          )?.vc_car_brand?.car_brand_name,
                        }
                      : null
                  }
                  onChange={(opt: any) => setSelectedCar(opt ? opt.value : "")}
                  formatOptionLabel={formatCarOptionLabel}
                  placeholder="ค้นหาทะเบียนรถ..."
                  styles={reactSelectStyles}
                  isClearable
                />
              </div>

              {/* Driver Select */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800">
                  พนักงานขับรถ <span className="text-rose-500">*</span>
                </label>
                <Select
                  options={
                    dispatchType === "self_drive"
                      ? [
                          {
                            value: "self",
                            label: `นาย ${selectedOrder?.vc_user?.firstname} ${selectedOrder?.vc_user?.lastname} (ผู้ขอขับเอง)`,
                          },
                          ...drivers
                            .filter((d) => d.driver_type_id === 2)
                            .map((d) => ({
                              value: String(d.driver_id),
                              label: `นาย ${d.vc_users?.firstname} ${d.vc_users?.lastname}`,
                            })),
                        ]
                      : drivers
                          .filter(
                            (d) => d.driver_type_id === 1 || !d.driver_type_id,
                          )
                          .map((d) => ({
                            value: String(d.driver_id),
                            label: `นาย ${d.vc_users?.firstname} ${d.vc_users?.lastname}`,
                          }))
                  }
                  value={
                    selectedDriver === "self"
                      ? { value: "self", label: "ผู้ขอขับเอง" }
                      : selectedDriver
                        ? {
                            value: selectedDriver,
                            label: `นาย ${drivers.find((d) => String(d.driver_id) === selectedDriver)?.vc_users?.firstname}`,
                          }
                        : null
                  }
                  onChange={(opt: any) =>
                    setSelectedDriver(opt ? opt.value : "")
                  }
                  placeholder="ค้นหาพนักงานขับรถ..."
                  styles={reactSelectStyles}
                  isClearable
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800">
                เหตุผลที่ใช้ TAXI
              </label>
              <textarea
                value={taxiReason}
                onChange={(e) => setTaxiReason(e.target.value)}
                placeholder="เช่น รถว่างไม่พอ หรือ เป็นกรณีเร่งด่วน..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                rows={4}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* PICKUP MODAL */}
      <Modal
        isOpen={isPickupModalOpen}
        onClose={() => setIsPickupModalOpen(false)}
        title="บันทึกการส่งมอบรถ (Pickup Confirmation)"
        maxWidth="md"
        accentColor="bg-blue-600"
        footer={
          <>
            <button
              onClick={() => setIsPickupModalOpen(false)}
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handlePickupSubmit}
              disabled={isPickupSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              {isPickupSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              บันทึกการส่งมอบ
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-800">
              สถานะการส่งมอบ
            </label>
            <select
              value={pickupStatus}
              onChange={(e) => setPickupStatus(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="PICKED_UP">ส่งมอบเรียบร้อย</option>
              <option value="NO_SHOW">ผู้ขอไม่มาติดต่อรับรถ</option>
            </select>
          </div>

          {pickupStatus === "PICKED_UP" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-800">
                    วันที่ส่งมอบ
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-800">
                    เวลาที่ส่งมอบ
                  </label>
                  <TimeInput24hr value={pickupTime} onChange={setPickupTime} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800">
                  วิธีการส่งมอบ
                </label>
                <select
                  value={pickupMethod}
                  onChange={(e) => setPickupMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="STAFF_DELIVERY">เจ้าหน้าที่ขับไปส่ง</option>
                  <option value="SELF_PICKUP">ผู้ขอรับรถด้วยตนเอง</option>
                  <option value="TAXI">เรียก TAXI ให้</option>
                </select>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="ยกเลิกคำขอใช้รถ"
        maxWidth="md"
        accentColor="bg-rose-600"
        footer={
          <>
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              ปิด
            </button>
            <button
              onClick={handleCancelSubmit}
              disabled={isCancelSubmitting || !cancelReason.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700 shadow-md transition-all disabled:opacity-50"
            >
              {isCancelSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              ยืนยันยกเลิก
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-sm text-rose-700 font-medium">
            ยกเลิกคำขอ REQ#
            {String(selectedCancelOrder?.request_id).padStart(3, "0")} —{" "}
            {selectedCancelOrder?.journey_place}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-800">
              เหตุผลที่ยกเลิก <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="ระบุเหตุผลที่ยกเลิก..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all resize-none"
              rows={4}
            />
          </div>
        </div>
      </Modal>
      {/* ASSIGNMENT DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="รายละเอียดการจัดสรรรถ"
        maxWidth="md"
        accentColor="bg-blue-600"
        footer={
          <>
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              ปิด
            </button>
            <button
              onClick={() => {
                setIsDetailsModalOpen(false);
                openAssignModal(selectedDetailsOrder);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all"
            >
              <Edit2 size={14} />
              แก้ไขการจัดรถ
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
             <div className="bg-white p-2 rounded-lg shadow-sm">
                <Truck className="text-blue-600" size={24} />
             </div>
             <div>
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">ยานพาหนะที่จัดสรร</p>
                <p className="text-lg font-black text-blue-700">
                  {selectedDetailsOrder?.vc_car_master?.car_number || (selectedDetailsOrder?.pickup_method === "TAXI" ? "TAXI (แท็กซี่)" : "ไม่ระบุ")}
                </p>
                <p className="text-xs text-blue-600 font-bold">
                  {selectedDetailsOrder?.vc_car_master?.vc_car_brand?.car_brand_name} • {selectedDetailsOrder?.vc_car_master?.vc_car_spec?.car_spec_name}
                </p>
             </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-4">
             <div className="bg-white p-2 rounded-lg shadow-sm">
                <User className="text-emerald-600" size={24} />
             </div>
             <div>
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">พนักงานขับรถ</p>
                <p className="text-lg font-black text-emerald-700">
                  {selectedDetailsOrder?.self_drive ? "ผู้ขอขับรถเอง" : (selectedDetailsOrder?.vc_driver?.vc_users ? `นาย ${selectedDetailsOrder.vc_driver.vc_users.firstname} ${selectedDetailsOrder.vc_driver.vc_users.lastname}` : "ไม่ระบุ")}
                </p>
                <p className="text-xs text-emerald-600 font-bold">
                  {selectedDetailsOrder?.vc_driver?.tel || "ไม่มีเบอร์โทรศัพท์"}
                </p>
             </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ข้อมูลการรับรถ</span>
                {selectedDetailsOrder?.pickup_status ? (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-black">รับรถแล้ว</span>
                ) : (
                  <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-black">รอยืนยันการรับรถ</span>
                )}
             </div>
             <p className="text-sm font-bold text-slate-700">
                วิธีการรับรถ: <span className="text-blue-600">{selectedDetailsOrder?.pickup_method === "TAXI" ? "แท็กซี่" : (selectedDetailsOrder?.pickup_method === "SELF_PICKUP" ? "รับรถเอง" : "เจ้าหน้าที่ขับไปส่ง")}</span>
             </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
