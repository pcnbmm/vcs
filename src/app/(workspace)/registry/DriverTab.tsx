"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Loader2,
  Save,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function DriverTab() {
  const { hasAccess } = usePermissions();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const itemsPerPage = 8;
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "add" | "edit">("add");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/drivers");
      if (!res.ok) throw new Error("Failed to fetch drivers data");
      const data = await res.json();
      setDrivers(data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await fetch("/api/options");
      if (res.ok) {
        const data = await res.json();
        setOptions(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const filteredDrivers = drivers
    .filter((d) => {
      const fullStr =
        `${d.driver_code} ${d.vc_users?.firstname} ${d.vc_users?.lastname} ${d.tel} ${d.licence_no}`.toLowerCase();
      return fullStr.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Custom key access for nested user fields
      if (sortConfig.key === "firstname") {
        aVal = a.vc_users?.firstname || "";
        bVal = b.vc_users?.firstname || "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const currentDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const jumpPages = (amount: number) => {
    let newPage = currentPage + amount;
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;
    setCurrentPage(newPage);
  };

  const safeDate = (dateVal: any) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  };

  const openModal = (mode: "view" | "add" | "edit", driver?: any) => {
    setModalMode(mode);
    setSelectedDriver(driver);
    if (mode === "add") {
      setFormData({
        driver_code: "",
        driver_status: "A",
        div_code: "",
        start_date: "",
        end_date: "",
        licence_type: "",
        licence_no: "",
        licence_by: "",
        tel: "",
        flag: "Y",
      });
    } else {
      setFormData({
        ...driver,
        start_date: safeDate(driver.start_date),
        end_date: safeDate(driver.end_date),
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setSelectedDriver(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url =
        modalMode === "add"
          ? "/api/drivers"
          : `/api/drivers/${selectedDriver.driver_id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Saving failed");

      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving driver:", error);
      showError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await showConfirm("ยืนยันการลบข้อมูลคนขับรายนี้ ใช่หรือไม่?")))
      return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      await fetchData();
    } catch (error) {
      console.error("Error deleting driver:", error);
      showError("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, นามสกุล, รหัสประจำตัว, เบอร์โทร..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none placeholder:text-gray-500 placeholder:font-medium"
          />
        </div>
        {hasAccess("create") && (
          <button
            onClick={() => openModal("add")}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus className="w-5 h-5" />
            เพิ่มข้อมูลคนขับ
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th
                  onClick={() => handleSort("driver_code")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  รหัสคนขับ{" "}
                  {sortConfig?.key === "driver_code"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th
                  onClick={() => handleSort("firstname")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  ชื่อ - นามสกุล{" "}
                  {sortConfig?.key === "firstname"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th
                  onClick={() => handleSort("tel")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  เบอร์โทรศัพท์{" "}
                  {sortConfig?.key === "tel"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th
                  onClick={() => handleSort("driver_status")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  สถานะ{" "}
                  {sortConfig?.key === "driver_status"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-4 text-sm font-medium text-gray-500">
                      กำลังโหลดข้อมูลคนขับ...
                    </p>
                  </td>
                </tr>
              ) : currentDrivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-sm font-medium text-gray-500">
                      ไม่พบข้อมูลที่ค้นหา
                    </p>
                  </td>
                </tr>
              ) : (
                currentDrivers.map((driver) => (
                  <tr
                    key={driver.driver_id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                        {driver.driver_code || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {driver.vc_users?.firstname?.charAt(0) || "?"}
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-gray-900">
                            {driver.vc_users?.firstname}{" "}
                            {driver.vc_users?.lastname}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {driver.licence_no || "ยังไม่ระบุใบขับขี่"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-600">
                      {driver.tel || "-"}
                    </td>
                    <td className="py-4 px-6">
                      {driver.driver_status === "A" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm uppercase tracking-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          พร้อมใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-rose-50 text-rose-700 border-rose-100 shadow-sm uppercase tracking-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          ไม่พร้อมใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {hasAccess("view") && (
                          <button
                            onClick={() => openModal("view", driver)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {hasAccess("update") && (
                          <button
                            onClick={() => openModal("edit", driver)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasAccess("delete") && (
                          <button
                            onClick={() => handleDelete(driver.driver_id)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง{" "}
              {Math.min(currentPage * itemsPerPage, filteredDrivers.length)} จาก{" "}
              {filteredDrivers.length} รายการ
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => jumpPages(-5)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                -5 หน้า
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                ก่อนหน้า
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                ถัดไป
              </button>
              <button
                onClick={() => jumpPages(5)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                +5 หน้า
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-md shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalMode === "add"
                  ? "เพิ่มข้อมูลคนขับรถ"
                  : modalMode === "edit"
                    ? "แก้ไขข้อมูลคนขับรถ"
                    : "รายละเอียดคนขับรถ"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <FormSection title="ข้อมูลส่วนตัว">
                  <SelectField
                    label="รหัสผู้ใช้งาน (User)"
                    value={formData.driver_code}
                    onChange={(v: any) =>
                      setFormData({ ...formData, driver_code: v })
                    }
                    options={options?.users}
                    valueKey="userid"
                    labelKey="firstname"
                    labelKey2="lastname"
                    disabled={modalMode === "view"}
                  />
                  <InputField
                    label="เบอร์โทรศัพท์"
                    value={formData.tel}
                    onChange={(v: any) => setFormData({ ...formData, tel: v })}
                    disabled={modalMode === "view"}
                  />
                  <SelectField
                    label="สถานะการทำงาน"
                    value={formData.driver_status}
                    onChange={(v: any) =>
                      setFormData({ ...formData, driver_status: v })
                    }
                    options={[
                      { id: "A", name: "พร้อมใช้งาน (A)" },
                      { id: "I", name: "ไม่พร้อมใช้งาน (I)" },
                    ]}
                    valueKey="id"
                    labelKey="name"
                    disabled={modalMode === "view"}
                  />
                </FormSection>

                <FormSection title="ข้อมูลสังกัด">
                  <SelectField
                    label="รหัสหน่วยงาน (Div Code)"
                    value={formData.div_code}
                    onChange={(v: any) =>
                      setFormData({ ...formData, div_code: v })
                    }
                    options={options?.orgs}
                    valueKey="orgid"
                    labelKey="orgname"
                    disabled={modalMode === "view"}
                  />
                  <InputField
                    label="วันที่เริ่มงาน"
                    type="date"
                    value={formData.start_date}
                    onChange={(v: any) =>
                      setFormData({ ...formData, start_date: v })
                    }
                    disabled={modalMode === "view"}
                  />
                  <InputField
                    label="วันที่สิ้นสุด"
                    type="date"
                    value={formData.end_date}
                    onChange={(v: any) =>
                      setFormData({ ...formData, end_date: v })
                    }
                    disabled={modalMode === "view"}
                  />
                </FormSection>

                <FormSection title="ใบอนุญาตขับขี่">
                  <SelectField
                    label="ประเภทใบขับขี่"
                    value={formData.licence_type}
                    onChange={(v: any) =>
                      setFormData({ ...formData, licence_type: v })
                    }
                    options={options?.licenseTypes}
                    valueKey="license_type_id"
                    labelKey="license_type_name"
                    disabled={modalMode === "view"}
                  />
                  <InputField
                    label="เลขที่ใบขับขี่"
                    value={formData.licence_no}
                    onChange={(v: any) =>
                      setFormData({ ...formData, licence_no: v })
                    }
                    disabled={modalMode === "view"}
                  />
                  <SelectField
                    label="ออกให้โดย (จังหวัด)"
                    value={formData.licence_by}
                    onChange={(v: any) =>
                      setFormData({ ...formData, licence_by: v })
                    }
                    options={options?.provinces}
                    valueKey="province_id"
                    labelKey="province_name"
                    disabled={modalMode === "view"}
                  />
                </FormSection>
              </div>
            </div>

            {modalMode !== "view" && (
              <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-md font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-md font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all disabled:opacity-70"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Components เสริมภายในไฟล์
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm col-span-1 lg:col-span-3">
      <h3 className="text-sm font-semibold text-blue-900 mb-4 border-b border-gray-50 pb-3 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {children}
      </div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  required,
}: any) {
  return (
    <div className="space-y-1.5 focus-within:z-10">
      <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none disabled:opacity-60 disabled:bg-gray-100"
      />
    </div>
  );
}

const popupReactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: "0.75rem",
    padding: "0.25rem 0.5rem",
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    backgroundColor: state.isDisabled
      ? "#f3f4f6"
      : state.isFocused
        ? "#ffffff"
        : "#f9fafb",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
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
    padding: "0.5rem 1rem",
  }),
  singleValue: (base: any, state: any) => ({
    ...base,
    fontWeight: "bold",
    color: state.isDisabled ? "#9ca3af" : "#000000",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#000000",
    fontWeight: "bold",
  }),
  input: (base: any) => ({ ...base, color: "#000000", fontWeight: "bold" }),
  menu: (base: any) => ({
    ...base,
    borderRadius: "0.75rem",
    overflow: "hidden",
    zIndex: 100,
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
};

function SelectField({
  label,
  value,
  onChange,
  options,
  valueKey,
  labelKey,
  labelKey2,
  disabled,
  required,
}: any) {
  const formattedOptions =
    options?.map((opt: any) => ({
      value: String(opt[valueKey]),
      label:
        `${opt[labelKey] || ""} ${labelKey2 && opt[labelKey2] ? opt[labelKey2] : ""}`.trim(),
    })) || [];
  const currentValue =
    formattedOptions.find((o: any) => o.value === String(value)) || null;

  return (
    <div className="space-y-1.5 focus-within:z-10">
      <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <Select
        value={currentValue}
        onChange={(sel: any) => onChange(sel ? sel.value : "")}
        options={formattedOptions}
        isSearchable
        isClearable
        placeholder="-- เลือก --"
        isDisabled={disabled}
        styles={popupReactSelectStyles}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        menuPosition="fixed"
      />
    </div>
  );
}
