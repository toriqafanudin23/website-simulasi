import { createElement, useCallback, type CSSProperties, type ElementType, type ReactNode } from "react";

// Satu observer dipakai bersama oleh semua elemen.
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.in = "true";
          observer?.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
  }
  return observer;
}

interface RevealProps {
  as?: ElementType;
  /** Jeda dalam milidetik, untuk memberi urutan antar elemen. */
  delay?: number;
  className?: string;
  children?: ReactNode;
  id?: string;
}

/** Membungkus konten agar naik dan memudar masuk saat pertama kali terlihat. */
export function Reveal({ as = "div", delay = 0, className = "", children, id }: RevealProps) {
  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const io = getObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  return createElement(
    as,
    { ref, id, className: `reveal ${className}`, style: { "--d": `${delay}ms` } as CSSProperties },
    children,
  );
}
