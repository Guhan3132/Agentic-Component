"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Shown when a page throws while rendering. Says what happened and offers a way forward. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-20">
      <p className="text-sm font-medium text-danger">Something broke</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">This page could not load</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        It is our fault, not yours. Try again, and if it keeps happening, tell us on GitHub
        {error.digest ? (
          <>
            {" "}
            with the code <code className="rounded bg-muted px-1.5 py-0.5 text-base">{error.digest}</code>
          </>
        ) : null}
        .
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={reset} className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90 sm:py-2.5">
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted sm:py-2.5">
          Go to the home page
        </Link>
        <a
          href="https://github.com/Guhan3132/Agentic-Component/issues/new/choose"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:py-2.5"
        >
          Report it
        </a>
      </div>
    </main>
  );
}
