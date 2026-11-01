import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Preview } from "@/components/Previews";
import { LATEST_RELEASE, type Pattern } from "@/registry";

/**
 * Hierarchy, in reading order: the live miniature, the name, then one line of what it does.
 * The category is metadata, so it is a small tag on the miniature, not competing with the name.
 */
export function PatternCard({ pattern }: { pattern: Pattern }) {
  return (
    <Link
      href={`/components/${pattern.slug}`}
      className="group block rounded-3xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-zinc-900/40 focus-visible:ring-offset-4 active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 transition-colors group-hover:border-zinc-300 group-hover:bg-zinc-200/60">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200/80">
          {pattern.category}
        </span>
        {pattern.since === LATEST_RELEASE && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm">New</span>
        )}
        <div className="size-full transition-transform duration-300 ease-out group-hover:scale-[1.03]">
          <Preview slug={pattern.slug} />
        </div>
      </div>

      <div className="mt-4 px-0.5">
        <h3 className="flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-zinc-900">
          {pattern.title}
          <ArrowUpRight
            size={16}
            aria-hidden
            className="shrink-0 -translate-x-1 text-zinc-400 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
          />
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500">{pattern.summary}</p>
      </div>
    </Link>
  );
}
