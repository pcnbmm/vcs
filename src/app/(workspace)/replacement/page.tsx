"use client";
import TimeInput24hr from "@/components/ui/TimeInput24hr";
import React, { useState, useEffect } from "react";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";
import {
  Plus,
  X,
  Loader2,
  RotateCcw,
  CheckCircle,
  Clock,
  Eye,
  Edit2,
  Search,
} from "lucide-react";
import Select from "react-select";
import { usePermissions } from "@/hooks/usePermissions";
import { getProvinces, getCarSpecs } from "@/app/actions/dropdownActions";

export default function ReplacementPage() {
  const { hasAccess } = usePermissions();
  const [replacements, setReplacements] = useState<any[]>([]);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [carSpecs, setCarSpecs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [masterReplacementCars, setMasterReplacementCars] = useState<any[]>([]);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterSearchTerm, setMasterSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "view" | "edit">("add");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // For Add Mode state flow
  const [isChecked, setIsChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isReturning, setIsReturning] = useState(false); // To toggle cancel checkbox

  const [formData, setFormData] = useState({
    car_id: "",
    replacement_car_number: "",
    car_province_id: "",
    car_spec_id: "",
    remark: "",
    broken_car_id: "",
    start_date: "",
    broken_datetime: "",
    end_date: "",
    end_datetime: "",
    cre_by: "",
    existing_car_id: "" as string | number,
  });

  useEffect(() => {
    fetchReplacements();
    fetchAvailableCars();
    fetchDropdowns();
    fetchMasterReplacements();
  }, []);

  const fetchMasterReplacements = async () => {
    try {
      const res = await fetch("/api/replacements/master");
      if (res.ok) {
        const data = await res.json();
        setMasterReplacementCars(data);
      }
    } catch (error) {
      console.error("Error fetching master replacements:", error);
    }
  };

  const fetchDropdowns = async () => {
    const pRes = await getProvinces();
    if (pRes.success) setProvinces(pRes.data);
    const sRes = await getCarSpecs();
    if (sRes.success) setCarSpecs(sRes.data);
  };

  const fetchReplacements = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/replacements");
      if (res.ok) {
        const data = await res.json();
        setReplacements(data);
      }
    } catch (error) {
      console.error("Error fetching replacements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableCars = async () => {
    try {
      const res = await fetch("/api/replacements/cars");
      if (res.ok) {
        const data = await res.json();
        setAvailableCars(data);
      }
    } catch (error) {
      console.error("Error fetching available cars:", error);
    }
  };

  const getLocalISOString = (dateInput: Date | string | null) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const openModal = (mode: "add" | "view" | "edit", record?: any) => {
    setModalMode(mode);
    setIsChecked(false);
    setIsReturning(false);
    if (mode === "add") {
      setSelectedId(null);
      setFormData({
        car_id: "",
        replacement_car_number: "",
        car_province_id: "",
        car_spec_id: "",
        remark: "",
        broken_car_id: "",
        start_date: getLocalISOString(new Date()),
        broken_datetime: getLocalISOString(new Date()),
        end_date: getLocalISOString(new Date()),
        end_datetime: "",
        cre_by: "",
        existing_car_id: "",
      });
      fetchAvailableCars();
    } else if (record) {
      setSelectedId(record.replacement_id);
      setFormData({
        car_id: record.car_id ? record.car_id.toString() : "",
        replacement_car_number: record.car_number || "",
        car_province_id: record.car_province_id || "",
        car_spec_id: record.car_spec_id || "",
        remark: record.remark || (mode === "view" ? "ไม่มีหมายเหตุ" : ""),
        broken_car_id: record.broken_car_id || "",
        start_date: getLocalISOString(
          record.start_datetime || record.start_date || new Date(),
        ),
        broken_datetime: getLocalISOString(
          record.broken_datetime || new Date(),
        ),
        end_date: getLocalISOString(
          record.end_datetime || record.end_date || new Date(),
        ),
        end_datetime: record.end_datetime || "",
        cre_by: record.cre_by || "system",
        existing_car_id: record.replacemant_car_id || "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
  };

  const handleSelectMasterCar = (car: any) => {
    setFormData({
      ...formData,
      replacement_car_number: car.car_number,
      car_province_id: car.car_province_id?.toString() || "",
      car_spec_id: car.car_spec_id?.toString() || "",
      existing_car_id: car.car_id,
    });
    setIsChecked(true);
    setIsMasterModalOpen(false);
  };

  const handleCheckCar = async () => {
    if (!formData.replacement_car_number || !formData.car_province_id) {
      return showWarning("กรุณากรอกทะเบียนรถและเลือกจังหวัดก่อนตรวจสอบ");
    }
    setIsChecking(true);
    try {
      const res = await fetch(
        `/api/replacements/check?plate=${encodeURIComponent(formData.replacement_car_number)}&province=${formData.car_province_id}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          showWarning(
            "รถคันนี้มีในระบบแล้ว ให้นำทะเบียนรถไปค้นหาที่หน้าเลือกรถที่มีอยู่เพื่อดำเนินการจัดการต่อไป",
          );
          closeModal();
        } else {
          setIsChecked(true);
          showSuccess(
            "ไม่พบข้อมูลในระบบ กรุณาเลือกสเปครถเพื่อบันทึกเป็นรถทดแทนใหม่",
          );
        }
      }
    } catch (error) {
      console.error("Error checking car:", error);
      showError("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      if (modalMode === "edit") {
        if (!formData.remark || formData.remark.trim() === "") {
          return showWarning("กรุณาระบุหมายเหตุการดำเนินการ");
        }
      }

      if (modalMode === "add") {
        if (!formData.car_spec_id) return showWarning("กรุณาเลือกสเปครถ");

        const res = await fetch("/api/replacements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Saving failed");
        showSuccess("บันทึกข้อมูลรถทดแทนใหม่เรียบร้อยแล้ว");
      } else if (modalMode === "edit") {
        // Determine if we are updating active details, or ending the replacement
        if (isReturning) {
          // Step 7: Send return
          const res = await fetch(`/api/replacements/${selectedId}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ end_date: formData.end_date }),
          });
          if (!res.ok) throw new Error("Cancel failed");
          showSuccess("ยกเลิกการใช้รถทดแทนและคืนค่าทะเบียนเดิมเรียบร้อยแล้ว");
        } else {
          // Step 5: Fill details and link broken car
          if (!formData.car_id && !formData.broken_car_id) {
            return showWarning("กรุณาเลือกรถที่ถูกทดแทน");
          }
          const res = await fetch(`/api/replacements/${selectedId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          if (!res.ok) throw new Error("Updating failed");
          showSuccess("อัปเดตข้อมูลการทดแทนเรียบร้อยแล้ว");
        }
      }

      await fetchReplacements();
      fetchAvailableCars();
      closeModal();
    } catch (error: any) {
      console.error("Error saving replacement:", error);
      showError(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-800">การจัดการรถทดแทน</h2>
          <p className="text-sm text-slate-500">
            เพิ่มและจัดการข้อมูลการใช้งานรถทดแทน
          </p>
        </div>
        {hasAccess("create") && (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsMasterModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all border border-slate-200"
            >
              <Search className="w-5 h-5" />
              เลือกรถทดแทนที่มีอยู่
            </button>
            <button
              onClick={() => openModal("add")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              <Plus className="w-5 h-5" />
              เพิ่มรถทดแทนใหม่
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ทะเบียนรถที่ถูกแทนที่ (เดิม)
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ทะเบียนรถทดแทน (ใหม่)
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  วันที่เริ่มทดแทน
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  วันที่สิ้นสุด (คืนรถ)
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-4 text-sm font-medium text-gray-500">
                      กำลังโหลดข้อมูล...
                    </p>
                  </td>
                </tr>
              ) : replacements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm font-medium text-gray-500"
                  >
                    ไม่พบประวัติการใช้รถทดแทน
                  </td>
                </tr>
              ) : (
                replacements.map((r) => {
                  const isIdle = !r.car_id && !r.end_datetime; // Wait for assignment
                  const isActive = r.car_id && !r.end_datetime; // Actively replacing
                  const isEnded = r.end_datetime; // Finished
                  return (
                    <tr
                      key={r.replacement_id}
                      className={`hover:bg-slate-50 transition-colors ${isActive ? "bg-blue-50/20" : isIdle ? "bg-amber-50/20" : ""}`}
                    >
                      <td className="py-4 px-6">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs border border-blue-200">
                            <Clock className="w-3.5 h-3.5" />
                            กำลังใช้งานทดแทน
                          </span>
                        ) : isIdle ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            รอการระบุรถที่ถูกทดแทน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            คืนรถแล้ว
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-700">
                          {r.broken_car_id || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          {r.car_number || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {r.start_date
                          ? new Date(r.start_date).toLocaleDateString("th-TH")
                          : "-"}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {r.end_date
                          ? new Date(r.end_date).toLocaleDateString("th-TH")
                          : "-"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasAccess("view") && (
                            <button
                              onClick={() => openModal("view", r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-md transition-colors border border-blue-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              รายละเอียด
                            </button>
                          )}
                          {!isEnded && hasAccess("update") && (
                            <button
                              onClick={() => openModal("edit", r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 font-semibold text-xs rounded-md transition-colors border border-amber-200"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              จัดการรถทดแทน
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                {modalMode === "add"
                  ? "เพิ่มข้อมูลรถทดแทน"
                  : modalMode === "edit"
                    ? "จัดการรถทดแทน"
                    : "รายละเอียดการใช้รถทดแทน"}
              </h2>
            </div>

            <form
              onSubmit={handleSave}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-5"
            >
              {/* ADD MODE (Steps 3) */}
              {modalMode === "add" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">
                      ทะเบียนรถที่มาทดแทน{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isChecked}
                      placeholder="เช่น 1กข 1234"
                      value={formData.replacement_car_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          replacement_car_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">
                      จังหวัดที่จดทะเบียน{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      options={provinces.map((p) => ({
                        value: p.province_id.toString(),
                        label: p.province_name,
                      }))}
                      isDisabled={isChecked}
                      placeholder="-- เลือกจังหวัด --"
                      value={
                        provinces.find(
                          (p) =>
                            p.province_id.toString() ===
                            formData.car_province_id,
                        )
                          ? {
                              value: formData.car_province_id,
                              label: provinces.find(
                                (p) =>
                                  p.province_id.toString() ===
                                  formData.car_province_id,
                              )?.province_name,
                            }
                          : null
                      }
                      onChange={(selected: any) =>
                        setFormData({
                          ...formData,
                          car_province_id: selected ? selected.value : "",
                        })
                      }
                      className="react-select-container text-sm font-medium"
                      classNamePrefix="react-select"
                    />
                  </div>

                  {!isChecked ? (
                    <button
                      type="button"
                      onClick={handleCheckCar}
                      disabled={isChecking}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 shadow-md transition-all disabled:opacity-50"
                    >
                      {isChecking ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      ตรวจสอบทะเบียนรถ
                    </button>
                  ) : (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
                      <label className="text-sm font-semibold text-gray-800">
                        สเปครถ <span className="text-rose-500">*</span>
                      </label>
                      <Select
                        options={carSpecs.map((c) => ({
                          value: c.car_spec_id.toString(),
                          label: c.car_spec_name,
                        }))}
                        placeholder="-- เลือกสเปครถ --"
                        value={
                          carSpecs.find(
                            (c) =>
                              c.car_spec_id.toString() === formData.car_spec_id,
                          )
                            ? {
                                value: formData.car_spec_id,
                                label: carSpecs.find(
                                  (c) =>
                                    c.car_spec_id.toString() ===
                                    formData.car_spec_id,
                                )?.car_spec_name,
                              }
                            : null
                        }
                        onChange={(selected: any) =>
                          setFormData({
                            ...formData,
                            car_spec_id: selected ? selected.value : "",
                          })
                        }
                        className="react-select-container text-sm font-medium"
                        classNamePrefix="react-select"
                      />
                    </div>
                  )}
                </>
              )}

              {/* EDIT/VIEW MODE (Steps 5 & 7) */}
              {modalMode !== "add" && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-blue-900">
                        ทะเบียนรถทดแทน:
                      </span>
                      <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                        {formData.replacement_car_number}
                      </span>
                    </div>
                  </div>

                  {formData.broken_car_id && modalMode === "edit" && (
                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isReturning}
                          onChange={(e) => setIsReturning(e.target.checked)}
                          className="w-5 h-5 cursor-pointer text-blue-600 rounded border-gray-300"
                        />
                        <span className="text-sm font-bold text-rose-600">
                          ยกเลิกการใช้งานรถทดแทน (ส่งคืนรถ)
                        </span>
                      </label>
                    </div>
                  )}

                  {!isReturning ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">
                          รถที่ถูกทดแทน (รถเดิม){" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        {modalMode === "edit" && !formData.broken_car_id ? (
                          <Select
                            options={availableCars.map((c) => ({
                              value: c.car_id.toString(),
                              label: c.car_number,
                            }))}
                            placeholder="-- ค้นหาและเลือกรถที่ต้องการนำมาแทนที่ --"
                            value={
                              availableCars.find(
                                (c) => c.car_id.toString() === formData.car_id,
                              )
                                ? {
                                    value: formData.car_id,
                                    label: availableCars.find((c) => c.car_id.toString() === formData.car_id)?.car_number,
                                  }
                                : null
                            }
                            onChange={(selected: any) =>
                              setFormData({
                                ...formData,
                                car_id: selected ? selected.value : "",
                              })
                            }
                            isClearable
                            className="react-select-container text-sm font-medium"
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <input
                            type="text"
                            disabled
                            value={formData.broken_car_id || "ยังไม่ได้ระบุ"}
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
                          />
                        )}
                        {modalMode === "edit" && !formData.broken_car_id && (
                          <p className="text-xs text-slate-500 mt-1">
                            ระบบจะเปลี่ยนทะเบียนของรถคันนี้บนระบบเป็นคันใหม่ชั่วคราว
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">
                            วัน/เวลาที่แจ้งเหตุเสีย{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          {modalMode === "view" ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700">
                                {formData.broken_datetime
                                  ? new Date(
                                      formData.broken_datetime,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </div>
                              <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700">
                                {formData.broken_datetime
                                  ? formData.broken_datetime.split("T")[1]
                                  : "-"}{" "}
                                น.
                              </div>
                            </div>
                          ) : (
                            <TimeInput24hr
                              value={formData.broken_datetime}
                              onChange={(val) =>
                                setFormData({
                                  ...formData,
                                  broken_datetime: val,
                                })
                              }
                              showDate
                              disabled={!!formData.broken_car_id}
                            />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-800">
                            วันที่และเวลาเริ่มทดแทน{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          {modalMode === "view" ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700">
                                {formData.start_date
                                  ? new Date(
                                      formData.start_date,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </div>
                              <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700">
                                {formData.start_date
                                  ? formData.start_date.split("T")[1]
                                  : "-"}{" "}
                                น.
                              </div>
                            </div>
                          ) : (
                            <TimeInput24hr
                              value={formData.start_date}
                              onChange={(val) =>
                                setFormData({ ...formData, start_date: val })
                              }
                              showDate
                              disabled={!!formData.broken_car_id}
                            />
                          )}
                        </div>
                      </div>

                      {formData.end_datetime && (
                        <div className="space-y-1.5 pt-2">
                          <label className="text-sm font-semibold text-gray-800">
                            วันที่และเวลาที่ส่งคืนรถ{" "}
                            <span className="text-emerald-500 font-bold">
                              (ส่งคืนแล้ว)
                            </span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800">
                              {formData.end_date
                                ? new Date(
                                    formData.end_date,
                                  ).toLocaleDateString("th-TH")
                                : "-"}
                            </div>
                            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800">
                              {formData.end_date
                                ? formData.end_date.split("T")[1]
                                : "-"}{" "}
                              น.
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          หมายเหตุ <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <textarea
                          placeholder={modalMode === "edit" ? "ระบุหมายเหตุการทดแทน (บังคับ)" : "ระบุหมายเหตุ (ถ้ามี)"}
                          rows={3}
                          required={modalMode === "edit"}
                          disabled={modalMode === "view" || !!formData.end_datetime}
                          value={formData.remark}
                          onChange={(e) =>
                            setFormData({ ...formData, remark: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none disabled:bg-gray-100 disabled:text-gray-600"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          ระบบจะคืนค่าทะเบียนรถและสถานะของรถเดิม (
                          <span className="font-bold">
                            {formData.broken_car_id}
                          </span>
                          ) กลับสู่สภาวะปกติ
                          และนำข้อมูลวันเวลาไปใช้สำหรับรายงานการใช้รถ-รายเดือน
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">
                          วันที่และเวลาที่ส่งคืนรถ{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <TimeInput24hr
                          value={formData.end_date}
                          onChange={(val) =>
                            setFormData({ ...formData, end_date: val })
                          }
                          showDate
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-xs text-gray-400 font-medium">
                    ผู้บันทึกรายการ: {formData.cre_by}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  {modalMode === "view" ? "ปิดหน้าต่าง" : "ยกเลิก"}
                </button>
                {modalMode !== "view" && (modalMode !== "add" || isChecked) && (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-bold text-sm shadow-md transition-all disabled:opacity-50 ${isReturning ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"}`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : null}
                    {isSaving
                      ? "กำลังบันทึก..."
                      : isReturning
                        ? "ยืนยันส่งคืนรถทดแทน"
                        : "บันทึกข้อมูล"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Replacement Selection Modal */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMasterModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-slate-500 rounded-full"></div>
                เลือกรถทดแทนที่มีในระบบ
              </h2>
              <button
                onClick={() => {
                  setIsMasterModalOpen(false);
                  setMasterSearchTerm("");
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาทะเบียนรถ หรือ สเปครถ..."
                  value={masterSearchTerm}
                  onChange={(e) => setMasterSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3">
                {masterReplacementCars.filter(car => 
                  car.car_number?.toLowerCase().includes(masterSearchTerm.toLowerCase()) ||
                  car.vc_car_spec?.car_spec_name?.toLowerCase().includes(masterSearchTerm.toLowerCase())
                ).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    ไม่พบข้อมูลรถทดแทนที่ค้นหา
                  </div>
                ) : (
                  masterReplacementCars
                    .filter(car => 
                      car.car_number?.toLowerCase().includes(masterSearchTerm.toLowerCase()) ||
                      car.vc_car_spec?.car_spec_name?.toLowerCase().includes(masterSearchTerm.toLowerCase())
                    )
                    .map((car) => {
                    const activeReplacement = car.vc_replacement?.[0];
                    const isBusy = !!activeReplacement;
                    
                    return (
                      <button
                        key={car.car_id}
                        disabled={isBusy}
                        onClick={() => {
                          openModal("add");
                          handleSelectMasterCar(car);
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${isBusy ? "bg-gray-50 border-gray-200 cursor-not-allowed" : "border-gray-100 hover:border-blue-300 hover:bg-blue-50"}`}
                      >
                        <div>
                          <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-white px-2 py-0.5 rounded border border-gray-200 group-hover:border-blue-200">
                              {car.car_number}
                            </span>
                            <span className="text-sm font-normal text-slate-500">
                              {car.vc_province?.province_name}
                            </span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            {car.vc_car_spec?.car_spec_name || "ไม่ระบุสเปค"}
                          </div>
                          {isBusy && (
                            <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block border border-blue-100">
                              กำลังทดแทนรถ: {activeReplacement.broken_car_id}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${isBusy ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                             {isBusy ? "ไม่ว่าง (ใช้งานอยู่)" : "พร้อมใช้งาน"}
                           </span>
                           {!isBusy && (
                             <span className="text-blue-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                               เลือกคันนี้ →
                             </span>
                           )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                onClick={() => {
                  setIsMasterModalOpen(false);
                  setMasterSearchTerm("");
                }}
                className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
