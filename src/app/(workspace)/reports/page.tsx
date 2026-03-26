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

// Register Thai Font
Font.register({
  family: "Sarabun",
  fonts: [
    { src: "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf" },
    { src: "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf", fontWeight: "bold" },
  ],
});
import {
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Search,
  ChevronDown,
} from "lucide-react";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Sarabun",
    fontSize: 10,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  orgInfo: {
    textAlign: "right",
  },
  orgName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  printDate: {
    fontSize: 9,
    color: "#666",
  },
  titleSection: {
    marginBottom: 25,
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 5,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 25,
    alignItems: "center",
  },
  tableColHeader: {
    backgroundColor: "#f5f5f5",
    fontWeight: "bold",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000",
    justifyContent: "center",
    textAlign: "center",
  },
  tableCol: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000",
    justifyContent: "center",
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
  },
  tableCell: {
    fontSize: 9,
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  signatureBox: {
    width: "40%",
    textAlign: "center",
  },
  signatureLine: {
    marginTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 8,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 9,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#999",
  },
});

const MyPDFDocument = ({ title, columns, data }: { title: string, columns: any[], data: any[] }) => {
  const currentDate = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={{ fontSize: 8 }}>LOGO</Text>
          </View>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>ระบบจัดการยานพาหนะ (VCS)</Text>
            <Text style={styles.printDate}>วันที่พิมพ์: {currentDate}</Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Table Section */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {columns.map((col, i) => (
              <View 
                key={i} 
                style={[
                  styles.tableColHeader, 
                  { width: `${100 / columns.length}%` },
                  i === columns.length - 1 ? { borderRightWidth: 0 } : {}
                ]}
              >
                <Text style={styles.tableCellHeader}>{col.header}</Text>
              </View>
            ))}
          </View>
          {data.map((item, index) => (
            <View 
              style={[
                styles.tableRow,
                index === data.length - 1 ? { borderBottomWidth: 0 } : {}
              ]} 
              key={index}
            >
              {columns.map((col, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.tableCol, 
                    { width: `${100 / columns.length}%` },
                    i === columns.length - 1 ? { borderRightWidth: 0 } : {}
                  ]}
                >
                  <Text style={styles.tableCell}>{item[col.key] || "-"}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>(..........................................................)</Text>
            <Text style={{ marginTop: 4 }}>ผู้จัดทำ</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>(..........................................................)</Text>
            <Text style={{ marginTop: 4 }}>ผู้อนุมัติ</Text>
          </View>
        </View>

        {/* Footer Section */}
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} 
          fixed 
        />
      </Page>
    </Document>
  );
};

const REPORT_TYPES = [
  { id: "summary_performance", name: "รายงานสรุปการปฏิบัติงานของพนักงาน" },
  { id: "dept_usage", name: "รายงานสรุปการใช้รถยนต์ของหน่วยงานต่างๆ" },
  { id: "vehicle_usage", name: "รายงานสรุปการใช้งานของรถยนต์" },
  { id: "stat_ubph", name: "รายงานสถิติการใช้รถ ยบพ. ออกปฏิบัติงานของหน่วยงานต่างๆ" },
  { id: "stat_request", name: "รายงานสถิติการขอใช้รถยนต์ของหน่วยงานต่างๆ" },
  { id: "tax_payment", name: "รายงานยานพาหนะชำระภาษี" },
  { id: "purchase_tax", name: "รายงานภาษีซื้อ" },
  { id: "insurance", name: "รายงานยานพาหนะจัดทำประกันภัยรถยนต์" },
  { id: "act_insurance", name: "รายงานยานพาหนะจัดทำประกันภัยรถยนต์ตาม พ.ร.บ." },
  { id: "fueling", name: "รายงานสรุปการเติมน้ำมันเชื้อเพลิง" },
  { id: "summary_status", name: "รายงานสรุปการขอใช้งานรถยนต์ตามสถานะ" },
  { id: "rental_usage", name: "รายงานการใช้งานรถยนต์เช่า" },
];

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState(REPORT_TYPES[0].id);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedReportName = REPORT_TYPES.find(r => r.id === selectedReportId)?.name || "";

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        let url = `/api/reports?type=${selectedReportId}`;
        if (selectedReportId === "summary_status" && selectedStatus !== "all") {
          url += `&statusId=${selectedStatus}`;
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
        } else {
          cols = [
            { header: "รหัสอ้างอิง", key: oIdKey, width: 10 },
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

    const oIdKey = selectedReportId === "summary_status" ? "id" : "id";
    fetchReportData();
  }, [selectedReportId, selectedReportName, selectedStatus]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    // Set header style with Thai font support
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Sarabun', bold: true, size: 12 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
    headerRow.alignment = { horizontal: 'center' };

    // Add data and set font for all rows
    data.forEach(item => {
      const row = worksheet.addRow(item);
      row.font = { name: 'Sarabun', size: 11 };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = (selectedReportName || "report").replace(/[/\\?%*:|"<>]/g, '-');
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `${fileName}.xlsx`
    );
  };

  const exportToWord = async () => {
    const doc = new DocxDocument({
      sections: [
        {
          properties: {
             page: { 
                size: { 
                    width: 16838, // A4 Landscape width
                    height: 11906, // A4 Landscape height
                } 
             } 
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: selectedReportName, bold: true, size: 28 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: columns.map(col => new DocxTableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: col.header, bold: true, font: "Sarabun" })],
                      alignment: AlignmentType.CENTER
                    })],
                    shading: { fill: "E0E0E0" },
                  })),
                }),
                ...data.map(item => new DocxTableRow({
                  children: columns.map(col => new DocxTableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: String(item[col.key] || "-"), font: "Sarabun" })]
                    })],
                  })),
                })),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = (selectedReportName || "report").replace(/[/\\?%*:|"<>]/g, '-');
    saveAs(blob, `${fileName}.docx`);
  };

  const exportToPDF = async () => {
    const doc = <MyPDFDocument title={selectedReportName} columns={columns} data={data} />;
    const blob = await pdf(doc).toBlob();
    const fileName = (selectedReportName || "report").replace(/[/\\?%*:|"<>]/g, '-');
    saveAs(blob, `${fileName}.pdf`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">ระบบรายงานกลาง</h1>
          <p className="text-gray-500 mt-2">เลือกประเภทรายงานที่ต้องการตรวจสอบและส่งออกข้อมูล</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium">
            <FileSpreadsheet size={18} /> Excel
          </button>
          <button onClick={exportToWord} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium">
            <FileText size={18} /> Word
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium">
            <FileIcon size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทรายงาน</label>
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-gray-700"
          >
            {REPORT_TYPES.map((report) => (
              <option key={report.id} value={report.id}>{report.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>
      </div>

      {selectedReportId === "summary_status" && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-sarabun">กรองตามสถานะ</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", name: "ทั้งหมด" },
              { id: "1", name: "รอการอนุมัติ (Pending)" },
              { id: "2", name: "อนุมัติแล้ว (Approved)" },
              { id: "3", name: "ปฏิเสธ (Rejected)" },
              { id: "4", name: "กำลังใช้งาน (In Use)" },
              { id: "5", name: "เสร็จสิ้น (Completed)" },
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedStatus === status.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400"
                }`}
              >
                {status.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            {selectedReportName}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="ค้นหาในตาราง..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 italic">กำลังดึงข้อมูล...</td>
                </tr>
              ) : data.length > 0 ? (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    {columns.map((col, i) => (
                      <td key={i} className="px-6 py-4 text-sm text-gray-600">{row[col.key] || "-"}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">ไม่มีข้อมูลแสดงผล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}