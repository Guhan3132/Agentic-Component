import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Why Agentic UI exists, what is in it, how it differs from general component libraries, and how to contribute.",
  alternates: { canonical: "/about" },
};

const repo = "https://github.com/Guhan3132/Agentic-Component";

const compare = [
  ["Focus", "General UI components", "Agent-specific UX patterns"],
  ["Previews", "Mostly static", "Live scripted simulations with failure scenarios"],
  ["Guidance", "Code and props", "Why it works, do and don't, accessibility notes"],
  ["Copy", "Code, CLI, prompt", "Code, shadcn CLI, prompts for 7 AI tools"],
  ["Size", "Thousands of components", "A small, curated set that grows"],
  ["Community", "Open submissions", "Open source; pattern requests and PRs welcome"],
];

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-14 text-2xl font-semibold tracking-tight">{children}</h2>;
}

export default function About() {
  return (
    <main className="pb-24 pt-10">
      <div className="mx-auto max-w-3xl px-5">
        <h1 className="text-4xl font-semibold sm:text-5xl">About Agentic UI</h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          Most AI interfaces look the same and fail the same way: a blank wait, a confident wrong answer, an action that ran before anyone
          agreed to it. Agentic UI is a small library of patterns that handle those moments well, and you can feel each one before you
          build it.
        </p>

        <H2>What you get</H2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-600">
          <li>
            <strong className="text-zinc-900">Live patterns.</strong> Streaming, trust, tool use, planning, approval, steering, chat and
            input. Each runs as a scripted simulation, so no API key is needed.
          </li>
          <li>
            <strong className="text-zinc-900">Failure on purpose.</strong> Every pattern has scenarios that break: a dropped stream, a
            destructive action, an answer with no sources.
          </li>
          <li>
            <strong className="text-zinc-900">Code you own.</strong> One file per pattern. Install it with the shadcn CLI or copy it, with
            light and dark themes, desktop and mobile layouts.
          </li>
        </ul>

        <H2>How it compares with 21st.dev</H2>
        <p className="mt-4 text-zinc-600">
          21st.dev is a large community marketplace of general components, and it is great for that. Agentic UI is narrower on purpose: it
          is about how an agent should behave on screen.
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium" />
                <th className="px-4 py-2 font-medium">21st.dev</th>
                <th className="px-4 py-2 font-medium">Agentic UI</th>
              </tr>
            </thead>
            <tbody>
              {compare.map(([k, a, b]) => (
                <tr key={k} className="border-t border-zinc-200">
                  <th scope="row" className="px-4 py-2 font-medium text-zinc-900">
                    {k}
                  </th>
                  <td className="px-4 py-2 text-zinc-600">{a}</td>
                  <td className="px-4 py-2 text-zinc-700">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2>Roadmap</H2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-600">
          <li>More patterns: tool permissions, multi-agent status, voice input</li>
          <li>Versioned registry so you can pin a pattern</li>
          <li>An npm package for people who prefer installing to copying</li>
          <li>Community pattern submissions</li>
        </ul>

        <H2>Privacy</H2>
        <p className="mt-4 text-zinc-600">
          The site uses anonymous page-view analytics from Vercel. There are no cookies, no accounts and no tracking of individuals. Saved
          patterns stay in your browser.
        </p>

        <H2>Contribute</H2>
        <p className="mt-4 text-zinc-600">
          The project is MIT licensed. Read the{" "}
          <a className="text-zinc-900 underline" href={`${repo}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
            contributing guide
          </a>
          , open a{" "}
          <a className="text-zinc-900 underline" href={`${repo}/issues/new/choose`} target="_blank" rel="noreferrer">
            pattern request
          </a>
          , or send a pull request.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={repo} target="_blank" rel="noreferrer" className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 sm:py-2.5">
            Star on GitHub
          </a>
          <Link href="/get-started" className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-medium hover:bg-zinc-50 sm:py-2.5">
            Get started
          </Link>
        </div>
      </div>
    </main>
  );
}
