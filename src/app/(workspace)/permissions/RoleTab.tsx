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

export default function RoleTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    roles_name: "",
    description: "",
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/permissions/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      (r.roles_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const currentRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const openModal = (mode: "add" | "edit", role?: any) => {
    setModalMode(mode);
    setSelectedRole(role);
    if (mode === "add") {
      setFormData({ roles_name: "", description: "" });
    } else if (role) {
      setFormData({
        roles_name: role.roles_name || "",
        description: role.description || "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ roles_name: "", description: "" });
    setSelectedRole(null);
  };

  const handleSave = async () => {
    if (!formData.roles_name) return showWarning("กรุณาระบุชื่อบทบาท");

    setIsSaving(true);
    try {
      const url = modalMode === "add" ? "/api/permissions/roles" : `/api/permissions/roles/${selectedRole.roles_id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Saving failed");

      showSuccess("บันทึกข้อมูลเรียบร้อย");
      fetchRoles();
      closeModal();
    } catch (error) {
      console.error("Error saving role:", error);
      showError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await showConfirm("ยืนยันการลบบทบาทนี้ ใช่หรือไม่?"))) return;
    try {
      const res = await fetch(`/api/permissions/roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      showSuccess("ลบข้อมูลเรียบร้อย");
      fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
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
            placeholder="ค้นหาบทบาท..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          เพิ่มบทบาท
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <DataTable
          columns={[
            {
              header: "ID",
              cell: (role) => <span className="font-bold text-slate-400 italic">#{role.roles_id}</span>
            },
            {
              header: "ชื่อบทบาท",
              cell: (role) => <span className="font-bold text-slate-800">{role.roles_name}</span>
            },
            {
              header: "รายละเอียด",
              cell: (role) => <span className="text-sm text-slate-500">{role.description || "-"}</span>
            },
            {
              header: "จัดการ",
              className: "text-right",
              cell: (role) => (
                <div className="flex justify-end gap-1">
                  <button onClick={() => openModal("edit", role)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(role.roles_id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          data={currentRoles}
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
        title={modalMode === "add" ? "เพิ่มบทบาทใหม่" : "แก้ไขบทบาท"}
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
            <label className="text-sm font-bold text-slate-700">ชื่อบทบาท <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.roles_name}
              onChange={(e) => setFormData({ ...formData, roles_name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="ระบุชื่อบทบาท..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">รายละเอียด</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all h-32 resize-none"
              placeholder="ระบุคำอธิบายเพิ่มเติม..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
