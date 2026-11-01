# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub:
[Report a vulnerability](https://github.com/Guhan3132/Agentic-Component/security/advisories/new).

Do not open a public issue for a vulnerability. Include steps to reproduce and the affected page or component. You can expect a first reply within a week.

## Scope

- The website at https://agentic-component.vercel.app
- The component source and the registry files served from `/r/*.json`

The components are copied into your project, so you own the copy you install. Review the code before you ship it.

## What the site collects

Anonymous page views and usage events (for example "copied install command"), with no cookies and no personal data. There are no accounts and no API keys.

## Verifying what you install

Every registry file has a SHA-256 in [`/r/checksums.txt`](https://agentic-component.vercel.app/r/checksums.txt). To check one:

```bash
curl -s https://agentic-component.vercel.app/r/approval-step.json | sha256sum
grep approval-step.json <(curl -s https://agentic-component.vercel.app/r/checksums.txt)
```

The two hashes should match. For stronger guarantees, pin a release (`/r/v<version>/<name>.json`) and read the code before you ship it: you own the copy you install.

## Known limitations

- The Content-Security-Policy allows inline scripts (`'unsafe-inline'`). Next.js injects small inline bootstrap scripts, and a per-request nonce would make every page dynamic instead of static. Everything else is restricted to this origin, and the site has no accounts, forms or user-generated content.
- `npm audit` reports moderate findings that come from tooling inside Next.js and ESLint (build time only). They are tracked through Dependabot.
