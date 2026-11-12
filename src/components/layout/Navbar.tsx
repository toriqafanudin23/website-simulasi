import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "../ui/Logo";

const LINKS = [
  { to: "/simulasi", label: "Simulasi" },
  { to: "/#cara-pakai", label: "Cara pakai" },
  { to: "/tentang", label: "Tentang" },
];

/** Logo dan nama, garis hitam tebal, lalu tagline. Gaya kepala halaman sama dengan blog. */
export function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <header className="container-page pt-8 md:pt-[60px]">
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-5">
        <Logo />
        <nav aria-label="Utama" className="flex w-full justify-between text-[17px] md:w-auto md:gap-7 md:justify-start">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center underline-offset-4 transition-colors hover:text-link hover:underline ${
                  isActive && l.to === pathname ? "text-link underline" : "text-ink"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div aria-hidden="true" className="mt-6 h-1.5 bg-ink md:mt-[30px]" />
      <p className="py-6 font-serif text-[17px] italic text-ink md:pb-8 md:pt-7">Simulasi Matematika ala Avan</p>
      {isHome ? null : <div aria-hidden="true" className="h-1 bg-ink" />}
    </header>
  );
}
