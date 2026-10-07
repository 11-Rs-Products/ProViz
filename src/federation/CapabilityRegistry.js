import { VerificationAgent } from './VerificationAgent.js';
import { CapabilityMatcher } from './CapabilityMatcher.js';

/**
 * Central registry of all available verification engines and agents in the federation
 */
export class CapabilityRegistry {
  constructor() {
    this._agents = new Map();
    this._queryCache = new Map();
  }

  registerAgent(agent) {
    const verifiedAgent = agent instanceof VerificationAgent ? agent : VerificationAgent.fromJSON(agent);
    this._agents.set(verifiedAgent.agentId, verifiedAgent);
    this._queryCache.clear();
    return verifiedAgent;
  }

  unregisterAgent(agentId) {
    this._queryCache.clear();
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
    this._queryCache.clear();
  }

  findCapableAgents(requirements = {}) {
    const cacheKey = JSON.stringify(requirements);
    if (this._queryCache.has(cacheKey)) {
      return [...this._queryCache.get(cacheKey)];
    }

    const results = [];
    const allowQuarantined = requirements.allowQuarantined === true;
    for (const agent of this._agents.values()) {
      if (!allowQuarantined && agent.isQuarantined()) {
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
    let finalAgents;
    if (results.length <= 1) {
      finalAgents = results.map(r => r.agent);
    } else {
      // Sort deterministically: highest score first, then trust rank, then agentId lexicographically
      results.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        const rankDiff = b.agent.trustProfile.rank - a.agent.trustProfile.rank;
        if (rankDiff !== 0) return rankDiff;
        return a.agent.agentId.localeCompare(b.agent.agentId);
      });
      finalAgents = results.map(r => r.agent);
    }

    this._queryCache.set(cacheKey, finalAgents);
    return [...finalAgents];
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
