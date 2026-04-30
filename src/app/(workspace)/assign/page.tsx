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
  CheckCircle,
  Truck,
  Navigation,
  Check,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  getPendingDispatch,
  getAvailableCars,
  getDrivers,
  assignResource,
  recordPickupResource,
} from "./actions";
import { getCarSpecs } from "@/app/actions/carSpecActions";
import Select from "react-select";

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
      
    // Clean up journeyTime (e.g. remove " น.", trailing spaces)
    let timeStr = journeyTime ? journeyTime.replace(/[^0-9:]/g, "") : "23:59:59";
    if (!timeStr || timeStr.length < 4) timeStr = "23:59:59";
    
    if (timeStr.split(':').length === 2) {
      timeStr += ':00';
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

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("action_required");
  
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

  // React-Select styles mapping
  const reactSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: "1rem",
      padding: "0.3rem 0.5rem",
      borderColor: state.isFocused ? "#3b82f6" : "transparent",
      backgroundColor: state.isFocused ? "#ffffff" : "#f8fafc",
      boxShadow: state.isFocused ? "0 0 0 4px #eff6ff" : "none",
      borderWidth: "2px",
      cursor: "pointer",
      transition: "all 0.2s",
      "&:hover": {
        borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
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
      padding: "0.75rem 1.5rem",
    }),
    singleValue: (base: any) => ({
      ...base,
      fontWeight: "bold",
      color: "#000000",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#000000",
      fontWeight: "bold",
    }),
    input: (base: any) => ({
      ...base,
      color: "#000000",
      fontWeight: "bold",
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: "1rem",
      overflow: "hidden",
      zIndex: 100,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
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
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
        </div>
        <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
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
    // Set current time for pickup defaults
    const now = new Date();
    setPickupTime(now.toTimeString().slice(0, 5));
  }, []);

  // Handle Logic: "Self-Drive"
  useEffect(() => {
    if (dispatchType === "self_drive" && selectedOrder) {
      if (selectedOrder.self_drive) {
        // ถ้ามีการระบุ driver_id มาตั้งแต่ตอนจอง ให้ยึดตามนั้น
        if (selectedOrder.driver_id) {
          setSelectedDriver(String(selectedOrder.driver_id));
        } else {
          // ถ้าไม่มีการระบุคนขับ ให้ fallback เป็นผู้จอง
          setSelectedDriver("self");
        }
      }
    }
  }, [dispatchType, selectedOrder]);

  const openAssignModal = async (order: any) => {
    setSelectedOrder(order);
    setSelectedCar(order.car_id ? String(order.car_id) : "");
    setSelectedDriver(order.driver_id ? String(order.driver_id) : "");
    setDispatchType(order.pickup_method === "TAXI" ? "taxi" : order.self_drive ? "self_drive" : "with_driver");
    setTaxiReason("");
    setSelectedSpecFilter(order.car_spec_id ? String(order.car_spec_id) : "all");

    const carList = await getAvailableCars(order.use_div_code ?? undefined);
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

    console.log(
      "Submitting with Car ID:",
      selectedCar,
      "Driver ID:",
      selectedDriver,
    );

    // แปลงค่าและเตรียมข้อมูล
    const finalCarId = parseInt(selectedCar);
    let finalDriverId: number | null = null;

    if (dispatchType === "self_drive") {
      finalDriverId =
        selectedDriver === "self" ? null : parseInt(selectedDriver);
    } else {
      finalDriverId = parseInt(selectedDriver);
    }

    const isConfirmed = await showConfirm("ยืนยันการจัดรถ");
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
        fetchData(); // Refresh list
      } else {
        showError(result.error || "เกิดข้อผิดพลาดในการจัดรถและส่งอีเมล");
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
  ];

  const filteredOrders = pendingOrders
    .filter((order) => {
      const isExpired = isAssignExpired(order.journey_date, order.journey_time);
      if (filterStatus === "action_required") {
        return (order.status_use_id === 2 && !isExpired) || (order.status_use_id === 4 && !order.pickup_status && !isExpired);
      }
      if (filterStatus === "expired") {
        return isExpired && !order.pickup_status && order.status_use_id !== 5 && order.status_use_id !== 6;
      }
      if (filterStatus === "pending_assign") return order.status_use_id === 2 && !isExpired;
      if (filterStatus === "pending_pickup")
        return order.status_use_id === 4 && !order.pickup_status && !isExpired;
      if (filterStatus === "completed")
        return (
          (order.status_use_id === 4 &&
            (order.pickup_status === "PICKED_UP" ||
              order.pickup_status === "TAXI_CALLED")) ||
          (order.status_use_id === 5 && order.pickup_method === "TAXI")
        );
      return true;
    })
    .sort((a, b) => {
      // 1. Sort by status priority
      const getPriority = (order: any) => {
        if (order.status_use_id === 2) return 1; // รอจัดรถ
        if (order.status_use_id === 4 && !order.pickup_status) return 2; // จัดรถแล้ว รอการรับรถ
        return 3;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 2. Sort by date and time
      const dateStrA = a.journey_date ? new Date(a.journey_date).toISOString().split('T')[0] : '1970-01-01';
      const timeStrA = a.journey_time ? a.journey_time.trim() : '00:00:00';
      const fullDateA = new Date(`${dateStrA}T${timeStrA.split(':').length === 2 ? timeStrA + ':00' : timeStrA}`);

      const dateStrB = b.journey_date ? new Date(b.journey_date).toISOString().split('T')[0] : '1970-01-01';
      const timeStrB = b.journey_time ? b.journey_time.trim() : '00:00:00';
      const fullDateB = new Date(`${dateStrB}T${timeStrB.split(':').length === 2 ? timeStrB + ':00' : timeStrB}`);

      return fullDateA.getTime() - fullDateB.getTime();
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* --- (SECTION 1: PENDING ASSIGNMENT) --- */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-900">
              รายการจัดสรร (ASSIGNMENT)
            </h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-sm font-bold">
              {filteredOrders.length}
            </span>
          </div>

          <div className="w-full sm:w-64 z-[45]">
            <Select
              options={statusFilterOptions}
              value={statusFilterOptions.find((o) => o.value === filterStatus)}
              onChange={(option: any) => {
                setFilterStatus(option.value);
                setCurrentPage(1);
              }}
              isSearchable={false}
              styles={{
                ...reactSelectStyles,
                menuPortal: (base: any) => ({ ...base, zIndex: 50 }),
              }}
            />
          </div>
        </div>

        {filteredOrders.length === 0 && !loading ? (
          <div className="bg-white rounded-md border border-slate-100 p-12 flex items-center justify-center shadow-sm">
            <p className="text-slate-400">ไม่มีรายการในสถานะนี้</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {paginatedOrders.map((order) => (
              <div
                key={order.request_id}
                className="bg-white rounded-md p-6 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  {/* ID Tag */}
                  <div className="bg-slate-50 border border-slate-100 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-blue-600 font-bold">
                    <span className="text-[10px] text-slate-400">REQ</span>
                    <span>{String(order.request_id).padStart(3, "0")}</span>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {order.journey_place}
                      {order.status_use_id === 4 && !order.pickup_status && (
                        <span className="ml-3 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 tracking-wide border border-emerald-200">
                          จัดรถแล้ว (รอการรับรถ)
                        </span>
                      )}
                      {order.status_use_id === 4 &&
                        (order.pickup_status === "PICKED_UP" ||
                          order.pickup_status === "TAXI_CALLED") && (
                          <span className="ml-3 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 tracking-wide border border-gray-200">
                            {order.pickup_status === "TAXI_CALLED"
                              ? "เรียกรถแท็กซี่แล้ว"
                              : "รับรถเรียบร้อยแล้ว"}
                          </span>
                        )}
                      {order.status_use_id === 5 &&
                        order.pickup_method === "TAXI" && (
                          <span className="ml-3 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 tracking-wide border border-amber-200">
                            อนุมัติ taxi
                          </span>
                        )}
                    </h3>
                    <div className="flex flex-col gap-1.5 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-semibold text-slate-500">วันเดินทาง:</span>
                        <span>
                          {new Date(order.journey_date).toLocaleDateString("th-TH")} 
                          {order.journey_time ? ` เวลา ${order.journey_time.slice(0, 5)} น.` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="font-semibold text-slate-500">ผู้ขอใช้รถ:</span>
                        <span>{order.vc_user?.firstname} {order.vc_user?.lastname}</span>
                      </div>
                      
                      {/* Show assigned vehicle and driver if available */}
                      {order.car_id && (
                        <div className="flex items-center gap-2 mt-1">
                          <Truck size={14} className="text-blue-400" />
                          <span className="font-semibold text-blue-500">รถที่จัดให้:</span>
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-medium text-[12px]">
                            {order.vc_car_master?.car_number} ({order.vc_car_master?.vc_car_brand?.car_brand_name || "ไม่ระบุ"})
                          </span>
                        </div>
                      )}
                      
                      {(order.driver_id || order.self_drive) && (
                        <div className="flex items-center gap-2">
                          <Navigation size={14} className="text-amber-400" />
                          <span className="font-semibold text-amber-500">พนักงานขับรถ:</span>
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium text-[12px]">
                            {order.self_drive 
                              ? "ขับเอง (ผู้ขอใช้รถ)" 
                              : `${order.vc_driver?.vc_users?.firstname || ""} ${order.vc_driver?.vc_users?.lastname || ""}`}
                          </span>
                        </div>
                      )}

                      {order.pickup_method === "TAXI" && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">🚕</span>
                          <span className="font-semibold text-orange-500">การจัดสรร:</span>
                          <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md font-medium text-[12px]">
                            ใช้รถรับจ้าง (Taxi)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {(order.status_use_id === 4 &&
                  (order.pickup_status === "PICKED_UP" ||
                    order.pickup_status === "TAXI_CALLED")) ||
                (order.status_use_id === 5 &&
                  order.pickup_method === "TAXI") ? (
                  <button
                    disabled
                    className="bg-gray-100 text-gray-400 px-6 py-2.5 rounded-md flex items-center gap-2 cursor-not-allowed border border-gray-200"
                  >
                    <CheckCircle size={18} />
                    <span className="font-bold">เสร็จสิ้น</span>
                  </button>
                ) : isAssignExpired(order.journey_date, order.journey_time) ? (
                  <button
                    disabled
                    className="bg-rose-50 text-rose-500 px-6 py-2.5 rounded-md flex items-center gap-2 cursor-not-allowed border border-rose-200"
                  >
                    <AlertCircle size={18} />
                    <span className="font-bold">คำขอจัดรถหมดอายุ</span>
                  </button>
                ) : order.status_use_id === 4 ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAssignModal(order)}
                      className="bg-slate-50 text-slate-600 px-4 py-2.5 rounded-md flex items-center gap-2 hover:bg-slate-200 transition-colors duration-300 border border-slate-200"
                    >
                      <Edit2 size={18} />
                      <span className="font-bold">แก้ไข</span>
                    </button>
                    <button
                      onClick={() => openPickupModal(order)}
                      className="bg-emerald-600 text-white px-6 py-2.5 rounded-md flex items-center gap-2 hover:bg-emerald-700 transition-colors duration-300 shadow-xl shadow-emerald-100"
                    >
                      <CheckCircle size={18} />
                      <span className="font-bold">ยืนยันการรับรถ</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openAssignModal(order)}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-md flex items-center gap-2 hover:bg-blue-600 transition-colors duration-300 shadow-sm"
                  >
                    <Settings size={18} />
                    <span className="font-medium">จัดสรรยานพาหนะ</span>
                  </button>
                )}
              </div>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-2">
                <span className="text-sm text-slate-500">
                  แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredOrders.length)} จาก {filteredOrders.length} รายการ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    ก่อนหน้า
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- ASSIGNMENT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-slate-900 px-10 py-8 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold tracking-tight">
                การระบุทรัพยากร
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Dispatch Type Selection */}
              <div>
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-4">
                  รูปแบบการจัดรถ (DISPATCH TYPE)
                </label>
                <div className="grid grid-cols-3 gap-4">
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
                      label: "รถรับจ้าง (TAXI)",
                      icon: MapPin,
                      color: "amber",
                    },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        if (dispatchType !== type.id) {
                          setDispatchType(type.id as DispatchType);
                          setSelectedDriver("");
                        }
                      }}
                      className={`
                        flex flex-col items-center justify-center gap-3 p-6 rounded-md border transition-all duration-300
                        ${
                          dispatchType === type.id
                            ? `bg-${type.color}-600 border-${type.color}-600 text-white shadow-xl shadow-${type.color}-100 scale-105`
                            : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
                        }
                      `}
                    >
                      <type.icon size={28} />
                      <span className="text-xs font-bold">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* วางเงื่อนไขซ่อนส่วนเลือกรถและคนขับ ถ้าเป็นแท็กซี่ */}
              {dispatchType !== "taxi" ? (
                <>
                  {/* Vehicle Type Filter */}
                  <div className="space-y-4 relative z-[60]">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block">
                        ประเภทรถที่ต้องการจัดสรร
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          ประเภทที่ขอมา:
                        </span>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {selectedOrder?.vc_car_spec?.car_spec_name || "ไม่ระบุ"}
                        </span>
                      </div>
                    </div>
                    <Select
                      options={[
                        { value: "all", label: "|- เลือกประเภทรถ -|" },
                        ...carSpecs.map(spec => ({
                          value: String(spec.car_spec_id),
                          label: spec.car_spec_name || "ไม่ระบุ"
                        }))
                      ]}
                      value={
                        selectedSpecFilter === "all" 
                          ? { value: "all", label: "|- เลือกประเภทรถ -|" } 
                          : {
                              value: selectedSpecFilter,
                              label: carSpecs.find(s => String(s.car_spec_id) === selectedSpecFilter)?.car_spec_name || "ไม่ระบุ"
                            }
                      }
                      onChange={(selectedOption: any) => {
                        setSelectedSpecFilter(selectedOption ? selectedOption.value : "all");
                        setSelectedCar(""); // reset selected car when type changes
                      }}
                      isSearchable
                      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                      menuPosition="fixed"
                      styles={{...reactSelectStyles, menuPortal: (base: any) => ({ ...base, zIndex: 9999 })}}
                    />
                  </div>

                  {/* Vehicle Selection */}
                  <div className="space-y-4 relative z-[55]">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block">
                        เลือกยานพาหนะ
                      </label>
                    </div>

                    <Select
                      options={cars
                        .filter(car => selectedSpecFilter === "all" || String(car.car_spec_id) === selectedSpecFilter)
                        .map((car) => ({
                          value: String(car.car_id),
                          label: `${car.car_number} (${car.vc_car_brand?.car_brand_name || "ไม่ระบุยี่ห้อ"})`,
                          number: car.car_number,
                          brand: car.vc_car_brand?.car_brand_name,
                          spec: car.vc_car_spec?.car_spec_name,
                          isRequestedSpec: car.car_spec_id === selectedOrder?.car_spec_id,
                        }))
                        .sort((a, b) => {
                          if (a.isRequestedSpec && !b.isRequestedSpec) return -1;
                          if (!a.isRequestedSpec && b.isRequestedSpec) return 1;
                          return 0;
                        })}
                      value={
                        selectedCar
                          ? {
                              value: selectedCar,
                              label:
                                cars.find(
                                  (c) => String(c.car_id) === selectedCar,
                                )?.car_number +
                                " (" +
                                (cars.find(
                                  (c) => String(c.car_id) === selectedCar,
                                )?.vc_car_brand?.car_brand_name ||
                                  "ไม่ระบุยี่ห้อ") +
                                ")",
                              number: cars.find(
                                (c) => String(c.car_id) === selectedCar,
                              )?.car_number,
                              brand: cars.find(
                                (c) => String(c.car_id) === selectedCar,
                              )?.vc_car_brand?.car_brand_name,
                            }
                          : null
                      }
                      onChange={(selectedOption: any) =>
                        setSelectedCar(
                          selectedOption ? selectedOption.value : "",
                        )
                      }
                      formatOptionLabel={formatCarOptionLabel}
                      placeholder="ค้นหาทะเบียน หรือยี่ห้อรถ..."
                      isClearable
                      isSearchable
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                      menuPosition="fixed"
                      styles={reactSelectStyles}
                      noOptionsMessage={() => (
                        <div className="p-4 text-center text-slate-400 italic text-sm space-y-2">
                          <p>ไม่พบรถว่างของประเภทที่ค้นหา</p>
                        </div>
                      )}
                    />
                  </div>

                  {/* Driver Selection Using React-Select */}
                  <div className="space-y-4 relative z-[50]">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block">
                      เลือกพนักงานขับรถ
                    </label>
                    <div className="relative group z-40">
                      <Select
                        options={
                          dispatchType === "self_drive"
                            ? [
                                {
                                  value: "self",
                                  label: `นาย ${selectedOrder?.vc_user?.firstname || ""} ${selectedOrder?.vc_user?.lastname || ""}`.trim() + (selectedOrder?.self_drive && !selectedOrder?.driver_id ? " (ผู้ขอขับรถด้วยตนเอง)" : ""),
                                },
                                ...drivers.map((driver) => ({
                                  value: String(driver.driver_id),
                                  label: `นาย ${driver.vc_users?.firstname || ""} ${driver.vc_users?.lastname || ""}`.trim() + (selectedOrder?.self_drive && String(selectedOrder.driver_id) === String(driver.driver_id) ? " (ผู้ขอขับรถด้วยตนเอง)" : ""),
                                })),
                              ].sort((a, b) => {
                                if (a.label.includes("(ผู้ขอขับรถด้วยตนเอง)")) return -1;
                                if (b.label.includes("(ผู้ขอขับรถด้วยตนเอง)")) return 1;
                                return 0;
                              })
                            : drivers.map((driver) => ({
                                value: String(driver.driver_id),
                                label: `นาย ${driver.vc_users?.firstname || ""} ${driver.vc_users?.lastname || ""}`,
                              }))
                        }
                        value={
                          selectedDriver === "self"
                            ? {
                                value: "self",
                                label: `นาย ${selectedOrder?.vc_user?.firstname || ""} ${selectedOrder?.vc_user?.lastname || ""}`.trim() + (selectedOrder?.self_drive && !selectedOrder?.driver_id ? " (ผู้ขอขับรถด้วยตนเอง)" : ""),
                              }
                            : selectedDriver
                              ? {
                                  value: selectedDriver,
                                  label: `นาย ${drivers.find((d) => String(d.driver_id) === selectedDriver)?.vc_users?.firstname || ""} ${drivers.find((d) => String(d.driver_id) === selectedDriver)?.vc_users?.lastname || ""}`.trim() + (selectedOrder?.self_drive && String(selectedOrder.driver_id) === selectedDriver ? " (ผู้ขอขับรถด้วยตนเอง)" : ""),
                                }
                              : null
                        }
                        onChange={(selectedOption: any) =>
                          setSelectedDriver(
                            selectedOption ? selectedOption.value : "",
                          )
                        }
                        placeholder="พิมพ์ค้นหาชื่อคนขับ..."
                        isClearable
                        isSearchable
                        menuPortalTarget={
                          typeof document !== "undefined" ? document.body : null
                        }
                        menuPosition="fixed"
                        styles={reactSelectStyles}
                        noOptionsMessage={() => "ไม่พบชื่อพนักงานขับรถ"}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block">
                    เหตุผลที่จัดรถแท็กซี่
                  </label>
                  <textarea
                    value={taxiReason}
                    onChange={(e) => setTaxiReason(e.target.value)}
                    placeholder="ระบุเหตุผล..."
                    className="w-full border-2 border-slate-200 rounded-xl p-3 font-semibold text-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-50 outline-none min-h-[100px] transition-all"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100">
              <div className="px-10 py-6">
                <button
                  onClick={handleAssignSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white font-extrabold py-5 rounded-lg shadow-xl shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  <Save size={20} />
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกและส่งอีเมลแจ้งเตือน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PICKUP MODAL --- */}
      {isPickupModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-emerald-600 px-8 py-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold tracking-tight">
                บันทึกการส่งมอบรถ
              </h2>
              <button
                onClick={() => setIsPickupModalOpen(false)}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">
                  สถานะการส่งมอบ
                </label>
                <select
                  value={pickupStatus}
                  onChange={(e) => setPickupStatus(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                >
                  <option value="PICKED_UP">ดำเนินการรับรถแล้ว</option>
                  <option value="NO_SHOW">ผู้ขอไม่มารับรถ</option>
                </select>
              </div>

              {pickupStatus === "PICKED_UP" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">
                        วันที่
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl p-3 font-semibold text-slate-800 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">
                        เวลา
                      </label>
                      <TimeInput24hr
                        value={pickupTime}
                        onChange={(val) => setPickupTime(val)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">
                      รูปแบบการส่งมอบ
                    </label>
                    <select
                      value={pickupMethod}
                      onChange={(e) => setPickupMethod(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:border-emerald-500 outline-none transition-colors"
                    >
                      <option value="STAFF_DELIVERY">
                        เจ้าหน้าที่นำรถไปส่ง
                      </option>
                      <option value="SELF_PICKUP">ผู้ขอรับรถด้วยตนเอง</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50">
              <button
                onClick={handlePickupSubmit}
                disabled={isPickupSubmitting}
                className="w-full bg-emerald-600 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isPickupSubmitting ? "กำลังบันทึก..." : "บันทึกการส่งมอบ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind Style Helper for Dynamic colors if needed by class string */}
      <style jsx global>{`
        .bg-blue-600 {
          background-color: #2563eb;
        }
        .bg-indigo-600 {
          background-color: #4f46e5;
        }
        .bg-amber-600 {
          background-color: #d97706;
        }
        .border-blue-600 {
          border-color: #2563eb;
        }
        .border-indigo-600 {
          border-color: #4f46e5;
        }
        .border-amber-600 {
          border-color: #d97706;
        }
        .shadow-blue-100 {
          --tw-shadow-color: rgba(37, 99, 235, 0.1);
        }
        .shadow-indigo-100 {
          --tw-shadow-color: rgba(79, 70, 229, 0.1);
        }
        .shadow-amber-100 {
          --tw-shadow-color: rgba(217, 119, 6, 0.1);
        }
      `}</style>
    </div>
  );
}
