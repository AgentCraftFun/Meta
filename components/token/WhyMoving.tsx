'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTokenExplanation } from '@/lib/useTokenDetail';
import type { Token } from '@/lib/types/token';

type Props = {
  token: Token;
  chain: string;
  address: string;
};

/**
 * AI-generated "why is this moving?" panel. Server-side endpoint
 * gathers a compact JSON brief (recent metrics + linked narratives)
 * and asks Claude Haiku 4.5 for 2–3 factual sentences. Cached 5min.
 *
 * Empty states (all rendered as the same "not enough signal" copy):
 *   no_signal   — token isn't tagged to any narrative
 *   no_api_key  — server missing ANTHROPIC_API_KEY
 *   llm_error   — call failed
 *   not_found   — token couldn't be resolved
 *
 * The empty-state copy is intentionally identical so users don't
 * need to think about operational details — they just see "watch
 * this space" until signal arrives.
 */
export default function WhyMoving({ token, chain, address }: Props) {
  const { data, isFetching, isError } = useTokenExplanation(chain, address);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (isError) {
    return (
      <EmptyShell
        token={token}
        message="Couldn't reach the explanation service. Try again in a moment."
      />
    );
  }

  // First-paint skeleton while the LLM call is in-flight.
  if (isFetching && !data) {
    return <LoadingShell />;
  }

  if (!data?.explanation) {
    return (
      <EmptyShell
        token={token}
        message="Not enough signal to explain this move. Watch this space."
      />
    );
  }

  const ageLabel = formatRelative(now - new Date(data.generatedAt).getTime());
  const { text, citations } = renderWithCitations(
    data.explanation,
    data.citations
  );

  return (
    <section
      aria-label="Why is this moving?"
      className="relative overflow-hidden rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface p-ds5 font-ds-mono"
    >
      <AccentBar />
      <header className="flex items-center justify-between">
        <h2 className="text-[12px] uppercase tracking-[0.4em] text-ds-text-primary">
          Why is this moving?
        </h2>
        <span className="text-[9px] uppercase tracking-[0.32em] text-ds-text-tertiary">
          AI-generated · refreshed {ageLabel}
        </span>
      </header>

      <p className="mt-ds3 text-[14px] leading-relaxed text-ds-text-primary">
        {text}
      </p>

      {citations.length > 0 && (
        <div className="mt-ds4 flex flex-wrap items-center gap-ds2">
          <span className="text-[9px] uppercase tracking-[0.32em] text-ds-text-tertiary">
            Sources
          </span>
          {citations.map((c) => (
            <CitationChip key={c.id} id={c.id} label={c.label} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function CitationChip({ id, label }: { id: string; label: string }) {
  return (
    <Link
      href={`/terminal?narratives=${encodeURIComponent(id)}`}
      className="inline-flex h-5 items-center rounded-ds-sm border border-ds-accent-cyan/40 bg-ds-accent-cyan/10 px-ds2 text-[10px] uppercase tracking-[0.28em] text-ds-accent-cyan hover:bg-ds-accent-cyan/20"
    >
      {label}
    </Link>
  );
}

function AccentBar() {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-0 h-full w-[4px] bg-ds-accent-cyan"
      style={{ boxShadow: '0 0 12px rgba(77, 212, 255, 0.55)' }}
    />
  );
}

function LoadingShell() {
  return (
    <section
      aria-busy
      aria-label="Generating explanation"
      className="relative overflow-hidden rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface p-ds5 font-ds-mono"
    >
      <AccentBar />
      <h2 className="text-[12px] uppercase tracking-[0.4em] text-ds-text-primary">
        Why is this moving?
      </h2>
      <div className="mt-ds4 space-y-ds2">
        <div className="h-2 w-full animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
        <div className="h-2 w-5/6 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
        <div className="h-2 w-4/6 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
      </div>
    </section>
  );
}

function EmptyShell({
  token,
  message,
}: {
  token: Token;
  message: string;
}) {
  return (
    <section
      aria-label="Why is this moving?"
      className="relative overflow-hidden rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface p-ds5 font-ds-mono"
    >
      <AccentBar />
      <h2 className="text-[12px] uppercase tracking-[0.4em] text-ds-text-primary">
        Why is this moving?
      </h2>
      <p className="mt-ds3 max-w-[640px] text-[13px] leading-relaxed text-ds-text-secondary">
        {message}{' '}
        {token.narrativeTags.length === 0 && (
          <span className="text-ds-text-tertiary">
            (No narratives are currently linked to {token.symbol}.)
          </span>
        )}
      </p>
    </section>
  );
}

/**
 * Split the LLM output around the inline mentions of any cited
 * narrative label so the same string can be rendered with clickable
 * pill links. Match is case-insensitive on the label as a whole word
 * — the LLM is steered to use the label verbatim so this is reliable.
 *
 * Falls back to plain text if no labels match.
 */
function renderWithCitations(
  explanation: string,
  citations: { id: string; label: string }[]
) {
  if (citations.length === 0) {
    return { text: explanation, citations: [] };
  }
  // For now we render the explanation as plain prose and surface the
  // citations as a chip strip below. Inline link injection causes
  // brittle string surgery against an LLM output and adds little
  // beyond the chip row — punting that until the explorer ships.
  return { text: explanation, citations };
}

function formatRelative(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}
