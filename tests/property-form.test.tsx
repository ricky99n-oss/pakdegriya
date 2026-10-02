// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PropertyDetailsForm from "@/components/admin/PropertyDetailsForm";
import PropertyPublishForm from "@/components/admin/PropertyPublishForm";
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); refresh.mockClear(); });

describe("property edit form", () => {
  it("sends the edited price as JSON and refreshes only after a confirmed save", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, message: "Perubahan properti berhasil disimpan." }), { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<PropertyDetailsForm>
      <input type="hidden" name="propertyId" value="d3966a45-feb6-4dd3-b5f6-c6205cb804e8" />
      <input aria-label="Harga" type="number" name="price" defaultValue="900000000" />
      <button type="submit">Simpan Perubahan</button>
    </PropertyDetailsForm>);
    fireEvent.change(screen.getByLabelText("Harga"), { target: { value: "800000000" } });
    await act(async () => { fireEvent.click(screen.getByText("Simpan Perubahan")); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/properties");
    expect(JSON.parse(init.body)).toEqual({ operation: "updateProperty", fields: { propertyId: "d3966a45-feb6-4dd3-b5f6-c6205cb804e8", price: "800000000" } });
    expect(screen.getByRole("status").textContent).toContain("berhasil disimpan");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("preserves the entered price when the server rejects the save", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: "Sesi admin sudah berakhir." }), { status: 400, headers: { "Content-Type": "application/json" } })));
    render(<PropertyDetailsForm><input aria-label="Harga" name="price" defaultValue="800000000" /><button type="submit">Simpan</button></PropertyDetailsForm>);
    await act(async () => { fireEvent.click(screen.getByText("Simpan")); });
    expect(screen.getByRole("alert").textContent).toContain("Sesi admin");
    expect((screen.getByLabelText("Harga") as HTMLInputElement).value).toBe("800000000");
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("property publish form", () => {
  it.each([true, false])("sends publication through JSON and refreshes only on success=%s", async (success) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(success
      ? { success: true, message: "Properti berhasil diterbitkan." }
      : { success: false, error: "Status publikasi gagal disimpan." }), {
      status: success ? 200 : 400, headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(<PropertyPublishForm>
      <input type="hidden" name="propertyId" value="d3966a45-feb6-4dd3-b5f6-c6205cb804e8" />
      <input type="hidden" name="publishStatus" value="published" />
      <button type="submit">Terbitkan ke Publik</button>
    </PropertyPublishForm>);
    await act(async () => { fireEvent.click(screen.getByText("Terbitkan ke Publik")); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/properties");
    expect(JSON.parse(init.body)).toEqual({ operation: "setPublishStatus", fields: {
      propertyId: "d3966a45-feb6-4dd3-b5f6-c6205cb804e8", publishStatus: "published",
    } });
    expect(screen.getByRole(success ? "status" : "alert").textContent).toContain(success ? "berhasil diterbitkan" : "gagal disimpan");
    expect(refresh).toHaveBeenCalledTimes(success ? 1 : 0);
  });
});
