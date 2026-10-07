/**
 * ApprovalPolicy.js
 * Configurable thresholds defining conditions under which operations require human approval.
 */

export class ApprovalPolicy {
  /**
   * @param {Object} [options]
   * @param {boolean} [options.requireApprovalForHighRisk=true]
   * @param {boolean} [options.requireApprovalForPublicAPI=true]
   * @param {boolean} [options.requireApprovalForSecurityMitigation=true]
   * @param {boolean} [options.requireApprovalForArchitectureChange=true]
   */
  constructor({
    requireApprovalForHighRisk = true,
    requireApprovalForPublicAPI = true,
    requireApprovalForSecurityMitigation = true,
    requireApprovalForArchitectureChange = true
  } = {}) {
    this.requireApprovalForHighRisk = Boolean(requireApprovalForHighRisk);
    this.requireApprovalForPublicAPI = Boolean(requireApprovalForPublicAPI);
    this.requireApprovalForSecurityMitigation = Boolean(requireApprovalForSecurityMitigation);
    this.requireApprovalForArchitectureChange = Boolean(requireApprovalForArchitectureChange);
    Object.freeze(this);
  }

  isApprovalRequired(operationKind, riskLevel = 'LOW') {
    if (this.requireApprovalForHighRisk && (riskLevel === 'HIGH' || riskLevel === 'CRITICAL')) {
      return true;
    }
    if (this.requireApprovalForPublicAPI && operationKind === 'PUBLIC_API_CHANGE') {
      return true;
    }
    if (this.requireApprovalForSecurityMitigation && operationKind === 'SECURITY_MITIGATION') {
      return true;
    }
    if (this.requireApprovalForArchitectureChange && operationKind === 'ARCHITECTURE_TRANSFORMATION') {
      return true;
    }
    return false;
  }
}
