"use client";

import { Check, Copy, Link2, Palette, Pipette, RotateCcw, TriangleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { BRAND_CSS_KEY, BRAND_CSS_VERSION, BRAND_KEY, BRAND_STYLE_ID } from "@/lib/head-scripts";
import { deriveTheme, onColour, parseColor, themeCss, toHex, wcagLevel } from "@/theme/derive";
import { DEFAULT_BRAND, sampleThemes } from "@/theme/samples";

export type Brand = { hex: string; tint: boolean; white: boolean };
const DEFAULT: Brand = { hex: DEFAULT_BRAND, tint: false, white: false };
const isDefault = (b: Brand) => b.hex === DEFAULT.hex && !b.tint && !b.white;

// Slightly more specific than the stylesheet's own :root, .light and .dark, so this wins whatever the
// load order. .light and .dark also cover single previews forced into the other theme.
const SELECTORS = { light: "html:root, html:root .light", dark: "html:root.dark, html:root .dark" };

/** Reads what a person typed: hex with or without #, rgb(), hsl() or oklch(). */
export const readColour = (v: string) => parseColor(/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v.trim()) ? `#${v.trim().replace(/^#/, "")}` : v);

// ---- a tiny external store, so the choice survives navigation and needs no effect to load ----

let current: Brand | null = null;
const listeners = new Set<() => void>();

function readInitial(): Brand {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("brand");
    const rgb = fromUrl ? readColour(fromUrl) : null;
    if (rgb) return { hex: toHex(rgb), tint: params.get("tint") === "1", white: params.get("text") === "white" };
    const saved = JSON.parse(localStorage.getItem(BRAND_KEY) ?? "null");
    if (saved && readColour(saved.hex)) return { hex: toHex(readColour(saved.hex)!), tint: !!saved.tint, white: !!saved.white };
  } catch {
    /* storage blocked or bad data: use the default */
  }
  return DEFAULT;
}

export const getBrand = () => (current ??= readInitial());
const getServerBrand = () => DEFAULT;
export const subscribeBrand = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const deriveFor = (b: Brand) => deriveTheme(b.hex, { tintNeutrals: b.tint, textColor: b.white ? "white" : "auto" });
const cssFor = (b: Brand) => {
  if (isDefault(b)) return "";
  const t = deriveFor(b);
  return t ? themeCss(t, SELECTORS) : "";
};

let frame = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

/** Restyles on the next frame, and saves and updates the address a moment later, so dragging stays smooth. */
function setBrand(next: Brand) {
  current = next;
  listeners.forEach((l) => l());
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const css = cssFor(next);
    let el = document.getElementById(BRAND_STYLE_ID);
    if (css) {
      if (!el) {
        el = document.createElement("style");
        el.id = BRAND_STYLE_ID;
        document.head.appendChild(el);
      }
      el.textContent = css;
    } else el?.remove();
  });
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (isDefault(next)) {
        localStorage.removeItem(BRAND_KEY);
        localStorage.removeItem(BRAND_CSS_KEY);
      } else {
        localStorage.setItem(BRAND_KEY, JSON.stringify(next));
        localStorage.setItem(BRAND_CSS_KEY, JSON.stringify({ v: BRAND_CSS_VERSION, css: cssFor(next) }));
      }
      window.history.replaceState(window.history.state, "", shareUrl(next, window.location.href));
    } catch {
      /* the colour still applies for this visit */
    }
  }, 250);
}

function shareUrl(b: Brand, href: string) {
  const url = new URL(href);
  for (const k of ["brand", "tint", "text"]) url.searchParams.delete(k);
  if (!isDefault(b)) {
    url.searchParams.set("brand", b.hex.slice(1));
    if (b.tint) url.searchParams.set("tint", "1");
    if (b.white) url.searchParams.set("text", "white");
  }
  return url.toString();
}

/** A colour typed so far is applied only once it is complete, so "#7c3" does not flash green on the way to "#7c3aed". */
const completeWhileTyping = (v: string) => /^#?[0-9a-f]{6}$/i.test(v.trim()) || /\)\s*$/.test(v.trim());

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

/** The current brand, for other parts of the site (the Tokens page). The default on the server. */
export function useBrand() {
  return useSyncExternalStore(subscribeBrand, getBrand, getServerBrand);
}

/**
 * Pick a brand colour and watch the components change: everywhere they appear on the site, and in the
 * live preview inside the panel, in light and dark. The site's own chrome stays neutral.
 */
