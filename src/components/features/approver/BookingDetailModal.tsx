'use client';

import { useState } from 'react';
import { Booking } from '@/types';
import {
    X,
    User,
    MapPin,
    ArrowRight,
    Calendar,
    Users,
    ClipboardList,
    CheckCircle2,
    XCircle,
    Phone,
    Car,
    ShieldCheck
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────
function formatThaiDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatThaiDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }) + ' น.';
}

function StatusBadge({ status }: { status: Booking['status'] }) {
    const config = {
        PENDING: { label: 'รอพิจารณา', className: 'bg-amber-100 text-amber-700' },
        APPROVED: { label: 'อนุมัติแล้ว', className: 'bg-emerald-100 text-emerald-700' },
        REJECTED: { label: 'ปฏิเสธแล้ว', className: 'bg-rose-100 text-rose-700' },
        IN_USE: { label: 'กำลังใช้งาน', className: 'bg-blue-100 text-blue-700' },
        COMPLETED: { label: 'เสร็จสิ้น', className: 'bg-slate-100 text-slate-600' },
    };
    const { label, className } = config[status] || config.PENDING;
    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${className}`}>
            {label}
        </span>
    );
}

function Section({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) {
    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-2">
                {Icon && <Icon size={14} className="text-slate-400" />}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{title}</p>
            </div>
            {children}
        </div>
    );
}

// ── Props ───────────────────────────────────────────────────
interface BookingDetailModalProps {
    booking: Booking;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string, reason: string) => void;
}

// ── Modal ───────────────────────────────────────────────────
export default function BookingDetailModal({
    booking,
    onClose,
    onApprove,
    onReject,
}: BookingDetailModalProps) {
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 z-10"
                >
                    <X size={20} />
                </button>

                {/* Content Container */}
                <div className="p-10">
                    {/* Header */}
                    <div className="mb-8">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{booking.id}</span>
                        <h2 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">รายละเอียดคำขอจองรถ</h2>
                        <div className="flex items-center gap-4 mt-4">
                            <StatusBadge status={booking.status} />
                            <span className="text-sm text-slate-400 font-medium">
                                ยื่นคำขอเมื่อ {formatThaiDate(booking.requestDate)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* ผู้ขอ & สังกัด */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Section title="ผู้ขอใช้รถ" icon={User}>
                                <div>
                                    <p className="text-lg font-bold text-slate-900">{booking.requesterName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Phone size={12} className="text-blue-500" />
                                        <p className="text-sm font-semibold text-blue-600">{booking.phone || '-'}</p>
                                    </div>
                                </div>
                            </Section>
                            <Section title="สังกัด / แผนก" icon={ShieldCheck}>
                                <p className="text-lg font-bold text-slate-900">{booking.department}</p>
                            </Section>
                        </div>

                        {/* เส้นทาง */}
                        <Section title="เส้นทางที่ต้องการเดินทาง" icon={MapPin}>
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="bg-white px-3 py-1.5 rounded-xl text-sm font-bold text-slate-600 shadow-sm border border-slate-100">{booking.origin}</span>
                                <ArrowRight size={16} className="text-slate-300 shrink-0" />
                                <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100">{booking.destination}</span>
                            </div>
                        </Section>

                        {/* วันเวลา & ประเภทรถ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Section title="วันเวลาเดินทาง" icon={Calendar}>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-slate-700">ไป: <span className="text-slate-900">{formatThaiDateTime(booking.startDateTime)}</span></p>
                                    <p className="text-sm font-bold text-slate-700">กลับ: <span className="text-slate-900">{formatThaiDateTime(booking.endDateTime)}</span></p>
                                </div>
                            </Section>
                            <Section title="รถและผู้โดยสาร" icon={Car}>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">{booking.carType}</p>
                                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tight">
                                        <span className="text-slate-400">ผู้โดยสาร {booking.passengerCount} คน</span>
                                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{booking.selfDrive}</span>
                                    </div>
                                </div>
                            </Section>
                        </div>

                        {/* วัตถุประสงค์ */}
                        <Section title="วัตถุประสงค์ / หมายเหตุ" icon={ClipboardList}>
                            <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{booking.objective}</p>
                            </div>
                        </Section>

                        {/* Reject Reason (แสดงเฉพาะ REJECTED) */}
                        {booking.status === 'REJECTED' && booking.rejectReason && (
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                                <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2">เหตุผลที่ปฏิเสธ</p>
                                <p className="text-sm font-bold text-rose-700">{booking.rejectReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {booking.status === 'PENDING' && (
                        <div className="mt-10 pt-8 border-t border-slate-100">
                            {isRejecting ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="ระบุเหตุผลที่ปฏิเสธคำขอนี้..."
                                        rows={3}
                                        className="w-full text-sm font-medium p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-rose-50 text-slate-700 placeholder:text-slate-400 resize-none transition-all"
                                    />
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => { setIsRejecting(false); setRejectReason(''); }}
                                            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-sm font-bold"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            onClick={() => onReject(booking.id, rejectReason)}
                                            disabled={!rejectReason.trim()}
                                            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-rose-100 transition-all text-sm font-bold"
                                        >
                                            <XCircle size={18} />
                                            ยืนยันปฏิเสธ
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-end gap-4">
                                    <button
                                        onClick={() => setIsRejecting(true)}
                                        className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all text-sm font-black uppercase tracking-tight"
                                    >
                                        <XCircle size={18} />
                                        ปฏิเสธ
                                    </button>
                                    <button
                                        onClick={() => onApprove(booking.id)}
                                        className="flex items-center gap-2 px-10 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-100 transition-all text-sm font-black uppercase tracking-tight"
                                    >
                                        <CheckCircle2 size={18} />
                                        อนุมัติคำขอ
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
