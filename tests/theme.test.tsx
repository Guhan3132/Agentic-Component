import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgenticTheme, contrast, deriveTheme, parseHex, themeCss, toHex } from "@/theme/agentic-theme";
import { sampleThemes } from "@/theme/samples";

const DARK_CARD = parseHex("#171717")!;
const WHITE = parseHex("#ffffff")!;
const rgb = (hex: string) => parseHex(hex)!;

describe("parseHex", () => {
  it("accepts 3 and 6 digits, with or without #", () => {
    expect(parseHex("#7c3aed")).toEqual([124, 58, 237]);
    expect(parseHex("7C3AED")).toEqual([124, 58, 237]);
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex(" #0af ")).toEqual([0, 170, 255]);
  });
  it("rejects anything else", () => {
    for (const bad of ["", "#12", "#12345", "#1234567", "violet", "#ggg", "rgb(1,2,3)"]) expect(parseHex(bad)).toBeNull();
  });
  it("round-trips through toHex", () => {
    expect(toHex(rgb("#7c3aed"))).toBe("#7c3aed");
  });
});

describe("contrast", () => {
  it("matches the WCAG reference values", () => {
    expect(contrast(rgb("#000000"), rgb("#ffffff"))).toBeCloseTo(21, 1);
    expect(contrast(rgb("#ffffff"), rgb("#ffffff"))).toBeCloseTo(1, 5);
    expect(contrast(rgb("#767676"), rgb("#ffffff"))).toBeCloseTo(4.54, 1); // the classic AA grey
  });
});

describe("deriveTheme", () => {
  it("returns null for an invalid colour", () => {
    expect(deriveTheme("nope")).toBeNull();
  });

  it("keeps the brand colour as primary in light mode", () => {
    expect(deriveTheme("#7c3aed")!.light.primary).toBe("#7c3aed");
    expect(deriveTheme("7c3aed")!.brand).toBe("#7c3aed");
  });

  it("only touches the brand tokens unless neutrals are tinted", () => {
    const plain = deriveTheme("#2563eb")!;
    expect(Object.keys(plain.light).sort()).toEqual(["primary", "primary-foreground", "ring"]);
    const tinted = deriveTheme("#2563eb", { tintNeutrals: true })!;
    for (const k of ["muted", "accent", "border", "input"]) {
      expect(tinted.light).toHaveProperty(k);
      expect(tinted.dark).toHaveProperty(k);
    }
  });

  it("meets WCAG for every sample theme in both modes", () => {
    for (const s of sampleThemes) {
      const t = deriveTheme(s.hex)!;
      expect(t.report.onPrimary.light, `${s.name} text on primary (light)`).toBeGreaterThanOrEqual(4.5);
      expect(t.report.onPrimary.dark, `${s.name} text on primary (dark)`).toBeGreaterThanOrEqual(4.5);
      expect(t.report.ring.light, `${s.name} ring (light)`).toBeGreaterThanOrEqual(3);
      expect(t.report.ring.dark, `${s.name} ring (dark)`).toBeGreaterThanOrEqual(3);
    }
  });

  it("meets WCAG for hundreds of arbitrary colours, including the awkward ones", () => {
    let seed = 20261102;
    const next = () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
    const awkward = ["#000000", "#ffffff", "#facc15", "#fde047", "#ffff00", "#808080", "#0a0a0a", "#fefefe", "#00ff00", "#ff00ff", "#0000ff", "#7f7f7f"];
    const random = Array.from({ length: 400 }, () => toHex([next() * 255, next() * 255, next() * 255]));
    for (const hex of [...awkward, ...random]) {
      const t = deriveTheme(hex)!;
      const pl = rgb(t.light.primary);
      const pd = rgb(t.dark.primary);
      expect(contrast(pl, rgb(t.light["primary-foreground"])), `${hex} on-primary light`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(pd, rgb(t.dark["primary-foreground"])), `${hex} on-primary dark`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(rgb(t.light.ring), WHITE), `${hex} ring light`).toBeGreaterThanOrEqual(3);
      expect(contrast(rgb(t.dark.ring), DARK_CARD), `${hex} ring dark`).toBeGreaterThanOrEqual(3);
    }
  });

  it("darkens a light brand for the focus ring and lightens a dark one in dark mode, and says so", () => {
    const yellow = deriveTheme("#facc15")!;
    expect(yellow.light.primary).toBe("#facc15");
    expect(yellow.light.ring).not.toBe("#facc15");
    expect(yellow.report.adjusted.light).toBe(true);
    expect(yellow.report.warnings.join(" ")).toMatch(/focus ring/);

    const navy = deriveTheme("#1e3a8a")!;
    expect(navy.dark.primary).not.toBe("#1e3a8a");
    expect(navy.report.warnings.join(" ")).toMatch(/dark mode/);
  });

  it("warns when the brand is mistaken for a status colour, and only then", () => {
    expect(deriveTheme("#e11d48")!.report.warnings.join(" ")).toMatch(/danger red/);
    expect(deriveTheme("#16a34a")!.report.warnings.join(" ")).toMatch(/success green/);
    expect(deriveTheme("#d97706")!.report.warnings.join(" ")).toMatch(/warning amber/);
    expect(deriveTheme("#0d9488")!.report.warnings.filter((w) => /status/.test(w))).toEqual([]); // teal is far enough from the greens
    expect(deriveTheme("#7c3aed")!.report.warnings.filter((w) => /status/.test(w))).toEqual([]);
    expect(deriveTheme("#808080")!.report.warnings).toEqual([]); // a grey is not a status colour
  });
});

describe("themeCss and AgenticTheme", () => {
  it("writes a light and a dark block", () => {
    const css = themeCss(deriveTheme("#7c3aed")!);
    expect(css).toMatch(/:root \{ --primary:#7c3aed;/);
    expect(css).toMatch(/\.dark \{ --primary:#/);
  });

  it("scopes the variables to its own subtree and follows .dark", () => {
    const { container } = render(
      <AgenticTheme brand="#7c3aed">
        <span>inside</span>
      </AgenticTheme>,
    );
    const wrapper = container.querySelector("[data-agentic-theme]")!;
    const css = container.querySelector("style")!.textContent!;
    expect(css).toContain(`[data-agentic-theme="${wrapper.getAttribute("data-agentic-theme")}"]`);
    expect(css).toContain(".dark [data-agentic-theme");
    expect(wrapper).toHaveTextContent("inside");
  });

  it("changes nothing for an invalid colour", () => {
    const { container } = render(
      <AgenticTheme brand="not a colour">
        <span>inside</span>
      </AgenticTheme>,
    );
    expect(container.querySelector("style")).toBeNull();
    expect(container).toHaveTextContent("inside");
  });
});
