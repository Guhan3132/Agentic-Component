"use client";

import { useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { FeedbackThumbs } from "./feedback-thumbs";

export default function Demo() {
  const [log, setLog] = useState<string>("");
  return (
    <DemoFrame>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 text-foreground">
          Your refund window is 30 days from delivery, per the current returns policy.
        </div>
        <FeedbackThumbs onSubmit={(v, r) => setLog(`onSubmit("${v}", ${JSON.stringify(r)})`)} />
        <p className="font-mono text-xs text-muted-foreground">{log || "Callback output appears here."}</p>
      </div>
    </DemoFrame>
  );
}
