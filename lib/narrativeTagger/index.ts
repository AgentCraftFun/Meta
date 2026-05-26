/**
 * Narrative→token tagger. Public surface:
 *
 *   tagToken         — tags a single token against a narrative set
 *   tagTokens        — batch variant (builds the keyword index once)
 *   inverseLink      — populates Narrative.relatedTokenIds from tagged tokens
 *   narrativeToTag   — pure derivation: Narrative -> NarrativeTag
 *   linkAll          — one-shot helper for API routes; tags tokens and
 *                      inverse-links narratives in a single pass.
 *
 * The implementation lives in ./rules. Future LLM-based tagging will
 * sit alongside in ./llm.ts behind a feature flag.
 */

import type { Narrative } from '../types';
import type { Token } from '../types/token';
import { inverseLink, narrativeToTag, tagToken, tagTokens } from './rules';

export { tagToken, tagTokens, inverseLink, narrativeToTag };

export type LinkResult = {
  tokens: Token[];
  narratives: Narrative[];
};

/** Tag the token batch and inverse-link the narrative batch in one
 *  shot. Both inputs are read-only; outputs are fresh arrays. */
export function linkAll(
  tokens: Token[],
  narratives: Narrative[]
): LinkResult {
  const taggedTokens = tagTokens(tokens, narratives);
  const linkedNarratives = inverseLink(narratives, taggedTokens);
  return { tokens: taggedTokens, narratives: linkedNarratives };
}
