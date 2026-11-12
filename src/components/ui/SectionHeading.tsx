import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  /** Tautan di kanan judul. */
  action?: ReactNode;
  className?: string;
}

/** Garis hitam tebal di atas judul bagian, seperti di blog. */
export function SectionHeading({ title, action, className = "" }: SectionHeadingProps) {
  return (
    <div className={className}>
      <div aria-hidden="true" className="h-1 bg-ink" />
      <div className="flex items-baseline justify-between gap-6 pt-5">
        <h2 className="text-[26px] leading-[1.15] md:text-[32px]">{title}</h2>
        {action}
      </div>
    </div>
  );
}
