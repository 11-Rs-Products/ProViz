import { CapabilityRegistry } from './CapabilityRegistry.js';

/**
 * Represents a federated collection of verification engines and coordination policies
 */
export class Federation {
  constructor({
    federationId = 'proviz-federation-default',
    name = 'ProViz Universal Verification Federation',
    registry = new CapabilityRegistry(),
    policies = {},
    resourcePool = { totalCpu: 16, totalMemoryMB: 16384, maxConcurrentTasks: 32 },
    evidencePolicy = { formalDominance: true, minConfidence: 0.8 },
    coordinationPolicy = { crossValidation: true, solverPortfolio: true }
  } = {}) {
    this.federationId = federationId;
    this.name = name;
    this.registry = registry instanceof CapabilityRegistry ? registry : CapabilityRegistry.fromJSON(registry);
    this.policies = Object.freeze({ ...policies });
    this.resourcePool = Object.freeze({ ...resourcePool });
    this.evidencePolicy = Object.freeze({ ...evidencePolicy });
    this.coordinationPolicy = Object.freeze({ ...coordinationPolicy });
    Object.freeze(this);
  }

  get agents() {
    return this.registry.getAgents();
  }

  toJSON() {
    return {
      federationId: this.federationId,
      name: this.name,
      registry: this.registry.toJSON(),
      policies: { ...this.policies },
      resourcePool: { ...this.resourcePool },
      evidencePolicy: { ...this.evidencePolicy },
      coordinationPolicy: { ...this.coordinationPolicy }
    };
  }

  static fromJSON(json = {}) {
    return new Federation({
      ...json,
      registry: CapabilityRegistry.fromJSON(json.registry)
    });
  }
}
