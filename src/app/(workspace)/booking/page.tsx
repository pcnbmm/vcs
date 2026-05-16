"use client";
import { showSuccess, showError, showWarning } from "@/lib/sweetalert";
import { useState, useEffect } from "react";
import { createBooking } from "@/app/actions/bookingActions";
import { getStartPlaces } from "@/app/actions/startPlaceActions";
import { getCarSpecs } from "@/app/actions/carSpecActions";
import { getMyOrgs } from "@/app/actions/orgActions";
import MapBox from "@/components/ui/LongdoMapBox";
import { useRouter } from "next/navigation";
import { getDrivers } from "@/app/actions/driverActions";
import Select from "react-select";
import flatpickr from "flatpickr";
import { useRef } from "react";
import "flatpickr/dist/flatpickr.min.css";
import {
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
} from "lucide-react";

export default function VehicleRequestPage() {
  const [startPlaces, setStartPlaces] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carSpecs, setCarSpecs] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
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
      color: "#000000",
      cursor: "pointer",
      padding: "0.75rem 1.5rem",
      fontSize: "0.875rem",
      fontWeight: "bold",
    }),
    singleValue: (base: any) => ({
      ...base,
      fontWeight: "bold",
      color: "#000000",
      fontSize: "0.875rem",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#000000",
      fontWeight: "bold",
      fontSize: "0.875rem",
    }),
    input: (base: any) => ({
      ...base,
      color: "#000000",
      fontWeight: "bold",
      fontSize: "0.875rem",
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
  const [mapKey, setMapKey] = useState(0);
  const router = useRouter();

  const [formData, setFormData] = useState({
    ownerDept: "",
    vehicleType: "",
    origin: "",
    province: "",
    destination: "",
    lat: 0,
    lon: 0,
    startDate: "",
    startTime: "",
    endDate: "",
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
  const startPlaceMap = startPlaces.reduce(
    (acc, sp) => {
      acc[sp.start_place_name] = sp.start_place_id;
      return acc;
    },
    {} as Record<string, number>,
  );

  const handleSave = async () => {
    if (
      !formData.vehicleType ||
      !formData.destination ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime ||
      !formData.objective ||
      (formData.selfDrive && !formData.driverId)
    ) {
      showWarning(
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (จุดหมาย, วันที่/เวลาเริ่ม, วันที่/เวลากลับ, วัตถุประสงค์, ชื่อผู้ขับ)",
      );
      return;
    }

    if (!/^\d{9,10}$/.test(formData.phone)) {
      showWarning("เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก");
      return;
    }

    if (!formData.passengers || Number(formData.passengers) < 1) {
      showWarning("จำนวนผู้เดินทางต้องมีอย่างน้อย 1 คน");
      return;
    }

    const now = new Date();
    const startDT = new Date(
      `${formData.startDate}T${formData.startTime}:00+07:00`,
    );
    const endDT = new Date(`${formData.endDate}T${formData.endTime}:00+07:00`);
    if (startDT < now) {
      showWarning("วันที่และเวลาเดินทางไปต้องไม่น้อยกว่าเวลาปัจจุบัน");
      return;
    }

    if (endDT <= startDT) {
      showWarning("วันที่และเวลากลับต้องมากกว่าวันที่และเวลาเดินทางไป");
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

      const combinedDateTime = `${formData.startDate}T${formData.startTime}:00+07:00`;
      dataToSubmit.append("journey_date", combinedDateTime);
      dataToSubmit.append("journey_time", formData.startTime);

      const combinedEndDateTime = `${formData.endDate}T${formData.endTime || "00:00"}:00+07:00`;
      dataToSubmit.append("return_date", combinedEndDateTime);
      dataToSubmit.append("return_time", formData.endTime || "00:00");

      dataToSubmit.append("journey_causes", formData.objective);
      dataToSubmit.append("passenger_amount", formData.passengers.toString());
      dataToSubmit.append("user_mobile", formData.phone);
      dataToSubmit.append("self_drive", formData.selfDrive ? "true" : "false");
      if (formData.selfDrive && formData.driverId) {
        dataToSubmit.append("driver_id", formData.driverId.toString());
      }

      const result = await createBooking(dataToSubmit);

      if (result.success) {
        showSuccess("บันทึกคำขอใช้รถเรียบร้อยแล้ว!");
        router.push("/pending");
      } else {
        showError(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      showError("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ownerDept: "",
      vehicleType: "",
      origin: "",
      province: "",
      destination: "",
      lat: 0,
      lon: 0,
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      objective: "",
      passengers: 1,
      phone: "",
      selfDrive: false,
      driverId: 0,
    });
    if (startDateRef.current) (startDateRef.current as any)._flatpickr?.clear();
    if (endDateRef.current) (endDateRef.current as any)._flatpickr?.clear();
    setMapKey((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [startRes, orgRes, driverRes] = await Promise.all([
        getStartPlaces(),
        getMyOrgs(),
        getDrivers(),
      ]);

      if (startRes.success) setStartPlaces(startRes.data);
      if (driverRes.success) setDrivers(driverRes.data);

      if (orgRes.success) {
        setOrgs(orgRes.data);
        if (orgRes.data.length === 1) {
          setFormData((prev) => ({
            ...prev,
            ownerDept: String(orgRes.data[0].orgid),
          }));
        }
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSpecs = async () => {
      if (formData.ownerDept) {
        const specRes = await getCarSpecs(formData.ownerDept);
        if (specRes.success) setCarSpecs(specRes.data);
        setFormData((prev) => ({ ...prev, vehicleType: "" }));
      } else {
        setCarSpecs([]);
        setFormData((prev) => ({ ...prev, vehicleType: "" }));
      }
    };
    fetchSpecs();
  }, [formData.ownerDept]);

  useEffect(() => {
    if (!formData.origin) {
      handleInputChange("province", "");
      return;
    }
    const selected = startPlaces.find(
      (sp) => sp.start_place_name === formData.origin,
    );
    if (selected?.province_id) {
      handleInputChange("province", selected.province_id);
    }
  }, [formData.origin, startPlaces]);

  useEffect(() => {
    let fp: any;
    if (startDateRef.current) {
      const now = new Date();
      fp = flatpickr(startDateRef.current, {
        enableTime: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i",
        defaultHour: now.getHours(),
        defaultMinute: now.getMinutes(),
        onChange: (dates) => {
          if (dates && dates.length > 0) {
            const d = dates[0];
            const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const isoTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            setFormData((prev) => ({
              ...prev,
              startDate: isoDate,
              startTime: isoTime,
            }));
          }
        },
      });
    }
    return () => fp?.destroy();
  }, []);

  useEffect(() => {
    let fp: any;
    if (endDateRef.current) {
      const now = new Date();
      fp = flatpickr(endDateRef.current, {
        enableTime: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i",
        defaultHour: now.getHours(),
        defaultMinute: now.getMinutes(),
        onChange: (dates) => {
          if (!dates || dates.length === 0 || !dates[0]) return;
          const d = dates[0];
          const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const isoTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
          setFormData((prev) => ({
            ...prev,
            endDate: isoDate,
            endTime: isoTime,
          }));
        },
      });
    }
    return () => fp?.destroy();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 gap-8">
        <div className="w-full space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none select-none">
              <Car size={180} />
            </div>

            <div className="relative space-y-10">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-sm"></div>
                <h2 className="text-xl font-bold text-black uppercase tracking-tight">
                  รายละเอียดแผนการเดินทาง
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {/* Row 1 */}
                <FormField label="สังกัดเจ้าของรถ" icon={Users} required>
                  <Select
                    options={orgs.map((org) => ({
                      value: String(org.orgid),
                      label: org.orgname,
                    }))}
                    value={
                      formData.ownerDept
                        ? {
                            value: String(formData.ownerDept),
                            label: orgs.find(
                              (o) =>
                                String(o.orgid) === String(formData.ownerDept),
                            )?.orgname,
                          }
                        : null
                    }
                    onChange={(sel: any) =>
                      handleInputChange("ownerDept", sel ? sel.value : "")
                    }
                    placeholder="-- เลือกสังกัด --"
                    isClearable
                    isSearchable
                    styles={reactSelectStyles}
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                  />
                </FormField>

                <FormField label="ประเภทรถที่ต้องการ" icon={Car} required>
                  <Select
                    options={carSpecs.map((cs) => ({
                      value: String(cs.car_spec_id),
                      label: cs.car_spec_name,
                    }))}
                    value={
                      formData.vehicleType && carSpecs.length > 0
                        ? {
                            value: String(formData.vehicleType),
                            label: carSpecs.find(
                              (c) =>
                                String(c.car_spec_id) ===
                                String(formData.vehicleType),
                            )?.car_spec_name,
                          }
                        : null
                    }
                    onChange={(sel: any) =>
                      handleInputChange("vehicleType", sel ? sel.value : "")
                    }
                    placeholder="-- เลือกประเภทรถ --"
                    isClearable
                    isSearchable
                    styles={reactSelectStyles}
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                  />
                </FormField>

                {/* Row 2 */}
                <FormField label="สถานที่ (ต้นทาง)" icon={NavIcon} required>
                  <Select
                    options={startPlaces.map((sp) => ({
                      value: sp.start_place_name,
                      label: sp.start_place_name,
                    }))}
                    value={
                      formData.origin
                        ? { value: formData.origin, label: formData.origin }
                        : null
                    }
                    onChange={(sel: any) =>
                      handleInputChange("origin", sel ? sel.value : "")
                    }
                    placeholder="-- โปรดเลือกสถานที่ --"
                    isClearable
                    isSearchable
                    styles={reactSelectStyles}
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                  />
                </FormField>

                {/* Row 3, Map */}
                <div className="md:col-span-2 space-y-4 placeholder:text-gray-500">
                  <FormField label="สถานที่ (ปลายทาง)" icon={MapPin} required>
                    <MapBox
                      key={mapKey}
                      onLocationSelect={(loc: any) => {
                        setFormData((prev) => ({
                          ...prev,
                          destination: loc.name,
                          lat: loc.lat,
                          lon: loc.lon,
                        }));
                      }}
                      placeholder="ค้นหาสถานที่ แล้วคลิกจุดหมายบนแผนที่เพื่อปักหมุด"
                    />
                  </FormField>

                  {/* Latitude, Longitude */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="ละติจูด" icon={NavIcon}>
                      <input
                        type="text"
                        value={
                          formData.lat ? Number(formData.lat).toFixed(6) : ""
                        }
                        readOnly
                        placeholder="-"
                        className="w-full bg-slate-100 border-slate-200 border rounded-md px-4 py-2 text-sm font-bold text-black cursor-not-allowed"
                      />
                    </FormField>
                    <FormField label="ลองจิจูด" icon={NavIcon}>
                      <input
                        type="text"
                        value={
                          formData.lon ? Number(formData.lon).toFixed(6) : ""
                        }
                        readOnly
                        placeholder="-"
                        className="w-full bg-slate-100 border-slate-200 border rounded-md px-4 py-2 text-sm font-bold text-black cursor-not-allowed"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField label="วันเวลาเดินทางไป" icon={Calendar} required>
                    <div className="relative">
                      <input
                        ref={startDateRef}
                        type="text"
                        placeholder="วัน/เดือน/ปี --:--"
                        readOnly
                        className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer placeholder:text-gray-600"
                      />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </FormField>

                  <FormField
                    label="วันเวลาเดินทางกลับ"
                    icon={Calendar}
                    required
                  >
                    <div className="relative">
                      <input
                        ref={endDateRef}
                        type="text"
                        placeholder="วัน/เดือน/ปี --:--"
                        readOnly
                        className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer placeholder:text-gray-600"
                      />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </FormField>
                </div>

                {/* Row 5 */}
                <div className="md:col-span-2 space-y-3">
                  <FormField label="ขับรถด้วยตนเอง" icon={User}>
                    <label className="flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                      <input
                        type="checkbox"
                        checked={formData.selfDrive}
                        onChange={(e) => {
                          handleInputChange("selfDrive", e.target.checked);
                          handleInputChange("driverId", 0);
                        }}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-black">
                        ยืนยัน
                      </span>
                    </label>
                  </FormField>

                  {formData.selfDrive && (
                    <div className="px-4">
                      <FormField label="เลือกชื่อผู้ขับ" icon={User} required>
                        <Select
                          options={drivers.map((d) => ({
                            value: d.driver_id,
                            label:
                              `${d.vc_users?.firstname ?? ""} ${d.vc_users?.lastname ?? ""}`.trim(),
                          }))}
                          value={
                            formData.driverId
                              ? {
                                  value: formData.driverId,
                                  label:
                                    `${drivers.find((d) => d.driver_id === formData.driverId)?.vc_users?.firstname ?? ""} ${drivers.find((d) => d.driver_id === formData.driverId)?.vc_users?.lastname ?? ""}`.trim(),
                                }
                              : null
                          }
                          onChange={(sel: any) =>
                            handleInputChange("driverId", sel ? sel.value : 0)
                          }
                          placeholder="พิมพ์ชื่อคนขับเพื่อค้นหา..."
                          isClearable
                          isSearchable
                          styles={reactSelectStyles}
                          menuPortalTarget={
                            typeof document !== "undefined"
                              ? document.body
                              : null
                          }
                          menuPosition="fixed"
                          noOptionsMessage={() => "ไม่พบชื่อในระบบ"}
                        />
                        {!formData.driverId && (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            กรุณาเลือกชื่อคนขับ ถ้าไม่มีชื่อในระบบ กรุณาติดต่อ
                            Admin *
                          </p>
                        )}
                      </FormField>
                    </div>
                  )}
                </div>

                {/* Row 6 */}
                <div className="md:col-span-2">
                  <FormField label="หมายเหตุ" icon={MessageSquare} required>
                    <textarea
                      rows={3}
                      value={formData.objective}
                      onChange={(e) =>
                        handleInputChange("objective", e.target.value)
                      }
                      placeholder="ระบุวัตถุประสงค์ในการเดินทาง..."
                      className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm resize-none placeholder:text-gray-600"
                    />
                  </FormField>
                </div>

                {/* Row 8 */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 md:gap-x-8">
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
                        className="w-full bg-gray-50 border-gray-300 border rounded-lg pl-4 pr-16 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm placeholder:text-gray-600"
                      />
                      <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs font-bold text-black pointer-events-none">
                        คน
                      </span>
                    </div>
                  </FormField>
                  <FormField
                    label="หมายเลขโทรศัพท์ติดต่อ"
                    icon={Phone}
                    required
                  >
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        handleInputChange("phone", val);
                      }}
                      placeholder="0xxxxxxxxx"
                      className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm placeholder:text-gray-600"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Row 7 Button */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-50">
              <button
                onClick={resetForm}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-bold text-sm text-black hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" /> ยกเลิกเนื้อหา
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-70"
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
  );
}

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
      <label className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-2">
        <Icon size={12} className="text-blue-500" />
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
