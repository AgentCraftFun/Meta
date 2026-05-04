import type { SourceMode } from '../types';
import { MockProvider } from './MockProvider';
import type { NarrativeProvider } from './NarrativeProvider';
import { XApiProvider } from './XApiProvider';

/**
 * Resolves the active source mode. Returns 'x' only when both the env flag
 * and a bearer token are present; otherwise falls back to 'mock' so the
 * globe is never empty for ops reasons alone.
 */
export function getActiveSourceMode(): SourceMode {
  const requested = process.env.NARRATIVE_SOURCE === 'x' ? 'x' : 'mock';
  if (requested === 'x' && !process.env.X_BEARER_TOKEN) {
    if (!warned) {
      warned = true;
      console.warn(
        '[providers] NARRATIVE_SOURCE=x but X_BEARER_TOKEN is unset; falling back to mock'
      );
    }
    return 'mock';
  }
  return requested;
}

let warned = false;

export function getProvider(): NarrativeProvider {
  return getActiveSourceMode() === 'x' ? new XApiProvider() : new MockProvider();
}

export type { NarrativeProvider };
