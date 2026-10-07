import { CapabilityMatcher } from './CapabilityMatcher.js';
import { DelegationCandidate } from './DelegationCandidate.js';
import { DelegationDecision } from './DelegationDecision.js';
import { AgentTrustLevel } from './AgentTrustLevel.js';

/**
 * Core selection engine for assigning tasks to verification agents with deterministic tie-breaking
 */
export class DelegationEngine {
  constructor({ registry, weights = {} } = {}) {
    this.registry = registry;
    this.weights = Object.freeze({
      capabilityFit: weights.capabilityFit ?? 2.0,
      evidenceQuality: weights.evidenceQuality ?? 1.5,
      reliability: weights.reliability ?? 1.0,
      environmentFit: weights.environmentFit ?? 0.8,
      informationValue: weights.informationValue ?? 0.5,
      cost: weights.cost ?? 0.3,
      latency: weights.latency ?? 0.3
    });
  }

  evaluateCandidate(agent, request) {
    const match = CapabilityMatcher.matchAgent(agent, request.requiredCapabilities);
    if (!match.isMatch) {
      return null;
    }

    const capabilityFit = match.score;
    const evidenceQuality = agent.trustProfile.evidenceQuality;
    const reliability = agent.trustProfile.reliabilityScore;

    // Environment fit
    let environmentFit = 1.0;
    if (request.environment?.fingerprint && agent.environmentFingerprint !== request.environment.fingerprint) {
      environmentFit = 0.5;
    }

    // Information value: bonus if formal solver when proving or high-tier trust
    let informationValue = 0.5;
    if (agent.trustProfile.trustLevel === AgentTrustLevel.FORMAL) {
      informationValue = 1.0;
    } else if (agent.trustProfile.trustLevel === AgentTrustLevel.VERIFIED) {
      informationValue = 0.8;
    }

    // Normalized cost and latency
    const cost = Math.min(1.0, (agent.resourceProfile.costPerOp || 1.0) / 10.0);
    const latency = Math.min(1.0, (agent.resourceProfile.avgLatencyMs || 50) / 1000.0);

    const compositeScore = (
      this.weights.capabilityFit * capabilityFit +
      this.weights.evidenceQuality * evidenceQuality +
      this.weights.reliability * reliability +
      this.weights.environmentFit * environmentFit +
      this.weights.informationValue * informationValue -
      this.weights.cost * cost -
      this.weights.latency * latency
    );

    return new DelegationCandidate({
      agent,
      capabilityFit,
      evidenceQuality,
      reliability,
      environmentFit,
      informationValue,
      cost,
      latency,
      compositeScore,
      details: { missing: match.missing }
    });
  }

  delegate(request) {
    const availableAgents = this.registry ? this.registry.getAgents() : [];
    const candidates = [];

    for (const agent of availableAgents) {
      if (agent.isQuarantined()) continue;
      const candidate = this.evaluateCandidate(agent, request);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    if (candidates.length === 0) {
      return new DelegationDecision({
        taskId: request.taskId,
        goalId: request.goalId,
        selectedAgent: null,
        candidates: [],
        reason: 'No capable or available agent found in federation',
        confidence: 0.0,
        isFallback: false
      });
    }

    // Deterministic sorting
    candidates.sort((a, b) => {
      // Primary: composite score descending
      const scoreDiff = b.compositeScore - a.compositeScore;
      if (Math.abs(scoreDiff) > 1e-6) return scoreDiff;

      // Secondary: formal trust level rank descending
      const trustDiff = b.agent.trustProfile.rank - a.agent.trustProfile.rank;
      if (trustDiff !== 0) return trustDiff;

      // Tertiary: deterministic lexicographical tie-breaker
      return a.agent.agentId.localeCompare(b.agent.agentId);
    });

    const selected = candidates[0].agent;
    return new DelegationDecision({
      taskId: request.taskId,
      goalId: request.goalId,
      selectedAgent: selected,
      candidates,
      reason: `Selected agent '${selected.agentId}' with composite score ${candidates[0].compositeScore.toFixed(4)}`,
      confidence: Math.min(1.0, Math.max(0.1, candidates[0].compositeScore / 5.0)),
      isFallback: false
    });
  }
}
