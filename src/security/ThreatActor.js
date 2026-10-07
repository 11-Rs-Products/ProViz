/**
 * ThreatActor.js
 * Represents an adversary model with specific privileges, motives, and capabilities.
 */

export const ThreatActorRole = Object.freeze({
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  AUTHENTICATED: 'AUTHENTICATED',
  LOW_PRIVILEGE: 'LOW_PRIVILEGE',
  HIGH_PRIVILEGE: 'HIGH_PRIVILEGE',
  INSIDER: 'INSIDER',
  MALICIOUS_COMPONENT: 'MALICIOUS_COMPONENT',
  COMPROMISED_DEPENDENCY: 'COMPROMISED_DEPENDENCY',
  ENVIRONMENTAL: 'ENVIRONMENTAL',
  ACCIDENTAL: 'ACCIDENTAL'
});

export class ThreatActor {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.role - ThreatActorRole
   * @param {string} [options.name='']
   * @param {Array<string>} [options.capabilities=[]]
   * @param {Array<string>} [options.accessibleBoundaries=[]]
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    role = ThreatActorRole.UNAUTHENTICATED,
    name = '',
    capabilities = [],
    accessibleBoundaries = [],
    attributes = {}
  }) {
    if (!id) throw new Error('ThreatActor requires id');
    this.id = id;
    this.role = role;
    this.name = name || id;
    this.capabilities = Object.freeze([...capabilities]);
    this.accessibleBoundaries = Object.freeze([...accessibleBoundaries]);
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  hasCapability(cap) {
    return this.capabilities.includes(cap);
  }

  canAccess(boundaryId) {
    return this.accessibleBoundaries.includes(boundaryId) || this.accessibleBoundaries.includes('*');
  }

  toJSON() {
    return {
      id: this.id,
      role: this.role,
      name: this.name,
      capabilities: [...this.capabilities],
      accessibleBoundaries: [...this.accessibleBoundaries],
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new ThreatActor(json);
  }
}
