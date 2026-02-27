"use client";
import React, { useState } from "react";
import {
  Car,
  Search,
  Filter,
  Eye,
  FileEdit,
  X,
  Navigation,
  User,
  Clock,
  Gauge,
  UserCircle,
  Save,
} from "lucide-react";

export default function ReturnsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("แสดงทุกสถานะ");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const filterOptions = [
    "แสดงทุกสถานะ",
    "กำลังใช้งาน (In Use)",
    "คืนแล้ว (Returned)",
  ];

  const mockReturns = [
    {
      id: "EMG-2024-001",
      plate: "ยังไม่ระบุ",
      borrower: "นาย C (Dispatcher)",
      department: "ส่วนบริหารงานบุคคล",
      driver: "ยังไม่ระบุ",
      carType: "ไซเรน",
      status: "อนุมัติให้ใช้งาน (จัดให้แล้ว/รอคืน)",
    },
  ];

  const handleOpenViewModal = (item: any) => {
    setSelectedItem(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setSelectedItem(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">
      {/* Header Square */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-6">
        <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
          <Car className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            การบันทึกการคืนรถ (Return)
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            บันทึกการรับคืนและตรวจสอบความถูกต้องของภารกิจ
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-full p-2 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 px-4 py-2">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาเลขที่คำขอ, ทะเบียน, ผู้ยืม..."
            className="flex-1 outline-none text-slate-600 placeholder:text-slate-400 bg-transparent w-full"
          />
        </div>
        <div className="w-[1px] h-8 bg-slate-200"></div>

        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-6 py-2 rounded-full hover:bg-slate-50 transition-colors text-slate-600 text-sm font-medium"
          >
            <Filter size={18} />
            <span>{selectedFilter}</span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-20">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelectedFilter(option);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedFilter === option
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="px-6 py-5 font-medium whitespace-nowrap">
                  ID / ทะเบียน
                </th>
                <th className="px-6 py-5 font-medium whitespace-nowrap">
                  ผู้ยืม / หน่วยงาน
                </th>
                <th className="px-6 py-5 font-medium whitespace-nowrap">
                  คนขับ / ประเภทรถ
                </th>
                <th className="px-6 py-5 font-medium whitespace-nowrap">
                  สถานะ
                </th>
                <th className="px-6 py-5 font-medium text-center whitespace-nowrap">
                  การจัดการ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {mockReturns.length > 0 ? (
                mockReturns.map((item, index) => (
                  <tr
                    key={index}
                    className="bg-white hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-5 align-top">
                      <p className="font-bold text-slate-800">{item.id}</p>
                      <p className="text-sm text-emerald-500 font-medium mt-1">
                        {item.plate}
                      </p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="font-medium text-slate-800">
                        {item.borrower}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {item.department}
                      </p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="font-medium text-slate-800">
                        {item.driver}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {item.carType}
                      </p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenViewModal(item)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          <FileEdit size={18} />
                          บันทึกรับคืน
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-slate-400">
                      ยังไม่มีข้อมูลรายการส่งคืนรถ
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1a2332] px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-400 p-2.5 rounded-xl">
                  <Car size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-wide">
                    RECORD VEHICLE RETURN
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    เลขที่คำขอ: {selectedItem?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-white">
              {/* 1. ข้อมูลเส้นทาง */}
              <section>
                <div className="flex items-center gap-2 text-emerald-600 font-bold mb-4">
                  <Navigation size={18} />
                  <h3>ข้อมูลเส้นทาง (ROUTE INFO)</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      เอาจากไหน (ORIGIN)
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800">
                        หลักสี่
                      </div>
                    ) : (
                      <input
                        type="text"
                        defaultValue="หลักสี่"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      ไปกลับ (DESTINATION)
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800">
                        โรงพยาบาลศิริราช
                      </div>
                    ) : (
                      <input
                        type="text"
                        defaultValue="โรงพยาบาลศิริราช"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>
              </section>

              {/* 2. ผู้รับผิดชอบ */}
              <section>
                <div className="flex items-center gap-2 text-emerald-600 font-bold mb-4">
                  <User size={18} />
                  <h3>ผู้รับผิดชอบ (PERSONNEL)</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      ใครอนุมัติ (APPROVER)
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800">
                        หน.ส่วนงานบริการรถ
                      </div>
                    ) : (
                      <input
                        type="text"
                        defaultValue="หน.ส่วนงานบริการรถ"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      ลักษณะการขับขี่
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1">
                      <div className="flex-1 text-center py-2 text-xs font-medium text-slate-400">
                        ขับเอง (SELF)
                      </div>
                      <div className="flex-1 text-center py-2 text-xs font-bold text-emerald-600 bg-white rounded-lg shadow-sm">
                        มีคนขับ (STAFF)
                      </div>
                      <div className="flex-1 text-center py-2 text-xs font-medium text-slate-400">
                        รถรับจ้าง (TAXI)
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      ใครขับ (DRIVER)
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-400">
                        เลือกพนักงานขับรถ...
                      </div>
                    ) : (
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 outline-none focus:border-emerald-500 appearance-none">
                        <option>เลือกพนักงานขับรถ...</option>
                        <option>นายสมชาย</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      ทะเบียน / ประเภทรถ
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-400">
                        เลือกทะเบียนรถ...
                      </div>
                    ) : (
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 outline-none focus:border-emerald-500 appearance-none">
                        <option>เลือกทะเบียนรถ...</option>
                        <option>กท-1234</option>
                      </select>
                    )}
                  </div>
                </div>
              </section>

              {/* 3. วันเวลาเดินทาง */}
              <section>
                <div className="flex items-center gap-2 text-emerald-600 font-bold mb-4">
                  <Clock size={18} />
                  <h3>วันเวลาเดินทาง (TRIP DATE &amp; TIME)</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      วันที่ออกเดินทาง
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800">
                        -
                      </div>
                    ) : (
                      <input
                        type="date"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      เวลาออกเดินทาง
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800">
                        -
                      </div>
                    ) : (
                      <input
                        type="time"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      วันที่กลับ
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800">
                        2026-02-25
                      </div>
                    ) : (
                      <input
                        type="date"
                        defaultValue="2026-02-25"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      เวลากลับ
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800">
                        10:11
                      </div>
                    ) : (
                      <input
                        type="time"
                        defaultValue="10:11"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>
              </section>

              {/* 4. เลขไมล์ */}
              <section>
                <div className="flex items-center gap-2 text-emerald-600 font-bold mb-4">
                  <Gauge size={18} />
                  <h3>เลขไมล์ (MILEAGE)</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      เลขไมล์เริ่มต้น (ก่อนใช้)
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-400">
                        กม.
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                        placeholder="กม."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      เลขไมล์สิ้นสุด (หลังใช้)
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-400">
                        กม.
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                        placeholder="กม."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>
              </section>

              {/* 5. ผู้บันทึก */}
              <section>
                <div className="flex items-center gap-2 text-emerald-600 font-bold mb-4">
                  <UserCircle size={18} />
                  <h3>ผู้บันทึก (RECORDER)</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      ผู้ดำเนินการบันทึกรับคืน
                    </label>
                    {modalMode === "view" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-800">
                        นาย A (Admin)
                      </div>
                    ) : (
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-500 appearance-none">
                        <option value="admin">นาย A (Admin)</option>
                        <option value="dispatcher">นายเวร Dispatcher</option>
                      </select>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Footer ของ Modal */}
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-4">
              {modalMode === "view" ? (
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  CLOSE
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm shadow-emerald-600/20"
                  >
                    <Save size={18} />
                    SAVE RETURN RECORD
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
