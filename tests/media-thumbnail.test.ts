import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadMediaThumbnail, queueMediaThumbnail } from "@/lib/media-thumbnail";

const decode = vi.fn();
const signal = () => new AbortController().signal;
const response = () => new Response("image-bytes", { headers: { "Content-Type": "image/jpeg", "X-Media-Size": "11" } });

beforeEach(() => {
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  decode.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("Image", class { src = ""; decode = decode; });
  let sequence = 0;
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:fixture-${++sequence}`);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

describe("complete thumbnail transfers", () => {
  it("decodes only after the complete file is received", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response()));
    expect(await loadMediaThumbnail("/api/media/id?thumbnail=2", signal())).toBe("blob:fixture-1");
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ size: 11 }));
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it("retries a short response once without ever decoding its incomplete bytes", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("short", { headers: { "Content-Type": "image/jpeg", "X-Media-Size": "100" } })).mockResolvedValueOnce(response());
    vi.stubGlobal("fetch", fetchMock);
    await loadMediaThumbnail("/api/media/id?thumbnail=2", signal());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/media/id?thumbnail=2&retry=1", expect.objectContaining({ cache: "no-store", credentials: "same-origin" }));
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it("retries a stream that disconnects after sending response headers", async () => {
    const body = new ReadableStream({ start(controller) { controller.error(new Error("stream disconnected")); } });
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(body, { headers: { "Content-Type": "image/jpeg" } })).mockResolvedValueOnce(response());
    vi.stubGlobal("fetch", fetchMock);
    await loadMediaThumbnail("/api/media/id", signal());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 404])("does not retry HTTP %s", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("denied", { status }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadMediaThumbnail("/api/media/id", signal())).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(decode).not.toHaveBeenCalled();
  });

  it("stops at two attempts on a persistent Worker failure", async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Response("worker failed", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadMediaThumbnail("/api/media/id", signal())).rejects.toThrow("belum dapat dimuat utuh");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("releases every corrupt decoded blob and does not display it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(response));
    decode.mockRejectedValue(new Error("corrupt image"));
    await expect(loadMediaThumbnail("/api/media/id", signal())).rejects.toThrow("unggah ulang");
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([["blob:fixture-1"], ["blob:fixture-2"]]);
  });

  it("cancels work when the thumbnail is unmounted", async () => {
    const controller = new AbortController(); controller.abort();
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(loadMediaThumbnail("/api/media/id", controller.signal)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits requests to two and removes cancelled thumbnails from the waiting list", async () => {
    const pending: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn((url: string) => { void url; return new Promise<Response>((resolve) => pending.push(resolve)); });
    vi.stubGlobal("fetch", fetchMock);
    const first = queueMediaThumbnail("/api/media/1", signal());
    const second = queueMediaThumbnail("/api/media/2", signal());
    const cancelled = new AbortController();
    const third = queueMediaThumbnail("/api/media/3", cancelled.signal);
    const thirdCheck = expect(third).rejects.toThrow();
    const fourth = queueMediaThumbnail("/api/media/4", signal());
    cancelled.abort();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    pending[0](response()); pending[1](response());
    await Promise.all([first, second, thirdCheck]);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[2][0]).toBe("/api/media/4");
    pending[2](response()); await fourth;
  });
});
