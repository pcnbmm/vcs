"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";
import { isBookingExpired } from "@/lib/bookingUtils";
import { useEffect, useState } from "react";
import { getBookingsForManagement } from "@/app/actions/bookingActions";
import { updateRequestStatus } from "@/app/actions/requestActions";
import { Booking } from "@/types";

import {
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  ArrowRight,
  Loader2,
  User,
  Phone,
  Car,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";

// Help mapping status_use_id to Booking status strings
const mapStatus = (id: number | null): Booking["status"] => {
  switch (id) {
    case 2:
      return "APPROVED";
    case 3:
      return "REJECTED";
    case 4:
      return "IN_USE";
    case 5:
      return "COMPLETED";
    case 6:
      return "CANCELLED";
    case 7:
      return "DISPATCHED_PENDING";
    default:
      return "PENDING";
  }
};

function formatThaiDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatThaiDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({
  status,
  isExpired,
}: {
  status: Booking["status"];
  isExpired?: boolean;
}) {
  const config: Record<
    Booking["status"],
    { label: string; className: string }
  > = {
    PENDING: { label: "รอพิจารณา", className: "bg-amber-100 text-amber-700 border-amber-200" },
    APPROVED: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    REJECTED: { label: "ปฏิเสธแล้ว", className: "bg-rose-100 text-rose-700 border-rose-200" },
    IN_USE: { label: "กำลังใช้งาน", className: "bg-blue-100 text-blue-700 border-blue-200" },
    COMPLETED: { label: "เสร็จสิ้น", className: "bg-slate-100 text-slate-600 border-slate-200" },
    CANCELLED: { label: "ยกเลิกแล้ว", className: "bg-gray-100 text-gray-600 border-gray-200" },
    DISPATCHED_PENDING: { label: "จัดรถแล้ว (รออนุมัติ)", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  };

  if (isExpired) {
    return (
      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 shadow-sm">
        เกินกำหนด
      </span>
    );
  }

  const { label, className } = config[status] || config.PENDING;
  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm whitespace-nowrap ${className}`}
    >
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
        <p className="text-sm font-semibold text-gray-800">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}



export default function ApproverRequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBookings = async () => {
    setIsLoading(true);
    const result = await getBookingsForManagement();
    if (result.success && result.data) {
      const mapped: Booking[] = result.data.map((b: any) => {
        // Combine Date and Time correctly
        const journeyDateStr = b.journey_date
          ? b.journey_date.toISOString().split("T")[0]
          : "";
        const journeyTimeStr = b.journey_time || "00:00";
        const startDT = journeyDateStr
          ? `${journeyDateStr}T${journeyTimeStr}:00`
          : "";

        const returnDateStr = b.return_date
          ? b.return_date.toISOString().split("T")[0]
          : "";
        const returnTimeStr = b.return_time || "00:00";
        const endDT = returnDateStr
          ? `${returnDateStr}T${returnTimeStr}:00`
          : "";

        return {
          id: String(b.request_id),
          requesterName: b.vc_user
            ? `${b.vc_user.firstname} ${b.vc_user.lastname}`
            : "ไม่ระบุชื่อ",
          department: b.vc_org?.orgname || b.use_div_code || "-",
          objective: b.journey_causes || "-",
          origin:
            b.vc_start_place?.start_place_name || b.journey_origin_text || String(b.start_place || "-"),
          destination: b.journey_place || "-",
          requestDate: b.cre_date
            ? b.cre_date.toISOString()
            : new Date().toISOString(),
          startDateTime: startDT,
          endDateTime: endDT,
          passengerCount: b.passenger_amount || 0,
          status: mapStatus(b.status_use_id),
          // Adding extra metadata for the modal to be richer
          phone: b.user_mobile || "-",
          carType: b.vc_car_spec?.car_spec_name || "-",
          selfDrive: b.self_drive ? "ขับเอง" : "พนักงานขับ",
          rejectReason: b.reject_reason || null,
          isRegional: (b as any).isRegional ?? false,
        };
      });
      setBookings(mapped);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const pendingBookings = bookings.filter((b) => {
    const isExpired = isBookingExpired(b.startDateTime ?? "", b.status, b.isRegional);
    // รายการ "รอพิจารณา" สำหรับ Approver:
    // 1. PENDING / DISPATCHED_PENDING ที่ยังไม่ expire
    // 2. คำขอภูมิภาคที่จัดรถแล้ว (DISPATCHED_PENDING/IN_USE/COMPLETED) ยังไม่มี approver (อนุมัติย้อนหลัง)
    if (b.status === "PENDING" && !isExpired) return true;
    if (b.status === "DISPATCHED_PENDING") return true; // status 7 ไม่ expire สำหรับ regional อยู่แล้ว
    if (b.isRegional && (b.status === "IN_USE" || b.status === "COMPLETED")) return true;
    return false;
  });
  const pendingCount = pendingBookings.length;

  const totalPages = Math.ceil(pendingBookings.length / itemsPerPage);
  const currentBookings = pendingBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleApprove = async (id: string) => {
    const isConfirmed = await showConfirm(
      "ยืนยันการอนุมัติ",
      "คุณต้องการอนุมัติคำขอใช้รถนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    const res = await updateRequestStatus(Number(id), 2);
    if (res.success) {
      showSuccess("อนุมัติคำขอสำเร็จ");
      setSelectedBooking(null);
      fetchBookings(); // Refresh list
    } else {
      showError(res.error ?? "เกิดข้อผิดพลาด");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    const isConfirmed = await showConfirm(
      "ยืนยันการปฏิเสธ",
      "คุณต้องการปฏิเสธคำขอนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    // We don't save reason in DB yet based on user request "no approve_id",
    // but we update status to 3.
    const res = await updateRequestStatus(Number(id), 3, reason);
    if (res.success) {
      showSuccess("ปฏิเสธคำขอสำเร็จ");
      setSelectedBooking(null);
      fetchBookings(); // Refresh list
    } else {
      showError(res.error ?? "เกิดข้อผิดพลาด");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const columns: DataTableColumn<Booking>[] = [
    {
      header: "คำขอ",
      cell: (booking) => (
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-100 w-14 h-14 rounded-lg flex flex-col items-center justify-center text-blue-600 font-bold shrink-0">
            <span className="text-[10px] text-slate-400">REQ</span>
            <span className="text-sm">{String(booking.id).padStart(3, "0")}</span>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[11px] text-slate-400 font-medium">
              {formatThaiDate(booking.requestDate)}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "เส้นทาง",
      cell: (booking) => (
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-600 truncate">{booking.origin}</span>
          <ArrowRight size={14} className="text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-slate-800 truncate">{booking.destination}</span>
        </div>
      ),
    },
    {
      header: "วันเวลาเดินทาง",
      cell: (booking) => (
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600">
              {formatThaiDateTime(booking.startDateTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Calendar size={14} className="text-transparent shrink-0" />
            <span className="text-xs text-slate-600">
              ถึง {formatThaiDateTime(booking.endDateTime)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "ผู้ขอ",
      cell: (booking) => (
        <div>
          <p className="text-sm font-medium text-slate-700">{booking.requesterName}</p>
          <p className="text-xs text-slate-400 mt-0.5">{booking.department}</p>
          <div className="mt-1">
            {booking.isRegional ? (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600 border border-violet-100 whitespace-nowrap">
                🏢 ส่วนภูมิภาค
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 border border-sky-100 whitespace-nowrap">
                🏛 ส่วนกลาง
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "ผู้โดยสาร",
      cell: (booking) => (
        <div className="flex items-center gap-2">
          <Users size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600">{booking.passengerCount} คน</span>
        </div>
      ),
    },
    {
      header: "สถานะ",
      className: "text-center justify-center",
      cell: (booking) => {
        const isExpired = isBookingExpired(booking.startDateTime ?? "", booking.status, booking.isRegional);
        return <StatusBadge status={booking.status} isExpired={isExpired} />;
      },
    },
    {
      header: "",
      className: "text-right",
      cell: () => (
        <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors inline-block" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mt-1">
            รอพิจารณา{" "}
            <span className="font-semibold text-amber-600">
              {pendingCount} รายการ
            </span>
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={currentBookings}
        onRowClick={(booking) => setSelectedBooking(booking)}
        rowKey={(row) => row.id}
        emptyMessage="ไม่มีรายการที่รอการพิจารณาในขณะนี้"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal รายละเอียดคำขอ */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => {
          setSelectedBooking(null);
          setIsRejecting(false);
          setRejectReason("");
        }}
        title="รายละเอียดคำขอจองยานพาหนะ"
        maxWidth="2xl"
        accentColor="bg-blue-600"
        footer={
          selectedBooking && (
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setIsRejecting(false);
                  setRejectReason("");
                }}
                className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
              
              {/* ปุ่มอนุมัติ/ปฏิเสธ: แสดงสำหรับ PENDING, DISPATCHED_PENDING และ regional IN_USE/COMPLETED */}
              {(selectedBooking.status === "PENDING" || selectedBooking.status === "DISPATCHED_PENDING" || 
                (selectedBooking.isRegional && (selectedBooking.status === "IN_USE" || selectedBooking.status === "COMPLETED"))) &&
               !isBookingExpired(selectedBooking.startDateTime, selectedBooking.status, selectedBooking.isRegional) && (
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
                        onClick={() => handleReject(selectedBooking.id, rejectReason)}
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
                        onClick={() => handleApprove(selectedBooking.id)}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 transition-all text-xs font-bold"
                      >
                        <CheckCircle2 size={16} />
                        {(selectedBooking.status === "IN_USE" || selectedBooking.status === "COMPLETED")
                          ? "อนุมัติย้อนหลัง"
                          : "อนุมัติคำขอ"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        }
      >
        {selectedBooking && (
          <div className="space-y-8">
            {/* Header Extra Info */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">
                  REQ-{String(selectedBooking.id).padStart(3, "0")}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <StatusBadge 
                    status={selectedBooking.status} 
                    isExpired={isBookingExpired(selectedBooking.startDateTime, selectedBooking.status)} 
                  />
                  <span className="text-xs text-slate-600 font-semibold">
                    ยื่นคำขอเมื่อ {formatThaiDate(selectedBooking.requestDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* ผู้ขอ & สังกัด */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Section title="ผู้ขอใช้รถ" icon={User}>
                  <div>
                    <p className="text-lg font-bold text-blue-600">
                      {selectedBooking.requesterName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Phone size={12} className="text-blue-500" />
                      <p className="text-sm font-semibold text-blue-600">
                        {selectedBooking.phone || "-"}
                      </p>
                    </div>
                  </div>
                </Section>
                <Section title="สังกัด / แผนก" icon={ShieldCheck}>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedBooking.department}
                  </p>
                </Section>
              </div>

              {/* เส้นทาง */}
              <Section title="เส้นทางที่ต้องการเดินทาง" icon={MapPin}>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-600 shadow-sm border border-slate-200 truncate">
                    {selectedBooking.origin}
                  </span>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 truncate">
                    {selectedBooking.destination}
                  </span>
                </div>
              </Section>

              {/* วันเวลา & ประเภทรถ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Section title="กำหนดเวลาเดินทาง" icon={Calendar}>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-700">
                      ไป: <span className="text-blue-600 ml-2">{formatThaiDateTime(selectedBooking.startDateTime)}</span>
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      กลับ: <span className="text-blue-600 ml-2">{formatThaiDateTime(selectedBooking.endDateTime)}</span>
                    </p>
                  </div>
                </Section>
                <Section title="รถและผู้โดยสาร" icon={Car}>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-600">
                      {selectedBooking.carType}
                    </p>
                    <p className="text-xs font-bold text-blue-600">
                      ผู้โดยสาร {selectedBooking.passengerCount} คน • <span className="text-blue-600 italic">{selectedBooking.selfDrive}</span>
                    </p>
                  </div>
                </Section>
              </div>

              {/* วัตถุประสงค์ */}
              <Section title="วัตถุประสงค์ / หมายเหตุ" icon={ClipboardList}>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedBooking.objective}
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
              {selectedBooking.status === "REJECTED" && selectedBooking.rejectReason && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                  <p className="text-sm font-bold text-rose-600 mb-2">
                    เหตุผลที่ปฏิเสธ
                  </p>
                  <p className="text-sm font-bold text-rose-700 leading-relaxed">
                    {selectedBooking.rejectReason}
                  </p>
                </div>
              )}

              {isBookingExpired(selectedBooking.startDateTime, selectedBooking.status, selectedBooking.isRegional) && selectedBooking.status === "PENDING" && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-center gap-3">
                  <Calendar className="text-orange-500" size={20} />
                  <p className="text-sm font-bold text-orange-700">
                    เกินกำหนดเวลาการใช้งานแล้ว ระบบล็อกการอนุมัติ
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
