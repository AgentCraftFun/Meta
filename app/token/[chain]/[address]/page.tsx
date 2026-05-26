'use client';

import { useParams } from 'next/navigation';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import ChartEmbed from '@/components/token/ChartEmbed';
import NarrativeContextBand from '@/components/token/NarrativeContextBand';
import RelatedPanels from '@/components/token/RelatedPanels';
import StatsStrip from '@/components/token/StatsStrip';
import TokenHeader from '@/components/token/TokenHeader';
import TokenSidePanel from '@/components/token/TokenSidePanel';
import TransactionsPanel from '@/components/token/TransactionsPanel';
import WhyMoving from '@/components/token/WhyMoving';
import { useTokenDetail } from '@/lib/useTokenDetail';

/**
 * Token detail. Single-column vertical stack, max 1600px wide.
 *
 *   header           64px
 *   context band     72px   (narrative differentiator)
 *   stats strip      88px   (8 inline KPIs)
 *   chart + side     560px  (chart embed flex-1, side panel 360px)
 *   why moving       auto   (AI-generated, Claude Haiku 4.5)
 *   transactions     auto   (tabbed)
 *   related          auto   (tokens + narratives, side-by-side)
 *
 * Data flow:
 *   /api/token/[chain]/[address] tags server-side against the live
 *   1h narrative window, so context band + Why Moving have linkage
 *   on first paint without an extra round-trip.
 */
export default function TokenDetailPage() {
  const params = useParams<{ chain: string; address: string }>();
  const chain = decodeURIComponent(params?.chain ?? '');
  const address = decodeURIComponent(params?.address ?? '');

  const { data: token, isLoading, isError } = useTokenDetail(chain, address);

  return (
    <div className="flex min-h-screen w-full flex-col bg-ds-bg-base text-ds-text-primary pt-12">
      <KeyboardShortcuts />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
        {isLoading && !token && <DetailSkeleton />}

        {isError && (
          <ErrorState chain={chain} address={address} message="Couldn't load this token." />
        )}

        {!isLoading && !token && !isError && (
          <ErrorState
            chain={chain}
            address={address}
            message="Token not found on DexScreener."
          />
        )}

        {token && (
          <>
            <TokenHeader token={token} chain={chain} address={address} />
            <NarrativeContextBand token={token} />
            <StatsStrip token={token} />

            <div className="flex flex-1 flex-col gap-ds5 p-ds5">
              <div className="flex flex-col gap-ds5 lg:flex-row">
                <div className="flex-1 min-w-0">
                  <ChartEmbed token={token} />
                </div>
                <TokenSidePanel token={token} />
              </div>

              <WhyMoving token={token} chain={chain} address={address} />

              <TransactionsPanel token={token} />

              <RelatedPanels token={token} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Inline states ────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div aria-busy aria-label="Loading token detail" className="flex flex-col">
      <div className="flex h-16 items-center gap-ds5 border-b border-ds-border-subtle px-ds5">
        <div className="h-3 w-24 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
        <div className="h-10 w-10 animate-ds-pulse rounded-ds-md bg-ds-bg-surfaceHi" />
        <div className="h-4 w-32 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
      </div>
      <div className="h-[72px] border-b border-ds-border-subtle bg-ds-bg-surface/40" />
      <div className="h-[88px] border-b border-ds-border-subtle bg-ds-bg-surface/30" />
      <div className="flex flex-col gap-ds5 p-ds5 lg:flex-row">
        <div className="h-[560px] flex-1 animate-ds-pulse rounded-ds-md bg-ds-bg-surfaceHi" />
        <div className="h-[560px] w-[360px] animate-ds-pulse rounded-ds-md bg-ds-bg-surfaceHi" />
      </div>
    </div>
  );
}

function ErrorState({
  chain,
  address,
  message,
}: {
  chain: string;
  address: string;
  message: string;
}) {
  return (
    <main
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-ds3 font-ds-mono"
    >
      <p className="text-[11px] uppercase tracking-[0.4em] text-ds-text-tertiary">
        Token detail
      </p>
      <p className="max-w-[420px] text-center text-[14px] text-ds-text-secondary">
        {message}
      </p>
      <p
        data-numeric="true"
        className="text-[11px] tabular-nums text-ds-text-tertiary"
      >
        {chain} · {address}
      </p>
    </main>
  );
}
