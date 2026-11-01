import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ChevronRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/CodeBlock";
import { CopyMenu } from "@/components/CopyMenu";
import { depsOf } from "@/lib/prompts";
import { RemixButton, SaveButton } from "@/components/PageActions";
import { PatternCard } from "@/components/PatternCard";
import { SectionTabs } from "@/components/SectionTabs";
import { getPattern, patterns } from "@/registry";
import { demos } from "@/registry/demos";
import { tags, usage } from "@/registry/usage";

export function generateStaticParams() {
  return patterns.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPattern((await params).slug);
  if (!p) return {};
  const url = `/components/${p.slug}`;
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: url },
    openGraph: { type: "article", title: `${p.title} · Agentic UI`, description: p.summary, url },
    twitter: { card: "summary_large_image", title: `${p.title} · Agentic UI`, description: p.summary },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = getPattern(slug);
  if (!pattern) notFound();
  const Demo = demos[slug];
  const file = `${slug}.tsx`;
  const code = readFileSync(join(process.cwd(), "src/registry", slug, file), "utf8");
  const mine = new Set(tags[slug] ?? []);
  const score = (p: (typeof patterns)[number]) => (p.category === pattern.category ? 10 : 0) + (tags[p.slug] ?? []).filter((t) => mine.has(t)).length;
  const more = patterns
    .filter((p) => p.slug !== slug)
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, 3)
    .map((x) => x.p);

  return (
    <main className="pb-24 pt-8">
      <div className="mx-auto max-w-6xl px-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-900">
          Patterns
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span>{pattern.category}</span>
        <ChevronRight size={14} aria-hidden />
        <span className="text-zinc-900">{pattern.title}</span>
      </nav>

      {/* Header stack, then a full-width preview */}
      <header className="mt-8 max-w-3xl">
        <h1 className="flex items-center gap-3 text-4xl font-semibold sm:text-5xl">
          {pattern.title}
          <a href="#about" aria-label="Why this pattern" title="Why this pattern" className="text-amber-500 hover:text-amber-600">
            <Lightbulb size={22} />
          </a>
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-600">{pattern.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <Link href="/#patterns" className="flex items-center gap-2 font-medium text-zinc-900 hover:text-zinc-600">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-zinc-900 text-[10px] font-semibold text-white">
              {pattern.category.slice(0, 2).toUpperCase()}
            </span>
            {pattern.category}
          </Link>
          <span className="text-zinc-500">by</span>
          <span className="flex items-center gap-2 font-medium text-zinc-900">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-700">A</span>
            Agentic UI
          </span>
        </div>

        <div className="mt-6">
          <CopyMenu slug={slug} title={pattern.title} code={code} usage={usage[slug]}>
            <SaveButton slug={slug} />
            <RemixButton slug={slug} title={pattern.title} code={code} usage={usage[slug]} />
          </CopyMenu>
        </div>
      </header>

      <section className="mt-8">
        <Demo />
      </section>

      </div>

      <SectionTabs
        className="mt-12"
          tabs={[
            { id: "about", label: "About" },
            { id: "code", label: "Code" },
            { id: "props", label: "Props" },
            { id: "a11y", label: "Accessibility" },
          ]}
        />

      <div className="mx-auto max-w-6xl px-5">
      {/* Body: tabs-style sections on the left, metadata on the right */}
      <div className="mt-2 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">

          <section id="about" className="scroll-mt-32 pt-8">
            <p className="max-w-2xl leading-relaxed text-zinc-700">{pattern.why}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Built with React and Tailwind. Copy the prompt and paste it into Claude Code, Cursor or Lovable: your agent adds{" "}
              {pattern.title} to your project and fits it to your theme.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <List title="Do" items={pattern.dos} tone="text-emerald-700" mark="✓" />
              <List title="Don't" items={pattern.donts} tone="text-rose-700" mark="✕" />
            </div>
          </section>

          <section id="code" className="scroll-mt-32 pt-12">
            <h2 className="mb-1 text-lg font-medium">Code</h2>
            <p className="mb-4 text-sm text-zinc-500">
              Install with the CLI, or copy the file into <code className="text-zinc-800">components/ui</code>. It needs{" "}
              {depsOf(code).map((d, i) => (
                <span key={d}>
                  {i > 0 && ", "}
                  <code className="text-zinc-800">{d}</code>
                </span>
              ))}{" "}
              and a <code className="text-zinc-800">cn</code> helper.
            </p>
            <div className="space-y-4">
              <CodeBlock code={`npx shadcn@latest add "https://agentic-component.vercel.app/r/${slug}.json"`} file="terminal" />
              <CodeBlock code={usage[slug]} file="Usage.tsx" />
              <CodeBlock code={code.replaceAll('"@/lib/cn"', '"@/lib/utils"')} file={file} />
            </div>
          </section>

          <section id="props" className="scroll-mt-32 pt-12">
            <h2 className="mb-3 text-lg font-medium">Props</h2>
            <ul className="space-y-2 sm:hidden">
              {pattern.props.map((r) => (
                <li key={r.name} className="rounded-xl border border-zinc-200 bg-white p-3.5">
                  <p className="font-mono text-sm text-emerald-700">{r.name}</p>
                  <p className="mt-1 break-words font-mono text-xs text-zinc-500">{r.type}</p>
                  <p className="mt-1.5 text-sm text-zinc-700">{r.desc}</p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Prop</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {pattern.props.map((r) => (
                    <tr key={r.name} className="border-t border-zinc-200">
                      <td className="px-4 py-2 font-mono text-emerald-700">{r.name}</td>
                      <td className="px-4 py-2 font-mono text-zinc-500">{r.type}</td>
                      <td className="px-4 py-2 text-zinc-700">{r.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="a11y" className="scroll-mt-32 pt-12">
            <h2 className="mb-3 text-lg font-medium">Accessibility</h2>
            <ul className="list-disc space-y-1 pl-5 text-zinc-600">
              {pattern.a11y.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-8 text-sm lg:pt-12">
          <Meta title="Tags">
            <div className="flex flex-wrap gap-2">
              {(tags[slug] ?? []).map((t) => (
                <span key={t} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700">
                  {t}
                </span>
              ))}
            </div>
          </Meta>
          <Meta title="Author">Agentic UI</Meta>
          <Meta title="Category">{pattern.category}</Meta>
          <Meta title="Added in">v{pattern.since ?? "0.1.0"}</Meta>
          <Meta title="License">MIT License</Meta>
        </aside>
      </div>

      <section className="mt-20">
        <h2 className="mb-5 text-xl font-semibold tracking-tight">Related patterns</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((p) => (
            <PatternCard key={p.slug} pattern={p} />
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}

function Meta({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</h3>
      <div className="text-zinc-800">{children}</div>
    </div>
  );
}

function List({ title, items, tone, mark }: { title: string; items: string[]; tone: string; mark: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className={`mb-2 text-sm font-medium ${tone}`}>{title}</h3>
      <ul className="space-y-1.5 text-sm text-zinc-700">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className={tone} aria-hidden>
              {mark}
            </span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
