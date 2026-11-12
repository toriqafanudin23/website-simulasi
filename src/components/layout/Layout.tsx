import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function Layout() {
  const { pathname, hash } = useLocation();

  // Pindah halaman: ke atas. Tautan dengan #bagian: gulir ke bagian itu.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Lompat ke isi
      </a>
      <Navbar />
      <main id="isi" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
