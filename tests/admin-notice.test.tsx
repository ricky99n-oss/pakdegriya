// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ActionForm from "@/components/admin/ActionForm";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("admin notification timeout", () => {
  it.each([true, false])("dismisses success=%s after three seconds without a click", async (success) => {
    render(<ActionForm action={async () => ({ success, message: "Selesai" })}><button type="submit">Simpan</button></ActionForm>);
    await act(async () => { fireEvent.click(screen.getByText("Simpan")); });
    expect(screen.getByText("Selesai")).toBeTruthy();
    act(() => vi.advanceTimersByTime(2999)); expect(screen.getByText("Selesai")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1)); expect(screen.queryByText("Selesai")).toBe(null);
  });
  it("restarts the timeout for the next response and cleans up on unmount", async () => {
    const { unmount } = render(<ActionForm action={async () => ({ success: true, message: "Selesai" })}><button type="submit">Simpan</button></ActionForm>);
    await act(async () => { fireEvent.click(screen.getByText("Simpan")); });
    act(() => vi.advanceTimersByTime(2000));
    await act(async () => { fireEvent.click(screen.getByText("Simpan")); });
    act(() => vi.advanceTimersByTime(1500)); expect(screen.getByText("Selesai")).toBeTruthy();
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});