export function BrandSwitcher() {
  const brand = useBrand();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const swatches = useRef<(HTMLButtonElement | null)[]>([]);
  const canPick = useSyncExternalStore(
    () => () => {},
    () => "EyeDropper" in window,
    () => false,
  );

  // The saved choice is applied before paint by a script in <head>. A shared link (?brand=), or saved
  // CSS from an older version, is applied here.
  useEffect(() => {
    const b = getBrand();
    if (!isDefault(b)) setBrand(b);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Focus starts on the chosen colour, so the arrow keys work straight away.
    const i = Math.max(
      0,
      sampleThemes.findIndex((s) => s.hex === getBrand().hex),
    );
    swatches.current[i]?.focus();
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const theme = useMemo(() => deriveFor(brand), [brand]);
  const text = draft ?? brand.hex;
  const draftRgb = draft !== null ? readColour(draft) : null;
  const invalid = draft !== null && draft.trim() !== "" && !draftRgb && completeWhileTyping(draft);
  const selected = sampleThemes.findIndex((s) => s.hex === brand.hex);

  const commitDraft = () => {
    if (draftRgb) setBrand({ ...brand, hex: toHex(draftRgb) });
    setDraft(null);
  };

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  // One Tab stop for the ten colours; arrows move through the 5 x 2 grid and choose as they go.
  const onSwatchKey = (e: KeyboardEvent, i: number) => {
    const move: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 5, ArrowUp: -5 };
    let next = i;
    if (e.key in move) next = (i + move[e.key] + sampleThemes.length) % sampleThemes.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = sampleThemes.length - 1;
    else return;
    e.preventDefault();
    setBrand({ ...brand, hex: sampleThemes[next].hex });
    swatches.current[next]?.focus();
  };

  const pickFromScreen = async () => {
    try {
      const result = await new (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper().open();
      const rgb = readColour(result.sRGBHex);
      if (rgb) setBrand({ ...brand, hex: toHex(rgb) });
    } catch {
      /* cancelled */
    }
  };

  // The playground fills the screen, so the control moves up there, clear of the composer.
  const place = pathname === "/playground" ? "left-3 top-16" : "bottom-4 left-4";

  return (
    <div ref={box} className={`fixed z-40 ${place}`}>
      <button
        ref={trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Brand colour"
        className="flex h-11 items-center gap-2 rounded-full border border-border bg-card pl-2.5 pr-3 text-sm font-medium text-foreground shadow-lg hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:pr-3.5"
      >
        <span className="size-5 rounded-full ring-1 ring-foreground/15" style={{ background: brand.hex }} aria-hidden />
        <Palette size={15} aria-hidden /> <span className="hidden sm:inline">Brand</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Brand colour"
          className={cn(
            "material-pop absolute left-0 max-h-[calc(100dvh-6rem)] w-[21rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border p-4",
            pathname === "/playground" ? "top-full mt-2" : "bottom-full mb-2",
          )}
        >
          <p className="text-sm font-medium text-foreground">Try your brand colour</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Every component on the site follows it. The preview shows light and dark.</p>

          <div role="radiogroup" aria-label="Sample colours" className="mt-3 grid grid-cols-5 gap-2">
            {sampleThemes.map((s, i) => {
              const on = brand.hex === s.hex;
              const clash = deriveTheme(s.hex)?.report.statusClash;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    swatches.current[i] = el;
                  }}
                  role="radio"
                  aria-checked={on}
                  tabIndex={on || (selected === -1 && i === 0) ? 0 : -1}
                  onClick={() => {
                    setDraft(null);
                    setBrand({ ...brand, hex: s.hex });
                  }}
                  onKeyDown={(e) => onSwatchKey(e, i)}
                  aria-label={`${s.name} ${s.hex}${clash ? `, close to the ${clash} colour` : ""}`}
                  title={`${s.name} ${s.hex}${clash ? ` (close to ${clash})` : ""}`}
                  className="grid aspect-square place-items-center rounded-xl ring-1 ring-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:min-h-11"
                  style={{ background: s.hex }}
                >
                  {on && <Check size={16} color={toHex(onColour(readColour(s.hex)!))} aria-hidden />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="sr-only" htmlFor="brand-colour">
              Brand colour: hex, rgb(), hsl() or oklch()
            </label>
            <input
              id="brand-colour"
              value={text}
              onChange={(e) => {
                const v = e.target.value;
                setDraft(v);
                if (!completeWhileTyping(v)) return;
                const rgb = readColour(v);
                if (rgb) setBrand({ ...brand, hex: toHex(rgb) });
              }}
              onKeyDown={(e) => e.key === "Enter" && commitDraft()}
              onBlur={commitDraft}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={invalid}
              aria-describedby={invalid ? "brand-colour-error" : undefined}
              placeholder="#7c3aed or oklch(0.54 0.25 293)"
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 font-mono text-base text-foreground outline-none focus:border-ring sm:h-9 sm:text-sm"
            />
            <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-foreground/15 sm:size-9" style={{ background: brand.hex }}>
              <span className="sr-only">Pick a colour</span>
              <input
                type="color"
                value={brand.hex}
                onChange={(e) => {
                  setDraft(null);
                  setBrand({ ...brand, hex: e.target.value });
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            {canPick && (
              <button
                onClick={pickFromScreen}
                aria-label="Pick a colour from the screen"
                title="Pick a colour from the screen"
                className="grid size-11 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground sm:size-9"
              >
                <Pipette size={15} aria-hidden />
              </button>
            )}
          </div>
          {invalid && (
            <p id="brand-colour-error" role="alert" className="mt-1.5 text-xs text-danger">
              Use a colour like #7c3aed, rgb(124 58 237), hsl(262 83% 58%) or oklch(0.54 0.25 293).
            </p>
          )}

          {/* Live preview: the same tokens the components read, in both themes side by side. */}
          <div aria-hidden inert className="mt-3 grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((mode) => (
              <div key={mode} className={cn(mode, "space-y-2 rounded-xl border border-border bg-background p-2.5 text-foreground")}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{mode}</p>
                <span className="inline-flex rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">Approve</span>
                <span className="block truncate rounded-md border border-input bg-card px-2 py-1 text-xs text-muted-foreground outline-2 outline-offset-1 outline-ring">Focused field</span>
                <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full w-3/5 rounded-full bg-primary" />
                </span>
                <span className="flex gap-2 text-[11px]">
                  <span className="text-success">Done</span>
                  <span className="text-warning">Review</span>
                  <span className="text-danger">Failed</span>
                </span>
              </div>
            ))}
          </div>

          {theme && (
            <dl className="mt-3 space-y-1 rounded-lg bg-muted/60 p-2.5 text-xs">
              <div aria-hidden className="grid grid-cols-[1fr_4.75rem_4.75rem] gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span>Contrast</span>
                <span>Light</span>
                <span>Dark</span>
              </div>
              <Row label="Button text" light={theme.report.onPrimary.light} dark={theme.report.onPrimary.dark} kind="text" />
              <Row label="Focus ring" light={theme.report.ring.light} dark={theme.report.ring.dark} kind="ui" />
            </dl>
          )}
          {theme && theme.report.warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {theme.report.warnings.map((w) => (
                <li key={w} className="flex gap-1.5 text-xs text-warning">
                  <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden /> {w}
                </li>
              ))}
            </ul>
          )}

          <Toggle id="brand-white" label="Keep white text on buttons" on={brand.white} onChange={(white) => setBrand({ ...brand, white })} />
          <Toggle id="brand-tint" label="Tint neutrals with the brand" on={brand.tint} onChange={(tint) => setBrand({ ...brand, tint })} />

          <div className="mt-3 flex flex-wrap gap-2">
            <Btn onClick={() => theme && copy("css", themeCss(theme))} done={copied === "css"} disabled={!theme}>
              Copy CSS
            </Btn>
            <Btn
              onClick={() => theme && copy("code", `<AgenticTheme brand="${theme.brand}"${brand.white ? ' textColor="white"' : ""}${brand.tint ? " tintNeutrals" : ""}>\n  {/* your components */}\n</AgenticTheme>`)}
              done={copied === "code"}
              disabled={!theme}
            >
              Copy wrapper
            </Btn>
            <Btn onClick={() => copy("link", shareUrl(brand, window.location.href))} done={copied === "link"} icon={<Link2 size={13} aria-hidden />}>
              Copy link
            </Btn>
            {!isDefault(brand) && (
              <button
                onClick={() => {
                  setDraft(null);
                  setBrand(DEFAULT);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted pointer-coarse:min-h-11"
              >
                <RotateCcw size={13} aria-hidden /> Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, light, dark, kind }: { label: string; light: number; dark: number; kind: "text" | "ui" }) {
  const cell = (n: number, mode: string) => {
    const level = wcagLevel(n, kind);
    return (
      <dd className={cn("font-mono", level === "Fail" ? "text-danger" : "text-success")}>
        {n.toFixed(1)} {level}
        <span className="sr-only"> in {mode} mode</span>
      </dd>
    );
  };
  return (
    <div className="grid grid-cols-[1fr_4.75rem_4.75rem] items-center gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      {cell(light, "light")}
      {cell(dark, "dark")}
    </div>
  );
}

function Toggle({ id, label, on, onChange }: { id: string; label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-foreground/80">
      <span id={id}>{label}</span>
      <button
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors pointer-coarse:h-7 pointer-coarse:w-12 pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-2 pointer-coarse:before:content-['']",
          on ? "bg-foreground" : "bg-input",
        )}
      >
        <span className={cn("absolute left-0.5 top-0.5 size-4 rounded-full bg-background shadow transition-transform pointer-coarse:size-6", on && "translate-x-4 pointer-coarse:translate-x-5")} />
      </button>
    </div>
  );
}

function Btn({ children, onClick, done, disabled, icon }: { children: React.ReactNode; onClick: () => void; done: boolean; disabled?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 pointer-coarse:min-h-11"
    >
      {done ? <Check size={13} aria-hidden /> : (icon ?? <Copy size={13} aria-hidden />)} {done ? "Copied" : children}
    </button>
  );
}
