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
  Users,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";

export default function UserRoleTab() {
  const [groupedUserRoles, setGroupedUserRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<{
    user_id: string;
    roles_ids: number[];
  }>({
    user_id: "",
    roles_ids: [],
  });

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/permissions/user-roles");
      if (res.ok) {
        const data = await res.json();
        setGroupedUserRoles(data);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/permissions/users"),
        fetch("/api/permissions/roles"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  const filteredUserRoles = groupedUserRoles.filter(
    (ur) =>
      (ur.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ur.fullname || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      ur.roles.some((r: any) =>
        (r.roles_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const totalPages = Math.ceil(filteredUserRoles.length / itemsPerPage);
  const currentUserRoles = filteredUserRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const openModal = (ur?: any) => {
    if (ur) {
      setFormData({
        user_id: String(ur.user_id),
        roles_ids: ur.roles.map((r: any) => r.roles_id),
      });
    } else {
      setFormData({ user_id: "", roles_ids: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ user_id: "", roles_ids: [] });
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData((prev) => {
      if (prev.roles_ids.includes(roleId)) {
        return { ...prev, roles_ids: prev.roles_ids.filter((id) => id !== roleId) };
      } else {
        return { ...prev, roles_ids: [...prev.roles_ids, roleId] };
      }
    });
  };

  const handleSave = async () => {
    if (!formData.user_id) return showWarning("กรุณาเลือกผู้ใช้");
    if (formData.roles_ids.length === 0) return showWarning("กรุณาเลือกอย่างน้อย 1 บทบาท");

    setIsSaving(true);
    try {
      const res = await fetch("/api/permissions/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Saving failed");
      showSuccess("บันทึกข้อมูลเรียบร้อย");
      fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving user roles:", error);
      showError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!(await showConfirm("ยืนยันการลบสิทธิ์ทั้งหมดของผู้ใช้นี้?"))) return;
    try {
      const res = await fetch(`/api/permissions/user-roles/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      showSuccess("ลบข้อมูลเรียบร้อย");
      fetchData();
    } catch (error) {
      console.error("Error deleting user roles:", error);
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
            placeholder="ค้นหาผู้ใช้ หรือบทบาท..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-100 outline-none transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 shadow-lg shadow-amber-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          มอบหมายสิทธิ์
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <DataTable
          columns={[
            {
              header: "ผู้ใช้ (User)",
              cell: (ur) => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                    {ur.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-tight">{ur.username}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{ur.fullname}</p>
                  </div>
                </div>
              ),
            },
            {
              header: "บทบาทที่ได้รับ",
              cell: (ur) => (
                <div className="flex flex-wrap gap-1.5">
                  {ur.roles.map((r: any) => (
                    <span key={r.roles_id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-tighter">
                      <ShieldCheck size={10} />
                      {r.roles_name}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              header: "จัดการ",
              className: "text-right",
              cell: (ur) => (
                <div className="flex justify-end gap-1">
                  <button onClick={() => openModal(ur)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(ur.user_id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          data={currentUserRoles}
          isLoading={isLoading}
          rowKey={(row) => row.user_id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="มอบหมายบทบาทให้ผู้ใช้"
        maxWidth="2xl"
        accentColor="bg-amber-600"
        footer={
          <>
            <button onClick={closeModal} className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || formData.roles_ids.length === 0}
              className="flex items-center gap-2 px-8 py-2.5 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              {isSaving ? "กำลังบันทึก..." : "บันทึกและอัปเดตสิทธิ์"}
            </button>
          </>
        }
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">1. เลือกผู้ใช้ที่ต้องการ</label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none transition-all"
            >
              <option value="">-- ค้นหาและเลือกผู้ใช้ --</option>
              {users.map((u) => (
                <option key={u.userid} value={u.userid}>
                  {u.username} - {u.firstname} {u.lastname}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. กำหนดบทบาทที่ได้รับ</label>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">เลือกไว้ {formData.roles_ids.length} บทบาท</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((r) => {
                const isSelected = formData.roles_ids.includes(r.roles_id);
                return (
                  <button
                    key={r.roles_id}
                    onClick={() => handleRoleToggle(r.roles_id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500 shadow-sm shadow-amber-50"
                        : "border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-amber-600 text-white scale-110" : "bg-white border border-slate-200"}`}>
                      {isSelected && <CheckCircle2 size={14} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? "text-amber-900" : "text-slate-700"}`}>{r.roles_name}</p>
                      {r.description && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{r.description}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
