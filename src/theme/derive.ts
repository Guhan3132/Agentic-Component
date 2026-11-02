/**
 * Colour maths and the brand theme, with no dependencies and no React. It is used by AgenticTheme,
 * by the website, and by the build that writes the installable presets.
 */

export type ThemeTokens = { primary: string; "primary-foreground": string; ring: string } & Partial<Record<"muted" | "accent" | "border" | "input", string>>;

export type ThemeReport = {
  /** Contrast of the text on the primary button, per mode. WCAG AA for text is 4.5. */
  onPrimary: { light: number; dark: number };
  /** Contrast of the focus ring against the card, per mode. WCAG AA for UI is 3. */
  ring: { light: number; dark: number };
  /** True when the brand colour had to be darkened or lightened to reach those targets. */
  adjusted: { light: boolean; dark: boolean };
  /** Plain-language notes, for example when the brand is close to a status colour. */
  warnings: string[];
};

export type DerivedTheme = { brand: string; light: ThemeTokens; dark: ThemeTokens; report: ThemeReport };

// ---------- colour maths (sRGB, OKLab) ----------

type Rgb = [number, number, number];
type Oklch = { l: number; c: number; h: number };

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/** Accepts "#rgb", "#rrggbb" and the same without the #. Returns null when it is not a colour. */
export function parseHex(input: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export const toHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function luminance(rgb: Rgb) {
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function toOklch(rgb: Rgb): Oklch {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

function fromOklch({ l: L, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin: Rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return lin.map((v) => fromLinear(clamp(v))) as Rgb;
}

/** Moves a colour's lightness (keeping hue and chroma) until it reaches `min` contrast against `against`. */
function reach(color: Rgb, against: Rgb, min: number, direction: "darker" | "lighter"): { rgb: Rgb; changed: boolean } {
  if (contrast(color, against) >= min) return { rgb: color, changed: false };
  const base = toOklch(color);
  const step = direction === "darker" ? -0.01 : 0.01;
  let l = base.l;
  let out = color;
  for (let i = 0; i < 100; i++) {
    l = clamp(l + step);
    // Rounded to whole channels, because that is the colour that is actually shown and measured.
    out = fromOklch({ ...base, l }).map(Math.round) as Rgb;
    if (contrast(out, against) >= min) break;
  }
  return { rgb: out, changed: true };
}

// ---------- the theme ----------

const WHITE: Rgb = [255, 255, 255];
const INK: Rgb = [24, 24, 27];
const BLACK: Rgb = [0, 0, 0];
const LIGHT_CARD = WHITE;
const DARK_CARD: Rgb = [23, 23, 23];

/**
 * The text colour for a given background: white if it passes AA (4.5), else near-black if that does,
 * else whichever of pure black and white is stronger. One of them always reaches 4.5.
 */
const onColour = (bg: Rgb): Rgb => {
  if (contrast(WHITE, bg) >= 4.5) return WHITE;
  if (contrast(INK, bg) >= 4.5) return INK;
  return contrast(BLACK, bg) >= contrast(WHITE, bg) ? BLACK : WHITE;
};

// Hues (OKLCH degrees) of the status colours, to warn when a brand would be mistaken for one.
const STATUS_HUES: [string, number][] = [
  ["danger red", 17],
  ["warning amber", 49],
  ["success green", 166],
];

// Default neutral lightness, so "tint neutrals" keeps the layout and only adds a trace of the brand hue.
const NEUTRALS = {
  light: { muted: 0.97, accent: 0.97, border: 0.922, input: 0.922 },
  dark: { muted: 0.269, accent: 0.269, border: 0.3, input: 0.35 },
};

export function deriveTheme(hex: string, options: { tintNeutrals?: boolean } = {}): DerivedTheme | null {
  const brand = parseHex(hex);
  if (!brand) return null;
  const h = toOklch(brand);

  // Light: the brand is the primary colour. The ring must stand out from the card (3:1), so it may be darkened.
  const ringLight = reach(brand, LIGHT_CARD, 3, "darker");
  // Dark: a brand that sinks into a dark card is lightened until it is visible (3:1).
  const neutralBrand = h.c < 0.03;
  const lifted = reach(brand, DARK_CARD, 3, "lighter");
  const primaryDark = lifted.changed && neutralBrand ? { rgb: [229, 229, 229] as Rgb, changed: false } : lifted;

  const tint = (mode: "light" | "dark") =>
    options.tintNeutrals ? Object.fromEntries(Object.entries(NEUTRALS[mode]).map(([k, l]) => [k, toHex(fromOklch({ l, c: 0.012, h: h.h }))])) : {};

  const light: ThemeTokens = { primary: toHex(brand), "primary-foreground": toHex(onColour(brand)), ring: toHex(ringLight.rgb), ...tint("light") };
  const dark: ThemeTokens = { primary: toHex(primaryDark.rgb), "primary-foreground": toHex(onColour(primaryDark.rgb)), ring: toHex(primaryDark.rgb), ...tint("dark") };

  const warnings: string[] = [];
  if (h.c > 0.08) {
    for (const [name, hue] of STATUS_HUES) {
      const diff = Math.min(Math.abs(h.h - hue), 360 - Math.abs(h.h - hue));
      if (diff < 18) warnings.push(`This colour is close to the ${name} used for status. Messages and badges may look like branding, so check them.`);
    }
  }
  if (ringLight.changed) warnings.push("The focus ring is darker than your brand colour in light mode, so it stays visible on white.");
  if (primaryDark.changed) warnings.push("In dark mode the brand colour is lightened, so it stays visible on dark surfaces.");

  return {
    brand: toHex(brand),
    light,
    dark,
    report: {
      onPrimary: { light: round(contrast(parseHex(light.primary)!, parseHex(light["primary-foreground"])!)), dark: round(contrast(parseHex(dark.primary)!, parseHex(dark["primary-foreground"])!)) },
      ring: { light: round(contrast(parseHex(light.ring)!, LIGHT_CARD)), dark: round(contrast(parseHex(dark.ring)!, DARK_CARD)) },
      adjusted: { light: ringLight.changed, dark: primaryDark.changed },
      warnings,
    },
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

const declarations = (tokens: ThemeTokens) =>
  Object.entries(tokens)
    .map(([k, v]) => `--${k}:${v}`)
    .join(";");

/** CSS to paste into a global stylesheet. `.dark` follows the shadcn convention. */
export function themeCss(theme: DerivedTheme, selectors: { light?: string; dark?: string } = {}) {
  const { light = ":root", dark = ".dark" } = selectors;
  return `${light} { ${declarations(theme.light).replaceAll(";", "; ")}; }\n${dark} { ${declarations(theme.dark).replaceAll(";", "; ")}; }\n`;
}
