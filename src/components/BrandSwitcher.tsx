"use client";

import { Check, Copy, Palette, RotateCcw, TriangleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { deriveTheme, parseHex, themeCss, toHex } from "@/theme/agentic-theme";
import { DEFAULT_BRAND, sampleThemes } from "@/theme/samples";

const STORE_KEY = "agentic-ui:brand";
const CSS_KEY = "agentic-ui:brand-css";
const STYLE_ID = "agentic-brand";

type Brand = { hex: string; tint: boolean };
const DEFAULT: Brand = { hex: DEFAULT_BRAND, tint: false };

// ---- a tiny external store, so the choice survives navigation and needs no effect to load ----

let current: Brand | null = null;
const listeners = new Set<() => void>();

function readInitial(): Brand {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("brand");
    if (fromUrl && parseHex(fromUrl)) return { hex: toHex(parseHex(fromUrl)!), tint: params.get("tint") === "1" };
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
    if (saved && parseHex(saved.hex)) return { hex: toHex(parseHex(saved.hex)!), tint: !!saved.tint };
  } catch {
    /* storage blocked or bad data: use the default */
  }
  return DEFAULT;
}

const getBrand = () => (current ??= readInitial());
const getServerBrand = () => DEFAULT;
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Writes the override stylesheet, remembers the choice, and keeps the address bar shareable. */
function setBrand(next: Brand) {
  current = next;
  const isDefault = next.hex === DEFAULT.hex && !next.tint;
  const theme = isDefault ? null : deriveTheme(next.hex, { tintNeutrals: next.tint });
  // Slightly more specific than the stylesheet's own :root and .dark, so this wins whatever the load order.
  const css = theme ? themeCss(theme, { light: "html:root", dark: "html:root.dark, html:root .dark" }) : "";
  try {
    let el = document.getElementById(STYLE_ID);
    if (css) {
      if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
      }
      el.textContent = css;
    } else el?.remove();
    if (isDefault) {
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem(CSS_KEY);
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      localStorage.setItem(CSS_KEY, css);
    }
    const url = new URL(window.location.href);
    if (isDefault) {
      url.searchParams.delete("brand");
      url.searchParams.delete("tint");
    } else {
      url.searchParams.set("brand", next.hex.slice(1));
      if (next.tint) url.searchParams.set("tint", "1");
      else url.searchParams.delete("tint");
    }
    window.history.replaceState(null, "", url);
  } catch {
    /* the colour still applies for this visit */
  }
  listeners.forEach((l) => l());
}

/**
 * Pick a brand colour and watch the components change. Only the tokens the components read are
 * overridden, so the site's own header, footer and text stay as they are. Sits on the left, out of
 * the way of the composer and the chat controls.
 */
