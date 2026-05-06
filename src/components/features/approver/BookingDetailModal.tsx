"use client";

import { useState } from "react";
import { Booking } from "@/types";
import { isBookingExpired } from "@/lib/bookingUtils";
import {
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
  ShieldCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Modal from "@/components/ui/Modal";

// ── Helpers ──────────────────────────────────────────────────
function formatThaiDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatThaiDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " น."
  );
}

function StatusBadge({
  status,
  isExpired,
}: {
  status: Booking["status"];
  isExpired?: boolean;
}) {
  const config = {
    PENDING: { label: "รอพิจารณา", className: "bg-amber-100 text-amber-700 border-amber-200" },
    APPROVED: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    REJECTED: { label: "ปฏิเสธแล้ว", className: "bg-rose-100 text-rose-700 border-rose-200" },
    IN_USE: { label: "กำลังใช้งาน", className: "bg-blue-100 text-blue-700 border-blue-200" },
    COMPLETED: { label: "เสร็จสิ้น", className: "bg-slate-100 text-slate-600 border-slate-200" },
    CANCELLED: { label: "ยกเลิก", className: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  if (isExpired) {
    return (
      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
        เกินกำหนด
      </span>
    );
  }
  const { label, className } = config[status] || config.PENDING;
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${className}`}>
      {label}
    </span>
  );
}

function Section({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: any;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-400" />}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {title}
        </p>
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
  const [rejectReason, setRejectReason] = useState("");
  const isExpired = isBookingExpired(booking.startDateTime, booking.status);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="รายละเอียดคำขอจองยานพาหนะ"
      maxWidth="2xl"
      accentColor="bg-blue-600"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          
          {booking.status === "PENDING" && !isExpired && (
            <>
              {isRejecting ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                  <button
                    onClick={() => { setIsRejecting(false); setRejectReason(""); }}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => onReject(booking.id, rejectReason)}
                    disabled={!rejectReason.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white shadow-md shadow-rose-100 transition-all text-xs font-bold"
                  >
                    <XCircle size={14} />
                    ยืนยันปฏิเสธ
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all text-xs font-bold"
                  >
                    <XCircle size={16} />
                    ปฏิเสธ
                  </button>
                  <button
                    onClick={() => onApprove(booking.id)}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 transition-all text-xs font-bold"
                  >
                    <CheckCircle2 size={16} />
                    อนุมัติคำขอ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* Header Extra Info */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              REQ-{String(booking.id).padStart(3, "0")}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={booking.status} isExpired={isExpired} />
              <span className="text-xs text-slate-400 font-medium">
                ยื่นคำขอเมื่อ {formatThaiDate(booking.requestDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* ผู้ขอ & สังกัด */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section title="ผู้ขอใช้รถ" icon={User}>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {booking.requesterName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Phone size={12} className="text-blue-500" />
                  <p className="text-sm font-semibold text-blue-600">
                    {booking.phone || "-"}
                  </p>
                </div>
              </div>
            </Section>
            <Section title="สังกัด / แผนก" icon={ShieldCheck}>
              <p className="text-lg font-bold text-slate-900">
                {booking.department}
              </p>
            </Section>
          </div>

          {/* เส้นทาง */}
          <Section title="เส้นทางที่ต้องการเดินทาง" icon={MapPin}>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-600 shadow-sm border border-slate-200 truncate">
                {booking.origin}
              </span>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
              <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 truncate">
                {booking.destination}
              </span>
            </div>
          </Section>

          {/* วันเวลา & ประเภทรถ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section title="กำหนดเวลาเดินทาง" icon={Calendar}>
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700">
                  ไป: <span className="text-slate-900 ml-2">{formatThaiDateTime(booking.startDateTime)}</span>
                </p>
                <p className="text-sm font-bold text-slate-700">
                  กลับ: <span className="text-slate-900 ml-2">{formatThaiDateTime(booking.endDateTime)}</span>
                </p>
              </div>
            </Section>
            <Section title="รถและผู้โดยสาร" icon={Car}>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  {booking.carType}
                </p>
                <p className="text-xs font-bold text-slate-400">
                  ผู้โดยสาร {booking.passengerCount} คน • <span className="text-blue-600 italic">{booking.selfDrive}</span>
                </p>
              </div>
            </Section>
          </div>

          {/* วัตถุประสงค์ */}
          <Section title="วัตถุประสงค์ / หมายเหตุ" icon={ClipboardList}>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                {booking.objective}
              </p>
            </div>
          </Section>

          {/* Reject Reason input if rejecting */}
          {isRejecting && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <Section title="ระบุเหตุผลที่ปฏิเสธ" icon={XCircle}>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เช่น ข้อมูลไม่ครบถ้วน หรือไม่มีรถว่าง..."
                  rows={3}
                  className="w-full p-4 bg-white border border-rose-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-rose-50 outline-none transition-all resize-none"
                />
              </Section>
            </div>
          )}

          {/* Reject Reason display (แสดงเฉพาะ REJECTED) */}
          {booking.status === "REJECTED" && booking.rejectReason && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">
                เหตุผลที่ปฏิเสธ
              </p>
              <p className="text-sm font-bold text-rose-700 leading-relaxed">
                {booking.rejectReason}
              </p>
            </div>
          )}

          {isExpired && booking.status === "PENDING" && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-center gap-3">
              <Calendar className="text-orange-500" size={20} />
              <p className="text-sm font-bold text-orange-700">
                เกินกำหนดเวลาการใช้งานแล้ว ระบบล็อกการอนุมัติ
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
