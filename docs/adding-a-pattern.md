# Adding a pattern

A pattern is one component that shows how an agent should behave on screen in one situation, plus a live demo that can fail on purpose. Read [CONTRIBUTING.md](../CONTRIBUTING.md) first. If you are not sure whether an idea fits, open a [pattern request](https://github.com/Guhan3132/Agentic-Component/issues/new/choose) and we will talk it through before you build.

## What makes a good pattern

- **One problem.** "What does the person see when the agent is rate limited" is a pattern. "A chat app" is not.
- **A reason.** You can write the `why` in a short paragraph without naming a library.
- **A failure.** The demo has at least one scenario where something goes wrong, and the pattern handles it well.
- **Works for everyone.** Keyboard, screen reader, touch, light and dark, reduced motion.

## Steps

```bash
npm install
npm run new-pattern -- rate-limit-notice "Rate limit notice"
```

That creates `src/registry/rate-limit-notice/rate-limit-notice.tsx` and `demo.tsx`. Then:

1. **Build the component.** One file. It may import only `react`, `lucide-react`, `motion/react` and `@/lib/cn`, so anyone can copy it. Use the theme tokens (`bg-card`, `text-foreground`, `border-border`, ...) instead of fixed colours. Add `"use client"` if it has state or handlers.
2. **Build the demo** in `demo.tsx` with `DemoFrame`. Give it at least two scenarios, one of them a failure or edge case. Pass `onReplay` so the preview plays when it scrolls into view.
3. **Add the metadata** in `src/registry/index.ts`: `summary`, `why`, `dos`, `donts`, `a11y` and `props`. Set `since` to the next version.
4. **Add a usage snippet and tags** in `src/registry/usage.ts`.
5. **Register the demo** in `src/registry/demos.tsx`.
6. **Add a gallery preview** in `src/components/Previews.tsx`: a small static version of the component.
7. **Generate and check:**

```bash
npm run registry:build
npm test
npm run lint
```

`npm test` tells you what you missed: a missing demo or preview, an import the component should not have, an incomplete registry file.

## Checklist for the pull request

- [ ] Works with the keyboard alone, with visible focus
- [ ] Interactive targets are 44px on touch screens (`pointer-coarse:min-h-11`)
- [ ] Text inputs are 16px on small screens, so iOS does not zoom
- [ ] Looks right in light and dark, on desktop and at 375px wide
- [ ] Respects reduced motion (`motion-reduce:`) and does not rely on colour alone
- [ ] Status changes are announced once, not on every tick
- [ ] Tests for any logic (see `tests/`), and `npm test` and `npm run lint` pass
- [ ] Screenshots of desktop and mobile in the pull request
