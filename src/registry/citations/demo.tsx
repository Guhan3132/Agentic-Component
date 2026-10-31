"use client";

import { useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { Citations, type CitationSource } from "./citations";

const sources: CitationSource[] = [
  { id: 1, title: "State of Team Planning 2026", url: "https://example.com/team-planning", publisher: "Workplace Research", quote: "61% of teams that plan on Mondays report fewer mid-week changes." },
  { id: 2, title: "Offsite budgets, explained", url: "https://example.com/offsite-budgets", publisher: "Event Weekly", quote: "A two-day offsite for 8 people averages between $2,400 and $3,100 including lodging." },
  { id: 3, title: "Lisbon venue guide", url: "https://example.com/lisbon-venues", publisher: "City Notes", quote: "Most houses near Alfama require a 2-night minimum in November." },
];

const scenarios: (Scenario & { text: string; sources: CitationSource[] })[] = [
  {
    id: "cited",
    label: "Fully cited",
    hint: "Open a number to read the exact quote. The list below follows along.",
    script: [],
    text: "A two-day offsite for 8 people usually costs $2,400 to $3,100 [2]. Teams that plan on Mondays see fewer mid-week changes [1], and most houses near Alfama need a 2-night minimum in November [3].",
    sources,
  },
  {
    id: "mixed",
    label: "One claim unsourced",
    hint: "A claim with no source is flagged in the text, not hidden, and called out underneath.",
    script: [],
    text: "A two-day offsite for 8 people usually costs $2,400 to $3,100 [2]. Prices rise about 15% in peak season [?], and most houses near Alfama need a 2-night minimum in November [3].",
    sources: [sources[1], sources[2]],
  },
  {
    id: "none",
    label: "No sources",
    hint: "Honest beats confident: say plainly that nothing backs this answer.",
    script: [],
    text: "I'd budget around $3,000 for a two-day offsite for 8 people [?]. I could not find a source for that, so treat it as a rough estimate [?].",
    sources: [],
  },
];

export default function Demo() {
  const [id, setId] = useState("cited");
  const [run, setRun] = useState(0);
  const s = scenarios.find((x) => x.id === id)!;

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        setId(n);
        setRun((r) => r + 1);
      }}
      onReplay={() => setRun((r) => r + 1)}
    >
      <Citations key={id + run} text={s.text} sources={s.sources} />
    </DemoFrame>
  );
}
