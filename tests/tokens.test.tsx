import { describe, expect, it } from "vitest";
import tokenData from "@/lib/tokens.json";
import { contrast, parseColor, type Rgb } from "@/theme/derive";

type Mode = "light" | "dark";
const value = (name: string, mode: Mode) => {
  const t = tokenData.tokens.find((x) => x.name === name);
  if (!t) throw new Error(`no token ${name}`);
  return parseColor(t[mode])!;
};
/** A colour at `alpha` over a background, like Tailwind's bg-danger/10. */
const over = (fg: Rgb, alpha: number, bg: Rgb): Rgb => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as Rgb;

const ratio = (a: string, b: string, mode: Mode) => contrast(value(a, mode), value(b, mode));

describe.each<Mode>(["light", "dark"])("default tokens meet the contrast rules the docs teach (%s)", (mode) => {
  it("text on surfaces reaches 4.5:1", () => {
    for (const [fg, bg] of [
      ["foreground", "background"],
      ["foreground", "card"],
      ["muted-foreground", "card"],
      ["muted-foreground", "muted"],
      ["primary-foreground", "primary"],
    ]) {
      expect(ratio(fg, bg, mode), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("the focus ring reaches 3:1 on the card and the background", () => {
    expect(ratio("ring", "card", mode)).toBeGreaterThanOrEqual(3);
    expect(ratio("ring", "background", mode)).toBeGreaterThanOrEqual(3);
  });

  it("status colours read as text on the card and on their own tint", () => {
    const card = value("card", mode);
    for (const s of ["success", "warning", "danger"]) {
      expect(contrast(value(s, mode), card), `${s} on card`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(value(s, mode), over(value(s, mode), 0.1, card)), `${s} on ${s}/10`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("token data", () => {
  it("every token has a role and both modes, and parses as a colour", () => {
    for (const t of tokenData.tokens) {
      expect(t.role.length, t.name).toBeGreaterThan(5);
      expect(parseColor(t.light), `${t.name} light`).not.toBeNull();
      expect(parseColor(t.dark), `${t.name} dark`).not.toBeNull();
    }
  });

  it("danger follows shadcn's --destructive when a project has it", () => {
    const danger = tokenData.tokens.find((t) => t.name === "danger")!;
    expect(danger.light.startsWith("var(--destructive,")).toBe(true);
    expect(danger.dark.startsWith("var(--destructive,")).toBe(true);
  });
});
