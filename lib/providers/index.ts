import type { SourceMode } from '../types';
import { MockProvider } from './MockProvider';
import type { NarrativeProvider } from './NarrativeProvider';
import { XApiProvider } from './XApiProvider';

export function getActiveSourceMode(): SourceMode {
  return process.env.NARRATIVE_SOURCE === 'x' ? 'x' : 'mock';
}

export function getProvider(): NarrativeProvider {
  return getActiveSourceMode() === 'x' ? new XApiProvider() : new MockProvider();
}

export type { NarrativeProvider };
