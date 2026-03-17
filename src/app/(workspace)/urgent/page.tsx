"use client";
import { useState, useEffect } from "react";
import { departments, vehicleTypes, provinces } from "@/mock/data/vehicles";
import {
  FileText,
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  MessageSquare,
  Save,
  X,
  Loader2,
  Navigation as NavIcon,
  Map as MapIcon,
  AlertCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";
import LongdoMapBox from "@/components/ui/LongdoMapBox";

// Import Server Actions
import {
  getUrgentRequesters,
  createUrgentBooking,
} from "@/app/actions/urgentBookingActions";

export default function UrgentRequestPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requesters, setRequesters] = useState<
    {
      userid: number;
      firstname: string | null;
      lastname: string | null;
      departmentid: string | null;
    }[]
  >([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Fetch requesters on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      const result = await getUrgentRequesters();
      if (result.success && result.data) {
        setRequesters(result.data);
        // Set default to first user if available
        if (result.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            requester_id: result.data[0].userid.toString(),
          }));
        }
      } else {
        console.error("Failed to fetch users");
      }
      setIsLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  // Form States
  const [formData, setFormData] = useState({
    requester_id: "", // User ID from DB
    ownerDept: "ฝ่ายบริหาร",
    vehicleType: "รถเก๋ง 1500 cc",
    origin: "หลักสี่",
    province: "กรุงเทพมหานคร",
    destination: "",
    lat: 0,
    lon: 0,
    startDate: getTodayDate(),
    startTime: getCurrentTime(),
    endDate: getTodayDate(),
    endTime: "",
    objective: "",
    passengers: 1,
    phone: "",
    selfDrive: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (
      !formData.requester_id ||
      !formData.destination ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.objective
    ) {
      alert(
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ผู้ขอใช้งาน, จุดหมาย, วันที่/เวลาเริ่ม, วัตถุประสงค์)",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // สร้าง FormData ส่งให้ Server Action
      const dataToSubmit = new FormData();
      dataToSubmit.append("requester_id", formData.requester_id);
      dataToSubmit.append("use_div_code", formData.ownerDept);
      dataToSubmit.append("car_spec_id", formData.vehicleType); // ตรงนี้ยังเป็น mock ของ vehicle types (รถเก๋ง 1500 cc) ถ้าในระบบจริง car_spec_id เป็น Int อาจจะต้องแก้ให้ตรงกัน
      dataToSubmit.append("start_place", formData.origin);
      dataToSubmit.append("journey_province", formData.province);
      dataToSubmit.append("journey_place", formData.destination);
      dataToSubmit.append("journey_lat", formData.lat.toString());
      dataToSubmit.append("journey_long", formData.lon.toString());

      // รวม start date และ time เพื่อให้เป็น Date string สำหรับ Prisma
      const combinedDateTime = `${formData.startDate}T${formData.startTime}:00`;
      dataToSubmit.append("journey_date", combinedDateTime);
      dataToSubmit.append("journey_time", formData.startTime);

      // รวม end date และ time
      const combinedEndDateTime = `${formData.endDate}T${formData.endTime || "00:00"}:00`;
      dataToSubmit.append("return_date", combinedEndDateTime);
      dataToSubmit.append("return_time", formData.endTime || "00:00");

      dataToSubmit.append("journey_causes", formData.objective);
      dataToSubmit.append("passenger_amount", formData.passengers.toString());
      dataToSubmit.append("user_mobile", formData.phone);
      dataToSubmit.append("self_drive", formData.selfDrive.toString());

      const result = await createUrgentBooking(dataToSubmit);

      if (result.success) {
        alert("บันทึกคำขอด่วนลงฐานข้อมูลสำเร็จ!");
        resetForm();
        // Redirect ไปหน้าจัดรถและคนขับ (หรือหน้าแรกของนายเวร)
        router.push("/assign");
      } else {
        alert(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      requester_id:
        requesters.length > 0 ? requesters[0].userid.toString() : "",
      ownerDept: "ฝ่ายบริหาร",
      vehicleType: "รถเก๋ง 1500 cc",
      origin: "หลักสี่",
      province: "กรุงเทพมหานคร",
      destination: "",
      lat: 0,
      lon: 0,
      startDate: getTodayDate(),
      startTime: getCurrentTime(),
      endDate: getTodayDate(),
      endTime: "",
      objective: "",
      passengers: 1,
      phone: "",
      selfDrive: false,
    });
  };

  // Helper: Lock province based on origin
  useEffect(() => {
    if (formData.origin === "บางรัก" || formData.origin === "หลักสี่") {
      handleInputChange("province", "กรุงเทพมหานคร");
    } else if (formData.origin === "แจ้งวัฒนะ") {
      handleInputChange("province", "นนทบุรี");
    }
  }, [formData.origin]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Banner/Alert Box สำหรับงานด่วน */}
      <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
        <p className="text-red-800 font-bold text-lg">
          🚨 โหมดบันทึกคำขอด่วน (สำหรับนายเวรเท่านั้น)
        </p>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-4xl shadow-sm border border-red-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-red-600 tracking-tight">
              คำขอใช้งานด่วน
            </h1>
            <p className="text-gray-700 font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              ระบบจัดการคำขอใช้รถยนต์ส่วนกลาง
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Form */}
        <div className="w-full space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-red-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Car size={200} className="text-red-900" />
            </div>

            <div className="relative space-y-10">
              <div className="flex items-center gap-3 border-b border-red-200 pb-6">
                <div className="w-2 h-8 bg-red-600 rounded-full shadow-sm"></div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  รายละเอียดแผนการเดินทาง
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {/* Requester (ผู้ขอใช้งาน) - Database Driven */}
                <div className="md:col-span-2">
                  <FormField
                    label="ผู้ขอใช้งาน (Data from DB)"
                    icon={User}
                    required
                  >
                    <select
                      value={formData.requester_id}
                      onChange={(e) =>
                        handleInputChange("requester_id", e.target.value)
                      }
                      disabled={isLoadingUsers}
                      className="w-full bg-red-50 border-red-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none font-bold text-gray-900 shadow-sm disabled:opacity-50"
                    >
                      {isLoadingUsers ? (
                        <option>กำลังโหลดรายชื่อ...</option>
                      ) : (
                        requesters.map((r) => (
                          <option key={r.userid} value={r.userid}>
                            {r.firstname} {r.lastname}{" "}
                            {r.departmentid ? `(${r.departmentid})` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </FormField>
                </div>

                {/* Row 1 */}
                <FormField label="สังกัดเจ้าของรถ" icon={Users} required>
                  <select
                    value={formData.ownerDept}
                    onChange={(e) =>
                      handleInputChange("ownerDept", e.target.value)
                    }
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
                  >
                    {departments.map((d: string) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="ประเภทรถที่ต้องการ" icon={Car} required>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) =>
                      handleInputChange("vehicleType", e.target.value)
                    }
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
                  >
                    <option value="">กรุณาเลือกประเภทรถ</option>
                    {vehicleTypes.map((v: string) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Row 2 */}
                <FormField label="สถานที่ (ต้นทาง)" icon={NavIcon} required>
                  <select
                    value={formData.origin}
                    onChange={(e) =>
                      handleInputChange("origin", e.target.value)
                    }
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
                  >
                    <option value="หลักสี่">หลักสี่</option>
                    <option value="แจ้งวัฒนะ">แจ้งวัฒนะ</option>
                    <option value="บางรัก">บางรัก</option>
                  </select>
                </FormField>

                <FormField label="จังหวัด" icon={MapIcon} required>
                  <select
                    value={formData.province}
                    onChange={(e) =>
                      handleInputChange("province", e.target.value)
                    }
                    disabled={["บางรัก", "แจ้งวัฒนะ", "หลักสี่"].includes(
                      formData.origin,
                    )}
                    className={`w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm ${["บางรัก", "แจ้งวัฒนะ", "หลักสี่"].includes(formData.origin) ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}`}
                  >
                    {provinces.map((p: string) => (
                      <option key={p} className="text-black">
                        {p}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Row 3 - Destination & Map (Full Width) */}
                <div className="md:col-span-2 space-y-4">
                  <FormField label="สถานที่ (ปลายทาง)" icon={MapPin} required>
                    <LongdoMapBox
                      onLocationSelect={(loc: any) => {
                        handleInputChange("destination", loc.name);
                        handleInputChange("lat", loc.lat);
                        handleInputChange("lon", loc.lon);
                      }}
                      placeholder="ค้นหาจุดหมายปลายทาง (ระบุเลขที่บ้าน, อาคาร, ซอย)"
                    />
                  </FormField>

                  {/* Lat/Long Display Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <NavIcon size={12} className="text-red-500" />
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={formData.lat || ""}
                        readOnly
                        placeholder="0.000000"
                        className="w-full bg-gray-50 border-gray-200 border-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <NavIcon size={12} className="text-red-500" />
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={formData.lon || ""}
                        readOnly
                        placeholder="0.000000"
                        className="w-full bg-gray-50 border-gray-200 border-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3 - Departure */}
                <FormField label="วันที่เดินทางไป" icon={Calendar} required>
                  <input
                    type="date"
                    value={formData.startDate}
                    min={getTodayDate()}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
                  />
                </FormField>
                <FormField label="เวลาเดินทางไป" icon={Clock} required>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      handleInputChange("startTime", e.target.value)
                    }
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
                  />
                </FormField>

                {/* Row 4 - Return */}
                <FormField label="วันที่เดินทางกลับ" icon={Calendar} required>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || getTodayDate()}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
                  />
                </FormField>
                <FormField label="เวลาเดินทางกลับ" icon={Clock} required>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      handleInputChange("endTime", e.target.value)
                    }
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
                  />
                </FormField>

                {/* Self Drive Checkbox */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200">
                    <input
                      type="checkbox"
                      checked={formData.selfDrive}
                      onChange={(e) =>
                        handleInputChange("selfDrive", e.target.checked)
                      }
                      className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-red-600" />
                      <span className="font-bold text-red-900">
                        ขอขับเอง (Self Drive)
                      </span>
                    </div>
                  </label>
                </div>

                {/* Message/Reason */}
                <div className="md:col-span-2">
                  <FormField
                    label={
                      <div className="flex items-center gap-2">
                        <span>หมายเหตุ</span>
                        <span className="text-red-500 font-bold text-xs">
                          (** ในกรณีที่ต้องการขับเอง โปรดระบุชื่อผู้ขับในช่องนี้
                          **)
                        </span>
                      </div>
                    }
                    icon={MessageSquare}
                    required
                  >
                    <textarea
                      rows={3}
                      value={formData.objective}
                      onChange={(e) =>
                        handleInputChange("objective", e.target.value)
                      }
                      placeholder="ระบุวัตถุประสงค์ในการเดินทาง..."
                      className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-black shadow-sm resize-none"
                    />
                  </FormField>
                </div>

                {/* Passengers & Phone */}
                <FormField label="จำนวนผู้เดินทาง" icon={Users} required>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.passengers}
                      onChange={(e) =>
                        handleInputChange("passengers", e.target.value)
                      }
                      placeholder="0"
                      min="1"
                      className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      คน
                    </span>
                  </div>
                </FormField>
                <FormField label="หมายเลขโทรศัพท์ติดต่อ" icon={Phone} required>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="0x-xxxx-xxxx"
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-50">
                <button
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  ยกเลิกเนื้อหา
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-10 py-3.5 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 shadow-xl shadow-red-200 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลคำขอด่วน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component เสริม
function FormField({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: React.ReactNode;
  icon: any;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
        <Icon className="w-4 h-4 text-red-500" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
