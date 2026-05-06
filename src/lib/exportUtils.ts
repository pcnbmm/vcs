import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } from "docx";

export const exportToExcel = async (
  filename: string,
  sheetName: string,
  columns: any[],
  data: any[]
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;

  data.forEach((row) => {
    worksheet.addRow(row);
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToDocx = async (
  filename: string,
  title: string,
  headers: string[],
  data: string[][]
) => {
  const tableRows = [
    new TableRow({
      children: headers.map(
        (header) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
          })
      ),
    }),
    ...data.map(
      (row) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [new Paragraph({ text: cell })],
              })
          ),
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 28 })],
            spacing: { after: 200 },
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.docx`);
};

export const exportToPdf = (title: string, headers: string[], data: string[][]) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to print PDF");
    return;
  }

  let html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #333; }
        h2 { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #fdfdfd; }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
