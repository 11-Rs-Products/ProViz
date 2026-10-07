import { FederationMembership } from './FederationMembership.js';
import { CapabilityRegistry } from './CapabilityRegistry.js';
import { VerificationAgent } from './VerificationAgent.js';

/**
 * Manages federation lifecycle, membership, quarantines, and agent health
 */
export class FederationManager {
  constructor(registry = new CapabilityRegistry()) {
    this.registry = registry instanceof CapabilityRegistry ? registry : new CapabilityRegistry();
    this._membershipStatus = new Map();
    this._quarantineReasons = new Map();
  }

  addAgent(agent) {
    const verifiedAgent = this.registry.registerAgent(agent);
    this._membershipStatus.set(verifiedAgent.agentId, FederationMembership.AVAILABLE);
    return verifiedAgent;
  }

  removeAgent(agentId) {
    this._membershipStatus.set(agentId, FederationMembership.REMOVED);
    return this.registry.unregisterAgent(agentId);
  }

  activateAgent(agentId) {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return null;
    const updated = agent.withAvailability(FederationMembership.AVAILABLE);
    this.registry.registerAgent(updated);
    this._membershipStatus.set(agentId, FederationMembership.AVAILABLE);
    return updated;
  }

  deactivateAgent(agentId) {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return null;
    const updated = agent.withAvailability(FederationMembership.OFFLINE);
    this.registry.registerAgent(updated);
    this._membershipStatus.set(agentId, FederationMembership.OFFLINE);
    return updated;
  }

  quarantineAgent(agentId, reason = 'Repeated failures or non-determinism') {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return null;
    const updatedTrust = agent.trustProfile.withQuarantineIncrement();
    const updated = agent.withAvailability(FederationMembership.QUARANTINED).withTrustProfile(updatedTrust);
    this.registry.registerAgent(updated);
    this._membershipStatus.set(agentId, FederationMembership.QUARANTINED);
    this._quarantineReasons.set(agentId, { reason, timestamp: Date.now() });
    return updated;
  }

  unquarantineAgent(agentId) {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return null;
    const updated = agent.withAvailability(FederationMembership.AVAILABLE);
    this.registry.registerAgent(updated);
    this._membershipStatus.set(agentId, FederationMembership.AVAILABLE);
    this._quarantineReasons.delete(agentId);
    return updated;
  }

  getMembershipStatus(agentId) {
    return this._membershipStatus.get(agentId) || FederationMembership.OFFLINE;
  }

  getQuarantineReason(agentId) {
    return this._quarantineReasons.get(agentId) || null;
  }

  refreshCapabilities() {
    return this.registry.getAgents().map(agent => ({
      agentId: agent.agentId,
      status: this.getMembershipStatus(agent.agentId),
      capabilities: agent.capabilities.toJSON()
    }));
  }
}
