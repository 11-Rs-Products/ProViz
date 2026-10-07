/**
 * ArchitectureModel.js
 * Model containing layers, boundaries, rules, and allowed dependency specifications.
 */

import { ArchitectureLayer } from './ArchitectureLayer.js';
import { ArchitectureBoundary } from './ArchitectureBoundary.js';
import { ArchitectureRule } from './ArchitectureRule.js';

export class ArchitectureModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {ArchitectureLayer[]} [options.layers=[]]
   * @param {ArchitectureBoundary[]} [options.boundaries=[]]
   * @param {ArchitectureRule[]} [options.rules=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    layers = [],
    boundaries = [],
    rules = [],
    metadata = {}
  }) {
    if (!id) throw new Error('ArchitectureModel requires id');
    this.id = id;
    this.name = name || id;
    this.layers = new Map();
    for (const l of layers) {
      const layer = l instanceof ArchitectureLayer ? l : new ArchitectureLayer(l);
      this.layers.set(layer.id, layer);
    }
    this.boundaries = new Map();
    for (const b of boundaries) {
      const boundary = b instanceof ArchitectureBoundary ? b : new ArchitectureBoundary(b);
      this.boundaries.set(boundary.id, boundary);
    }
    this.rules = new Map();
    for (const r of rules) {
      const rule = r instanceof ArchitectureRule ? r : new ArchitectureRule(r);
      this.rules.set(rule.id, rule);
    }
    this.metadata = { ...metadata };
  }

  addLayer(layerData) {
    const layer = layerData instanceof ArchitectureLayer ? layerData : new ArchitectureLayer(layerData);
    this.layers.set(layer.id, layer);
    return layer;
  }

  getLayer(id) {
    return this.layers.get(id) || null;
  }

  getLayerForModule(moduleId) {
    for (const layer of this.layers.values()) {
      if (layer.modules.includes(moduleId)) return layer;
    }
    return null;
  }

  addBoundary(boundaryData) {
    const boundary = boundaryData instanceof ArchitectureBoundary ? boundaryData : new ArchitectureBoundary(boundaryData);
    this.boundaries.set(boundary.id, boundary);
    return boundary;
  }

  getBoundary(id) {
    return this.boundaries.get(id) || null;
  }

  getBoundaryForModule(moduleId) {
    for (const b of this.boundaries.values()) {
      if (b.isInternal(moduleId)) return b;
    }
    return null;
  }

  addRule(ruleData) {
    const rule = ruleData instanceof ArchitectureRule ? ruleData : new ArchitectureRule(ruleData);
    this.rules.set(rule.id, rule);
    return rule;
  }

  getRules() {
    return Array.from(this.rules.values());
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      layers: Array.from(this.layers.values()).map(l => l.toJSON()),
      boundaries: Array.from(this.boundaries.values()).map(b => b.toJSON()),
      rules: Array.from(this.rules.values()).map(r => r.toJSON()),
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ArchitectureModel({
      id: json.id,
      name: json.name,
      layers: (json.layers || []).map(l => ArchitectureLayer.fromJSON(l)),
      boundaries: (json.boundaries || []).map(b => ArchitectureBoundary.fromJSON(b)),
      rules: (json.rules || []).map(r => ArchitectureRule.fromJSON(r)),
      metadata: json.metadata
    });
  }
}
