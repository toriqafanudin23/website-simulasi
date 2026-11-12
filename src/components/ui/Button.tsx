import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "soft" | "inverse";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-ink",
  soft: "bg-tint text-ink hover:bg-ink hover:text-white",
  inverse: "bg-white text-ink hover:bg-ink hover:text-white",
};

const BASE = "inline-flex min-h-12 items-center justify-center px-[26px] font-sans text-base font-semibold transition-colors duration-150";

export const buttonClass = (variant: Variant = "primary", extra = "") => `${BASE} ${VARIANT[variant]} ${extra}`;

interface ButtonProps {
  to: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Button({ to, variant = "primary", children, className = "" }: ButtonProps) {
  return (
    <Link to={to} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}
