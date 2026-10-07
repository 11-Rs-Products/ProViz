/**
 * CapabilityRegistry.js
 * Central registry of all ProViz capabilities across Stages 1–36.
 */

import { Capability } from './Capability.js';
import { CapabilityKind } from './CapabilityKind.js';
import { CapabilityResolver } from './CapabilityResolver.js';

export class CapabilityRegistry {
  constructor() {
    /** @type {Map<string, Capability>} */
    this._capabilities = new Map();
    this.resolver = new CapabilityResolver(this);
    this._initStandardCapabilities();
  }

  registerCapability(capData) {
    const cap = capData instanceof Capability ? capData : new Capability(capData);
    this._capabilities.set(cap.id, cap);
    return cap;
  }

  getCapability(id) {
    return this._capabilities.get(id) || null;
  }

  hasCapability(id) {
    return this._capabilities.has(id);
  }

  getCapabilities() {
    return Array.from(this._capabilities.values());
  }

  getHealthyCapabilities() {
    return Array.from(this._capabilities.values()).filter(c => c.health.isAvailable);
  }

  resolveExecutionOrder(requestedIds) {
    return this.resolver.resolveExecutionOrder(requestedIds);
  }

  _initStandardCapabilities() {
    const standard = [
      { id: CapabilityKind.STATIC_ANALYSIS, name: 'Static Analysis', dependencies: [] },
      { id: CapabilityKind.SYMBOLIC_REASONING, name: 'Symbolic Reasoning', dependencies: [CapabilityKind.STATIC_ANALYSIS] },
      { id: CapabilityKind.TEST_GENERATION, name: 'Automated Test Generation', dependencies: [CapabilityKind.STATIC_ANALYSIS] },
      { id: CapabilityKind.CONCOLIC_EXECUTION, name: 'Concolic Execution', dependencies: [CapabilityKind.SYMBOLIC_REASONING, CapabilityKind.TEST_GENERATION] },
      { id: CapabilityKind.PROGRAM_REPAIR, name: 'Automated Program Repair', dependencies: [CapabilityKind.STATIC_ANALYSIS, CapabilityKind.TEST_GENERATION] },
      { id: CapabilityKind.MUTATION_ANALYSIS, name: 'Mutation Analysis', dependencies: [CapabilityKind.TEST_GENERATION] },
      { id: CapabilityKind.PROBABILISTIC_ANALYSIS, name: 'Probabilistic Verification', dependencies: [CapabilityKind.STATIC_ANALYSIS] },
      { id: CapabilityKind.PLANNING, name: 'Verification Planning', dependencies: [] },
      { id: CapabilityKind.ORCHESTRATION, name: 'Distributed Orchestration', dependencies: [CapabilityKind.PLANNING] },
      { id: CapabilityKind.FEDERATION, name: 'Cross-Engine Federation', dependencies: [CapabilityKind.ORCHESTRATION] },
      { id: CapabilityKind.KNOWLEDGE_REASONING, name: 'Knowledge Graph Reasoning', dependencies: [] },
      { id: CapabilityKind.SEMANTIC_ANALYSIS, name: 'Semantic Impact Intelligence', dependencies: [CapabilityKind.STATIC_ANALYSIS] },
      { id: CapabilityKind.EVOLUTION, name: 'Verified Software Evolution', dependencies: [CapabilityKind.SEMANTIC_ANALYSIS, CapabilityKind.PROGRAM_REPAIR] },
      { id: CapabilityKind.SECURITY, name: 'Adversarial Security Verification', dependencies: [CapabilityKind.STATIC_ANALYSIS, CapabilityKind.SYMBOLIC_REASONING] },
      { id: CapabilityKind.PERFORMANCE, name: 'Performance & Resource Verification', dependencies: [CapabilityKind.STATIC_ANALYSIS] },
      { id: CapabilityKind.CONCURRENCY, name: 'Concurrency & Temporal Verification', dependencies: [CapabilityKind.STATIC_ANALYSIS, CapabilityKind.SYMBOLIC_REASONING] },
      { id: CapabilityKind.CONTINUOUS_VERIFICATION, name: 'Continuous Autonomous Verification', dependencies: [CapabilityKind.FEDERATION, CapabilityKind.SEMANTIC_ANALYSIS] },
      { id: CapabilityKind.PROJECT_INTELLIGENCE, name: 'Project Intelligence & Analytics', dependencies: [CapabilityKind.CONTINUOUS_VERIFICATION] },
      { id: CapabilityKind.GOVERNANCE, name: 'Architecture Governance Engine', dependencies: [CapabilityKind.PROJECT_INTELLIGENCE] },
      { id: CapabilityKind.CERTIFICATION, name: 'Project & Release Certification', dependencies: [CapabilityKind.GOVERNANCE, CapabilityKind.CONTINUOUS_VERIFICATION] }
    ];

    for (const item of standard) {
      this.registerCapability(new Capability(item));
    }
  }

  toJSON() {
    return {
      capabilities: Array.from(this._capabilities.values()).map(c => c.toJSON())
    };
  }

  static fromJSON(json) {
    const registry = new CapabilityRegistry();
    if (json.capabilities) {
      for (const c of json.capabilities) registry.registerCapability(Capability.fromJSON(c));
    }
    return registry;
  }
}
