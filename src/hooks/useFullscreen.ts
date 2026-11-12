import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/** Safari (iPad, macOS) masih memakai awalan webkit. iPhone tidak punya API ini untuk elemen biasa. */
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const nativeElement = () => document.fullscreenElement ?? (document as FullscreenDocument).webkitFullscreenElement ?? null;

const exitNative = async () => {
  if (!nativeElement()) return;
  if (document.exitFullscreen) await document.exitFullscreen();
  else await (document as FullscreenDocument).webkitExitFullscreen?.();
};

/**
 * Layar penuh untuk satu elemen. Bila peramban tidak mendukung (iPhone), `full` tetap bernilai true
 * dan tampilan memenuhi jendela; pemanggil cukup menata ulang dirinya saat `full` menyala.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [full, setFull] = useState(false);
  const native = useRef(false);

  const enter = useCallback(async () => {
    setFull(true);
    const el = ref.current as FullscreenElement | null;
    try {
      if (el?.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
      else await el?.webkitRequestFullscreen?.();
    } catch {
      /* ditolak: tampilan tetap memenuhi jendela */
    }
    native.current = nativeElement() !== null;
  }, [ref]);

  const exit = useCallback(async () => {
    setFull(false);
    native.current = false;
    try {
      await exitNative();
    } catch {
      /* abaikan */
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (native.current && !nativeElement()) {
        native.current = false;
        setFull(false);
      }
    };
    // Layar penuh bawaan menangani Escape sendiri; Escape hanya perlu untuk tampilan pengganti.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !native.current) setFull(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
      if (native.current) void exitNative().catch(() => undefined);
    };
  }, []);

  return { full, enter, exit };
}
