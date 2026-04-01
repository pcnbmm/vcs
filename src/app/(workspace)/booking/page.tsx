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
import { getOrgs } from "@/app/actions/orgActions";
import MapBox from "@/components/ui/LongdoMapBox";
import { useRouter } from "next/navigation";
import { getDrivers } from "@/app/actions/driverActions";
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
  const [startPlaces, setStartPlaces] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carSpecs, setCarSpecs] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const router = useRouter();
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

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
    setDriverSearch("");
    setDriverDropdownOpen(false);
    setMapKey((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [startRes, specRes, orgRes, driverRes] = await Promise.all([
        getStartPlaces(),
        getCarSpecs(),
        getOrgs(),
        getDrivers(),
      ]);

      if (startRes.success) setStartPlaces(startRes.data);
      if (specRes.success) setCarSpecs(specRes.data);
      if (orgRes.success) setOrgs(orgRes.data);
      if (driverRes.success) setDrivers(driverRes.data);
    };
    fetchData();
  }, []);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 gap-8">
        <div className="w-full space-y-8">
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative space-y-10">
              <div className="flex items-center gap-3 border-gray-200">
                <h2 className="text-xl font-semibold text-black uppercase tracking-tight">
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none font-bold text-black shadow-sm"
                  >
                    <option value="">-- โปรดเลือก --</option>
                    {startPlaces.map((cs) => (
                      <option
                        key={cs.start_place_id}
                        value={cs.start_place_name}
                      >
                        {cs.start_place_name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="จังหวัด" icon={MapIcon} required>
                  <select
                    value={formData.province}
                    disabled={true}
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm font-bold text-black shadow-sm opacity-60 cursor-not-allowed bg-gray-100"
                  >
                    <option value="">-- จังหวัด --</option>
                    {startPlaces.map((sp) => (
                      <option key={sp.start_place_id} value={sp.province_id}>
                        {sp.province?.province_name ?? "-"}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Row 3 - Destination & Map */}
                <div className="md:col-span-2 space-y-4">
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
                      placeholder="ค้นหาจุดหมายปลายทาง (ระบุเลขที่บ้าน, อาคาร, ซอย)"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <NavIcon size={12} className="text-blue-500" /> Latitude
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
                        <NavIcon size={12} className="text-blue-500" />{" "}
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

                {/* Departure */}
                <FormField label="วันที่เดินทางไป" icon={Calendar} required>
                  <input
                    type="date"
                    value={formData.startDate}
                    min={getTodayDate()}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                  />
                </FormField>

                {/* Return */}
                <FormField label="วันที่เดินทางกลับ" icon={Calendar} required>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || getTodayDate()}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
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
                    className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                  />
                </FormField>

                {/* Self Drive */}
                <div className="md:col-span-2 space-y-3 relative">
                  <label className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.selfDrive}
                      onChange={(e) => {
                        handleInputChange("selfDrive", e.target.checked);
                        handleInputChange("driverId", 0);
                        setDriverSearch("");
                      }}
                      className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-full text-sm font-bold text-black">
                        ขับรถด้วยตนเอง
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
                              ? `${drivers.find((d) => d.driver_id === formData.driverId)?.vc_users?.firstname ?? ""} ${drivers.find((d) => d.driver_id === formData.driverId)?.vc_users?.lastname ?? ""}`.trim()
                              : driverSearch
                          }
                          onChange={(e) => {
                            setDriverSearch(e.target.value);
                            handleInputChange("driverId", 0);
                          }}
                          placeholder="พิมพ์ชื่อคนขับเพื่อค้นหา..."
                          className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                        />
                        {driverSearch && !formData.driverId && (
                          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {drivers
                              .filter((d) => {
                                const fullName =
                                  `${d.vc_users?.firstname ?? ""} ${d.vc_users?.lastname ?? ""}`.trim();
                                return (
                                  fullName
                                    .toLowerCase()
                                    .includes(driverSearch.toLowerCase()) ||
                                  String(d.driver_code).includes(driverSearch)
                                );
                              })
                              .map((d) => (
                                <button
                                  key={d.driver_id}
                                  type="button"
                                  onClick={() => {
                                    handleInputChange("driverId", d.driver_id);
                                    setDriverSearch("");
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm font-medium text-gray-700 hover:text-emerald-700 transition-colors"
                                >
                                  {`${d.vc_users?.firstname ?? ""} ${d.vc_users?.lastname ?? ""}`.trim()}
                                  <span className="text-xs text-gray-400 ml-2">
                                    ({d.driver_code})
                                  </span>
                                </button>
                              ))}
                            {drivers.filter((d) =>
                              `${d.vc_users?.firstname ?? ""} ${d.vc_users?.lastname ?? ""}`
                                .trim()
                                .toLowerCase()
                                .includes(driverSearch.toLowerCase()),
                            ).length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-400">
                                ไม่พบชื่อในระบบ กรุณาติดต่อ Admin
                              </div>
                            )}
                          </div>
                        )}
                      </FormField>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <FormField label="หมายเหตุ" icon={MessageSquare} required>
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
                      placeholder="0x-xxxx-xxxx"
                      className="w-full bg-gray-50 border-gray-300 border rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-black shadow-sm"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-50">
              <button
                onClick={resetForm}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
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
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
        <Icon className="w-4 h-4 text-blue-500" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
