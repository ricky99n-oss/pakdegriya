import { MEMBER_HEADERS, memberExportRows, type Member } from "./members";

export async function createMemberExcel(members: Member[]) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Pakde Griya";
  const sheet = workbook.addWorksheet("Member");
  sheet.addRow(MEMBER_HEADERS);
  for (const row of memberExportRows(members)) sheet.addRow(row); // Strings, never formulas.
  [6, 30, 38, 23, 16, 20].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A2F1B" } };
  sheet.getColumn(4).numFmt = "@";
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "F1" };
  return workbook.xlsx.writeBuffer();
}
export async function createMemberPdf(members: Member[]) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18); doc.text("Pakde Griya - Data Member", 14, 18);
  doc.setFontSize(10); doc.text(`${members.length} akun | Diekspor ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`, 14, 25);
  autoTable(doc, { head: [MEMBER_HEADERS], body: memberExportRows(members), startY: 32, margin: { top: 15, bottom: 18 }, styles: { fontSize: 9, overflow: "linebreak", cellPadding: 3 }, headStyles: { fillColor: [74, 47, 27] }, columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 57 }, 2: { cellWidth: 78 }, 3: { cellWidth: 45 }, 4: { cellWidth: 30 }, 5: { cellWidth: 47 } } });
  for (let page = 1; page <= doc.getNumberOfPages(); page++) { doc.setPage(page); doc.setFontSize(9); doc.text(`Halaman ${page} / ${doc.getNumberOfPages()}`, 280, 203, { align: "right" }); }
  return doc.output("arraybuffer");
}
export function downloadMemberFile(data: ArrayBuffer | Uint8Array, type: string, extension: string) {
  const bytes = new Uint8Array(data instanceof ArrayBuffer ? data : data.slice());
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement("a"); link.href = url; link.download = `pakdegriya-member-${new Date().toISOString().slice(0, 10)}.${extension}`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
