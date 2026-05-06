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
import Modal from "@/components/ui/Modal";

export default function PendingPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const result = await getMyBookings(undefined, true);
      if (result.success && result.data) {
        const formattedList = result.data.map((b: any) => ({
          id: String(b.request_id),
          requester: b.vc_user ? `${b.vc_user.firstname} ${b.vc_user.lastname}` : "ไม่ระบุชื่อ",
          department: b.vc_org?.orgname || b.use_div_code || "ไม่ระบุแผนก",
          destination: b.journey_place,
          date: b.journey_date ? new Date(b.journey_date).toLocaleDateString("th-TH", {
            day: "numeric", month: "short", year: "numeric",
          }) : "N/A",
          time: b.journey_time || "N/A",
          objective: b.journey_causes || "-",
          status: b.status_use_id ? String(b.status_use_id) : "1",
          carType: b.vc_car_spec?.car_spec_name || b.car_spec_id,
          origin: b.vc_start_place?.start_place_name || String(b.start_place || "-"),
          passengers: b.passenger_amount,
          phone: b.user_mobile || "-",
          selfDrive: b.self_drive ? "ขับเอง" : "พนักงานขับ",
          endDate: b.return_date ? new Date(b.return_date).toLocaleDateString("th-TH", {
            day: "numeric", month: "short", year: "numeric",
          }) : "-",
          endTime: b.return_time || "N/A",
          startDateTime: b.journey_date ? `${b.journey_date.toISOString().split("T")[0]}T${b.journey_time || "00:00"}:00` : "",
          rejectReason: b.reject_reason || null,
        }));
        setRequests(formattedList);
      } else {
        setRequests([]);
        setError("ไม่สามารถโหลดข้อมูลคำขอได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
      setError("ไม่สามารถโหลดข้อมูลคำขอได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const expired = isBookingExpired(req.startDateTime ?? "", req.status);
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && req.status === "1" && !expired) ||
      (statusFilter === "APPROVED" && (req.status === "2" || req.status === "5" || req.status === "4")) ||
      (statusFilter === "REJECTED" && (req.status === "3" || req.status === "6" || (req.status === "1" && expired)));

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
    { id: "ALL", label: "ทั้งหมด", icon: RefreshCw, color: "text-slate-500" },
    { id: "PENDING", label: "รออนุมัติ", icon: Clock, color: "text-amber-500" },
    { id: "APPROVED", label: "อนุมัติแล้ว", icon: CheckCircle2, color: "text-emerald-500" },
    { id: "REJECTED", label: "ยกเลิก/ไม่อนุมัติ", icon: XCircle, color: "text-rose-500" },
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const handleCancel = async (id: string) => {
    if (!(await showConfirm("ยืนยันการยกเลิกคำขอนี้?"))) return;
    const res = await cancelRequest(Number(id));
    if (res.success) {
      setSelectedRequest(null);
      fetchRequests();
    } else {
      showError(res.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="ค้นหาเลขที่คำขอ หรือชื่อผู้ขอ..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto">
          {tabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/50"}`}
              >
                <tab.icon size={14} className={tab.color} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <DataTable
          columns={[
            {
              header: "คำขอ",
              cell: (req) => (
                <div className="bg-slate-50 border border-slate-100 w-14 h-14 rounded-lg flex flex-col items-center justify-center text-blue-600 font-bold shrink-0">
                  <span className="text-[10px] text-slate-400">REQ</span>
                  <span className="text-sm">{String(req.id).padStart(3, "0")}</span>
                </div>
              )
            },
            {
              header: "ผู้ขอ / สังกัด",
              cell: (req) => (
                <div>
                  <p className="font-bold text-slate-800">{req.requester}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{req.department}</p>
                </div>
              )
            },
            {
              header: "เส้นทาง",
              cell: (req) => (
                <div className="flex items-center gap-2 max-w-[200px]">
                  <span className="text-xs font-medium text-slate-500 truncate">{req.origin}</span>
                  <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                  <span className="text-xs font-bold text-blue-600 truncate">{req.destination}</span>
                </div>
              )
            },
            {
              header: "วันเวลาเดินทาง",
              cell: (req) => (
                <div>
                  <p className="text-xs font-bold text-slate-700">{req.date}</p>
                  <p className="text-[11px] text-slate-400 font-bold">{req.time} น.</p>
                </div>
              )
            },
            {
              header: "สถานะ",
              cell: (req) => {
                const expired = isBookingExpired(req.startDateTime ?? "", req.status);
                const status = Number(req.status);
                let name = getStatusName(status);
                let color = getStatusColor(status);
                if (expired && status === 1) {
                  name = "หมดเวลาอนุมัติ";
                  color = "text-orange-600 bg-orange-50 border-orange-100";
                }
                return (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${color}`}>
                    {name}
                  </span>
                );
              }
            },
            {
              header: "จัดการ",
              className: "text-right",
              cell: (req) => (
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              )
            }
          ]}
          data={paginatedRequests}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="รายละเอียดคำขอจองยานพาหนะ"
        maxWidth="2xl"
        accentColor="bg-blue-600"
        footer={
          <>
            <button onClick={() => setSelectedRequest(null)} className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              ปิดหน้าต่าง
            </button>
            {selectedRequest?.status === "1" && !isBookingExpired(selectedRequest?.startDateTime ?? "", selectedRequest?.status) && (
              <button
                onClick={() => handleCancel(selectedRequest.id)}
                className="px-6 py-2.5 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700 shadow-md shadow-rose-100 transition-all"
              >
                ยกเลิกคำขอ
              </button>
            )}
          </>
        }
      >
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ผู้ขอใช้รถ</p>
              <p className="text-lg font-bold text-slate-900">{selectedRequest?.requester}</p>
              <p className="text-sm font-semibold text-blue-600">{selectedRequest?.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สังกัด / แผนก</p>
              <p className="text-lg font-bold text-slate-900">{selectedRequest?.department}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เส้นทางเดินทาง</p>
            <div className="flex items-center gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <span className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 shadow-sm">{selectedRequest?.origin}</span>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100">{selectedRequest?.destination}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">กำหนดเวลา</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-slate-400 font-bold">ไป:</span>
                  <span className="font-bold text-slate-800">{selectedRequest?.date} - {selectedRequest?.time} น.</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-slate-400 font-bold">กลับ:</span>
                  <span className="font-bold text-slate-800">{selectedRequest?.endDate} - {selectedRequest?.endTime} น.</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ข้อมูลทรัพยากร</p>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">{selectedRequest?.carType}</p>
                <p className="text-xs font-bold text-slate-400">
                  ผู้โดยสาร {selectedRequest?.passengers} คน • <span className="text-blue-600 italic">{selectedRequest?.selfDrive}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">วัตถุประสงค์ / หมายเหตุ</p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedRequest?.objective}</p>
          </div>

          {(selectedRequest?.status === "3" || selectedRequest?.status === "6") && selectedRequest?.rejectReason && (
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">เหตุผลที่ยกเลิก/ไม่อนุมัติ</p>
              <p className="text-sm font-bold text-rose-700 leading-relaxed">{selectedRequest?.rejectReason}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

const getStatusName = (status: number | string) => {
  const s = String(status);
  if (s === "1") return "รออนุมัติ";
  if (s === "2") return "อนุมัติแล้ว";
  if (s === "3") return "ไม่อนุมัติ";
  if (s === "4") return "กำลังใช้งาน";
  if (s === "5") return "อนุมัติแล้ว";
  if (s === "6") return "ยกเลิกคำขอ";
  return "ไม่ระบุ";
};

const getStatusColor = (status: number | string) => {
  const s = String(status);
  if (s === "1") return "text-amber-600 bg-amber-50 border-amber-100";
  if (s === "2" || s === "5") return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (s === "3" || s === "6") return "text-rose-600 bg-rose-50 border-rose-100";
  if (s === "4") return "text-blue-600 bg-blue-50 border-blue-100";
  return "text-slate-400 bg-slate-50 border-slate-100";
};
