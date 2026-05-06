"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  Save,
  Component,
  LayoutList,
  CheckCircle2,
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";

export default function MenuRoleTab() {
  const [groupedMenuRoles, setGroupedMenuRoles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [functions, setFunctions] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  type Mapping = { menu_id: number; function_id: number | null };
  const [formData, setFormData] = useState<{
    roles_id: string;
    mappings: Mapping[];
  }>({
    roles_id: "",
    mappings: [],
  });

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/permissions/menu-roles");
      if (res.ok) {
        const data = await res.json();
        setGroupedMenuRoles(data);
      }
    } catch (error) {
      console.error("Error fetching menu roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [rolesRes, menusRes, funcsRes] = await Promise.all([
        fetch("/api/permissions/roles"),
        fetch("/api/permissions/menus"),
        fetch("/api/permissions/functions"),
      ]);
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (menusRes.ok) setMenus(await menusRes.json());
      if (funcsRes.ok) setFunctions(await funcsRes.json());
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  const filteredMenuRoles = groupedMenuRoles.filter(
    (mr) =>
      (mr.roles_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      mr.menus.some((m: any) => (m.menuname || "").toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const totalPages = Math.ceil(filteredMenuRoles.length / itemsPerPage);
  const currentMenuRoles = filteredMenuRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const openModal = (mr?: any) => {
    if (mr) {
      const restoredMappings: Mapping[] = [];
      mr.menus.forEach((m: any) => {
        if (m.has_general_access) restoredMappings.push({ menu_id: m.menu_id, function_id: null });
        m.functions.forEach((f: any) => restoredMappings.push({ menu_id: m.menu_id, function_id: f.function_id }));
      });
      setFormData({ roles_id: String(mr.roles_id), mappings: restoredMappings });
    } else {
      setFormData({ roles_id: "", mappings: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ roles_id: "", mappings: [] });
  };

  const toggleMapping = (menuId: number, functionId: number | null) => {
    setFormData((prev) => {
      const exists = prev.mappings.some((m) => m.menu_id === menuId && m.function_id === functionId);
      if (exists) {
        return { ...prev, mappings: prev.mappings.filter((m) => !(m.menu_id === menuId && m.function_id === functionId)) };
      } else {
        return { ...prev, mappings: [...prev.mappings, { menu_id: menuId, function_id: functionId }] };
      }
    });
  };

  const hasMapping = (menuId: number, functionId: number | null) => {
    return formData.mappings.some((m) => m.menu_id === menuId && m.function_id === functionId);
  };

  const handleSave = async () => {
    if (!formData.roles_id) return showWarning("กรุณาเลือกบทบาท");
    if (formData.mappings.length === 0) return showWarning("กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ");

    setIsSaving(true);
    try {
      const res = await fetch("/api/permissions/menu-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Saving failed");
      showSuccess("บันทึกข้อมูลเรียบร้อย");
      fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving menu roles:", error);
      showError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rolesId: number) => {
    if (!(await showConfirm("ยืนยันการลบสิทธิ์เมนูทั้งหมดของบทบาทนี้?"))) return;
    try {
      const res = await fetch(`/api/permissions/menu-roles/${rolesId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      showSuccess("ลบข้อมูลเรียบร้อย");
      fetchData();
    } catch (error) {
      console.error("Error deleting menu roles:", error);
      showError("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาบทบาท หรือเมนู..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-100 outline-none transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          กำหนดสิทธิ์เมนู
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <DataTable
          columns={[
            {
              header: "บทบาท (Role)",
              cell: (mr) => <span className="font-bold text-slate-800">{mr.roles_name}</span>
            },
            {
              header: "สิทธิ์การเข้าถึง",
              cell: (mr) => (
                <div className="flex flex-col gap-2">
                  {mr.menus.map((m: any) => (
                    <div key={m.menu_id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2 font-bold text-xs text-slate-700">
                        <LayoutList size={14} className="text-rose-500" />
                        {m.menuname}
                      </div>
                      <div className="flex flex-wrap gap-1 pl-6">
                        {m.has_general_access && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold">เข้าถึงเมนู</span>
                        )}
                        {m.functions.map((f: any) => (
                          <span key={f.function_id} className="px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200 text-[10px] font-bold flex items-center gap-1">
                            <Component size={10} /> {f.func_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              header: "จัดการ",
              className: "text-right",
              cell: (mr) => (
                <div className="flex justify-end gap-1">
                  <button onClick={() => openModal(mr)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(mr.roles_id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          data={currentMenuRoles}
          isLoading={isLoading}
          rowKey={(row) => row.roles_id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="กำหนดสิทธิ์เข้าถึงเมนูและฟังก์ชัน"
        maxWidth="4xl"
        accentColor="bg-blue-600"
        footer={
          <>
            <button onClick={closeModal} className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || formData.mappings.length === 0}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              {isSaving ? "กำลังบันทึก..." : "บันทึกและอัปเดตสิทธิ์"}
            </button>
          </>
        }
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">1. เลือกบทบาท</label>
            <select
              value={formData.roles_id}
              onChange={(e) => setFormData({ ...formData, roles_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none transition-all"
            >
              <option value="">-- ค้นหาและเลือกบทบาท --</option>
              {roles.map((r) => (
                <option key={r.roles_id} value={r.roles_id}>{r.roles_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. กำหนดสิทธิ์เมนูและฟังก์ชัน</label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">เลือกไว้ {formData.mappings.length} สิทธิ์</span>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {menus.map((menu) => {
                const hasMenuAccess = hasMapping(menu.menu_id, null);
                return (
                  <div key={menu.menu_id} className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                    <button
                      onClick={() => toggleMapping(menu.menu_id, null)}
                      className={`w-full flex items-center justify-between p-4 transition-all ${hasMenuAccess ? "bg-white border-b border-slate-100" : "hover:bg-slate-100"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${hasMenuAccess ? "bg-rose-600 text-white scale-110 shadow-sm" : "bg-white border border-slate-200"}`}>
                          {hasMenuAccess && <CheckCircle2 size={14} />}
                        </div>
                        <span className={`text-sm font-bold ${hasMenuAccess ? "text-slate-900" : "text-slate-500"}`}>{menu.menuname}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สิทธิ์เข้าใช้งานเมนู</span>
                    </button>
                    
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {functions.map((func) => {
                        const hasFuncAccess = hasMapping(menu.menu_id, func.function_id);
                        return (
                          <button
                            key={func.function_id}
                            onClick={() => toggleMapping(menu.menu_id, func.function_id)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                              hasFuncAccess ? "bg-white border-slate-300 shadow-sm" : "bg-white/40 border-slate-100 hover:border-slate-200 hover:bg-white"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${hasFuncAccess ? "bg-slate-800 text-white" : "border border-slate-200"}`}>
                              {hasFuncAccess && <CheckCircle2 size={10} />}
                            </div>
                            <span className={`text-[11px] font-bold ${hasFuncAccess ? "text-slate-800" : "text-slate-400"}`}>{func.func_name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
