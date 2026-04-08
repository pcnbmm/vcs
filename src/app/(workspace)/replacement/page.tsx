"use client";

import React, { useState, useEffect } from "react";
import { showSuccess, showError, showWarning, showConfirm } from "@/lib/sweetalert";
import { Plus, X, Loader2, RotateCcw, CheckCircle, Clock, Eye, Edit2 } from "lucide-react";
import Select from "react-select";
import { usePermissions } from "@/hooks/usePermissions";

export default function ReplacementPage() {
    const { hasAccess } = usePermissions();
    const [replacements, setReplacements] = useState<any[]>([]);
    const [availableCars, setAvailableCars] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'view' | 'edit'>('add');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        car_id: "",
        replacement_car_number: "",
        remark: "",
        broken_car_id: "",
        start_date: "",
        end_date: "",
        cre_by: ""
    });

    useEffect(() => {
        fetchReplacements();
        fetchAvailableCars();
    }, []);

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

    const openModal = (mode: 'add' | 'view' | 'edit', record?: any) => {
        setModalMode(mode);
        if (mode === 'add') {
            setSelectedId(null);
            setFormData({ 
                car_id: "", replacement_car_number: "", remark: "",
                broken_car_id: "", start_date: "", end_date: "", cre_by: ""
            });
            fetchAvailableCars(); // Refresh available cars
        } else if (record) {
            setSelectedId(record.replacement_id);
            setFormData({
                car_id: record.car_id ? record.car_id.toString() : "",
                replacement_car_number: record.car_number || "",
                remark: record.remark || (mode === 'view' ? "ไม่มีหมายเหตุ" : ""),
                broken_car_id: record.broken_car_id || "",
                start_date: record.start_date ? new Date(record.start_date).toLocaleString('th-TH') : "-",
                end_date: record.end_date ? new Date(record.end_date).toLocaleString('th-TH') : "-",
                cre_by: record.cre_by || "system"
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.car_id && modalMode === 'add') return showWarning("กรุณาเลือกรถที่ต้องการทดแทน");
        if (!formData.replacement_car_number) return showWarning("กรุณาระบุทะเบียนรถคันใหม่ที่นำมาทดแทน");

        setIsSaving(true);
        try {
            const url = modalMode === 'add' ? "/api/replacements" : `/api/replacements/${selectedId}`;
            const method = modalMode === 'add' ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Saving failed");
            }
            
            showSuccess(modalMode === 'add' ? "บันทึกข้อมูลและอัปเดตทะเบียนรถเรียบร้อยแล้ว" : "อัปเดตข้อมูลรถทดแทนเรียบร้อยแล้ว");
            await fetchReplacements();
            closeModal();
        } catch (error: any) {
            console.error("Error saving replacement:", error);
            showError(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelReplacement = async (id: number) => {
        if (!(await showConfirm("ยืนยันการยกเลิกใช้รถทดแทน ระบบจะนำทะเบียนรถเดิมกลับมาใช้งาน ใช่หรือไม่?"))) return;
        
        try {
            const res = await fetch(`/api/replacements/${id}/cancel`, { method: "POST" });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Cancel failed");
            }
            
            showSuccess("ยกเลิกการใช้รถทดแทนและคืนค่าทะเบียนเดิมเรียบร้อยแล้ว");
            await fetchReplacements();
            fetchAvailableCars();
        } catch (error: any) {
            console.error("Error cancelling replacement:", error);
            showError(error.message || "เกิดข้อผิดพลาดในการยกเลิก");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-100">
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-800">ประวัติและการจัดการรถทดแทน</h2>
                    <p className="text-sm text-slate-500">บันทึกรถทดแทนเมื่อรถหลักเสีย และคืนค่าเมื่อซ่อมเสร็จ</p>
                </div>
                {hasAccess('create') && (
                    <button 
                        onClick={() => openModal('add')} 
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        เพิ่มรถทดแทน
                    </button>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ทะเบียนรถที่ถูกแทนที่ (เดิม)</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ทะเบียนรถทดแทน (ใหม่)</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่เริ่มทดแทน</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่สิ้นสุด (คืนรถ)</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                                        <p className="mt-4 text-sm font-medium text-gray-500">กำลังโหลดข้อมูล...</p>
                                    </td>
                                </tr>
                            ) : replacements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-sm font-medium text-gray-500">ไม่พบประวัติการใช้รถทดแทน</td>
                                </tr>
                            ) : (
                                replacements.map((r) => {
                                    const isActive = !r.end_datetime;
                                    return (
                                        <tr key={r.replacement_id} className={`hover:bg-slate-50 transition-colors ${isActive ? "bg-blue-50/20" : ""}`}>
                                            <td className="py-4 px-6">
                                                {isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        กำลังใช้งาน
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        คืนรถแล้ว
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-semibold text-slate-700">{r.broken_car_id || "-"}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">{r.car_number || "-"}</span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600">
                                                {r.start_date ? new Date(r.start_date).toLocaleDateString('th-TH') : "-"}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600">
                                                {r.end_date ? new Date(r.end_date).toLocaleDateString('th-TH') : "-"}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {hasAccess('view') && (
                                                        <button 
                                                            onClick={() => openModal('view', r)} 
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-md transition-colors border border-blue-200"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            รายละเอียด
                                                        </button>
                                                    )}
                                                    {isActive && hasAccess('update') && (
                                                        <button 
                                                            onClick={() => openModal('edit', r)} 
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 font-semibold text-xs rounded-md transition-colors border border-amber-200"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            แก้ไข
                                                        </button>
                                                    )}
                                                    {isActive ? (
                                                        hasAccess('update') && (
                                                            <button 
                                                                onClick={() => handleCancelReplacement(r.replacement_id)} 
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs rounded-md transition-colors border border-rose-200"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                                ยกเลิก/คืนรถ
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium">เสร็จสิ้น</span>
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
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                {modalMode === 'add' ? 'บันทึกรถทดแทน' : modalMode === 'edit' ? 'แก้ไขข้อมูลรถทดแทน' : 'รายละเอียดการใช้รถทดแทน'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-800">รถที่ถูกทดแทน (รถเดิม) <span className="text-rose-500">*</span></label>
                                {modalMode === 'add' ? (
                                    <Select 
                                        options={availableCars.map(c => ({
                                            value: c.car_id.toString(),
                                            label: `${c.car_number} (รถเช่า)`
                                        }))}
                                        placeholder="-- ค้นหาและเลือกรถที่ต้องการนำคันใหม่มาแทนที่ --"
                                        value={availableCars.find(c => c.car_id.toString() === formData.car_id) ? {
                                            value: formData.car_id,
                                            label: `${availableCars.find(c => c.car_id.toString() === formData.car_id)?.car_number} (รถเช่า)`
                                        } : null}
                                        onChange={(selected: any) => setFormData({...formData, car_id: selected ? selected.value : ""})}
                                        isClearable
                                        className="react-select-container text-sm font-medium"
                                        classNamePrefix="react-select"
                                        theme={(theme: any) => ({
                                            ...theme,
                                            borderRadius: 8,
                                            colors: {
                                                ...theme.colors,
                                                primary: '#3b82f6',
                                            },
                                        })}
                                        styles={{
                                            control: (base: any, state: any) => ({
                                                ...base,
                                                padding: '4px',
                                                borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
                                                backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
                                                boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                                                '&:hover': {
                                                    borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1'
                                                }
                                            })
                                        }}
                                    />
                                ) : (
                                    <input 
                                        type="text"
                                        disabled
                                        value={formData.broken_car_id}
                                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
                                    />
                                )}
                                {modalMode === 'add' && <p className="text-xs text-slate-500 mt-1">ระบบจะเปลี่ยนทะเบียนของรถคันนี้บนระบบเป็นคันใหม่ชั่วคราว</p>}
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-800">ทะเบียนรถทดแทน (รถใหม่) <span className="text-rose-500">*</span></label>
                                <input 
                                    type="text"
                                    required
                                    disabled={modalMode === 'view'}
                                    placeholder="เช่น 1กข 1234 กทม"
                                    value={formData.replacement_car_number}
                                    onChange={e => setFormData({...formData, replacement_car_number: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium disabled:bg-gray-100 disabled:font-bold disabled:text-blue-700"
                                />
                            </div>

                            {modalMode !== 'add' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-800">วันที่เริ่มทดแทน</label>
                                        <input type="text" disabled value={formData.start_date} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-800">วันที่สิ้นสุด (คืนรถ)</label>
                                        <input type="text" disabled value={formData.end_date} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-800">หมายเหตุ</label>
                                <textarea 
                                    placeholder="ระบุหมายเหตุ (ถ้ามี)"
                                    rows={3}
                                    disabled={modalMode === 'view'}
                                    value={formData.remark}
                                    onChange={e => setFormData({...formData, remark: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none disabled:bg-gray-100 disabled:text-gray-600"
                                />
                            </div>

                            {modalMode !== 'add' && (
                                <div className="pt-2 text-xs text-gray-400 font-medium">
                                    ผู้บันทึกรายการ: {formData.cre_by}
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">
                                    {modalMode === 'view' ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
                                </button>
                                {modalMode !== 'view' && (
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all disabled:opacity-50">
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                        {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
