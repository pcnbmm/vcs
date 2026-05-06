"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, Loader2, Save } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";

export default function MenuTab() {
  const [menus, setMenus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    menuname: "",
    route_path: "",
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/permissions/menus");
      if (res.ok) {
        const data = await res.json();
        setMenus(data);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMenus = menus.filter(
    (m) =>
      (m.menuname || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.route_path || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
  const currentMenus = filteredMenus.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const openModal = (mode: "add" | "edit", menu?: any) => {
    setModalMode(mode);
    setSelectedMenu(menu);
    if (mode === "add") {
      setFormData({ menuname: "", route_path: "" });
    } else if (menu) {
      setFormData({
        menuname: menu.menuname || "",
        route_path: menu.route_path || "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ menuname: "", route_path: "" });
    setSelectedMenu(null);
  };

  const handleSave = async () => {
    if (!formData.menuname) return showWarning("กรุณาระบุชื่อเมนู");

    setIsSaving(true);
    try {
      const url = modalMode === "add" ? "/api/permissions/menus" : `/api/permissions/menus/${selectedMenu.menu_id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Saving failed");

      showSuccess("บันทึกข้อมูลเรียบร้อย");
      fetchMenus();
      closeModal();
    } catch (error) {
      console.error("Error saving menu:", error);
      showError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await showConfirm("ยืนยันการลบเมนูนี้ ใช่หรือไม่?"))) return;
    try {
      const res = await fetch(`/api/permissions/menus/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      showSuccess("ลบข้อมูลเรียบร้อย");
      fetchMenus();
    } catch (error) {
      console.error("Error deleting menu:", error);
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
            placeholder="ค้นหาเมนู หรือ URL..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-100 outline-none transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          เพิ่มเมนู
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <DataTable
          columns={[
            {
              header: "ID",
              cell: (menu) => <span className="font-bold text-slate-400 italic">#{menu.menu_id}</span>
            },
            {
              header: "ชื่อเมนู",
              cell: (menu) => <span className="font-bold text-slate-800">{menu.menuname}</span>
            },
            {
              header: "URL Path",
              cell: (menu) => <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">{menu.route_path || "/"}</span>
            },
            {
              header: "จัดการ",
              className: "text-right",
              cell: (menu) => (
                <div className="flex justify-end gap-1">
                  <button onClick={() => openModal("edit", menu)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(menu.menu_id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          data={currentMenus}
          isLoading={isLoading}
          rowKey={(row) => row.menu_id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === "add" ? "เพิ่มเมนูใหม่" : "แก้ไขเมนู"}
        maxWidth="md"
        accentColor="bg-blue-600"
        footer={
          <>
            <button onClick={closeModal} className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">ชื่อเมนู <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.menuname}
              onChange={(e) => setFormData({ ...formData, menuname: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="เช่น หน้าแรก, รายงาน..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">URL Path</label>
            <input
              type="text"
              value={formData.route_path}
              onChange={(e) => setFormData({ ...formData, route_path: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="เช่น /dashboard"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
