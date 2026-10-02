// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreateSceneForm from "@/components/admin/CreateSceneForm";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("panorama registration form", () => {
  it.each(["button", "keyboard"])("sends panorama identity through JSON on %s submission and refreshes the editor", async (method) => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: true, message: "Ruangan berhasil ditambahkan." }));
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(
      <CreateSceneForm>
        <input type="hidden" name="propertyId" value="property-id" />
        <input type="hidden" name="mediaId" value="panorama-id" />
        <input name="name_panorama-id" defaultValue="Lokasi" required />
        <button type="submit">+</button>
      </CreateSceneForm>
    );
    if (method === "button") fireEvent.click(screen.getByRole("button"));
    else fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/tour");
    expect(JSON.parse(options.body)).toEqual({ operation: "createScene", fields: {
      propertyId: "property-id", mediaId: "panorama-id", "name_panorama-id": "Lokasi",
    } });
    expect(screen.getByRole("status").textContent).toContain("Ruangan berhasil ditambahkan.");
  });
});
