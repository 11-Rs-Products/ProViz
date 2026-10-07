/**
 * ComponentResponsibility.js
 * Encapsulates the team, security, verification, and operational responsibilities for a project component.
 * Invariant: Ownership is contextual metadata and NOT evidence of correctness.
 */

export class ComponentResponsibility {
  /**
   * @param {Object} options
   * @param {string} options.entityId
   * @param {string} options.primaryOwnerTeam
   * @param {string[]} [options.secondaryOwners=[]]
   * @param {string|null} [options.securityContact=null]
   * @param {string|null} [options.verificationLead=null]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    entityId,
    primaryOwnerTeam,
    secondaryOwners = [],
    securityContact = null,
    verificationLead = null,
    metadata = {}
  }) {
    if (!entityId || !primaryOwnerTeam) throw new Error('ComponentResponsibility requires entityId and primaryOwnerTeam');
    this.entityId = entityId;
    this.primaryOwnerTeam = primaryOwnerTeam;
    this.secondaryOwners = Object.freeze([...secondaryOwners]);
    this.securityContact = securityContact;
    this.verificationLead = verificationLead;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      entityId: this.entityId,
      primaryOwnerTeam: this.primaryOwnerTeam,
      secondaryOwners: [...this.secondaryOwners],
      securityContact: this.securityContact,
      verificationLead: this.verificationLead,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ComponentResponsibility(json);
  }
}
