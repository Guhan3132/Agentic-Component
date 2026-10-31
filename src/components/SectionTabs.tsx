"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: string };

/**
 * In-page tabs pinned under the site header. Same white strip and same content width as the
 * header, so the first tab lines up with the logo, and the section being read is highlighted.
 */
export function SectionTabs({ tabs, className }: { tabs: Tab[]; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = tabs[0]?.id;
      for (const t of tabs) {
        const el = document.getElementById(t.id);
        // 150px: site header (56) + this bar (~50) + breathing room
        if (el && el.getBoundingClientRect().top <= 150) current = t.id;
      }
      setActive(atBottom ? tabs[tabs.length - 1]?.id : current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [tabs]);

  return (
    <nav aria-label="Page sections" className={cn("sticky top-14 z-20 border-b border-zinc-200 bg-white", className)}>
      <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto overflow-y-hidden px-5 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            aria-current={active === t.id ? "true" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 py-3.5 transition-colors",
              active === t.id ? "border-zinc-900 font-medium text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900",
            )}
          >
            {t.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
