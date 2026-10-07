/**
 * Agent Trust Levels
 */
export const AgentTrustLevel = Object.freeze({
  FORMAL: 'FORMAL',
  VERIFIED: 'VERIFIED',
  TRUSTED: 'TRUSTED',
  STANDARD: 'STANDARD',
  EXPERIMENTAL: 'EXPERIMENTAL',
  UNTRUSTED: 'UNTRUSTED',
  UNKNOWN: 'UNKNOWN'
});

export const TRUST_LEVEL_ORDER = Object.freeze({
  [AgentTrustLevel.FORMAL]: 6,
  [AgentTrustLevel.VERIFIED]: 5,
  [AgentTrustLevel.TRUSTED]: 4,
  [AgentTrustLevel.STANDARD]: 3,
  [AgentTrustLevel.EXPERIMENTAL]: 2,
  [AgentTrustLevel.UNTRUSTED]: 1,
  [AgentTrustLevel.UNKNOWN]: 0
});
