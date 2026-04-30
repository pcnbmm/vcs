"use client";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";
import { isBookingExpired } from "@/lib/bookingUtils";
import { useEffect, useState } from "react";
import { getMyBookings } from "@/app/actions/bookingActions";
import { updateRequestStatus } from "@/app/actions/requestActions";
import { Booking } from "@/types";
import BookingDetailModal from "@/components/features/approver/BookingDetailModal";
import {
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  ArrowRight,
  Loader2,
} from "lucide-react";

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
    PENDING: { label: "รอพิจารณา", className: "bg-amber-100 text-amber-700" },
    APPROVED: {
      label: "อนุมัติแล้ว",
      className: "bg-emerald-100 text-emerald-700",
    },
    REJECTED: { label: "ปฏิเสธแล้ว", className: "bg-rose-100 text-rose-700" },
    IN_USE: { label: "กำลังใช้งาน", className: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "เสร็จสิ้น", className: "bg-slate-100 text-slate-600" },
    CANCELLED: {
      label: "ยกเลิกแล้ว",
      className: "bg-slate-200 text-slate-500 line-through",
    },
  };

  if (isExpired) {
    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
        เกินกำหนด
      </span>
    );
  }

  const { label, className } = config[status] || config.PENDING;
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}
    >
      {label}
    </span>
  );
}

function BookingRow({
  booking,
  onClick,
}: {
  booking: Booking;
  onClick: () => void;
}) {
  const isExpired = isBookingExpired(
    booking.startDateTime ?? "",
    booking.status,
  );
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors group"
    >
      {/* Col 1: เลขที่คำขอ + วันที่ขอ */}
      <div className="w-40 shrink-0">
        <p className="text-sm font-semibold text-slate-800">{booking.id}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatThaiDate(booking.requestDate)}
        </p>
      </div>

      {/* Col 2: ต้นทาง → ปลายทาง */}
      <div className="w-80 shrink-0 flex items-center gap-2">
        <MapPin size={14} className="text-slate-400 shrink-0" />
        <span className="text-sm text-slate-600 truncate">
          {booking.origin}
        </span>
        <ArrowRight size={14} className="text-slate-400 shrink-0" />
        <span className="text-sm font-medium text-slate-800 truncate">
          {booking.destination}
        </span>
      </div>

      {/* Col 3: วันเวลาเดินทาง */}
      <div className="w-40 shrink-0">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-600">
            {formatThaiDateTime(booking.startDateTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Calendar size={14} className="text-transparent shrink-0" />{" "}
          {/* spacer */}
          <span className="text-xs text-slate-600">
            ถึง {formatThaiDateTime(booking.endDateTime)}
          </span>
        </div>
      </div>

      {/* Col 4: ชื่อผู้ขอ + แผนก */}
      <div className="w-40 shrink-0">
        <p className="text-sm font-medium text-slate-700">
          {booking.requesterName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{booking.department}</p>
      </div>

      {/* Col 5: จำนวนผู้โดยสาร */}
      <div className="w-20 shrink-0 flex items-center gap-2">
        <Users size={14} className="text-slate-400" />
        <span className="text-sm text-slate-600">
          {booking.passengerCount} คน
        </span>
      </div>

      {/* Col 6: Status */}
      <div className="w-30 shrink-0 flex justify-center">
        <StatusBadge status={booking.status} isExpired={isExpired} />
      </div>

      {/* Col 7: Arrow */}
      <ChevronRight
        size={15}
        className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0"
      />
    </div>
  );
}

export default function ApproverRequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    const result = await getMyBookings();
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
            b.vc_start_place?.start_place_name || String(b.start_place || "-"),
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
        };
      });
      setBookings(mapped);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const pendingBookings = bookings.filter(
    (b) =>
      b.status === "PENDING" &&
      !isBookingExpired(b.startDateTime ?? "", b.status),
  );
  const pendingCount = pendingBookings.length;

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

      <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
        {/* ... Column Header เหมือนเดิม */}
        <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="w-40 shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            เลขที่คำขอ
          </div>
          <div className="w-80 shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wide ">
            เส้นทาง
          </div>
          <div className="w-40 shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            วันเวลาเดินทาง
          </div>
          <div className="w-40 shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            ผู้ขอ
          </div>
          <div className="w-20 shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            ผู้โดยสาร
          </div>
          <div className="w-30 shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
            สถานะ
          </div>
          <div className="w-5 shrink-0" />
        </div>

        {pendingBookings.length > 0 ? (
          pendingBookings.map((booking: Booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              onClick={() => setSelectedBooking(booking)}
            />
          ))
        ) : (
          <div className="py-16 text-center text-slate-400 text-sm">
            ไม่มีรายการที่รอการพิจารณาในขณะนี้
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
