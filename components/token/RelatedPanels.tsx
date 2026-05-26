'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import Delta from '@/components/primitives/Delta';
import Pill from '@/components/primitives/Pill';
import { formatUsd } from '@/lib/format';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';
import type { Token } from '@/lib/types/token';

const ROW_LIMIT = 5;

type Props = {
  token: Token;
};

/**
 * Two side-by-side panels at the bottom of the detail page:
 * "Related Tokens" (share at least one of the token's narrative tags)
 * and "Related Narratives" (same tag set, ranked by impact).
 */
export default function RelatedPanels({ token }: Props) {
  const window = useMetaStore((s) => s.timeWindow);
  const { data: tokensData } = useTokens(window);
  const { data: narrativesData } = useNarratives(window);

  const tagIds = useMemo(
    () => new Set(token.narrativeTags.map((t) => t.id)),
    [token.narrativeTags]
  );

  const relatedTokens = useMemo(() => {
    if (tagIds.size === 0) return [];
    const universe = tokensData?.tokens ?? [];
    return universe
      .filter(
        (t) =>
          t.id !== token.id &&
          t.narrativeTags.some((tag) => tagIds.has(tag.id))
      )
      .slice(0, ROW_LIMIT);
  }, [tokensData, tagIds, token.id]);

  const relatedNarratives = useMemo(() => {
    const all = narrativesData?.narratives ?? [];
    return all
      .filter((n) => tagIds.has(n.id))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, ROW_LIMIT);
  }, [narrativesData, tagIds]);

  return (
    <div className="grid grid-cols-1 gap-ds5 md:grid-cols-2">
      <Panel
        title="Related Tokens"
        empty="No related tokens — this token isn't tagged to a shared narrative yet."
        hasRows={relatedTokens.length > 0}
      >
        <ul role="list" className="flex flex-col">
          {relatedTokens.map((t) => (
            <li key={t.id}>
              <Link
                href={`/token/${encodeURIComponent(t.chain)}/${encodeURIComponent(t.contractAddress ?? t.id)}`}
                className="group flex items-center gap-ds3 border-b border-ds-border-subtle/60 px-ds3 py-ds2 transition-colors duration-ds-fast ease-ds-standard last:border-b-0 hover:bg-ds-bg-surfaceHi"
              >
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-ds-sm border border-ds-border-strong bg-ds-bg-base text-[9px] uppercase text-ds-text-primary"
                >
                  {t.symbol.slice(0, 2)}
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-ds-text-primary">
                  {t.symbol}
                </span>
                <span className="truncate text-[11px] text-ds-text-secondary">
                  {t.name}
                </span>
                <span
                  data-numeric="true"
                  className="ml-auto text-[11px] tabular-nums text-ds-text-secondary"
                >
                  {formatUsd(t.marketCap)}
                </span>
                <Delta value={t.priceChange24h} />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Related Narratives"
        empty="No active narratives are currently linked to this token."
        hasRows={relatedNarratives.length > 0}
      >
        <ul role="list" className="flex flex-col">
          {relatedNarratives.map((n) => {
            const tag = narrativeToTag(n);
            return (
              <li key={n.id}>
                <Link
                  href={`/terminal?narratives=${encodeURIComponent(n.id)}`}
                  className="group flex items-center gap-ds3 border-b border-ds-border-subtle/60 px-ds3 py-ds2 transition-colors duration-ds-fast ease-ds-standard last:border-b-0 hover:bg-ds-bg-surfaceHi"
                >
                  <Pill size="sm" variant="info">
                    {tag.label}
                  </Pill>
                  <span className="truncate text-[11px] text-ds-text-secondary">
                    {n.title}
                  </span>
                  <span
                    data-numeric="true"
                    className="ml-auto text-[11px] tabular-nums text-ds-text-primary"
                    aria-label={`Impact ${n.volume}`}
                  >
                    {n.volume}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  children,
  hasRows,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  hasRows: boolean;
  empty: string;
}) {
  return (
    <section
      aria-label={title}
      className="rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface font-ds-mono"
    >
      <h3 className="border-b border-ds-border-subtle px-ds4 py-ds3 text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
        {title}
      </h3>
      {hasRows ? (
        children
      ) : (
        <p className="px-ds4 py-ds5 text-[12px] leading-relaxed text-ds-text-tertiary">
          {empty}
        </p>
      )}
    </section>
  );
}
