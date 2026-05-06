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
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Truck,
  UserCheck,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { exportToExcel, exportToDocx, exportToPdf } from "@/lib/exportUtils";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";

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
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "add" | "edit">("add");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [driverType, setDriverType] = useState<"driver" | "staff">("driver");
  const [filterDriverType, setFilterDriverType] = useState<string>("all");

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
      const matchSearch = fullStr.includes(searchQuery.toLowerCase());
      
      const matchType = filterDriverType === "all" || 
                        (filterDriverType === "driver" && d.driver_type_id === 1) ||
                        (filterDriverType === "staff" && d.driver_type_id === 2);

      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

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

  const openModal = (mode: "view" | "add" | "edit", driver?: any) => {
    setModalMode(mode);
    setSelectedDriver(driver);
    if (mode === "add") {
      setDriverType("driver");
      setFormData({
        driver_code: "",
        driver_status: "1",
        div_code: "",
        tel: "",
        driver_license_no: "",
        driver_license_expire: "",
      });
    } else {
      setDriverType(driver.driver_type_id === 2 ? "staff" : "driver");
      setFormData({
        ...driver,
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
    const requiredFields = [
      formData.driver_code,
      formData.tel,
      formData.driver_status,
    ];

    if (requiredFields.some((field) => !field)) {
      showWarning("กรุณากรอกข้อมูลสำคัญที่มีเครื่องหมาย * ให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    try {
      const url =
        modalMode === "add"
          ? "/api/drivers"
          : `/api/drivers/${selectedDriver.driver_id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const payload = {
        ...formData,
        driver_type_id: driverType === "staff" ? 2 : 1,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const handleExportMenu = (type: string) => {
    setIsExportOpen(false);

    try {
      if (type === "excel") {
        const columns = [
          { header: "รหัสคนขับ", key: "driver_code", width: 15 },
          { header: "ชื่อ", key: "firstname", width: 20 },
          { header: "นามสกุล", key: "lastname", width: 20 },
          { header: "เบอร์โทรศัพท์", key: "tel", width: 15 },
          { header: "สถานะ", key: "status", width: 15 },
        ];

        const data = filteredDrivers.map((driver) => ({
          driver_code: driver.driver_code || "-",
          firstname: driver.vc_users?.firstname || "-",
          lastname: driver.vc_users?.lastname || "-",
          tel: driver.tel || "-",
          status: driver.driver_status === "1" ? "ปฏิบัติงาน" : "พ้นสภาพ",
        }));

        exportToExcel("drivers_export", "Drivers", columns, data)
          .then(() => showSuccess("Export Excel สำเร็จ"))
          .catch(() => showError("Export Error"));
      } else if (type === "docx" || type === "pdf") {
        const headers = ["รหัสคนขับ", "ชื่อ", "นามสกุล", "เบอร์โทรศัพท์", "สถานะ"];
        const data = filteredDrivers.map((driver) => [
          driver.driver_code || "-",
          driver.vc_users?.firstname || "-",
          driver.vc_users?.lastname || "-",
          driver.tel || "-",
          driver.driver_status === "1" ? "ปฏิบัติงาน" : "พ้นสภาพ",
        ]);

        if (type === "docx") {
          exportToDocx("drivers_export", "ข้อมูลพนักงานขับรถ", headers, data)
            .then(() => showSuccess("Export DOCX สำเร็จ"))
            .catch(() => showError("Export Error"));
        } else {
          exportToPdf("รายงานข้อมูลพนักงานขับรถ", headers, data);
          showSuccess("เปิดหน้าต่าง PDF แล้ว (กรุณาสั่ง Print หรือ Save as PDF)");
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      showError("เกิดข้อผิดพลาดในการ Export ข้อมูล");
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      header: "รหัสคนขับ",
      sortable: true,
      sortKey: "driver_code",
      cell: (driver) => (
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
          {driver.driver_code || "-"}
        </span>
      ),
    },
    {
      header: "ชื่อ - นามสกุล",
      sortable: true,
      sortKey: "firstname",
      cell: (driver) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {driver.vc_users?.firstname?.charAt(0) || "?"}
          </div>
          <div>
            <span className="block text-sm font-bold text-gray-900">
              {driver.vc_users?.firstname} {driver.vc_users?.lastname}
            </span>
            <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
              driver.driver_type_id === 2 
                ? "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                : "bg-blue-50 text-blue-600 border border-blue-100"
            }`}>
              {driver.driver_type_id === 2 ? "พนักงาน (ทำหน้าที่ขับรถ)" : "พนักงานขับรถโดยตรง"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "เบอร์โทรศัพท์",
      sortable: true,
      sortKey: "tel",
      cell: (driver) => (
        <span className="text-sm font-medium text-gray-600">{driver.tel || "-"}</span>
      ),
    },
    {
      header: "สถานะ",
      sortable: true,
      sortKey: "driver_status",
      cell: (driver) =>
        driver.driver_status === "1" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm uppercase tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ปฏิบัติงาน
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-rose-50 text-rose-700 border-rose-100 shadow-sm uppercase tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            พ้นสภาพ
          </span>
        ),
    },
    {
      header: "จัดการ",
      className: "text-right",
      cell: (driver) => (
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
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 md:max-w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, นามสกุล, รหัสประจำตัว, เบอร์โทร..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none placeholder:text-gray-500 placeholder:font-medium"
            />
          </div>
          <div className="w-full md:w-56">
            <select
              value={filterDriverType}
              onChange={(e) => {
                setFilterDriverType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%234B5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
            >
              <option value="all">ประเภทคนขับทั้งหมด</option>
              <option value="driver">พนักงานขับรถโดยตรง</option>
              <option value="staff">พนักงาน (ทำหน้าที่ขับรถ)</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            Export Data
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExportOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isExportOpen && (
            <div className="absolute top-full right-0 md:right-auto md:left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => handleExportMenu("excel")}
                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm font-bold text-gray-700 hover:text-emerald-700 flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export เป็น Excel
              </button>
              <button
                onClick={() => handleExportMenu("pdf")}
                className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-sm font-bold text-gray-700 hover:text-rose-700 flex items-center gap-3 transition-colors"
              >
                <FileIcon className="w-4 h-4 text-rose-600" />
                Export เป็น PDF
              </button>
              <button
                onClick={() => handleExportMenu("docx")}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm font-bold text-gray-700 hover:text-blue-700 flex items-center gap-3 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Export เป็น Word
              </button>
            </div>
          )}

          {hasAccess("create") && (
            <button
              onClick={() => openModal("add")}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              เพิ่มข้อมูลคนขับ
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={currentDrivers}
        isLoading={isLoading}
        onSort={handleSort}
        sortConfig={sortConfig}
        rowKey={(row) => row.driver_id}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === "add"
            ? "เพิ่มข้อมูลคนขับใหม่"
            : modalMode === "edit"
              ? "แก้ไขข้อมูลคนขับ"
              : "รายละเอียดคนขับ"
        }
        maxWidth="5xl"
        accentColor="bg-blue-600"
        footer={
          modalMode !== "view" ? (
            <>
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูลพนักงานขับรถ"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          )
        }
      >
        <div className="space-y-8">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
            <label className="text-sm font-bold text-blue-900 block mb-4 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
              เลือกประเภทพนักงานขับรถ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`relative flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all ${driverType === "driver" ? "border-blue-600 bg-white shadow-md scale-[1.02]" : "border-gray-200 bg-white hover:border-blue-200"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${driverType === "driver" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                    <Truck size={24} />
                  </div>
                  <input
                    type="radio"
                    name="driver_type"
                    value="driver"
                    checked={driverType === "driver"}
                    onChange={() => setDriverType("driver")}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-900">พนักงานขับรถโดยตรง</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">เจ้าหน้าที่ที่สังกัดตำแหน่งพนักงานขับรถของบริษัทโดยตรง</p>
                </div>
              </label>

              <label
                className={`relative flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all ${driverType === "staff" ? "border-indigo-600 bg-white shadow-md scale-[1.02]" : "border-gray-200 bg-white hover:border-indigo-200"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${driverType === "staff" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
                    <UserCheck size={24} />
                  </div>
                  <input
                    type="radio"
                    name="driver_type"
                    value="staff"
                    checked={driverType === "staff"}
                    onChange={() => setDriverType("staff")}
                    className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-900">พนักงาน (ทำหน้าที่ขับรถ)</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">พนักงานในแผนกที่ทำเรื่องขอทำหน้าที่พนักงานขับรถเพิ่มเติม</p>
                </div>
              </label>
            </div>
          </div>

          <FormSection title="ข้อมูลส่วนตัว">
            <SelectField
              label="รหัสผู้ใช้งาน (User)"
              required
              value={formData.driver_code}
              onChange={(v: any) => {
                const selectedUser = options?.users?.find(
                  (u: any) => String(u.userid) === String(v),
                );
                setFormData({
                  ...formData,
                  driver_code: v,
                  div_code: selectedUser?.sectionid ?? "",
                });
              }}
              options={options?.users}
              valueKey="userid"
              labelKey="firstname"
              labelKey2="lastname"
              disabled={modalMode === "view"}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1">
                รหัสหน่วยงาน (Div Code)
              </label>
              <input
                type="text"
                disabled
                value={formData.div_code || "-"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed"
              />
            </div>
            <InputField
              label="เบอร์โทรศัพท์"
              required
              value={formData.tel}
              onChange={(v: any) => setFormData({ ...formData, tel: v })}
              disabled={modalMode === "view"}
              placeholder="08X-XXX-XXXX"
            />
          </FormSection>

          <FormSection title="ข้อมูลใบอนุญาตและการทำงาน">
            <InputField
              label="เลขที่ใบอนุญาตขับรถ"
              value={formData.driver_license_no}
              onChange={(v: any) =>
                setFormData({ ...formData, driver_license_no: v })
              }
              disabled={modalMode === "view"}
              placeholder="ระบุเลขที่ใบอนุญาต"
            />
            <InputField
              label="วันหมดอายุใบอนุญาต"
              type="date"
              value={
                formData.driver_license_expire
                  ? new Date(formData.driver_license_expire)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(v: any) =>
                setFormData({ ...formData, driver_license_expire: v })
              }
              disabled={modalMode === "view"}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1">
                สถานะการทำงาน <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.driver_status}
                onChange={(e) =>
                  setFormData({ ...formData, driver_status: e.target.value })
                }
                disabled={modalMode === "view"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none disabled:opacity-70"
              >
                <option value="1">ปฏิบัติงาน</option>
                <option value="0">พ้นสภาพ</option>
              </select>
            </div>
          </FormSection>
          </div>
        </Modal>
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
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
      <div className="flex items-center gap-3 text-blue-600">
        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
        <h3 className="font-bold text-sm uppercase tracking-widest text-slate-800">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  maxLength,
}: any) {
  return (
    <div className="space-y-1.5 focus-within:z-10 group">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1 transition-colors group-focus-within:text-blue-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none disabled:opacity-70 disabled:bg-slate-100 placeholder:text-slate-300 placeholder:font-normal"
      />
    </div>
  );
}

const popupReactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: "0.5rem",
    padding: "0.1rem 0.2rem",
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    backgroundColor: state.isDisabled
      ? "#f3f4f6"
      : state.isFocused
        ? "#ffffff"
        : "#f9fafb",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
    borderWidth: "1px",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    fontSize: "0.875rem",
    minHeight: "42px",
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
    fontSize: "0.875rem",
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
    <div className="space-y-1.5 focus-within:z-10 group">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1 transition-colors group-focus-within:text-blue-500">
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
