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
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf",
    },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});
import {
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Search,
  ChevronDown,
  ArrowRight,
  Filter,
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";

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

const MyPDFDocument = ({
  title,
  columns,
  data,
}: {
  title: string;
  columns: any[];
  data: any[];
}) => {
  const currentDate = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={{ fontSize: 8 }}>LOGO</Text>
          </View>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>ระบบจัดการยานพาหนะ (VCS)</Text>
            <Text style={styles.printDate}>วันที่พิมพ์: {currentDate}</Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            {columns.map((col, i) => (
              <View
                key={i}
                style={[
                  styles.tableColHeader,
                  { width: `${100 / columns.length}%` },
                  i === columns.length - 1 ? { borderRightWidth: 0 } : {},
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
                index === data.length - 1 ? { borderBottomWidth: 0 } : {},
              ]}
              key={index}
            >
              {columns.map((col, i) => (
                <View
                  key={i}
                  style={[
                    styles.tableCol,
                    { width: `${100 / columns.length}%` },
                    i === columns.length - 1 ? { borderRightWidth: 0 } : {},
                  ]}
                >
                  <Text style={styles.tableCell}>{item[col.key] || "-"}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>
              (..........................................................)
            </Text>
            <Text style={{ marginTop: 4 }}>ผู้จัดทำ</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>
              (..........................................................)
            </Text>
            <Text style={{ marginTop: 4 }}>ผู้อนุมัติ</Text>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `หน้า ${pageNumber} / ${totalPages}`
          }
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
  {
    id: "stat_ubph",
    name: "รายงานสถิติการใช้รถ ยบพ. ออกปฏิบัติงานของหน่วยงานต่างๆ",
  },
  { id: "stat_request", name: "รายงานสถิติการขอใช้รถยนต์ของหน่วยงานต่างๆ" },
  { id: "tax_payment", name: "รายงานยานพาหนะชำระภาษี" },
  { id: "purchase_tax", name: "รายงานภาษีซื้อ" },
  { id: "insurance", name: "รายงานยานพาหนะจัดทำประกันภัยรถยนต์" },
  { id: "act_insurance", name: "รายงานยานพาหนะจัดทำประกันภัยรถยนต์ตาม พ.ร.บ." },
  { id: "fueling", name: "รายงานสรุปการเติมน้ำมันเชื้อเพลิง" },
  { id: "summary_status", name: "รายงานสรุปการขอใช้งานรถยนต์ตามสถานะ" },
  { id: "rental_usage", name: "รายงานการใช้งานรถยนต์เช่า" },
  { id: "replacement_usage", name: "รายงานการใช้รถทดแทน" },
];

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState(REPORT_TYPES[0].id);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const selectedReportName =
    REPORT_TYPES.find((r) => r.id === selectedReportId)?.name || "";

  // Reset page when report type or status changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReportId, selectedStatus]);

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
        } else if (selectedReportId === "replacement_usage") {
          cols = [
            { header: "ทะเบียนรถที่เสีย", key: "broken_car", width: 15 },
            { header: "ทะเบียนรถทดแทน", key: "replacement_car", width: 15 },
            { header: "วันที่เริ่มใช้", key: "start_date", width: 15 },
            { header: "วันที่คืนรถ", key: "end_date", width: 15 },
            { header: "ผู้บันทึก", key: "cre_by", width: 20 },
            { header: "สถานะ", key: "status", width: 20 },
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
  }, [selectedReportId, selectedStatus]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: "Sarabun", bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    headerRow.alignment = { horizontal: "center" };

    data.forEach((item) => {
      const row = worksheet.addRow(item);
      row.font = { name: "Sarabun", size: 11 };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = (selectedReportName || "report").replace(
      /[/\\?%*:|"<>]/g,
      "-",
    );
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${fileName}.xlsx`,
    );
  };

  const exportToWord = async () => {
    const doc = new DocxDocument({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 16838,
                height: 11906,
              },
            },
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: selectedReportName, bold: true, size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: columns.map(
                    (col) =>
                      new DocxTableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: col.header,
                                bold: true,
                                font: "Sarabun",
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                        shading: { fill: "E0E0E0" },
                      }),
                  ),
                }),
                ...data.map(
                  (item) =>
                    new DocxTableRow({
                      children: columns.map(
                        (col) =>
                          new DocxTableCell({
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: String(item[col.key] || "-"),
                                    font: "Sarabun",
                                  }),
                                ],
                              }),
                            ],
                          }),
                      ),
                    }),
                ),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = (selectedReportName || "report").replace(
      /[/\\?%*:|"<>]/g,
      "-",
    );
    saveAs(blob, `${fileName}.docx`);
  };

  const exportToPDF = async () => {
    const doc = (
      <MyPDFDocument title={selectedReportName} columns={columns} data={data} />
    );
    const blob = await pdf(doc).toBlob();
    const fileName = (selectedReportName || "report").replace(
      /[/\\?%*:|"<>]/g,
      "-",
    );
    saveAs(blob, `${fileName}.pdf`);
  };

  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return columns.some(col => String(item[col.key] || "").toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            ระบบรายงาน (REPORTS)
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <FileSpreadsheet size={16} /> EXCEL
          </button>
          <button
            onClick={exportToWord}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <FileText size={16} /> WORD
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
          >
            <FileIcon size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">เลือกประเภทรายงาน</label>
          <div className="relative group">
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 pr-10 focus:outline-none focus:ring-4 focus:ring-blue-50 font-bold text-slate-700 transition-all hover:bg-slate-100"
            >
              {REPORT_TYPES.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" size={18} />
          </div>
        </div>

        {selectedReportId === "summary_status" && (
          <div className="space-y-2 animate-in slide-in-from-left-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">กรองตามสถานะ</label>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { id: "all", name: "ทั้งหมด" },
                { id: "1", name: "รออนุมัติ" },
                { id: "2", name: "อนุมัติ" },
                { id: "4", name: "กำลังใช้" },
                { id: "5", name: "คืนแล้ว" },
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    selectedStatus === status.id
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-blue-100"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {status.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="font-bold text-slate-900 text-lg">
              {selectedReportName}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              พบข้อมูล {filteredData.length} รายการ
            </p>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาในตารางนี้..."
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all w-full sm:w-80 shadow-sm"
            />
          </div>
        </div>

        <DataTable
          columns={columns.map((col) => ({
            header: col.header,
            cell: (row: any) => <span className="text-sm text-slate-600 font-medium">{row[col.key] || "-"}</span>,
          }))}
          data={currentData}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
