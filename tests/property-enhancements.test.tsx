// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PriceInput from "@/components/admin/PriceInput";
import PropertyFlagsFields from "@/components/admin/PropertyFlagsFields";
import PropertyCard from "@/components/PropertyCard";
import MemberWelcomeModal from "@/components/auth/MemberWelcomeModal";
import PropertyDetailsForm from "@/components/admin/PropertyDetailsForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
beforeEach(() => {
  sessionStorage.clear();
  HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("formatted price and listing controls", () => {
  it("formats thousands while sending only numeric digits and both admin settings", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<PropertyDetailsForm><PriceInput defaultValue={300000000} /><PropertyFlagsFields /><button>Simpan</button></PropertyDetailsForm>);
    const input = screen.getByRole("textbox", { name: "Harga (Rp)" }) as HTMLInputElement;
    expect(input.value).toBe("300.000.000");
    fireEvent.change(input, { target: { value: "1250000000" } });
    expect(input.value).toBe("1.250.000.000");
    fireEvent.change(screen.getByRole("combobox", { name: /Hot Item/ }), { target: { value: "true" } });
    fireEvent.change(screen.getByRole("combobox", { name: /Negosiasi Harga/ }), { target: { value: "true" } });
    await act(async () => fireEvent.click(screen.getByText("Simpan")));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).fields).toEqual({ price: "1250000000", isHotItem: "true", isNegotiable: "true" });
  });
  it("supports paste, zero, clearing and deleting through a separator", () => {
    render(<form><PriceInput /></form>);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2.500.000" } }); expect(input.value).toBe("2.500.000");
    fireEvent.change(input, { target: { value: "1234" } });
    input.setSelectionRange(2, 2);
    fireEvent.keyDown(input, { key: "Backspace" }); expect(input.value).toBe("234");
    fireEvent.change(input, { target: { value: "1234" } }); input.setSelectionRange(1, 1);
    fireEvent.keyDown(input, { key: "Delete" }); expect(input.value).toBe("134");
    fireEvent.change(input, { target: { value: "000" } }); expect(input.value).toBe("0");
    fireEvent.change(input, { target: { value: "" } }); expect(input.value).toBe(""); expect(input.checkValidity()).toBe(false);
  });
  it.each([false, true])("renders Hot Item/Nego only when enabled=%s", (enabled) => {
    render(<PropertyCard item={{ id: "1", title: "Tanah Batu", slug: "tanah-batu", propertyType: "tanah", generalLocation: "Batu", price: 300000000, coverId: null, isHotItem: enabled, isNegotiable: enabled }} />);
    expect(Boolean(screen.queryByText("Hot Item"))).toBe(enabled);
    expect(Boolean(screen.queryByText("Nego"))).toBe(enabled);
    expect(screen.getByText("Rp 300.000.000")).toBeTruthy();
  });
});

describe("member welcome prompt", () => {
  it("opens for a guest with signup/login links and stays dismissed in the current session", () => {
    const { unmount } = render(<MemberWelcomeModal isMember={false} />);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("link", { name: /Daftar Member Gratis/ }).getAttribute("href")).toBe("/auth/daftar");
    expect(screen.getByRole("link", { name: "Masuk" }).getAttribute("href")).toBe("/auth/masuk");
    fireEvent.click(screen.getByRole("button", { name: "Lihat listing dulu" }));
    expect(screen.queryByRole("dialog")).toBeNull(); expect(document.body.style.overflow).toBe("");
    unmount(); render(<MemberWelcomeModal isMember={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("does not appear for a logged-in member", () => {
    render(<MemberWelcomeModal isMember />);
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("can be dismissed with Escape and remains usable when storage is blocked", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<MemberWelcomeModal isMember={false} />);
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe(""); spy.mockRestore();
  });
});
