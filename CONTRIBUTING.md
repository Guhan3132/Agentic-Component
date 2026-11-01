# Contributing to Agentic UI

Thanks for helping. Patterns, fixes and docs are all welcome.

## Setup

```bash
git clone https://github.com/Guhan3132/Agentic-Component.git
cd Agentic-Component
npm install
npm run dev
```

Node 20 or newer is required.

## Before you open a pull request

```bash
npm run lint
npm run build
```

`npm test` runs the registry checks and the component and accessibility tests, and `npm run test:smoke` (after a build) checks the production site. `npm run build` also regenerates `public/r/*.json`; commit those files if they changed.

## Adding a pattern

See "Add a pattern" in the [README](./README.md). A new pattern needs:

- a single-file component in `src/registry/<slug>/<slug>.tsx` that depends only on React, `lucide-react`, `motion` and `cn`
- a `demo.tsx` with at least two scenarios, one of them a failure or edge case
- metadata with a "why", do and don't lists, props and accessibility notes
- light and dark mode using the theme tokens, not hard-coded colours
- keyboard support, visible focus, 44px touch targets on touch devices and reduced-motion support

## Pull requests

- Keep each pull request to one change.
- Describe what changed and why. Add screenshots for visual changes (desktop and mobile).
- Do not add runtime dependencies without discussing them in an issue first.

## Reporting security issues

Do not open a public issue. See [SECURITY.md](./SECURITY.md).

By contributing you agree that your work is released under the [MIT License](./LICENSE).

## Releasing

1. Move the "Unreleased" changelog entries under a new dated version, and bump `version` in `package.json`.
2. Run `npm run registry:build`, then `npm run registry:release`. It freezes `public/r/v<version>/`, so people can pin `https://agentic-component.vercel.app/r/v<version>/<name>.json`. It refuses to overwrite an existing release.
3. Commit, push, tag `v<version>` and publish a GitHub release with the changelog notes.

CI fails if a component changes after its version was frozen, which is the reminder to bump the version.
