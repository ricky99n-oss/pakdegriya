import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { createMemberExcel, createMemberPdf } from "@/lib/member-export";
const rows = [{ id: "1", name: '=HYPERLINK("evil")', email: "test@example.test", phone: "+628123456789", role: "member", created_at: "2026-09-29T10:00:00Z" }];
describe("member export files", () => {
  it("creates a genuine XLSX with literal names and WhatsApp stored as text", async () => {
    const bytes = await createMemberExcel(rows);
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
    const sheet = workbook.getWorksheet("Member")!;
    expect(sheet.getCell("B2").value).toBe(rows[0].name);
    expect(sheet.getCell("D2").value).toBe("+628123456789");
    expect(sheet.getCell("D2").type).toBe(ExcelJS.ValueType.String);
    expect(sheet.rowCount).toBe(2);
  });
  it("creates a multipage PDF for long member lists", async () => {
    const bytes = await createMemberPdf(Array.from({ length: 100 }, (_, i) => ({ ...rows[0], id: String(i), name: `Member ${i}` })));
    const pdf = new TextDecoder().decode(bytes);
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect((pdf.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(1);
    expect(pdf).toContain("Pakde Griya");
  });
});
