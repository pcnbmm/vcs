"use client";

import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  AlignmentType,
  WidthType,
} from "docx";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";
import {
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Search,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Fuel,
  Users,
  Activity,
  Calendar,
  Filter,
  Wrench,
  MapPin,
  Building,
  PieChart,
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";

// Register Thai Font
Font.register({
  family: "Sarabun",
  fonts: [
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf",
    },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Sarabun", fontSize: 10, color: "#334155", lineHeight: 1.5 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 15 },
  logoPlaceholder: { width: 50, height: 50, backgroundColor: "#f8fafc", borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  orgInfo: { textAlign: "right", justifyContent: "center" },
  orgName: { fontSize: 16, fontWeight: "bold", marginBottom: 4, color: "#0f172a", lineHeight: 1.3 },
  printDate: { fontSize: 9, color: "#64748b" },
  titleSection: { marginBottom: 20, textAlign: "center" },
  title: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 5, lineHeight: 1.3 },
  table: { width: "100%", borderStyle: "solid", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 4, overflow: 'hidden' },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", minHeight: 28, alignItems: "center" },
  tableRowEven: { backgroundColor: "#f8fafc" },
  tableColHeader: { backgroundColor: "#f1f5f9", paddingVertical: 8, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: "#cbd5e1", justifyContent: "center", alignItems: "center" },
  tableCol: { paddingVertical: 6, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: "#e2e8f0", justifyContent: "center" },
  tableCellHeader: { fontSize: 10, fontWeight: "bold", color: "#334155", textAlign: "center", lineHeight: 1.5 },
  tableCell: { fontSize: 9, color: "#475569", lineHeight: 1.5 },
  signatureSection: { marginTop: 60, flexDirection: "row", justifyContent: "space-around" },
  signatureBox: { width: "35%", textAlign: "center" },
  signatureLine: { marginTop: 40, borderBottomWidth: 1, borderBottomColor: "#94a3b8", marginBottom: 8 },
  pageNumber: { position: "absolute", fontSize: 9, bottom: 20, left: 0, right: 0, textAlign: "center", color: "#94a3b8" },
});

const MyPDFDocument = ({ title, columns, data, periodText }: { title: string, columns: any[], data: any[], periodText?: string }) => {
  const currentDate = new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeStyle: "short" }).format(new Date());
  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>ระบบจัดการยานพาหนะ (VCS)</Text>
            <Text style={styles.printDate}>วันที่พิมพ์: {currentDate}</Text>
          </View>
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          {periodText && <Text style={{ fontSize: 12, color: "#475569", marginTop: 4, lineHeight: 1.5 }}>{periodText}</Text>}
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {columns.map((col, i) => (
              <View key={i} style={[styles.tableColHeader, { width: `${col.width}%` }, i === columns.length - 1 ? { borderRightWidth: 0 } : {}]}>
                <Text style={styles.tableCellHeader}>{col.header}</Text>
              </View>
            ))}
          </View>
          {data.map((item, index) => (
            <View style={[styles.tableRow, index % 2 !== 0 ? styles.tableRowEven : {}, index === data.length - 1 ? { borderBottomWidth: 0 } : {}]} key={index}>
              {columns.map((col, i) => (
                <View key={i} style={[styles.tableCol, { width: `${col.width}%` }, i === columns.length - 1 ? { borderRightWidth: 0 } : {}]}>
                  <Text style={styles.tableCell}>{item[col.key] || "-"}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}><View style={styles.signatureLine} /><Text>(..........................................................)</Text><Text style={{ marginTop: 10, lineHeight: 1.5 }}>ผู้จัดทำ </Text></View>
          <View style={styles.signatureBox}><View style={styles.signatureLine} /><Text>(..........................................................)</Text><Text style={{ marginTop: 10, lineHeight: 1.5 }}>ผู้อนุมัติ</Text></View>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};

const REPORT_TYPES = [
  { id: "summary_performance", name: "รายงานสรุปการปฏิบัติงานพนักงาน", icon: Users, desc: "สรุปจำนวนภารกิจและระยะทางของคนขับ" },
  { id: "fueling", name: "รายงานการเติมน้ำมัน", icon: Fuel, desc: "รายการเบิกจ่ายน้ำมันและจำนวนลิตรทั้งหมด" },
  { id: "maintenance_incident", name: "รายงานเหตุรถเสีย", icon: Wrench, desc: "ข้อมูลรถเสียและสาเหตุการเสียรายวัน" },
  { id: "replacement_usage", name: "รายงานการใช้รถทดแทน", icon: Calendar, desc: "ประวัติการนำรถเข้าซ่อมและใช้รถสำรอง" },
  { id: "summary_status", name: "รายงานการขอใช้รถตามสถานะ", icon: Activity, desc: "สถิติการจองรถแยกตามสถานะต่างๆ" },
  { id: "regional_booking", name: "รายงานการขอใช้รถส่วนภูมิภาค", icon: MapPin, desc: "สถิติการขอใช้งานรถยนต์ของส่วนภูมิภาค" },
  { id: "central_booking", name: "รายงานการขอใช้รถส่วนกลาง", icon: Building, desc: "สถิติการขอใช้งานรถยนต์ของส่วนกลาง" },
  { id: "journey_causes", name: "รายงานเหตุผลในการขอใช้งานรถยนต์", icon: PieChart, desc: "สรุปจำนวนการขอใช้งานแยกตามเหตุผล" },
];

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState(REPORT_TYPES[0].id);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [reportPeriod, setReportPeriod] = useState("all"); // 'all', 'monthly', 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const selectedReport = REPORT_TYPES.find((r) => r.id === selectedReportId);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReportId, selectedStatus, reportPeriod, selectedMonth, selectedYear]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        let url = `/api/reports?type=${selectedReportId}`;
        if (selectedReportId === "summary_status" && selectedStatus !== "all") {
          url += `&statusId=${selectedStatus}`;
        }
        if (reportPeriod !== "all") {
          url += `&period=${reportPeriod}`;
          if (reportPeriod === "monthly") {
            url += `&month=${selectedMonth}&year=${selectedYear}`;
          } else if (reportPeriod === "yearly") {
            url += `&year=${selectedYear}`;
          }
        }
        const response = await fetch(url);
        const result = await response.json();

        let cols: any[] = [];
        if (selectedReportId === "summary_performance") {
          cols = [
            { header: "ชื่อพนักงาน", key: "name", width: 25 },
            { header: "ตำแหน่ง", key: "position", width: 20 },
            { header: "จำนวนครั้งที่ปฏิบัติงาน", key: "tasks", width: 20 },
            { header: "ระยะทางรวม (กม.)", key: "distance", width: 20 },
          ];
        } else if (selectedReportId === "fueling") {
          cols = [
            { header: "วันที่", key: "date", width: 15 },
            { header: "ทะเบียนรถ", key: "car_no", width: 15 },
            { header: "ประเภทน้ำมัน", key: "fuel_type", width: 20 },
            { header: "จำนวนลิตร", key: "liters", width: 15 },
            { header: "จำนวนเงิน (บาท)", key: "amount", width: 15 },
          ];
        } else if (selectedReportId === "replacement_usage") {
          cols = [
            { header: "ทะเบียนรถที่เสีย", key: "broken_car", width: 15 },
            { header: "ทะเบียนรถทดแทน", key: "replacement_car", width: 15 },
            { header: "วันที่เริ่มใช้", key: "start_date", width: 15 },
            { header: "วันที่คืนรถ", key: "end_date", width: 15 },
            { header: "ผู้บันทึก", key: "cre_by", width: 20 },
            { header: "สถานะ", key: "status", width: 20 },
          ];
        } else if (selectedReportId === "maintenance_incident") {
          cols = [
            { header: "คันที่เสีย (ยี่ห้อ)", key: "car_desc", width: 20 },
            { header: "ทะเบียนรถ", key: "car_no", width: 15 },
            { header: "สาเหตุการเสีย", key: "cause", width: 40 },
            { header: "วันที่", key: "date", width: 15 },
            { header: "เวลา", key: "time", width: 10 },
          ];
        } else if (selectedReportId === "regional_booking") {
          cols = [
            { header: "รหัสอ้างอิง", key: "id", width: 10 },
            { header: "แผนก/หน่วยงาน", key: "department", width: 20 },
            { header: "จุดเริ่มต้น (ภูมิภาค)", key: "origin", width: 25 },
            { header: "สถานที่ปลายทาง", key: "detail", width: 25 },
            { header: "วันที่เดินทาง", key: "date", width: 10 },
            { header: "สถานะ", key: "status", width: 10 },
          ];
        } else if (selectedReportId === "central_booking") {
          cols = [
            { header: "รหัสอ้างอิง", key: "id", width: 10 },
            { header: "แผนก/หน่วยงาน", key: "department", width: 30 },
            { header: "สถานที่ปลายทาง", key: "detail", width: 35 },
            { header: "วันที่เดินทาง", key: "date", width: 15 },
            { header: "สถานะ", key: "status", width: 10 },
          ];
        } else if (selectedReportId === "journey_causes") {
          cols = [
            { header: "ลำดับ", key: "id", width: 10 },
            { header: "เหตุผลในการขอใช้งาน", key: "cause", width: 60 },
            { header: "จำนวนครั้งที่ขอใช้งาน", key: "count", width: 30 },
          ];
        } else {
          cols = [
            { header: "รหัสอ้างอิง", key: "id", width: 10 },
            { header: "รายละเอียด/สถานที่", key: "detail", width: 40 },
            { header: "วันที่", key: "date", width: 20 },
            { header: "สถานะ", key: "status", width: 15 },
          ];
        }
        setColumns(cols);
        setData(result.data || []);
      } catch (error) {
        console.error("Fetch Error:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedReportId, selectedStatus, reportPeriod, selectedMonth, selectedYear]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");
    worksheet.columns = columns.map((col) => ({ header: col.header, key: col.key, width: col.width }));
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: "Sarabun", bold: true, size: 12 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
    headerRow.alignment = { horizontal: "center" };
    data.forEach((item) => {
      const row = worksheet.addRow(item);
      row.font = { name: "Sarabun", size: 11 };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${selectedReport?.name}.xlsx`);
  };

  const exportToWord = async () => {
    const doc = new DocxDocument({
      sections: [{
        properties: { page: { size: { width: 16838, height: 11906 } } },
        children: [
          new Paragraph({ children: [new TextRun({ text: selectedReport?.name || "", bold: true, size: 28 })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({ children: columns.map(col => new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: col.header, bold: true, font: "Sarabun" })], alignment: AlignmentType.CENTER })], shading: { fill: "E0E0E0" } })) }),
              ...data.map(item => new DocxTableRow({ children: columns.map(col => new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item[col.key] || "-"), font: "Sarabun" })] })] })) })),
            ],
          }),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${selectedReport?.name}.docx`);
  };

  let periodText = "";
  if (reportPeriod === "monthly") {
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    periodText = `ประจำเดือน ${thaiMonths[selectedMonth - 1]} ${selectedYear + 543}  `;
  } else if (reportPeriod === "yearly") {
    periodText = `ประจำปี ${selectedYear + 543}  `;
  }

  const exportToPDF = async () => {
    const doc = <MyPDFDocument title={selectedReport?.name || ""} columns={columns} data={data} periodText={periodText} />;
    const blob = await pdf(doc).toBlob();
    saveAs(blob, `${selectedReport?.name}.pdf`);
  };

  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return columns.some(col => String(item[col.key] || "").toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 flex flex-col lg:flex-row-reverse gap-8 animate-in fade-in duration-500">
      {/* Sidebar Selector */}
      <aside className="w-full lg:w-80 shrink-0 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-blue-600">
            <BarChart3 size={20} />
            <h2 className="font-black text-slate-900 tracking-tight uppercase text-sm">ศูนย์รวมรายงาน</h2>
          </div>
          
          <div className="space-y-2">
            {REPORT_TYPES.map((report) => {
              const Icon = report.icon;
              const isActive = selectedReportId === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left group ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50" 
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-white/20" : "bg-slate-100 text-slate-400 group-hover:text-blue-500"}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm leading-tight ${isActive ? "text-white" : "text-slate-700"}`}>
                      {report.name}
                    </p>
                    <p className={`text-[10px] mt-1 font-medium ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                      {report.desc}
                    </p>
                  </div>
                  <ChevronLeft size={14} className={`ml-auto mt-1 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 text-slate-300"}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl">
          <h3 className="text-xs font-bold opacity-60 uppercase tracking-widest mb-4">ส่งออกข้อมูล</h3>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={exportToExcel} className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-xs font-bold border border-white/5">
              <FileSpreadsheet size={16} className="text-emerald-400" /> EXCEL (.xlsx)
            </button>
            <button onClick={exportToWord} className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-xs font-bold border border-white/5">
              <FileText size={16} className="text-blue-400" /> WORD (.docx)
            </button>
            <button onClick={exportToPDF} className="flex items-center gap-3 w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-xs font-bold border border-white/5">
              <FileIcon size={16} className="text-rose-400" /> PDF (.pdf)
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 space-y-6">
        {/* Header Section */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4 animate-in slide-in-from-right-4 duration-500">
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
              <span>รายงาน</span>
              <ChevronRight size={10} />
              <span className="text-slate-400">ปัจจุบัน</span>
            </nav>
            <h1 className="text-2xl font-black text-slate-900">{selectedReport?.name}</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">{selectedReport?.desc}</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex items-center gap-3 flex-wrap justify-end animate-in slide-in-from-right-4 duration-500 delay-75">
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
            >
                <option value="all">ทุกช่วงเวลา</option>
                <option value="monthly">รายเดือน</option>
                <option value="yearly">รายปี</option>
              </select>
            </div>

          {reportPeriod === "monthly" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
            >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
                  </option>
                ))}
              </select>
            )}

          {(reportPeriod === "monthly" || reportPeriod === "yearly") && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
            >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return (
                    <option key={y} value={y}>
                      {y + 543}
                    </option>
                  );
                })}
              </select>
            )}

          {selectedReportId === "summary_status" && (
            <div className="relative group">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
              >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="1">รออนุมัติ</option>
                  <option value="2">อนุมัติแล้ว</option>
                  <option value="4">กำลังใช้รถ</option>
                  <option value="5">คืนรถแล้ว</option>
                </select>
              </div>
            )}
            
          <div className="relative group flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาข้อมูล..."
              className="pl-10 pr-6 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all w-full"
            />
          </div>
        </div>

        {/* Data Table Area */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden min-h-[600px]">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-blue-100/50">
              พบข้อมูล {filteredData.length} รายการ
            </span>
          </div>
          
          <DataTable
            columns={columns.map((col) => ({
              header: col.header,
              cell: (row: any) => (
                <span className={`text-sm font-bold ${
                  col.key === 'status' && row[col.key] === 'คืนแล้ว' ? 'text-emerald-600' :
                  col.key === 'status' && row[col.key] === 'อนุมัติ' ? 'text-blue-600' :
                  'text-slate-600'
                }`}>
                  {row[col.key] || "-"}
                </span>
              ),
            }))}
            data={currentData}
            isLoading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>
    </div>
  );
}
