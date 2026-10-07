import { VerificationAgentKind } from './VerificationAgentKind.js';
import { AgentCapability } from './AgentCapability.js';
import { AgentTrustProfile } from './AgentTrustProfile.js';
import { AgentTrustLevel } from './AgentTrustLevel.js';

/**
 * Immutable Verification Agent Descriptor
 */
export class VerificationAgent {
  constructor({
    agentId,
    name,
    kind = VerificationAgentKind.STATIC_ANALYZER,
    capabilities = new AgentCapability(),
    supportedLanguages = ['JAVASCRIPT'],
    supportedProperties = ['SAFETY', 'LIVENESS', 'TERMINATION'],
    supportedEvidence = ['FORMAL_PROOF', 'COUNTEREXAMPLE', 'TEST_RESULT'],
    resourceProfile = { cpu: 1, memoryMB: 512, costPerOp: 1.0, avgLatencyMs: 50 },
    trustProfile = new AgentTrustProfile(),
    version = '1.0.0',
    environmentFingerprint = 'default-node-env',
    availability = 'AVAILABLE',
    metadata = {}
  } = {}) {
    if (!agentId) {
      throw new Error('VerificationAgent requires an agentId');
    }

    this.agentId = agentId;
    this.name = name || agentId;
    this.kind = kind;
    this.capabilities = capabilities instanceof AgentCapability ? capabilities : new AgentCapability(capabilities);
    this.supportedLanguages = Object.freeze([...new Set(supportedLanguages)]);
    this.supportedProperties = Object.freeze([...new Set(supportedProperties)]);
    this.supportedEvidence = Object.freeze([...new Set(supportedEvidence)]);
    this.resourceProfile = Object.freeze({
      cpu: resourceProfile.cpu ?? 1,
      memoryMB: resourceProfile.memoryMB ?? 512,
      costPerOp: resourceProfile.costPerOp ?? 1.0,
      avgLatencyMs: resourceProfile.avgLatencyMs ?? 50
    });
    this.trustProfile = trustProfile instanceof AgentTrustProfile ? trustProfile : new AgentTrustProfile(trustProfile);
    this.version = version;
    this.environmentFingerprint = environmentFingerprint;
    this.availability = availability;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  isAvailable() {
    return this.availability === 'AVAILABLE' || this.availability === 'JOINED';
  }

  isQuarantined() {
    return this.availability === 'QUARANTINED';
  }

  withAvailability(status) {
    return new VerificationAgent({
      ...this.toJSON(),
      availability: status
    });
  }

  withTrustProfile(trustProfile) {
    return new VerificationAgent({
      ...this.toJSON(),
      trustProfile: trustProfile instanceof AgentTrustProfile ? trustProfile : new AgentTrustProfile(trustProfile)
    });
  }

  toJSON() {
    return {
      agentId: this.agentId,
      name: this.name,
      kind: this.kind,
      capabilities: this.capabilities.toJSON(),
      supportedLanguages: [...this.supportedLanguages],
      supportedProperties: [...this.supportedProperties],
      supportedEvidence: [...this.supportedEvidence],
      resourceProfile: { ...this.resourceProfile },
      trustProfile: this.trustProfile.toJSON(),
      version: this.version,
      environmentFingerprint: this.environmentFingerprint,
      availability: this.availability,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new VerificationAgent({
      ...json,
      capabilities: AgentCapability.fromJSON(json.capabilities),
      trustProfile: AgentTrustProfile.fromJSON(json.trustProfile)
    });
  }
}
