import type { Tool } from "@/lib/prompts";

/** Simplified marks for each tool, drawn to read at 18px. They are approximations, not official brand assets. */
const size = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true } as const;

function ClaudeCode() {
  return (
    <svg {...size}>
      <g stroke="#D97757" strokeWidth="2.4" strokeLinecap="round">
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const r1 = i % 2 ? 4.5 : 3.5;
          const r2 = i % 2 ? 9 : 10.5;
          return <line key={i} x1={12 + Math.cos(a) * r1} y1={12 + Math.sin(a) * r1} x2={12 + Math.cos(a) * r2} y2={12 + Math.sin(a) * r2} />;
        })}
      </g>
    </svg>
  );
}

function Codex() {
  return (
    <svg {...size}>
      <defs>
        <linearGradient id="codex-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7AA2FF" />
          <stop offset="1" stopColor="#6C4CF0" />
        </linearGradient>
      </defs>
      <path
        d="M7.5 5.5c1.2-1.9 4-2.4 5.9-1.2 2-.6 4.3.6 4.9 2.7 1.9.9 2.7 3.3 1.7 5.2.4 2.1-1 4.2-3.1 4.6-1 1.9-3.5 2.6-5.4 1.5-2.1.4-4.2-1-4.5-3.1-1.9-1-2.5-3.5-1.3-5.3-.5-1.9.5-3.7 1.8-4.4Z"
        fill="url(#codex-g)"
      />
      <path d="m9 10 2.5 2L9 14M13 14.2h2.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Cursor() {
  return (
    <svg {...size}>
      <path d="M12 2.5 20.5 7.4v9.2L12 21.5 3.5 16.6V7.4L12 2.5Z" fill="#4b4b4f" />
      <path d="M12 2.5 20.5 7.4 12 12.3 3.5 7.4 12 2.5Z" fill="#8d8d93" />
      <path d="M12 12.3v9.2l-8.5-4.9V7.4L12 12.3Z" fill="#2c2c30" />
      <path d="M12 12.3 20.5 7.4v9.2L12 21.5v-9.2Z" fill="#6a6a70" />
    </svg>
  );
}

function Replit() {
  return (
    <svg {...size}>
      <g fill="#F26207">
        <rect x="3.5" y="3" width="7.5" height="6" rx="1.8" />
        <rect x="13" y="3" width="7.5" height="6" rx="1.8" />
        <rect x="3.5" y="10.5" width="7.5" height="6" rx="1.8" />
        <rect x="13" y="10.5" width="7.5" height="6" rx="1.8" />
        <rect x="3.5" y="18" width="7.5" height="3" rx="1.5" />
      </g>
    </svg>
  );
}

function Lovable() {
  return (
    <svg {...size}>
      <defs>
        <linearGradient id="lov-g" x1="0.2" y1="1" x2="0.9" y2="0">
          <stop offset="0" stopColor="#4F7BFF" />
          <stop offset="0.5" stopColor="#FF4E8B" />
          <stop offset="1" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
      <path d="M12 21.5c-5.6-3.9-8.5-7-8.5-10.6C3.5 7.9 5.7 5.8 8.4 5.8c1.5 0 2.9.7 3.6 1.9.7-1.2 2.1-1.9 3.6-1.9 2.7 0 4.9 2.1 4.9 5.1 0 3.6-2.9 6.7-8.5 10.6Z" fill="url(#lov-g)" />
    </svg>
  );
}

function Bolt() {
  return (
    <svg {...size}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#0b0b0d" stroke="currentColor" strokeOpacity=".25" />
      <path d="M13.5 5.5 8 13h3.6l-1 5.5L16 11h-3.6l1.1-5.5Z" fill="#fff" />
    </svg>
  );
}

function V0() {
  return (
    <svg {...size}>
      <text x="1.5" y="17" fontSize="13" fontWeight="700" fill="currentColor" fontFamily="ui-sans-serif, system-ui" letterSpacing="-1">
        v0
      </text>
    </svg>
  );
}

export const toolIcons: Record<Tool, () => React.ReactElement> = {
  "claude-code": ClaudeCode,
  codex: Codex,
  cursor: Cursor,
  replit: Replit,
  lovable: Lovable,
  bolt: Bolt,
  v0: V0,
};