export function BrandSwitcher() {
  const brand = useSyncExternalStore(subscribe, getBrand, getServerBrand);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // The saved choice is applied before paint by a script in <head>; a shared link (?brand=) is applied here.
  useEffect(() => {
    const b = getBrand();
    if (b.hex !== DEFAULT.hex || b.tint) setBrand(b);
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => {
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

  const theme = useMemo(() => deriveTheme(brand.hex, { tintNeutrals: brand.tint }), [brand]);
  const text = draft ?? brand.hex;
  const invalid = draft !== null && !parseHex(draft);
  const isDefault = brand.hex === DEFAULT.hex && !brand.tint;

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  const pass = (n: number, min: number) => (n >= min ? "Pass" : "Low");
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
        className="flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white pl-2.5 pr-3.5 text-sm font-medium text-zinc-800 shadow-lg hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        <span className="size-5 rounded-full ring-1 ring-black/10" style={{ background: brand.hex }} aria-hidden />
        <Palette size={15} aria-hidden /> <span className="hidden sm:inline">Brand</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Brand colour"
          className={`material-pop absolute left-0 w-[19rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 p-4 ${pathname === "/playground" ? "top-full mt-2" : "bottom-full mb-2"}`}
        >
          <p className="text-sm font-medium text-zinc-900">Try your brand colour</p>
          <p className="mt-0.5 text-xs text-zinc-500">Changes the components and previews. Use the sun and moon on a preview to see dark.</p>

          <div role="group" aria-label="Sample colours" className="mt-3 grid grid-cols-5 gap-2">
            {sampleThemes.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setDraft(null);
                  setBrand({ ...brand, hex: s.hex });
                }}
                aria-pressed={brand.hex === s.hex}
                aria-label={`${s.name} ${s.hex}${s.note ? `. ${s.note}` : ""}`}
                title={`${s.name} ${s.hex}`}
                className="grid aspect-square place-items-center rounded-xl ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 pointer-coarse:min-h-11"
                style={{ background: s.hex }}
              >
                {brand.hex === s.hex && <Check size={16} color={parseHex(s.hex)![0] * 0.3 + parseHex(s.hex)![1] * 0.59 + parseHex(s.hex)![2] * 0.11 > 150 ? "#18181b" : "#fff"} aria-hidden />}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="sr-only" htmlFor="brand-hex">
              Brand colour as a hex code
            </label>
            <input
              id="brand-hex"
              value={text}
              onChange={(e) => {
                const v = e.target.value;
                setDraft(v);
                const rgb = parseHex(v);
                if (rgb) setBrand({ ...brand, hex: toHex(rgb) });
              }}
              onBlur={() => setDraft(null)}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={invalid}
              aria-describedby={invalid ? "brand-hex-error" : undefined}
              placeholder="#7c3aed"
              className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-base text-zinc-900 outline-none focus:border-zinc-400 sm:h-9 sm:text-sm"
            />
            <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10 sm:size-9" style={{ background: brand.hex }}>
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
          </div>
          {invalid && (
            <p id="brand-hex-error" role="alert" className="mt-1.5 text-xs text-rose-700">
              Use a hex code like #7c3aed or 7c3aed.
            </p>
          )}

          {theme && (
            <dl className="mt-3 space-y-1 rounded-lg bg-zinc-50 p-2.5 text-xs">
              <div aria-hidden className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-2 text-[10px] uppercase tracking-wide text-zinc-400">
                <span>Contrast</span>
                <span>Light</span>
                <span>Dark</span>
              </div>
              <Row label="Button text" light={theme.report.onPrimary.light} dark={theme.report.onPrimary.dark} min={4.5} pass={pass} />
              <Row label="Focus ring" light={theme.report.ring.light} dark={theme.report.ring.dark} min={3} pass={pass} />
            </dl>
          )}
          {theme && theme.report.warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {theme.report.warnings.map((w) => (
                <li key={w} className="flex gap-1.5 text-xs text-amber-800">
                  <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden /> {w}
                </li>
              ))}
            </ul>
          )}

          <label className="mt-3 flex items-center justify-between gap-3 text-sm text-zinc-700">
            Tint neutrals with the brand
            <button
              role="switch"
              aria-checked={brand.tint}
              aria-label="Tint neutrals with the brand"
              onClick={() => setBrand({ ...brand, tint: !brand.tint })}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors pointer-coarse:h-7 pointer-coarse:w-12 pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-2 pointer-coarse:before:content-[''] ${brand.tint ? "bg-zinc-900" : "bg-zinc-300"}`}
            >
              <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white transition-transform pointer-coarse:size-6 ${brand.tint ? "translate-x-4 pointer-coarse:translate-x-5" : ""}`} />
            </button>
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <Btn onClick={() => theme && copy("css", themeCss(theme))} done={copied === "css"} disabled={!theme}>
              Copy CSS
            </Btn>
            <Btn onClick={() => theme && copy("code", `<AgenticTheme brand="${theme.brand}">\n  {/* your components */}\n</AgenticTheme>`)} done={copied === "code"} disabled={!theme}>
              Copy wrapper
            </Btn>
            {!isDefault && (
              <button
                onClick={() => {
                  setDraft(null);
                  setBrand(DEFAULT);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 pointer-coarse:min-h-11"
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

function Row({ label, light, dark, min, pass }: { label: string; light: number; dark: number; min: number; pass: (n: number, min: number) => string }) {
  const cell = (n: number) => (
    <span className={pass(n, min) === "Pass" ? "text-emerald-700" : "text-rose-700"}>
      {n.toFixed(1)} {pass(n, min) === "Pass" ? "✓" : "low"}
    </span>
  );
  return (
    <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2">
      <dt className="text-zinc-600">{label}</dt>
      <dd className="font-mono">
        {cell(light)}
        <span className="sr-only"> in light mode</span>
      </dd>
      <dd className="font-mono">
        {cell(dark)}
        <span className="sr-only"> in dark mode</span>
      </dd>
    </div>
  );
}

function Btn({ children, onClick, done, disabled }: { children: React.ReactNode; onClick: () => void; done: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-200 disabled:opacity-50 pointer-coarse:min-h-11"
    >
      {done ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />} {done ? "Copied" : children}
    </button>
  );
}
