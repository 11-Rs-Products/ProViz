import { VerificationAgent } from './VerificationAgent.js';
import { CapabilityMatcher } from './CapabilityMatcher.js';

/**
 * Central registry of all available verification engines and agents in the federation
 */
export class CapabilityRegistry {
  constructor() {
    this._agents = new Map();
  }

  registerAgent(agent) {
    const verifiedAgent = agent instanceof VerificationAgent ? agent : VerificationAgent.fromJSON(agent);
    this._agents.set(verifiedAgent.agentId, verifiedAgent);
    return verifiedAgent;
  }

  unregisterAgent(agentId) {
    return this._agents.delete(agentId);
  }

  getAgent(agentId) {
    return this._agents.get(agentId) || null;
  }

  getAgents() {
    return Array.from(this._agents.values());
  }

  get size() {
    return this._agents.size;
  }

  clear() {
    this._agents.clear();
  }

  findCapableAgents(requirements = {}) {
    const results = [];
    for (const agent of this._agents.values()) {
      if (requirements.allowQuarantined !== true && agent.isQuarantined()) {
        continue;
      }
      const match = CapabilityMatcher.matchAgent(agent, requirements);
      if (match.isMatch) {
        results.push({
          agent,
          matchScore: match.score
        });
      }
    }
    // Sort deterministically: highest score first, then trust rank, then agentId lexicographically
    results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      const rankDiff = b.agent.trustProfile.rank - a.agent.trustProfile.rank;
      if (rankDiff !== 0) return rankDiff;
      return a.agent.agentId.localeCompare(b.agent.agentId);
    });
    return results.map(r => r.agent);
  }

  findBestAgent(requirements = {}) {
    const capable = this.findCapableAgents(requirements);
    return capable.length > 0 ? capable[0] : null;
  }

  toJSON() {
    return {
      agents: this.getAgents().map(a => a.toJSON())
    };
  }

  static fromJSON(json = {}) {
    const registry = new CapabilityRegistry();
    if (Array.isArray(json.agents)) {
      for (const a of json.agents) {
        registry.registerAgent(VerificationAgent.fromJSON(a));
      }
    }
    return registry;
  }
}
