import Link from "next/link";
import { Gallery } from "@/components/Gallery";
import { HeroDemo } from "@/components/HeroDemo";
import { PixelField } from "@/components/PixelField";
import { categories, patterns } from "@/registry";

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-10 sm:pb-20 sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white py-1 pl-1 pr-3 text-xs font-medium text-zinc-700">
          <span className="grid h-5 w-5 place-items-center rounded bg-orange-500 text-[10px] font-semibold text-white">A</span>
          {patterns.length} patterns, MIT licensed
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl font-semibold sm:text-6xl">Agent UI patterns you can click, break and copy</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
          Open-source React components that show how a good agent behaves: streaming, trust, approval and input. Every one runs as a live
          simulation, in light and dark, on desktop and mobile.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#patterns" className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-medium hover:bg-zinc-50 sm:py-2.5">
            Browse patterns
          </Link>
          <Link href="/playground" className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 sm:py-2.5">
            Try the full flow
          </Link>
        </div>

        {/* Banner with a live composer. Only the background is clipped, so the menus of the composer can open freely. */}
        <div className="relative mt-12 h-[24rem] sm:h-[36rem]">
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <PixelField className="h-full w-full" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-white/25 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-x-3 bottom-4 mx-auto max-w-2xl sm:inset-x-6 sm:bottom-10">
            <HeroDemo />
          </div>
        </div>
      </section>

      <Gallery patterns={patterns} categories={categories} />
    </main>
  );
}
