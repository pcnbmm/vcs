"use client";
import { showSuccess, showError, showWarning, showConfirm } from "@/lib/sweetalert";

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
} from "lucide-react";
import {
  getPendingDispatch,
  getAvailableCars,
  getDrivers,
  assignResource,
} from "./actions";

// Types
type DispatchType = "with_driver" | "self_drive" | "taxi";

export default function AssignPage() {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dispatchType, setDispatchType] = useState<DispatchType>("with_driver");
  const [selectedCar, setSelectedCar] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Searchable Dropdown States
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [isCarListOpen, setIsCarListOpen] = useState(false);

  // Load Initial Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pending, carList, driverList] = await Promise.all([
        getPendingDispatch(),
        getAvailableCars(),
        getDrivers(),
      ]);
      setPendingOrders(pending);
      setCars(carList);
      setDrivers(driverList);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Logic: "Self-Drive"
  useEffect(() => {
    if (dispatchType === "self_drive" && selectedOrder) {
      console.log("--- SELF-DRIVE MATCHING CHECK ---");
      console.log("Current Order UserID (Requester):", selectedOrder.userid);
      console.log(
        "All Driver Codes in DB:",
        drivers.map((d) => d.driver_code),
      );

      // ค้นหาแบบยืดหยุ่น (ตัดช่องว่าง และเช็คทั้ง driver_code และ user_id)
      const reqId = String(selectedOrder.userid || "").trim();

      const requesterDriver = drivers.find((d) => {
        const dCode = String(d.driver_code || "").trim();
        const dUserId = String(d.user_id || "").trim();
        const oUserId = String(selectedOrder.vc_user?.id || "").trim();

        // เช็คว่า รหัสพนักงานตรงกัน หรือ User ID ตรงกัน
        return (
          (dCode !== "" && dCode === reqId) ||
          (dUserId !== "" && dUserId === oUserId)
        );
      });

      if (requesterDriver) {
        console.log("MATCH FOUND! ✅ Driver ID:", requesterDriver.driver_id);
        setSelectedDriver(String(requesterDriver.driver_id));
      } else {
        console.log("MATCH NOT FOUND ❌ (Checked against all driver_codes)");
        setSelectedDriver("self");
      }
      console.log("---------------------------------");
    }
  }, [dispatchType, selectedOrder, drivers]);

  const openAssignModal = (order: any) => {
    setSelectedOrder(order);
    setSelectedCar(order.car_id ? String(order.car_id) : "");
    setSelectedDriver(order.driver_id ? String(order.driver_id) : "");
    setCarSearchQuery(""); // Reset search on open
    setIsCarListOpen(false); // Close dropdown on open

    if (order.self_drive) {
      setDispatchType("self_drive");
    } else {
      setDispatchType("with_driver");
    }

    setIsModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedCar || (dispatchType === "with_driver" && !selectedDriver)) {
      showWarning("กรุณาเลือกข้อมูลให้ครบถ้วน");
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

    console.log(
      "Processed Data -> Car ID:",
      finalCarId,
      "Driver ID:",
      finalDriverId,
    );

    const isConfirmed = await showConfirm("ยืนยันการจัดรถ", "คุณต้องการบันทึกการจัดรถและคนขับใช่หรือไม่?");
    if (!isConfirmed) return;

    try {
      const result = await assignResource({
        requestId: selectedOrder.request_id,
        carId: finalCarId,
        driverId: finalDriverId,
      });

      if (result.success) {
        showSuccess("จัดรถสำเร็จ!");
        setIsModalOpen(false);
        fetchData(); // Refresh list
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (requestId: number) => {
    // No longer used, handled by assignResource directly setting status 5
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">


      {/* --- (SECTION 1: PENDING ASSIGNMENT) --- */}
      <section>
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-900">
            รายการรอจัดสรร (PENDING ASSIGNMENT)
          </h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-sm font-bold">
            {pendingOrders.length}
          </span>
        </div>

        {pendingOrders.length === 0 && !loading ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-12 flex items-center justify-center shadow-sm">
            <p className="text-slate-400">ไม่มีรายการรอจัดสรร</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingOrders.map((order) => (
              <div
                key={order.request_id}
                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  {/* ID Tag */}
                  <div className="bg-slate-50 border border-slate-100 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-blue-600 font-bold">
                    <span className="text-[10px] text-slate-400">REQ</span>
                    <span>{String(order.request_id).padStart(3, "0")}</span>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {order.journey_place}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(order.journey_date).toLocaleDateString(
                          "th-TH",
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        นาย {order.vc_user?.firstname} {order.vc_user?.lastname}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openAssignModal(order)}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-colors duration-300 shadow-sm"
                >
                  <Settings size={18} />
                  <span className="font-medium">จัดรถ / คนขับ</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- ASSIGNMENT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-slate-900 px-10 py-8 flex justify-between items-center text-white">
              <h2 className="text-2xl font-bold tracking-tight">
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
                      onClick={() => setDispatchType(type.id as DispatchType)}
                      className={`
                        flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300
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

              {/* Vehicle Selection (Searchable & Scrollable) */}
              <div className="space-y-4 relative">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block">
                  เลือกยานพาหนะ
                </label>

                {/* Custom Dropdown Trigger */}
                <div
                  onClick={() => setIsCarListOpen(!isCarListOpen)}
                  className={`
                    w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 flex justify-between items-center cursor-pointer transition-all
                    ${isCarListOpen ? "border-blue-500 bg-white ring-4 ring-blue-50" : "border-slate-50/50 hover:border-slate-200"}
                  `}
                >
                  <span
                    className={`font-bold ${selectedCar ? "text-slate-800" : "text-slate-400"}`}
                  >
                    {selectedCar
                      ? cars.find((c) => String(c.car_id) === selectedCar)
                          ?.car_number +
                        " (" +
                        (cars.find((c) => String(c.car_id) === selectedCar)
                          ?.vc_car_brand?.car_brand_name || "ไม่ระบุยี่ห้อ") +
                        ")"
                      : "กรุณาเลือกรถยนต์..."}
                  </span>
                  <ChevronDown
                    className={`text-slate-400 transition-transform ${isCarListOpen ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Searchable Menu */}
                {isCarListOpen && (
                  <div className="absolute z-[60] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* Search Field & Filtering Helper */}
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 space-y-3">
                      {/* Requested Type Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          ประเภทที่ขอมา:
                        </span>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {selectedOrder?.vc_car_spec?.car_spec_name ||
                            "ไม่ระบุ"}
                        </span>
                      </div>

                      <div className="relative">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <input
                          autoFocus
                          type="text"
                          placeholder="พิมพ์เลขทะเบียน หรือยี่ห้อรถ..."
                          value={carSearchQuery}
                          onChange={(e) => setCarSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {cars
                        .filter((car) => {
                          const matchesSearch =
                            car.car_number
                              ?.toLowerCase()
                              .includes(carSearchQuery.toLowerCase()) ||
                            car.vc_car_brand?.car_brand_name
                              ?.toLowerCase()
                              .includes(carSearchQuery.toLowerCase());

                          // กรองตามประเภทรถที่ขอมา (car_spec_id)
                          const matchesSpec =
                            !selectedOrder?.car_spec_id ||
                            car.car_spec_id === selectedOrder.car_spec_id;

                          return matchesSearch && matchesSpec;
                        })
                        .map((car) => (
                          <div
                            key={car.car_id}
                            onClick={() => {
                              setSelectedCar(String(car.car_id));
                              setIsCarListOpen(false);
                            }}
                            className={`
                                    px-6 py-4 cursor-pointer hover:bg-blue-50 transition-colors flex flex-col gap-0.5
                                    ${selectedCar === String(car.car_id) ? "bg-blue-50 border-r-4 border-blue-600" : ""}
                                `}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800">
                                {car.car_number}
                              </span>
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                            </div>
                            <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                              {car.vc_car_brand?.car_brand_name || "ไม่ระบุ"} •{" "}
                              {car.vc_car_spec?.car_spec_name || "ไม่ระบุสเปค"}
                            </span>
                          </div>
                        ))}

                      {/* กรณีไม่พบรถที่ตรงตามประเภทหรือคำค้นหา */}
                      {cars.filter((car) => {
                        const matchesSearch =
                          car.car_number
                            ?.toLowerCase()
                            .includes(carSearchQuery.toLowerCase()) ||
                          car.vc_car_brand?.car_brand_name
                            ?.toLowerCase()
                            .includes(carSearchQuery.toLowerCase());
                        const matchesSpec =
                          !selectedOrder?.car_spec_id ||
                          car.car_spec_id === selectedOrder.car_spec_id;
                        return matchesSearch && matchesSpec;
                      }).length === 0 && (
                        <div className="p-10 text-center text-slate-400 italic text-sm space-y-2">
                          <p>
                            ไม่พบรถว่างของประเภท "
                            {selectedOrder?.vc_car_spec?.car_spec_name}"
                            ที่กรองไว้
                          </p>
                          <p className="text-[10px] font-normal not-italic">
                            หากต้องการรถประเภทอื่น รบกวนแจ้งผู้ขอแก้ไขคำขอครับ
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Driver Selection */}
              <div className="space-y-4">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block">
                  เลือกพนักงานขับรถ
                </label>
                <div
                  className={`relative group ${dispatchType === "self_drive" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <select
                    disabled={dispatchType === "self_drive"}
                    value={
                      dispatchType === "self_drive" ? "self" : selectedDriver
                    }
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className={`
                            w-full bg-slate-50 border-2 border-slate-100/50 rounded-2xl px-6 py-4 outline-none transition-all appearance-none text-slate-800 font-bold
                            ${dispatchType !== "self_drive" ? "focus:border-blue-500 focus:bg-white" : "text-slate-400"}
                        `}
                  >
                    {dispatchType === "self_drive" ? (
                      <option value="self">
                        นาย {selectedOrder?.vc_user?.firstname}{" "}
                        {selectedOrder?.vc_user?.lastname}
                      </option>
                    ) : (
                      <>
                        <option value="">กรุณาเลือกชื่อคนขับ...</option>
                        {drivers.map((driver) => (
                          <option
                            key={driver.driver_id}
                            value={driver.driver_id}
                          >
                            นาย {driver.vc_users?.firstname}{" "}
                            {driver.vc_users?.lastname}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-8 bg-slate-50">
              <button
                onClick={handleAssignSubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-extrabold py-5 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                <Save size={20} />
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกและดำเนินการต่อ"}
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
