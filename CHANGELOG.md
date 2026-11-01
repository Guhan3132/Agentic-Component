# Changelog

## Unreleased

## 0.3.0 (2026-11-01)

- New patterns: tool permissions, multi-agent status, voice input (17 in total)
- `npm run new-pattern` scaffolds a pattern, and docs/adding-a-pattern.md is the contributor guide

- Tests: component behaviour (Testing Library), accessibility checks on every pattern (axe) and a production-build smoke test, all in CI
- "New" badges and an "Added in" line, related patterns ranked by category and tags, a skip link, the `/` search shortcut, language labels on code blocks
- Registry: theme tokens (`cssVars`), SHA-256 checksums, pinned releases (`npm run registry:release`), a PR install check, CodeQL

## 0.2.0 (2026-11-01)

- New patterns: error recovery, citations, agent memory, human hand-off (14 in total)
- Security headers (CSP, HSTS, Permissions-Policy), a patched `sharp`, `security.txt`, and Next 16 with React 19.3
- Anonymous page-view analytics, a Get started page, and richer registry metadata (title, description, docs, installs into `components/ui`)
- Footer and About page, syntax-highlighted code, autoplaying previews, solid popovers, a logo, and per-pattern social images
- Gallery category counts and tag search; 44px touch targets on touch screens
- Lint is clean (0 warnings): the tooltip hook no longer reads a ref while rendering, and latest-value refs update in effects
- Registry consistency tests in CI, a weekly install test, Dependabot, and issue and pull request templates
- Sitemap, robots and per-page metadata

## 0.1.0

- First public release: 10 agent UX patterns, the playground, and the shadcn registry
