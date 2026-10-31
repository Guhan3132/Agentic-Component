import { CircleCheck, CircleHelp, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  /** 0 to 1 */
  value: number;
  reason?: string;
  className?: string;
};

const LEVELS = [
  { min: 0.8, label: "High confidence", style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", Icon: CircleCheck },
  { min: 0.5, label: "Medium confidence", style: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30", Icon: CircleHelp },
  { min: 0, label: "Low confidence", style: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30", Icon: TriangleAlert },
];

/** Label plus icon plus text: never colour alone, so it works for colour-blind users. */
export function ConfidenceBadge({ value, reason, className }: Props) {
  const level = LEVELS.find((l) => value >= l.min)!;
  const pct = Math.round(value * 100);
  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <span
        title={reason}
        className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm", level.style)}
      >
        <level.Icon size={14} aria-hidden />
        {level.label}
        <span className="tabular-nums opacity-70">{pct}%</span>
      </span>
      {reason && <span className="max-w-md text-sm text-muted-foreground">{reason}</span>}
      {value < 0.5 && <span className="max-w-md text-sm text-rose-700 dark:text-rose-300">Please verify this before acting on it.</span>}
    </div>
  );
}
