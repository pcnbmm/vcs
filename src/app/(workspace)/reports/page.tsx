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
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import {
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Download,
  Search,
} from "lucide-react";

// Register Thai Font for PDF (Optional but recommended if data has Thai text)
// Font.register({
//   family: 'THSarabunNew',
//   src: 'https://cdn.jsdelivr.net/gh/googlefonts/sarabun/fonts/ttf/Sarabun-Regular.ttf'
// });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica", // Use Sarabun if registered
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "16.6%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f3f4f6",
    padding: 5,
  },
  tableCol: {
    width: "16.6%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
  },
  tableCell: {
    fontSize: 10,
  },
});

// PDF Document Component
const MyPDFDocument = ({ data }: { data: any[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>รายงานการจองรถ (Vehicle Booking Report)</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>ID</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>ผู้จอง</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>วันที่เดินทาง</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>สถานที่</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>ทะเบียนรถ</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>สถานะ</Text>
          </View>
        </View>
        {data.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.request_id}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.user_name}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.journey_date}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.journey_place}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.car_number}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.status_name}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    // In production, fetch this from an API route that uses prisma
    const mockData = [
      {
        request_id: 1,
        user_name: "สมชาย ใจดี",
        journey_date: "2024-03-25",
        journey_place: "กรุงเทพฯ - ชลบุรี",
        car_number: "กข 1234",
        status_name: "อนุมัติแล้ว",
      },
      {
        request_id: 2,
        user_name: "สมหญิง รักเรียน",
        journey_date: "2024-03-26",
        journey_place: "กรุงเทพฯ - นนทบุรี",
        car_number: "ฮพ 5678",
        status_name: "รออนุมัติ",
      },
      {
        request_id: 3,
        user_name: "มานะ อดทน",
        journey_date: "2024-03-27",
        journey_place: "กรุงเทพฯ - ปทุมธานี",
        car_number: "รย 9012",
        status_name: "เสร็จสิ้น",
      },
    ];
    setData(mockData);
    setLoading(false);
  }, []);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Booking Report");

    worksheet.columns = [
      { header: "ID", key: "request_id", width: 10 },
      { header: "ผู้จอง", key: "user_name", width: 20 },
      { header: "วันที่เดินทาง", key: "journey_date", width: 15 },
      { header: "สถานที่", key: "journey_place", width: 30 },
      { header: "ทะเบียนรถ", key: "car_number", width: 15 },
      { header: "สถานะ", key: "status_name", width: 15 },
    ];

    worksheet.addRows(data);

    // Apply some styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "Vehicle_Booking_Report.xlsx");
  };

  const exportToWord = async () => {
    const doc = new DocxDocument({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "รายงานการจองรถ (Vehicle Booking Report)",
                  bold: true,
                  size: 32,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    "ID",
                    "ผู้จอง",
                    "วันที่เดินทาง",
                    "สถานที่",
                    "ทะเบียนรถ",
                    "สถานะ",
                  ].map(
                    (header) =>
                      new DocxTableCell({
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: header, bold: true })],
                          }),
                        ],
                        shading: { fill: "E0E0E0" },
                      })
                  ),
                }),
                ...data.map(
                  (item) =>
                    new DocxTableRow({
                      children: [
                        item.request_id.toString(),
                        item.user_name,
                        item.journey_date,
                        item.journey_place,
                        item.car_number,
                        item.status_name,
                      ].map(
                        (text) =>
                          new DocxTableCell({
                            children: [new Paragraph(text)],
                          })
                      ),
                    })
                ),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Vehicle_Booking_Report.docx");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">รายงาน (Reports)</h1>
          <p className="text-gray-500 mt-2">จัดการและส่งออกข้อมูลรายงานการจองรถ</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm font-medium"
          >
            <FileSpreadsheet size={18} />
            Export Excel
          </button>

          <button
            onClick={exportToWord}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm font-medium"
          >
            <FileText size={18} />
            Export Word
          </button>

          <PDFDownloadLink
            document={<MyPDFDocument data={data} />}
            fileName="Vehicle_Booking_Report.pdf"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm font-medium"
          >
            {/* @ts-ignore */}
            {({ loading }) => (
              <>
                <FileIcon size={18} />
                {loading ? "กำลังสร้าง PDF..." : "Export PDF"}
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-semibold text-gray-700">รายการข้อมูลทั้งหมด</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ค้นหาข้อมูล..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ผู้จอง</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่เดินทาง</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">สถานที่</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ทะเบียนรถ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.request_id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900"># {item.request_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{item.user_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.journey_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.journey_place}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{item.car_number}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status_name === "อนุมัติแล้ว" ? "bg-green-100 text-green-700" :
                        item.status_name === "รออนุมัติ" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {item.status_name}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    ไม่มีข้อมูลแสดงผล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>แสดงทั้งสิ้น {data.length} รายการ</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white transition-colors" disabled>Previous</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white font-medium text-blue-600">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}