/**
 * Turns the token list (src/lib/tokens.json) into CSS. The same output is used for the site's own
 * stylesheet, the Get started snippet and, as cssVars, the registry, so they can never disagree.
 */

export type TokenEntry = { name: string; group: string; role: string; light: string; dark: string };

const block = (selector: string, entries: [string, string][], extra: string[] = []) =>
  `${selector} {\n${[...entries.map(([k, v]) => `  --${k}: ${v};`), ...extra.map((e) => `  ${e}`)].join("\n")}\n}`;

/** A stylesheet with a light and a dark block. `withScheme` also sets color-scheme, for the site. */
export function tokenCss(tokens: TokenEntry[], options: { light?: string; dark?: string; withScheme?: boolean } = {}) {
  const { light = ":root", dark = ".dark", withScheme = false } = options;
  return [
    block(light, tokens.map((t) => [t.name, t.light]), withScheme ? ["color-scheme: light;"] : []),
    block(dark, tokens.map((t) => [t.name, t.dark]), withScheme ? ["color-scheme: dark;"] : []),
  ].join("\n\n");
}

/** The Tailwind v4 mapping, so classes like bg-card and text-danger exist. */
export function themeInlineCss(tokens: TokenEntry[]) {
  return `@theme inline {\n${tokens.map((t) => `  --color-${t.name}: var(--${t.name});`).join("\n")}\n}`;
}
