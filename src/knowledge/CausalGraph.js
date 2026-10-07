import { CausalLink } from './CausalLink.js';

/**
 * Directed Causal Graph for causal inference and multi-step root-cause paths
 */
export class CausalGraph {
  constructor() {
    this._links = new Map(); // id -> CausalLink
    this._causes = new Map(); // effectId -> Set<linkId> (incoming causes)
    this._effects = new Map(); // causeId -> Set<linkId> (outgoing effects)
  }

  addLink(link) {
    const l = link instanceof CausalLink ? link : CausalLink.fromJSON(link);
    const linkId = `${l.causeId}=>${l.effectId}`;
    this._links.set(linkId, l);

    if (!this._causes.has(l.effectId)) this._causes.set(l.effectId, new Set());
    if (!this._effects.has(l.causeId)) this._effects.set(l.causeId, new Set());

    this._causes.get(l.effectId).add(linkId);
    this._effects.get(l.causeId).add(linkId);
    return l;
  }

  getCauses(effectId) {
    const linkIds = this._causes.get(effectId);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this._links.get(id)).filter(Boolean);
  }

  getEffects(causeId) {
    const linkIds = this._effects.get(causeId);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this._links.get(id)).filter(Boolean);
  }

  getCausalChain(effectId, maxDepth = 15) {
    const chain = [];
    const visited = new Set();
    const queue = [{ id: effectId, path: [effectId] }];

    let longestPath = [effectId];

    while (queue.length > 0) {
      const { id, path } = queue.shift();
      if (path.length > maxDepth) continue;

      const directCauses = this.getCauses(id);
      if (directCauses.length === 0) {
        if (path.length > longestPath.length) {
          longestPath = path;
        }
      }

      for (const link of directCauses) {
        if (!visited.has(`${link.causeId}:${id}`)) {
          visited.add(`${link.causeId}:${id}`);
          const nextPath = [link.causeId, ...path];
          if (nextPath.length > longestPath.length) {
            longestPath = nextPath;
          }
          queue.push({ id: link.causeId, path: nextPath });
        }
      }
    }

    return longestPath;
  }

  toJSON() {
    return {
      links: Array.from(this._links.values()).map(l => l.toJSON())
    };
  }

  static fromJSON(json = {}) {
    const graph = new CausalGraph();
    if (Array.isArray(json.links)) {
      for (const l of json.links) graph.addLink(CausalLink.fromJSON(l));
    }
    return graph;
  }
}
