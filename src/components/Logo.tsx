import { useId } from "react";

/** The Agentic UI mark: a four-point spark on a violet to pink tile. Same drawing as the favicon. */
export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Agentic UI" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <path d="M32 12l5 15 15 5-15 5-5 15-5-15-15-5 15-5z" fill="#fff" />
    </svg>
  );
}
