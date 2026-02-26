'use client';

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
} from 'lucide-react';

// ── Helper ──────────────────────────────────────────────────
function formatThaiDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatThaiDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function StatusBadge({ status }: { status: Booking['status'] }) {
    const config = {
        PENDING:   { label: 'รอพิจารณา',   className: 'bg-amber-100 text-amber-700' },
        APPROVED:  { label: 'อนุมัติแล้ว',  className: 'bg-emerald-100 text-emerald-700' },
        REJECTED:  { label: 'ปฏิเสธแล้ว',  className: 'bg-rose-100 text-rose-700' },
        IN_USE:    { label: 'กำลังใช้งาน', className: 'bg-blue-100 text-blue-700' },
        COMPLETED: { label: 'เสร็จสิ้น',    className: 'bg-slate-100 text-slate-600' },
    };
    const { label, className } = config[status];
    return (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
            {label}
        </span>
    );
}

// ── Section Component ───────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
            {children}
        </div>
    );
}

// ── Props ───────────────────────────────────────────────────
interface BookingDetailModalProps {
    booking: Booking;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

// ── Modal ───────────────────────────────────────────────────
export default function BookingDetailModal({
    booking,
    onClose,
    onApprove,
    onReject,
}: BookingDetailModalProps) {
    return (
        // Backdrop
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Modal Box */}
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                    <div className="space-y-1.5">
                        <p className="text-lg font-bold text-slate-800">{booking.id}</p>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={booking.status} />
                            <span className="text-xs text-slate-400">
                                ขอเมื่อ {formatThaiDate(booking.requestDate)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Section 1: ผู้ขอ */}
                    <Section title="ผู้ขอใช้รถ">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <User size={16} className="text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{booking.requesterName}</p>
                                <p className="text-xs text-slate-400">{booking.department}</p>
                            </div>
                        </div>
                    </Section>

                    {/* Section 2: เส้นทาง */}
                    <Section title="เส้นทาง">
                        <div className="flex items-center gap-2">
                            <MapPin size={15} className="text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-600">{booking.origin}</span>
                            <ArrowRight size={15} className="text-slate-400 shrink-0" />
                            <span className="text-sm font-semibold text-slate-800">{booking.destination}</span>
                        </div>
                    </Section>

                    {/* Section 3: วันเวลาเดินทาง */}
                    <Section title="วันเวลาเดินทาง">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <Calendar size={15} className="text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-600">
                                    ออกเดินทาง {formatThaiDateTime(booking.startDateTime)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={15} className="text-transparent shrink-0" />
                                <span className="text-sm text-slate-600">
                                    กลับถึง {formatThaiDateTime(booking.endDateTime)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Users size={15} className="text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-600">ผู้โดยสาร {booking.passengerCount} คน</span>
                        </div>
                    </Section>

                    {/* Section 4: วัตถุประสงค์ */}
                    <Section title="วัตถุประสงค์">
                        <div className="flex items-start gap-2">
                            <ClipboardList size={15} className="text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">{booking.objective}</p>
                        </div>
                    </Section>

                    {/* Reject Reason (แสดงเฉพาะ REJECTED) */}
                    {booking.status === 'REJECTED' && booking.rejectReason && (
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                            <p className="text-xs font-semibold text-rose-600 mb-1">เหตุผลที่ปฏิเสธ</p>
                            <p className="text-sm text-rose-700">{booking.rejectReason}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {booking.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                        <button
                            onClick={() => onReject(booking.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-sm font-medium"
                        >
                            <XCircle size={16} />
                            ปฏิเสธ
                        </button>
                        <button
                            onClick={() => onApprove(booking.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors text-sm font-medium"
                        >
                            <CheckCircle2 size={16} />
                            อนุมัติ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}