'use client';

type Props = {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
};

/**
 * Inline failure banner with a Retry button. Sits above the table /
 * rail so it never causes layout shift over content the user was
 * already reading.
 */
export default function ErrorBanner({ message, onRetry, isRetrying }: Props) {
  return (
    <div
      role="alert"
      className="flex items-center gap-ds3 border-b border-ds-accent-bear/40 bg-ds-accent-bear/10 px-ds5 py-ds2 font-ds-mono"
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-ds-full bg-ds-accent-bear"
      />
      <span className="text-[11px] uppercase tracking-[0.32em] text-ds-accent-bear">
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="ml-auto rounded-ds-sm border border-ds-accent-bear/60 bg-ds-bg-base px-ds3 py-ds1 text-[10px] uppercase tracking-[0.32em] text-ds-accent-bear hover:bg-ds-accent-bear/10 disabled:opacity-50"
      >
        {isRetrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}
