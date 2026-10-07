/**
 * EvidenceStore.js
 * High-performance repository indexing all evidence artifacts across engines, entities, and categories.
 */

import { EvidenceArtifact, EvidenceCategory } from './EvidenceArtifact.js';

export class EvidenceStore {
  constructor() {
    /** @type {Map<string, EvidenceArtifact>} */
    this._artifacts = new Map();
    /** @type {Map<string, Set<string>>} */
    this._byEntity = new Map();
    /** @type {Map<string, Set<string>>} */
    this._byCategory = new Map();
  }

  put(artifactData) {
    const artifact = artifactData instanceof EvidenceArtifact ? artifactData : new EvidenceArtifact(artifactData);
    this._artifacts.set(artifact.id, artifact);

    if (!this._byEntity.has(artifact.targetEntityId)) {
      this._byEntity.set(artifact.targetEntityId, new Set());
    }
    this._byEntity.get(artifact.targetEntityId).add(artifact.id);

    if (!this._byCategory.has(artifact.category)) {
      this._byCategory.set(artifact.category, new Set());
    }
    this._byCategory.get(artifact.category).add(artifact.id);

    return artifact;
  }

  get(id) {
    return this._artifacts.get(id) || null;
  }

  getByEntity(entityId) {
    const ids = this._byEntity.get(entityId);
    if (!ids) return [];
    return Array.from(ids).map(id => this._artifacts.get(id)).filter(Boolean);
  }

  getByCategory(category) {
    const ids = this._byCategory.get(category);
    if (!ids) return [];
    return Array.from(ids).map(id => this._artifacts.get(id)).filter(Boolean);
  }

  getAll() {
    return Array.from(this._artifacts.values());
  }

  get size() {
    return this._artifacts.size;
  }

  toJSON() {
    return {
      artifacts: Array.from(this._artifacts.values()).map(a => a.toJSON())
    };
  }

  static fromJSON(json) {
    const store = new EvidenceStore();
    if (json.artifacts) {
      for (const a of json.artifacts) store.put(EvidenceArtifact.fromJSON(a));
    }
    return store;
  }
}

export class EvidenceMergeEngine {
  /**
   * Merge multiple evidence artifacts for the same entity without collapsing proof distinctions
   * @param {EvidenceArtifact[]} artifacts
   */
  merge(artifacts) {
    if (!artifacts || artifacts.length === 0) {
      return { totalConfidence: 0.0, hasFormalProof: false, mergedCount: 0 };
    }

    const hasFormal = artifacts.some(a => a.isFormalProof);
    const avgConfidence = artifacts.reduce((acc, a) => acc + a.confidence, 0) / artifacts.length;
    const categories = Array.from(new Set(artifacts.map(a => a.category)));

    return {
      totalConfidence: Number(avgConfidence.toFixed(4)),
      hasFormalProof: hasFormal,
      categories,
      mergedCount: artifacts.length,
      artifacts: artifacts.map(a => a.id)
    };
  }
}

export class EvidenceFreshnessManager {
  /**
   * Evaluate stale evidence based on source revision or elapsed time
   * @param {EvidenceArtifact[]} artifacts
   * @param {number} currentRevision
   * @param {number} [maxAgeMs=86400000]
   */
  detectStale(artifacts, currentRevision, maxAgeMs = 86400000) {
    const stale = [];
    const now = Date.now();

    for (const a of artifacts) {
      const isRevisionStale = a.provenance?.revision && a.provenance.revision < currentRevision - 2;
      const isTimeStale = (now - a.timestamp) > maxAgeMs;

      if (isRevisionStale || isTimeStale) {
        stale.push(a);
      }
    }

    return {
      totalEvaluated: artifacts.length,
      staleCount: stale.length,
      staleArtifacts: stale
    };
  }
}
