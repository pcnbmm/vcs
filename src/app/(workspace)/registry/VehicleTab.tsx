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
  Filter,
  ChevronDown,
  RotateCcw,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { exportToExcel, exportToDocx, exportToPdf } from "@/lib/exportUtils";

export default function VehicleTab() {
  const { hasAccess } = usePermissions();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters & Sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>({ key: "car_number", direction: "asc" });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterSpec, setFilterSpec] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTypeRegis, setFilterTypeRegis] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [pendingFilters, setPendingFilters] = useState({
    status: "",
    province: "",
    color: "",
    spec: "",
    type: "",
    typeRegis: "",
    brand: "",
  });

  const toggleFilter = () => {
    if (!isAdvancedFilterOpen) {
      setPendingFilters({
        status: filterStatus,
        province: filterProvince,
        color: filterColor,
        spec: filterSpec,
        type: filterType,
        typeRegis: filterTypeRegis,
        brand: filterBrand,
      });
    }
    setIsAdvancedFilterOpen(!isAdvancedFilterOpen);
  };

  const clearFilters = () => {
    setPendingFilters({
      status: "",
      province: "",
      color: "",
      spec: "",
      type: "",
      typeRegis: "",
      brand: "",
    });
    setFilterStatus("");
    setFilterProvince("");
    setFilterColor("");
    setFilterSpec("");
    setFilterType("");
    setFilterTypeRegis("");
    setFilterBrand("");
  };

  const applyFilters = () => {
    setFilterStatus(pendingFilters.status);
    setFilterProvince(pendingFilters.province);
    setFilterColor(pendingFilters.color);
    setFilterSpec(pendingFilters.spec);
    setFilterType(pendingFilters.type);
    setFilterTypeRegis(pendingFilters.typeRegis);
    setFilterBrand(pendingFilters.brand);
    setIsAdvancedFilterOpen(false);
  };

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "add" | "edit">("add");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/vehicles");
      if (!res.ok) throw new Error("Failed to fetch vehicles data");
      const data = await res.json();
      setVehicles(data);
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
        if (data.carBrands) {
          data.allCarBrands = [...data.carBrands];
          const uniqueBrandsMap = new Map();
          data.carBrands.forEach((b: any) => {
            if (!uniqueBrandsMap.has(b.car_brand_name)) {
              uniqueBrandsMap.set(b.car_brand_name, b);
            }
          });
          data.carBrands = Array.from(uniqueBrandsMap.values());
        }
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

  // Apply all filters + search + sorting
  const filteredVehicles = vehicles
    .filter((v) => {
      const fullStr =
        `${v.car_number} ${v.car_brand_name} ${v.car_series_name} ${v.car_status_name}`.toLowerCase();
      const matchSearch = fullStr.includes(searchQuery.toLowerCase());

      const matchStatus = filterStatus
        ? String(v.car_status_id) === String(filterStatus)
        : true;
      const matchProvince = filterProvince
        ? String(v.car_province_id) === String(filterProvince)
        : true;
      const matchColor = filterColor
        ? String(v.color_id) === String(filterColor)
        : true;
      const matchSpec = filterSpec
        ? String(v.car_spec_id) === String(filterSpec)
        : true;
      const matchType = filterType
        ? String(v.car_type_id) === String(filterType)
        : true;
      const matchTypeRegis = filterTypeRegis
        ? String(v.car_type_regis_id) === String(filterTypeRegis)
        : true;
      const matchBrand = filterBrand
        ? v.car_brand_name === options?.carBrands?.find((b: any) => String(b.car_brand_id) === String(filterBrand))?.car_brand_name || String(v.car_brand_id) === String(filterBrand)
        : true;

      return (
        matchSearch &&
        matchStatus &&
        matchProvince &&
        matchColor &&
        matchSpec &&
        matchType &&
        matchTypeRegis &&
        matchBrand
      );
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const key = sortConfig.key;
      const valA = a[key] ?? "";
      const valB = b[key] ?? "";

      if (typeof valA === "string" && typeof valB === "string") {
        return sortConfig.direction === "asc" 
          ? valA.localeCompare(valB, 'th') 
          : valB.localeCompare(valA, 'th');
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const currentVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
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

  const openModal = (mode: "view" | "add" | "edit", vehicle?: any) => {
    setModalMode(mode);
    setSelectedVehicle(vehicle);
    if (mode === "add") {
      const activeStatus = options?.statuses?.find((s:any) => s.car_status_name === "ใช้งานอยู่");
      setFormData({
        car_number: "",
        car_brand_id: "",
        temp_brand_name: "",
        color_id: "",
        car_status_id: activeStatus ? activeStatus.car_status_id : "",
        car_province_id: "",
        car_type_id: "",
        car_spec_id: "",
        car_type_regis_id: "",
        regis_date: "",
        fleetcard_no: "",
        body_no: "",
        machine_no: "",
        cylinder_capacityp: "",
        horse_power: "",
        weight: "",
        own_div_code: "",
        fiscal_year: "",
        start_date: "",
        end_date: "",
        oil_expense: "",
        refund_vat: "",
        flag: "",
        ref_car: "",
        machine_id: "",
        oil_type_id: "",
      });
    } else {
      setFormData({
        ...vehicle,
        temp_brand_name: vehicle.car_brand_name || "",
        regis_date: safeDate(vehicle.regis_date),
        start_date: safeDate(vehicle.start_date),
        end_date: safeDate(vehicle.end_date),
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setSelectedVehicle(null);
  };

  const handleSave = async () => {
    const requiredFields = [
      formData.car_number,
      formData.car_province_id,
    ];

    if (requiredFields.some((field) => !field)) {
      showWarning("กรุณากรอกข้อมูลสำคัญที่มีเครื่องหมาย * ให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    try {
      const url =
        modalMode === "add"
          ? "/api/vehicles"
          : `/api/vehicles/${selectedVehicle.car_id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      // คำนวณ flag อัตโนมัติจากสถานะ
      const selectedStatus = options?.statuses?.find((s: any) => String(s.car_status_id) === String(formData.car_status_id));
      const statusName = selectedStatus?.car_status_name || "";
      const isReady = statusName.includes("ปกติ") || statusName.includes("พร้อม") || statusName.includes("ใช้งานอยู่");

      const payload = {
        ...formData,
        flag: isReady ? null : "x"
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
      console.error("Error saving vehicle:", error);
      showError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await showConfirm("ยืนยันการลบข้อมูลรถยนต์คันนี้ ใช่หรือไม่?")))
      return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (errorData?.message) {
          showWarning(errorData.message);
          return;
        }
        throw new Error("Deletion failed");
      }
      showSuccess("ลบข้อมูลรถยนต์สำเร็จ");
      await fetchData();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      showError("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleExportMenu = (type: string) => {
    setIsExportOpen(false);
    
    try {
      if (type === "excel") {
        const columns = [
          { header: "ทะเบียนรถ", key: "car_number", width: 15 },
          { header: "จังหวัด", key: "province_name", width: 20 },
          { header: "สถานะ", key: "car_status_name", width: 15 },
          { header: "ยี่ห้อ", key: "car_brand_name", width: 20 },
          { header: "รุ่น", key: "car_series_name", width: 20 },
          { header: "สเปค", key: "car_spec_name", width: 25 },
          { header: "หน่วยงาน", key: "own_div_name", width: 30 },
        ];

        const data = filteredVehicles.map((vehicle) => {
          let orgName = vehicle.own_div_code;
          if (options?.orgs) {
            const org = options.orgs.find((o: any) => String(o.orgid) === String(vehicle.own_div_code));
            if (org) orgName = org.orgname;
          }
          return {
            car_number: vehicle.car_number || "-",
            province_name: vehicle.province_name || "-",
            car_status_name: vehicle.car_status_name || "-",
            car_brand_name: vehicle.car_brand_name || "-",
            car_series_name: vehicle.car_series_name || "-",
            car_spec_name: vehicle.car_spec_name || "-",
            own_div_name: orgName || "-",
          };
        });

        exportToExcel("vehicles_export", "Vehicles", columns, data)
          .then(() => showSuccess("Export Excel สำเร็จ"))
          .catch(() => showError("Export Error"));
      } else if (type === "docx" || type === "pdf") {
        const headers = ["ทะเบียนรถ", "จังหวัด", "สถานะ", "ยี่ห้อ", "รุ่น", "หน่วยงาน"];
        const data = filteredVehicles.map((vehicle) => {
          let orgName = vehicle.own_div_code;
          if (options?.orgs) {
            const org = options.orgs.find((o: any) => String(o.orgid) === String(vehicle.own_div_code));
            if (org) orgName = org.orgname;
          }
          return [
            vehicle.car_number || "-",
            vehicle.province_name || "-",
            vehicle.car_status_name || "-",
            vehicle.car_brand_name || "-",
            vehicle.car_series_name || "-",
            orgName || "-"
          ];
        });

        if (type === "docx") {
          exportToDocx("vehicles_export", "ข้อมูลรถยนต์", headers, data)
            .then(() => showSuccess("Export DOCX สำเร็จ"))
            .catch(() => showError("Export Error"));
        } else {
          exportToPdf("รายงานข้อมูลรถยนต์", headers, data);
          showSuccess("เปิดหน้าต่าง PDF แล้ว (กรุณาสั่ง Print หรือ Save as PDF)");
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      showError("เกิดข้อผิดพลาดในการ Export ข้อมูล");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header, Search & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3 w-full relative">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหา ทะเบียนรถ, ยี่ห้อ, รุ่น, หรือหน่วยงาน..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-black focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="relative w-full md:w-auto">
            <button
              onClick={toggleFilter}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-500 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              Filter เพิ่มเติม
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAdvancedFilterOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Advanced Filter Popover */}
            {isAdvancedFilterOpen && (
              <div className="absolute top-full right-0 md:right-0 mt-2 w-full md:w-[800px] max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-100 p-6 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-gray-800">Filter เพิ่มเติม</h3>
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    ล้างค่า
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                  <SelectFilter
                    label="ยี่ห้อรถ"
                    value={pendingFilters.brand}
                    onChange={(v: any) => setPendingFilters({ ...pendingFilters, brand: v })}
                    options={options?.carBrands}
                    valKey="car_brand_id"
                    lblKey="car_brand_name"
                  />
                  <SelectFilter
                    label="สถานะ"
                    value={pendingFilters.status}
                    onChange={(v: any) => setPendingFilters({ ...pendingFilters, status: v })}
                    options={options?.statuses}
                    valKey="car_status_id"
                    lblKey="car_status_name"
                  />
                  <SelectFilter
                    label="จังหวัด"
                    value={pendingFilters.province}
                    onChange={(v: any) => setPendingFilters({ ...pendingFilters, province: v })}
                    options={options?.provinces}
                    valKey="province_id"
                    lblKey="province_name"
                  />
                  <SelectFilter
                    label="สีรถ"
                    value={pendingFilters.color}
                    onChange={(v: any) => setPendingFilters({ ...pendingFilters, color: v })}
                    options={options?.colors}
                    valKey="color_id"
                    lblKey="color_name"
                  />
                  <SelectFilter
                    label="สเปค"
                    value={pendingFilters.spec}
                    onChange={(v: any) => setPendingFilters({ ...pendingFilters, spec: v })}
                    options={options?.carSpecs}
                    valKey="car_spec_id"
                    lblKey="car_spec_name"
                  />
                  <SelectFilter
                    label="ประเภทรถ"
                    value={pendingFilters.type}
                    onChange={(v: any) => setPendingFilters({ ...pendingFilters, type: v })}
                    options={options?.carTypes}
                    valKey="car_type_id"
                    lblKey="car_type_name"
                  />
                  <SelectFilter
                    label="ประเภทจดทะเบียน"
                    value={pendingFilters.typeRegis}
                    onChange={(v: any) => setPendingFilters({ ...pendingFilters, typeRegis: v })}
                    options={options?.typeRegis}
                    valKey="type_regis_id"
                    lblKey="type_regis_name"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setIsAdvancedFilterOpen(false)}
                    className="px-6 py-2.5 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all whitespace-nowrap"
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
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              เพิ่มข้อมูลรถยนต์
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th
                  onClick={() => handleSort("car_number")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  ทะเบียนรถ{" "}
                  {sortConfig?.key === "car_number"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th
                  onClick={() => handleSort("car_status_name")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  สถานะ{" "}
                  {sortConfig?.key === "car_status_name"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th
                  onClick={() => handleSort("car_brand_name")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  ยี่ห้อ / รุ่น{" "}
                  {sortConfig?.key === "car_brand_name"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th
                  onClick={() => handleSort("car_spec_name")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  สเปค{" "}
                  {sortConfig?.key === "car_spec_name"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th
                  onClick={() => handleSort("own_div_code")}
                  className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  หน่วยงาน{" "}
                  {sortConfig?.key === "own_div_code"
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
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-4 text-sm font-medium text-gray-500">
                      กำลังโหลดข้อมูลรถยนต์...
                    </p>
                  </td>
                </tr>
              ) : currentVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-sm font-medium text-gray-500">
                      ไม่พบข้อมูลที่ค้นหา
                    </p>
                  </td>
                </tr>
              ) : (
                currentVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.car_id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="block text-sm font-semibold text-gray-900">
                        {vehicle.car_number || "-"}
                      </span>
                      <span className="block text-xs font-medium text-gray-500 mt-0.5">
                        {vehicle.province_name || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {(() => {
                        const status = vehicle.car_status_name || "";
                        let colorClass =
                          "bg-slate-50 text-slate-700 border-slate-100";
                        let dotClass = "bg-slate-500";

                        if (
                          status.includes("ปกติ") ||
                          status.includes("พร้อม") ||
                          status.includes("ใช้งานอยู่")
                        ) {
                          colorClass =
                            "bg-emerald-50 text-emerald-700 border-emerald-100";
                          dotClass = "bg-emerald-500";
                        } else if (
                          status.includes("ซ่อม") ||
                          status.includes("บำรุง")
                        ) {
                          colorClass =
                            "bg-amber-50 text-amber-700 border-amber-100";
                          dotClass = "bg-amber-500";
                        } else if (
                          status.includes("ยกเลิก") ||
                          status.includes("จำหน่าย")
                        ) {
                          colorClass =
                            "bg-rose-50 text-rose-700 border-rose-100";
                          dotClass = "bg-rose-500";
                        } else if (status.includes("จอง")) {
                          colorClass =
                            "bg-indigo-50 text-indigo-700 border-indigo-100";
                          dotClass = "bg-indigo-500";
                        }

                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClass} shadow-sm uppercase tracking-tight`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`}
                            ></span>
                            {status || "-"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="block text-sm font-bold text-gray-800">
                        {vehicle.car_brand_name || "-"}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {vehicle.car_series_name || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-700">
                      {vehicle.car_spec_name || "-"}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-700">
                      {(() => {
                        if (!vehicle.own_div_code) return "-";
                        const org = options?.orgs?.find((o: any) => String(o.orgid) === String(vehicle.own_div_code));
                        return org ? org.orgname : vehicle.own_div_code;
                      })()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {hasAccess("view") && (
                          <button
                            onClick={() => openModal("view", vehicle)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {hasAccess("update") && (
                          <button
                            onClick={() => openModal("edit", vehicle)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasAccess("delete") && (
                          <button
                            onClick={() => handleDelete(vehicle.car_id)}
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
        {!isLoading && filteredVehicles.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              แสดง {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredVehicles.length)}{" "}
              จาก {filteredVehicles.length} รายการ
            </span>
            <div className="flex items-center gap-4">
              {/* Items per page selector */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer pr-8"
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
              >
                <option value={10}>10 / หน้า</option>
                <option value={20}>20 / หน้า</option>
                <option value={50}>50 / หน้า</option>
                <option value={100}>100 / หน้า</option>
              </select>

              {/* Pagination controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
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
                        className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-sm"
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
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
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
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm relative">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                {modalMode === "add"
                  ? "เพิ่มข้อมูลรถยนต์"
                  : modalMode === "edit"
                    ? "แก้ไขข้อมูลรถยนต์"
                    : "รายละเอียดรถยนต์"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors absolute right-6 top-1/2 -translate-y-1/2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
              <div className="space-y-6">
                <FormSection title="หมวดข้อมูลหลัก (Main Identity)">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <InputField
                      label="ทะเบียนรถ"
                      required
                      value={formData.car_number}
                      onChange={(v: any) =>
                        setFormData({ ...formData, car_number: v })
                      }
                      placeholder="เช่น กข 1234"
                      disabled={modalMode === "view"}
                    />
                    <SelectField
                      label="จังหวัด"
                      required
                      value={formData.car_province_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, car_province_id: v })
                      }
                      options={options?.provinces}
                      valueKey="province_id"
                      labelKey="province_name"
                      disabled={modalMode === "view"}
                    />
                    <SelectField
                      label="ประเภทรถ"
                      value={formData.car_type_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, car_type_id: v })
                      }
                      options={options?.carTypes}
                      valueKey="car_type_id"
                      labelKey="car_type_name"
                      disabled={modalMode === "view"}
                    />

                    <SelectField
                      label="ยี่ห้อรถ"
                      value={options?.carBrands?.find((b:any) => b.car_brand_name === formData.temp_brand_name)?.car_brand_id || ""}
                      onChange={(v: any) => {
                        const brandObj = options?.carBrands?.find((b:any) => String(b.car_brand_id) === String(v));
                        setFormData({ 
                          ...formData, 
                          temp_brand_name: brandObj?.car_brand_name || "",
                          car_brand_id: "" 
                        });
                      }}
                      options={options?.carBrands}
                      valueKey="car_brand_id"
                      labelKey="car_brand_name"
                      disabled={modalMode === "view"}
                    />
                    <SelectField
                      label="รุ่นรถยนต์"
                      value={formData.car_brand_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, car_brand_id: v })
                      }
                      options={options?.allCarBrands?.filter((b:any) => b.car_brand_name === formData.temp_brand_name).map((b:any) => ({
                        ...b,
                        display_name: b.car_series_name || "-"
                      })) || []}
                      valueKey="car_brand_id"
                      labelKey="display_name"
                      disabled={modalMode === "view" || !formData.temp_brand_name}
                    />
                    <SelectField
                      label="สเปค"
                      value={formData.car_spec_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, car_spec_id: v })
                      }
                      options={options?.carSpecs}
                      valueKey="car_spec_id"
                      labelKey="car_spec_name"
                      disabled={modalMode === "view"}
                    />
                    <SelectField
                      label="สีรถ"
                      value={formData.color_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, color_id: v })
                      }
                      options={options?.colors}
                      valueKey="color_id"
                      labelKey="color_name"
                      disabled={modalMode === "view"}
                    />

                    <SelectField
                      label="ประเภทจดทะเบียน"
                      value={formData.car_type_regis_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, car_type_regis_id: v })
                      }
                      options={options?.typeRegis}
                      valueKey="type_regis_id"
                      labelKey="type_regis_name"
                      disabled={modalMode === "view"}
                    />
                    <SelectField
                      label="สถานะรถ"
                      value={formData.car_status_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, car_status_id: v })
                      }
                      options={options?.statuses}
                      valueKey="car_status_id"
                      labelKey="car_status_name"
                      disabled={modalMode === "view" || modalMode === "add"}
                    />
                  </div>
                </FormSection>

                <FormSection title="หมวดวันที่และรายละเอียด (Dates & Details)">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <InputField
                      label="วันที่จดทะเบียน (Regis Date)"
                      type="date"
                      value={formData.regis_date}
                      onChange={(v: any) =>
                        setFormData({ ...formData, regis_date: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="ปีงบประมาณ (Fiscal Year)"
                      type="number"
                      value={formData.fiscal_year}
                      onChange={(v: any) =>
                        setFormData({ ...formData, fiscal_year: v })
                      }
                      placeholder="เช่น 2567"
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="วันที่เริ่มต้น (Start Date)"
                      type="date"
                      value={formData.start_date}
                      onChange={(v: any) =>
                        setFormData({ ...formData, start_date: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="วันที่สิ้นสุด (End Date)"
                      type="date"
                      value={formData.end_date}
                      onChange={(v: any) =>
                        setFormData({ ...formData, end_date: v })
                      }
                      disabled={modalMode === "view"}
                    />
                  </div>
                </FormSection>

                <FormSection title="หมวดเครื่องยนต์และตัวถัง (Engine & Body)">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <InputField
                      label="หมายเลขเครื่อง (Machine No)"
                      value={formData.machine_no}
                      onChange={(v: any) =>
                        setFormData({ ...formData, machine_no: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="หมายเลขตัวถัง (Body No)"
                      value={formData.body_no}
                      onChange={(v: any) =>
                        setFormData({ ...formData, body_no: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="รหัสเครื่องยนต์ (Machine ID)"
                      value={formData.machine_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, machine_id: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="ความจุกระบอกสูบ (CC)"
                      value={formData.cylinder_capacityp}
                      onChange={(v: any) =>
                        setFormData({ ...formData, cylinder_capacityp: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="แรงม้า (Horse Power)"
                      value={formData.horse_power}
                      onChange={(v: any) =>
                        setFormData({ ...formData, horse_power: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="น้ำหนัก (Weight)"
                      value={formData.weight}
                      onChange={(v: any) =>
                        setFormData({ ...formData, weight: v })
                      }
                      disabled={modalMode === "view"}
                    />
                  </div>
                </FormSection>

                <FormSection title="หมวดหน่วยงานและค่าใช้จ่าย (Operations & Expenses)">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <SelectField
                      label="รหัสหน่วยงาน (Own Div Code)"
                      value={formData.own_div_code}
                      onChange={(v: any) =>
                        setFormData({ ...formData, own_div_code: v })
                      }
                      options={options?.orgs}
                      valueKey="orgid"
                      labelKey="orgname"
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="หมายเลขอ้างอิงรถ (Ref Car)"
                      value={formData.ref_car}
                      onChange={(v: any) =>
                        setFormData({ ...formData, ref_car: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="หมายเลข Fleetcard"
                      value={formData.fleetcard_no}
                      onChange={(v: any) =>
                        setFormData({ ...formData, fleetcard_no: v })
                      }
                      disabled={modalMode === "view"}
                    />

                    <SelectField
                      label="ชนิดน้ำมัน"
                      value={formData.oil_type_id}
                      onChange={(v: any) =>
                        setFormData({ ...formData, oil_type_id: v })
                      }
                      options={options?.oilTypes}
                      valueKey="oil_type_id"
                      labelKey="oil_type_name"
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="ค่าใช้จ่ายน้ำมัน"
                      type="number"
                      step="0.01"
                      value={formData.oil_expense}
                      onChange={(v: any) =>
                        setFormData({ ...formData, oil_expense: v })
                      }
                      disabled={modalMode === "view"}
                    />
                    <InputField
                      label="การคืนภาษี (Refund Vat)"
                      type="number"
                      value={formData.refund_vat}
                      onChange={(v: any) =>
                        setFormData({ ...formData, refund_vat: v })
                      }
                      disabled={modalMode === "view"}
                    />

                    <InputField
                      label="Flag (สัญลักษณ์) - สถานะความพร้อมใช้งาน"
                      value={formData.flag}
                      onChange={(v: any) =>
                        setFormData({ ...formData, flag: v })
                      }
                      disabled={true}
                    />
                  </div>
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
                  {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูลรถยนต์"}
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
const filterReactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: "0.5rem",
    padding: "0",
    minHeight: "38px",
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    backgroundColor: "#ffffff",
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(59, 130, 246, 0.2)"
      : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
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
    fontSize: "0.875rem",
    fontWeight: "bold",
    padding: "0.5rem 1rem",
  }),
  singleValue: (base: any) => ({
    ...base,
    fontWeight: "bold",
    color: "#374151",
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
    borderRadius: "0.5rem",
    overflow: "hidden",
    zIndex: 100,
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
};

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

function SelectFilter({
  label,
  value,
  onChange,
  options,
  valKey,
  lblKey,
}: any) {
  const formattedOptions = [
    { value: "", label: "ทั้งหมด (All)" },
    ...(options?.map((opt: any) => ({
      value: String(opt[valKey]),
      label: opt[lblKey],
    })) || []),
  ];
  const currentValue =
    formattedOptions.find((o: any) => o.value === String(value)) ||
    formattedOptions[0];

  return (
    <div className="space-y-1.5 focus-within:z-10">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      <Select
        value={currentValue}
        onChange={(sel: any) => onChange(sel ? sel.value : "")}
        options={formattedOptions}
        isSearchable
        styles={filterReactSelectStyles}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        menuPosition="fixed"
      />
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm col-span-1 lg:col-span-3 hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-blue-900 mb-5 border-b border-gray-50 pb-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        {title}
      </h3>
      {children}
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
  step,
}: any) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        step={step}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none disabled:opacity-60 disabled:bg-gray-100 placeholder:font-medium placeholder:text-gray-400"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  valueKey,
  labelKey,
  disabled,
  required,
}: any) {
  const formattedOptions =
    options?.map((opt: any) => ({
      value: String(opt[valueKey]),
      label: opt[labelKey] || "",
    })) || [];
  const currentValue =
    formattedOptions.find((o: any) => o.value === String(value)) || null;

  return (
    <div className="space-y-1.5 group">
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
