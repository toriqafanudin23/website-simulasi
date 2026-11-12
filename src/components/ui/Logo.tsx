import { Link } from "react-router-dom";

/** Tanda 1729: kotak hitam dengan parabola sky yang tergambar ulang saat disorot, dan nama situs besar seperti di blog. */
export function Logo() {
  return (
    <Link to="/" aria-label="1729, beranda" className="group flex items-center gap-4 md:gap-6">
      <svg viewBox="0 0 80 80" aria-hidden="true" className="size-14 shrink-0 md:size-20">
        <rect width="80" height="80" className="fill-ink" />
        <path
          d="M12 66 C 30 66, 32 14, 40 14 S 50 66, 68 66"
          fill="none"
          pathLength={1}
          strokeWidth={5}
          className="stroke-curve [stroke-dasharray:1] [stroke-dashoffset:0] group-hover:animate-[logo-draw_0.9s_ease-out]"
        />
      </svg>
      <span className="font-sans text-[28px] leading-tight text-black md:text-[48px]">1729</span>
    </Link>
  );
}
