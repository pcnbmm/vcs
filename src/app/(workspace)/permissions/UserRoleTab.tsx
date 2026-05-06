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
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";

export default function UserRoleTab() {
  const [groupedUserRoles, setGroupedUserRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
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
        return {
          ...prev,
          roles_ids: prev.roles_ids.filter((id) => id !== roleId),
        };
      } else {
        return { ...prev, roles_ids: [...prev.roles_ids, roleId] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id) return showWarning("กรุณาเลือกผู้ใช้");

    setIsSaving(true);
    try {
      const res = await fetch("/api/permissions/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Saving failed");

      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving user roles:", error);
      showError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (
      !(await showConfirm("ยืนยันการลบสิทธิ์ทั้งหมดของผู้ใช้นี้ ใช่หรือไม่?"))
    )
      return;
    try {
      const res = await fetch(`/api/permissions/user-roles/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Deletion failed");
      await fetchData();
    } catch (error) {
      console.error("Error deleting user roles:", error);
      showError("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  // ตรวจสอบว่า User ที่เลือกอยู่ในตารางที่มีการมอบหมายบทบาทไปแล้วหรือไม่
  const isEditMode = groupedUserRoles.some(ur => String(ur.user_id) === formData.user_id);
  // ตรวจสอบว่าเป็นการกด Edit มาจากรายการเดิม (มีข้อมูลบทบาทติดมา)
  const isActualEditing = formData.roles_ids.length > 0 && isEditMode;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-สกุล หรือบทบาท..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all"
        >
          <Plus className="w-5 h-5" />
          มอบหมายบทบาทให้ผู้ใช้
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          columns={[
            {
              header: "ชื่อผู้ใช้ (Username)",
              cell: (ur) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-inner shrink-0">
                    <Users className="w-5 h-5 opacity-50" />
                  </div>
                  <span className="block text-sm font-bold text-gray-900">
                    {ur.username || "-"}
                  </span>
                </div>
              ),
            },
            {
              header: "ชื่อ-สกุล (พนักงาน)",
              cell: (ur) => (
                <span className="block text-sm font-medium text-gray-800">
                  {ur.fullname || "-"}
                </span>
              ),
            },
            {
              header: "บทบาททั้งหมด (Roles)",
              className: "max-w-[300px]",
              cell: (ur) => (
                <div className="flex flex-wrap gap-2">
                  {ur.roles.map((r: any, i: number) => (
                    <span
                      key={`${r.roles_id}-${i}`}
                      className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-sm"
                    >
                      <ShieldCheck className="w-3 h-3" />
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
                <div className="flex justify-end gap-2">
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${currentPage === page
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ur.user_id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
                  เพิ่ม/แก้ไขสิทธิ์บทบาทให้ผู้ใช้
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1 ml-4 text-left">
                  เลือกผู้ใช้ 1 ราย และเลือกบทบาทที่ต้องการ (เลือกได้หลายบทบาท)
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30 p-8 flex flex-col gap-6"
            >
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-2">
                <label className="text-sm font-semibold text-gray-800">
                  1. ผู้ใช้ (User) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) =>
                    setFormData({ ...formData, user_id: e.target.value })
                  }
                  disabled={isActualEditing}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none font-medium text-gray-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">-- ค้นหาและเลือกผู้ใช้ --</option>
                  {users.map((u) => {
                    // ตรวจสอบว่าผู้ใช้นี้มีอยู่ในตารางที่ถูกกำหนดสิทธิ์ไปแล้วหรือไม่
                    const isAssigned = groupedUserRoles.some(
                      (ur) => String(ur.user_id) === String(u.userid)
                    );

                    // จะเลือกได้ก็ต่อเมื่อ "ยังไม่ถูกกำหนดสิทธิ์" หรือ "เป็นการกด Edit แล้วผู้ใช้คนนั้นคือคนที่กำลังถูก Edit อยู่"
                    const isDisabled = isAssigned && !(isActualEditing && formData.user_id === String(u.userid));

                    return (
                      <option key={u.userid} value={u.userid} disabled={isDisabled}>
                        {u.username} - {u.firstname} {u.lastname}{" "}
                        {u.positionname ? `(${u.positionname})` : ""}
                        {isDisabled ? " (กำหนดสิทธิ์แล้ว)" : ""}
                      </option>
                    );
                  })}
                </select>

                {!isActualEditing && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100">
                    ⚠️ ผู้ใช้ที่กำหนดสิทธิ์ไว้แล้วจะไม่แสดงในรายการ — หากต้องการแก้ไขให้กดปุ่ม ✏️ ที่รายการนั้นแทน
                  </p>
                )}
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-800">
                    2. กำหนดบทบาทที่ได้รับ (Multiple Roles){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                    เลือกไว้ {formData.roles_ids.length} รายการ
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roles.map((r) => {
                    const isSelected = formData.roles_ids.includes(r.roles_id);
                    return (
                      <div
                        key={r.roles_id}
                        onClick={() => handleRoleToggle(r.roles_id)}
                        className={`flex items-start gap-3 p-4 rounded-md border transition-all cursor-pointer select-none group ${isSelected
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50/50"
                          }`}
                      >
                        <div
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected
                            ? "bg-amber-500 text-white"
                            : "border border-gray-300 group-hover:border-amber-400"
                            }`}
                        >
                          {isSelected && (
                            <svg
                              viewBox="0 0 14 14"
                              fill="none"
                              className="w-3.5 h-3.5"
                            >
                              <path
                                d="M3 7.5L5.5 10L11 4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-bold ${isSelected ? "text-amber-900" : "text-gray-700"}`}
                          >
                            {r.roles_name}
                          </span>
                          {r.description && (
                            <span className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                              {r.description}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {roles.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    ไม่มีข้อมูลบทบาทให้เลือก กรุณาไปเพิ่มในแท็บบทบาทก่อน
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 rounded-md font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving || formData.roles_ids.length === 0}
                  className="flex items-center gap-2 px-8 py-3 bg-amber-600 text-white rounded-md font-bold text-sm hover:bg-amber-700 shadow-md shadow-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูลและอัปเดตสิทธิ์"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
