"use client";
import { useState, useEffect } from "react";
import { createBooking } from "@/app/actions/bookingActions";
import { getStartPlaces } from "@/app/actions/startPlaceActions";
import { getCarSpecs } from "@/app/actions/carSpecActions";
import { getOrgs } from "@/app/actions/orgActions";
import { useRouter } from "next/navigation";
import LongdoMapBox from "@/components/ui/LongdoMapBox";
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
} from "lucide-react";

export default function VehicleRequestPage() {
  const router = useRouter();
  const [startPlaces, setStartPlaces] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carSpecs, setCarSpecs] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const [provinceList, setProvinceList] = useState<any[]>([]);

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const [formData, setFormData] = useState({
    ownerDept: "",
    vehicleType: "",
    origin: "",
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
    driverId: 0,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (
      !formData.destination ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.objective ||
      (formData.selfDrive && !formData.driverId)
    ) {
      alert(
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (จุดหมาย, วันที่/เวลาเริ่ม, วัตถุประสงค์, ชื่อผู้ขับ)",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSubmit = new FormData();
      dataToSubmit.append("use_div_code", formData.ownerDept);
      dataToSubmit.append("car_spec_id", formData.vehicleType);
      dataToSubmit.append(
        "start_place",
        String(startPlaceMap[formData.origin] ?? 1),
      );
      dataToSubmit.append("journey_province", formData.province);
      dataToSubmit.append("journey_place", formData.destination);
      dataToSubmit.append("journey_lat", formData.lat.toString());
      dataToSubmit.append("journey_long", formData.lon.toString());

      const combinedDateTime = `${formData.startDate}T${formData.startTime}:00`;
      dataToSubmit.append("journey_date", combinedDateTime);
      dataToSubmit.append("journey_time", formData.startTime);

      const combinedEndDateTime = `${formData.endDate}T${formData.endTime || "00:00"}:00`;
      dataToSubmit.append("return_date", combinedEndDateTime);
      dataToSubmit.append("return_time", formData.endTime || "00:00");

      dataToSubmit.append("journey_causes", formData.objective);
      dataToSubmit.append("passenger_amount", formData.passengers.toString());
      dataToSubmit.append("user_mobile", formData.phone);
      dataToSubmit.append("self_drive", formData.selfDrive.toString());
      if (formData.selfDrive && formData.driverId) {
        dataToSubmit.append("driver_id", formData.driverId.toString());
      }

      const result = await createBooking(dataToSubmit);

      if (result.success) {
        alert("บันทึกคำขอใช้รถลงฐานข้อมูลเรียบร้อยแล้ว!");
        resetForm();
      } else {
        alert(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ownerDept: "",
      vehicleType: "รถเก๋ง 1500 cc",
      origin: startPlaces[0]?.start_place_name ?? "",
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
      driverId: 0,
    });
  };

  useEffect(() => {
    const fetchStartPlaces = async () => {
      const result = await getStartPlaces();
      if (result.success) setStartPlaces(result.data);
    };
    fetchStartPlaces();
  }, []);
  useEffect(() => {
    const fetchCarSpecs = async () => {
      const result = await getCarSpecs();
      if (result.success) setCarSpecs(result.data);
    };
    fetchCarSpecs();
  }, []);
  useEffect(() => {
    const fetchOrgs = async () => {
      const result = await getOrgs();
      if (result.success) setOrgs(result.data);
    };
    fetchOrgs();
  }, []);
  useEffect(() => {
    const selected = startPlaces.find(
      (sp) => sp.start_place_name === formData.origin,
    );
    if (selected?.province_id) {
      handleInputChange("province", selected.province_id);
    }
  }, [formData.origin, startPlaces]);

  const mockDrivers = [
    { driver_id: 1, driver_code: "D001", name: "นาย สมชาย ขับดี" },
    { driver_id: 2, driver_code: "D002", name: "นาย สมหมาย วิ่งเร็ว" },
    { driver_id: 3, driver_code: "D003", name: "นาย สมศักดิ์ ปลอดภัย" },
  ];
  const startPlaceMap = startPlaces.reduce(
    (acc, sp) => {
      acc[sp.start_place_name] = sp.start_place_id;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">
              ขอใช้งานยานพาหนะ
            </h1>
            <p className="text-gray-700 font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              ระบบจัดการคำขอใช้รถยนต์ส่วนกลาง
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Form */}
        <div className="w-full space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Car size={200} />
            </div>

            <div className="relative space-y-10">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
                <div className="w-2 h-8 bg-black rounded-full shadow-sm"></div>
                <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                  รายละเอียดแผนการเดินทาง
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {/* Row 1 */}
                <FormField label="สังกัดเจ้าของรถ" icon={Users} required>
                  <select
                    value={formData.ownerDept}
                    onChange={(e) =>
                      handleInputChange("ownerDept", e.target.value)
                    }
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
                  >
                    <option value="">-- เลือกสังกัด --</option>
                    {orgs.map((org) => (
                      <option key={org.orgid} value={org.orgid}>
                        {org.orgname}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="ประเภทรถที่ต้องการ" icon={Car} required>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) =>
                      handleInputChange("vehicleType", e.target.value)
                    }
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
                  >
                    <option value="">-- เลือกประเภทรถ --</option>
                    {carSpecs.map((cs) => (
                      <option key={cs.car_spec_id} value={cs.car_spec_id}>
                        {cs.car_spec_name}
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
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
                  >
                    {startPlaces.map((sp) => (
                      <option
                        key={sp.start_place_id}
                        value={sp.start_place_name}
                      >
                        {sp.start_place_name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="จังหวัด" icon={MapIcon} required>
                  <select
                    value={formData.province}
                    disabled={true} // ← auto-set จาก start_place ไม่ให้ user เลือกเอง
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-black shadow-sm opacity-60 cursor-not-allowed bg-gray-100"
                  >
                    {startPlaces.map((sp) => (
                      <option key={sp.start_place_id} value={sp.province_id}>
                        {sp.province?.name_th ?? "-"}
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
                        <NavIcon size={12} className="text-blue-500" />
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
                        <NavIcon size={12} className="text-blue-500" />
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
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
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
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
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
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
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
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
                  />
                </FormField>

                {/* Self Drive Checkbox + Driver Combobox */}
                <div className="md:col-span-2 space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.selfDrive}
                      onChange={(e) => {
                        handleInputChange("selfDrive", e.target.checked);
                        handleInputChange("driverId", 0);
                      }}
                      className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-emerald-900">
                        ขอขับเอง (Self Drive)
                      </span>
                    </div>
                  </label>

                  {formData.selfDrive && (
                    <div className="px-4">
                      <FormField label="เลือกชื่อผู้ขับ" icon={User} required>
                        <input
                          type="text"
                          value={
                            formData.driverId
                              ? (mockDrivers.find(
                                  (d) => d.driver_id === formData.driverId,
                                )?.name ?? "")
                              : ""
                          }
                          onChange={(e) => {
                            const found = mockDrivers.find(
                              (d) =>
                                d.name.includes(e.target.value) ||
                                d.driver_code.includes(e.target.value),
                            );
                            handleInputChange(
                              "driverId",
                              found?.driver_id ?? 0,
                            );
                          }}
                          placeholder="พิมพ์ชื่อหรือรหัสคนขับ..."
                          list="driver-list"
                          className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                        />
                        <datalist id="driver-list">
                          {mockDrivers.map((d) => (
                            <option key={d.driver_id} value={d.name}>
                              {d.driver_code}
                            </option>
                          ))}
                        </datalist>
                        {!formData.driverId && (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            * กรุณาเลือกชื่อผู้ขับ ถ้าไม่มีชื่อในระบบ
                            กรุณาติดต่อ Admin
                          </p>
                        )}
                      </FormField>
                    </div>
                  )}
                </div>

                {/* Message/Reason */}
                <div className="md:col-span-2">
                  <FormField
                    label={
                      <div className="flex items-center gap-2">
                        <span>หมายเหตุ</span>
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
                      className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm resize-none"
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
                      className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
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
                    className="w-full bg-gray-50 border-gray-300 border-2 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
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
                  className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลคำขอ"}
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
        <Icon className="w-4 h-4 text-blue-500" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
