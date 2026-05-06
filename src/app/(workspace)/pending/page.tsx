"use client";
import { isBookingExpired } from "@/lib/bookingUtils";
import { showError, showConfirm } from "@/lib/sweetalert";
import { cancelRequest } from "@/app/actions/requestActions";
import { useState, useEffect } from "react";
import { getMyBookings } from "@/app/actions/bookingActions";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";

export default function PendingPage() {
  // 1. เตรียม State สำหรับรับข้อมูลจาก Database
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // จัดการสถานะโหลดข้อมูล
  const [error, setError] = useState<string | null>(null);

  // 2. State สำหรับการค้นหา และ Modal
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // 3. ฟังก์ชันดึงข้อมูลจาก API (Database)
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);

        const result = await getMyBookings(undefined, true);
        if (result.success && result.data) {
          const formattedList = result.data.map((b: any) => ({
            id: String(b.request_id),
            requester: b.vc_user
              ? `${b.vc_user.firstname} ${b.vc_user.lastname}`
              : "ไม่ระบุชื่อ",
            department: b.vc_org?.orgname || b.use_div_code || "ไม่ระบุแผนก",
            destination: b.journey_place,
            date: b.journey_date
              ? new Date(b.journey_date).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "N/A",
            time: b.journey_time || "N/A",
            objective: b.journey_causes || "-",
            status: b.status_use_id ? String(b.status_use_id) : "1",
            // เพิ่ม fields สำหรับนำไปแสดงใน Modal Detail
            carType: b.vc_car_spec?.car_spec_name || b.car_spec_id,
            origin:
              b.vc_start_place?.start_place_name ||
              String(b.start_place || "-"),
            passengers: b.passenger_amount,
            phone: b.user_mobile || "-",
            selfDrive: b.self_drive ? "ขับเอง" : "พนักงานขับ",
            endDate: b.return_date
              ? new Date(b.return_date).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "-",
            endTime: b.return_time || "N/A",
            startDateTime: b.journey_date
              ? `${b.journey_date.toISOString().split("T")[0]}T${b.journey_time || "00:00"}:00`
              : "",
            rejectReason: b.reject_reason || null,
          }));
          setRequests(formattedList);
        } else {
          setRequests([]);
          setError("ไม่สามารถโหลดข้อมูลคำขอได้ กรุณาลองใหม่อีกครั้ง");
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch requests", err);
        setError("ไม่สามารถโหลดข้อมูลคำขอได้ กรุณาลองใหม่อีกครั้ง");
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []); // <-- ลบ currentUser ออกจาก dependency array แล้ว

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 4. ฟังก์ชันจัดการค้นหาและสถานะ (ทำงานจริง)
  const filteredRequests = requests.filter((req) => {
    const expired = isBookingExpired(req.startDateTime ?? "", req.status);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && req.status === "1" && !expired) ||
      (statusFilter === "APPROVED" &&
        (req.status === "2" || req.status === "5")) ||
      (statusFilter === "REJECTED" &&
        (req.status === "3" ||
          req.status === "6" ||
          (req.status === "1" && expired)));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      req.id.includes(q) ||
      req.requester.toLowerCase().includes(q) ||
      req.date.toLowerCase().includes(q) ||
      req.time.includes(q);

    return matchesStatus && matchesSearch;
  });
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const tabs = [
    {
      id: "ALL",
      label: "ทั้งหมด",
      icon: RefreshCw,
      iconColor: "text-gray-500",
    },
    {
      id: "PENDING",
      label: "รออนุมัติ",
      icon: Clock,
      iconColor: "text-amber-500",
    },
    {
      id: "APPROVED",
      label: "อนุมัติแล้ว",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
    },
    {
      id: "REJECTED",
      label: "ยกเลิก/ไม่อนุมัติ/หมดเวลาอนุมัติ",
      icon: XCircle,
      iconColor: "text-rose-500",
    },
  ];
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const columns: DataTableColumn<any>[] = [
    {
      header: "เลขที่คำขอ",
      cell: (req) => (
        <span className="text-xs font-bold text-gray-800">
          {req.id}
        </span>
      ),
    },
    {
      header: "ผู้ขอ",
      cell: (req) => (
        <div>
          <p className="text-sm font-bold text-gray-800 leading-tight">
            {req.requester}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {req.department}
          </p>
        </div>
      ),
    },
    {
      header: "ปลายทาง",
      cell: (req) => (
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-500 shrink-0">
              {req.origin}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            <span className="text-blue-600 truncate">
              {req.destination}
            </span>
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {req.objective}
          </p>
        </div>
      ),
    },
    {
      header: "วันเวลาเดินทาง",
      cell: (req) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-700">
              {req.date}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            <span className="text-xs text-gray-400 font-medium">
              {req.time} น.
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "สถานะ",
      cell: (req) => {
        const status = Number(req.status);
        const expired = isBookingExpired(
          req.startDateTime ?? "",
          req.status,
        );
        const statusName = expired
          ? "หมดเวลาอนุมัติ"
          : getStatusName(status) || "สถานะไม่ระบุ";
        const statusColor = expired
          ? "text-orange-600 bg-orange-50 border-orange-200"
          : getStatusColor(status) ||
            "text-gray-600 bg-gray-50 border-gray-100";
        return (
          <div
            className={`inline-flex items-center justify-center min-w-[120px] px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wide ${statusColor}`}
          >
            {statusName}
          </div>
        );
      },
    },
    {
      header: "",
      className: "text-right",
      cell: () => (
        <div className="flex justify-end">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="ค้นหาเลขที่คำขอ, ชื่อผู้ขอ, วันเดินทาง"
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* Status Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 rounded-2xl overflow-x-auto no-scrollbar border border-gray-100">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`
  flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer
  ${
    isActive
      ? "bg-white shadow-md scale-[1.02] ring-1 ring-blue-100"
      : "hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200"
  }
`}
            >
              <Icon size={16} className={tab.iconColor} />
              <span className={isActive ? "text-gray-800" : "text-gray-500"}>
                {tab.label}
              </span>
              {isActive && (
                <span className="ml-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px]">
                  {filteredRequests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List Section */}
      <div className="space-y-4">
        {/* สถานะ Loading */}
        {isLoading ? (
          <div className="bg-white p-20 rounded-md text-center border border-gray-100 shadow-sm flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-blue-500 animate-spin" />
            <p className="font-bold text-lg text-gray-500">
              กำลังโหลดข้อมูล...
            </p>
          </div>
        ) : error ? (
          /* สถานะ Error */
          <div className="bg-rose-50 p-20 rounded-md text-center border border-rose-100 shadow-sm flex flex-col items-center gap-4">
            <AlertCircle size={48} className="text-rose-500" />
            <p className="font-bold text-lg text-rose-600">{error}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          /* สถานะไม่พบข้อมูล */
          <div className="bg-white p-20 rounded-md text-center border border-gray-100 shadow-sm flex flex-col items-center gap-4">
            <AlertCircle size={48} className="text-gray-200" />
            <p className="font-semibold text-xl text-gray-400 uppercase tracking-widest">
              ไม่พบรายการคำขอ
            </p>
          </div>
        ) : (
          /* แสดงข้อมูลจริง */
          <DataTable
            columns={columns}
            data={paginatedRequests}
            onRowClick={(req) => setSelectedRequest(req)}
            rowKey={(row) => row.id}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ส่วน Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="mb-8 border-b border-gray-100 pb-6">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                {selectedRequest.id}
              </span>
              <h2 className="text-xl font-semibold text-gray-900 mt-1 tracking-tight">
                รายละเอียดคำขอจองรถ
              </h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                    ชื่อผู้ขอ
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedRequest.requester}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-blue-600 tracking-tight">
                      {selectedRequest.phone}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                    สังกัด / แผนก
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedRequest.department}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                  เส้นทางที่ต้องการเดินทาง
                </p>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <span className="bg-white px-3 py-1.5 rounded-md text-sm font-bold text-gray-600 border border-gray-100 shadow-sm">
                    {selectedRequest.origin}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                  <span className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-lg shadow-blue-100">
                    {selectedRequest.destination}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                    วันเวลาเดินทาง
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-700">
                      ไป:{" "}
                      <span className="text-gray-900">
                        {selectedRequest.date} - {selectedRequest.time} น.
                      </span>
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      กลับ:{" "}
                      <span className="text-gray-900">
                        {selectedRequest.endDate} - {selectedRequest.endTime} น.
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                    ประเภทรถ / ลักษณะการขับ
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">
                      {selectedRequest.carType}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-black uppercase tracking-tighter">
                        ผู้โดยสาร {selectedRequest.passengers} คน
                      </span>
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md uppercase tracking-tight italic">
                        {selectedRequest.selfDrive}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                  วัตถุประสงค์ / หมายเหตุ
                </p>
                <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.objective}
                </p>
              </div>

              {(selectedRequest.status === "3" ||
                selectedRequest.status === "6") &&
                selectedRequest.rejectReason && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                      เหตุผลที่ไม่อนุมัติ / ยกเลิก
                    </p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.rejectReason}
                    </p>
                  </div>
                )}
            </div>
            {selectedRequest?.status === "1" &&
              !isBookingExpired(
                selectedRequest?.startDateTime ?? "",
                selectedRequest?.status,
              ) && (
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={async () => {
                      if (!(await showConfirm("ยืนยันการยกเลิกคำขอนี้?")))
                        return;
                      const res = await cancelRequest(
                        Number(selectedRequest.id),
                      );
                      if (res.success) {
                        setSelectedRequest(null);
                        const result = await getMyBookings(undefined, true);
                        if (result.success && result.data) {
                          const formattedList = result.data.map((b: any) => ({
                            id: String(b.request_id),
                            requester: b.vc_user
                              ? `${b.vc_user.firstname} ${b.vc_user.lastname}`
                              : "ไม่ระบุชื่อ",
                            department:
                              b.vc_org?.orgname ||
                              b.use_div_code ||
                              "ไม่ระบุแผนก",
                            destination: b.journey_place,
                            date: b.journey_date
                              ? new Date(b.journey_date).toLocaleDateString(
                                  "th-TH",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "N/A",
                            time: b.journey_time || "N/A",
                            objective: b.journey_causes || "-",
                            status: b.status_use_id
                              ? String(b.status_use_id)
                              : "1",
                            carType:
                              b.vc_car_spec?.car_spec_name || b.car_spec_id,
                            origin:
                              b.vc_start_place?.start_place_name ||
                              String(b.start_place || "-"),
                            passengers: b.passenger_amount,
                            phone: b.user_mobile || "-",
                            selfDrive: b.self_drive ? "ขับเอง" : "พนักงานขับ",
                            endDate: b.return_date
                              ? new Date(b.return_date).toLocaleDateString(
                                  "th-TH",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "-",
                            endTime: b.return_time || "N/A",
                          }));
                          setRequests(formattedList);
                        }
                      } else {
                        showError(res.error || "เกิดข้อผิดพลาด");
                      }
                    }}
                    className="px-8 py-3 bg-rose-600 text-white rounded-lg font-semibold text-sm hover:bg-rose-700 transition-all uppercase tracking-widest shadow-xl shadow-rose-200"
                  >
                    ยกเลิกคำขอ
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ⬇️ Helper Functions ⬇️
// ==========================================

export const getStatusName = (status: number | string) => {
  const strStatus = String(status).toUpperCase();

  switch (strStatus) {
    case "1":
    case "PENDING":
      return "รอการอนุมัติ";
    case "2":
    case "APPROVED":
      return "อนุมัติแล้ว";
    case "3":
    case "REJECTED":
      return "ไม่อนุมัติ";
    case "4":
    case "IN_USE":
      return "กำลังใช้งาน";
    case "5":
    case "COMPLETED":
      return "อนุมัติแล้ว";
    case "6":
    case "CANCELLED":
      return "ยกเลิกโดยผู้ขอ";
    default:
      return "สถานะไม่ระบุ";
  }
};

export const getStatusColor = (status: number | string) => {
  const strStatus = String(status).toUpperCase();

  switch (strStatus) {
    case "1":
    case "PENDING":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "2":
    case "APPROVED":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "3":
    case "REJECTED":
      return "text-rose-600 bg-rose-50 border-rose-200";
    case "4":
    case "IN_USE":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "5":
    case "COMPLETED":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "6":
    case "CANCELLED":
      return "text-rose-600 bg-rose-50 border-rose-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-100";
  }
};
