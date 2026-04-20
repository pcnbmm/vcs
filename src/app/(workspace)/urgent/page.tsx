"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";

import { useState, useEffect } from "react";
import { createBooking } from "@/app/actions/bookingActions";
import { getStartPlaces } from "@/app/actions/startPlaceActions";
import { getCarSpecs } from "@/app/actions/carSpecActions";
import { getMyOrgs,getOrgsByUserId  } from "@/app/actions/orgActions";
import {
  getUrgentRequesters,
  createUrgentBooking,
} from "@/app/actions/urgentBookingActions";
import { useRouter } from "next/navigation";
import LongdoMapBox from "@/components/ui/LongdoMapBox";
import { getDrivers } from "@/app/actions/driverActions";
import Select from "react-select";
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
  const [drivers, setDrivers] = useState<any[]>([]);
  const [requesters, setRequesters] = useState<any[]>([]);

  const reactSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: "1rem",
      padding: "0.3rem 0.5rem",
      borderColor: state.isFocused ? "#ef4444" : "transparent",
      backgroundColor: state.isFocused ? "#ffffff" : "#f8fafc",
      boxShadow: state.isFocused ? "0 0 0 4px #fee2e2" : "none",
      borderWidth: "2px",
      cursor: "pointer",
      transition: "all 0.2s",
      "&:hover": {
        borderColor: state.isFocused ? "#ef4444" : "#fca5a5",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#fee2e2"
        : state.isFocused
          ? "#fef2f2"
          : "#ffffff",
      color: state.isSelected ? "#7f1d1d" : "#1e293b",
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
    input: (base: any) => ({ ...base, color: "#000000", fontWeight: "bold" }),
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
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    objective: "",
    passengers: 1,
    phone: "",
    selfDrive: false,
    driverId: 0,
    isUrgent: true,
    requesterId: 0,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (
      !formData.requesterId ||
      !formData.destination ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime ||
      !formData.objective ||
      (formData.selfDrive && !formData.driverId)
    ) {
      showWarning(
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ผู้ขอใช้รถ, จุดหมาย, วันที่/เวลาเริ่ม, วันที่/เวลากลับ, วัตถุประสงค์)",
      );
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      showWarning("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น");
      return;
    }

    if (formData.startDate > formData.endDate) {
      showWarning("วันที่กลับต้องไม่น้อยกว่าวันที่เดินทางไป");
      return;
    }

    if (
      formData.startDate === formData.endDate &&
      formData.endTime <= formData.startTime
    ) {
      showWarning("เวลาที่เดินทางกลับต้องมากกว่าเวลาที่เดินทางไป");
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
      dataToSubmit.append("is_urgent", "true");

      if (formData.selfDrive && formData.driverId) {
        dataToSubmit.append("driver_id", formData.driverId.toString());
      }

      dataToSubmit.append("requester_id", formData.requesterId.toString());

      const result = await createUrgentBooking(dataToSubmit);

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
      origin: startPlaces[0]?.start_place_name ?? "",
      province: "กรุงเทพมหานคร",
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
      isUrgent: true,
      requesterId: 0,
    });
    // States removed
    setMapKey((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchStartPlaces = async () => {
      const result = await getStartPlaces();
      if (result.success) setStartPlaces(result.data);
    };
    fetchStartPlaces();
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
    const fetchOrgs = async () => {
      const result = await getMyOrgs();
      if (result.success) {
        setOrgs(result.data);
        if (result.data.length === 1) {
          setFormData((prev) => ({
            ...prev,
            ownerDept: String(result.data[0].orgid),
          }));
        }
      }
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
  useEffect(() => {
    const fetchDrivers = async () => {
      const result = await getDrivers();
      if (result.success) setDrivers(result.data);
    };
    fetchDrivers();
  }, []);

  useEffect(() => {
    const fetchRequesters = async () => {
      const result = await getUrgentRequesters();
      if (result.success && result.data) setRequesters(result.data);
    };
    fetchRequesters();
  }, []);

  const startPlaceMap = startPlaces.reduce(
    (acc, sp) => {
      acc[sp.start_place_name] = sp.start_place_id;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 gap-8">
        {/* Main Form */}
        <div className="w-full space-y-8">
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none select-none">
              <Car size={150} />
            </div>

            <div className="relative space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-1.5 h-6 bg-black rounded-full shadow-sm"></div>
                <h2 className="text-xl font-semibold text-black uppercase tracking-tight">
                  รายละเอียดแผนการเดินทาง
                </h2>
              </div>

              {/* Requester Selection Section */}
              <div className="bg-red-50 p-6 rounded-md border border-red-100 space-y-4">
                <div className="flex items-center gap-2 text-red-800 font-semibold uppercase text-sm tracking-wider">
                  <User size={18} />
                  ข้อมูลผู้ร้องขอรถด่วน
                </div>
                <div className="relative">
                  <FormField label="พนักงานผู้ขอใช้รถ" icon={User} required>
                    <Select
                      options={requesters.map((r) => ({
                        value: r.userid,
                        label:
                          `${r.firstname ?? ""} ${r.lastname ?? ""}`.trim() +
                          ` (ID: ${r.userid})`,
                        dept: r.sectionid,
                      }))}
                      value={
                        formData.requesterId
                          ? {
                              value: formData.requesterId,
                              label:
                                `${requesters.find((r) => r.userid === formData.requesterId)?.firstname ?? ""} ${requesters.find((r) => r.userid === formData.requesterId)?.lastname ?? ""}`.trim() +
                                ` (ID: ${formData.requesterId})`,
                            }
                          : null
                      }
                      onChange={async (sel: any) => {
                        handleInputChange("requesterId", sel ? sel.value : 0);
                        handleInputChange("ownerDept", ""); // clear ก่อน
                        handleInputChange("vehicleType", ""); // clear ประเภทรถด้วย

                        if (sel) {
                          const orgRes = await getOrgsByUserId(sel.value);
                          if (orgRes.success) {
                            setOrgs(orgRes.data);
                            // ถ้ามีแค่ org เดียว auto-set เลย
                            if (orgRes.data.length === 1) {
                              handleInputChange(
                                "ownerDept",
                                String(orgRes.data[0].orgid),
                              );
                            }
                          }
                        } else {
                          setOrgs([]); // clear orgs ถ้า deselect
                        }
                      }}
                      placeholder="พิมพ์ชื่อหรือนามสกุลพนักงานเพื่อค้นหา..."
                      isClearable
                      isSearchable
                      styles={reactSelectStyles}
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                      menuPosition="fixed"
                      noOptionsMessage={() => "ไม่พบพนักงานที่ค้นหา"}
                    />
                  </FormField>
                </div>
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
                      formData.vehicleType
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

                <FormField label="จังหวัด" icon={MapIcon} required>
                  <select
                    value={formData.province}
                    disabled={true} // ← auto-set จาก start_place ไม่ให้ user เลือกเอง
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm font-bold text-black shadow-sm opacity-60 cursor-not-allowed bg-gray-100"
                  >
                    {startPlaces.map((sp) => (
                      <option key={sp.start_place_id} value={sp.province_id}>
                        {sp.province?.province_name ?? "-"}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Row 3 - Destination & Map (Full Width) */}
                <div className="md:col-span-2 space-y-4">
                  <FormField label="สถานที่ (ปลายทาง)" icon={MapPin} required>
                    <LongdoMapBox
                      key={mapKey}
                      onLocationSelect={(loc: any) => {
                        // ปรับปรุง: Batch update เพื่อลดความซ้ำซ้อนในการ re-render
                        setFormData((prev) => ({
                          ...prev,
                          destination: loc.name,
                          lat: loc.lat,
                          lon: loc.lon,
                        }));
                      }}
                      placeholder="ค้นหาจุดหมายปลายทาง (ระบุเลขที่บ้าน, อาคาร, ซอย)"
                    />
                  </FormField>

                  {/* Lat/Long Display Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <NavIcon size={12} className="text-blue-500" />
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={formData.lat || ""}
                        readOnly
                        placeholder="0.000000"
                        className="w-full bg-gray-50 border-gray-200 border rounded-md px-4 py-2 text-sm font-bold text-slate-700 shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <NavIcon size={12} className="text-blue-500" />
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={formData.lon || ""}
                        readOnly
                        placeholder="0.000000"
                        className="w-full bg-gray-50 border-gray-200 border rounded-md px-4 py-2 text-sm font-bold text-slate-700 shadow-inner"
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm cursor-pointer"
                  />
                </FormField>

                {/* Self Drive Checkbox + Driver Combobox */}
                <div className="md:col-span-2 space-y-3 relative"></div>
                <label className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
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
                      <Select
                        options={drivers.map((d) => ({
                          value: d.driver_id,
                          label:
                            `${d.vc_users?.firstname ?? ""} ${d.vc_users?.lastname ?? ""}`.trim() +
                            ` (${d.driver_code})`,
                        }))}
                        value={
                          formData.driverId
                            ? {
                                value: formData.driverId,
                                label:
                                  `${drivers.find((d) => d.driver_id === formData.driverId)?.vc_users?.firstname ?? ""} ${drivers.find((d) => d.driver_id === formData.driverId)?.vc_users?.lastname ?? ""}`.trim() +
                                  ` (${drivers.find((d) => d.driver_id === formData.driverId)?.driver_code})`,
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
                          typeof document !== "undefined" ? document.body : null
                        }
                        menuPosition="fixed"
                        noOptionsMessage={() => "ไม่พบชื่อในระบบ"}
                      />
                      {!formData.driverId && (
                        <p className="text-xs text-red-500 font-medium mt-1">
                          * กรุณาเลือกชื่อผู้ขับ ถ้าไม่มีชื่อในระบบ กรุณาติดต่อ
                          Admin
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm resize-none"
                  />
                </FormField>
              </div>

              {/* Passengers & Phone */}
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
                      className="w-full bg-gray-50 border-gray-300 border rounded-lg pl-4 pr-16 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                    />
                    <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                      คน
                    </span>
                  </div>
                </FormField>
                <FormField label="หมายเลขโทรศัพท์ติดต่อ" icon={Phone} required>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      handleInputChange("phone", val);
                    }}
                    placeholder="0x-xxxx-xxxx"
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                  />
                </FormField>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-50">
              <button
                onClick={resetForm}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                ยกเลิกเนื้อหา
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-10 py-3.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-xl shadow-red-200 transition-all disabled:opacity-70"
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
