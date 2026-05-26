import type { SourceMode } from '../types';
import { MockProvider } from './MockProvider';
import type { NarrativeProvider } from './NarrativeProvider';
import { XApiProvider } from './XApiProvider';

const VALID_SOURCES: readonly SourceMode[] = ['mock', 'x'] as const;

let warnedMissingToken = false;
let warnedUnknownSource = false;

/**
 * Resolves the active source mode. Casing-tolerant: `x`, `X`, `mock`,
 * `Mock` all work. Returns 'x' only when both the env flag and a bearer
 * token are present; otherwise falls back to 'mock' so the globe is
 * never empty for ops reasons alone. Each warning fires once per
 * process to keep serverless logs clean.
 */
export function getActiveSourceMode(): SourceMode {
  const raw = (process.env.NARRATIVE_SOURCE ?? 'mock').trim().toLowerCase();

  if (raw && !(VALID_SOURCES as readonly string[]).includes(raw)) {
    if (!warnedUnknownSource) {
      warnedUnknownSource = true;
      console.warn(
        `[providers] Unknown NARRATIVE_SOURCE="${raw}"; falling back to mock. Valid: ${VALID_SOURCES.join(', ')}`
      );
    }
    return 'mock';
  }

  const requested = (raw === 'x' ? 'x' : 'mock') as SourceMode;

  if (requested === 'x' && !process.env.X_BEARER_TOKEN) {
    if (!warnedMissingToken) {
      warnedMissingToken = true;
      console.warn(
        '[providers] NARRATIVE_SOURCE=x but X_BEARER_TOKEN is unset; falling back to mock'
      );
    }
    return 'mock';
  }

  return requested;
}

export function getProvider(): NarrativeProvider {
  return getActiveSourceMode() === 'x' ? new XApiProvider() : new MockProvider();
}

export type { NarrativeProvider };
