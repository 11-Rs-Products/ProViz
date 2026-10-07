/**
 * ThreatModel.js
 * Comprehensive immutable threat model representation in ProViz Stage 31.
 */

import { ThreatActor } from './ThreatActor.js';
import { Asset } from './Asset.js';
import { TrustBoundary } from './TrustBoundary.js';
import { AttackSurface } from './AttackSurface.js';
import { SecurityInvariant } from './SecurityInvariant.js';

export class ThreatModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {Array<ThreatActor>} [options.actors=[]]
   * @param {Array<Asset>} [options.assets=[]]
   * @param {Array<TrustBoundary>} [options.trustBoundaries=[]]
   * @param {AttackSurface} [options.attackSurface=null]
   * @param {Array<SecurityInvariant>} [options.securityInvariants=[]]
   * @param {Array<string>} [options.assumptions=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    actors = [],
    assets = [],
    trustBoundaries = [],
    attackSurface = null,
    securityInvariants = [],
    assumptions = [],
    metadata = {}
  }) {
    if (!id) throw new Error('ThreatModel requires id');
    this.id = id;
    this.name = name || id;
    this.actors = Object.freeze(actors.map(a => a instanceof ThreatActor ? a : new ThreatActor(a)));
    this.assets = Object.freeze(assets.map(a => a instanceof Asset ? a : new Asset(a)));
    this.trustBoundaries = Object.freeze(trustBoundaries.map(tb => tb instanceof TrustBoundary ? tb : new TrustBoundary(tb)));
    this.attackSurface = attackSurface instanceof AttackSurface ? attackSurface : (attackSurface ? AttackSurface.fromJSON(attackSurface) : new AttackSurface());
    this.securityInvariants = Object.freeze(securityInvariants.map(si => si instanceof SecurityInvariant ? si : new SecurityInvariant(si)));
    this.assumptions = Object.freeze([...assumptions]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  getActor(id) {
    return this.actors.find(a => a.id === id) || null;
  }

  getAsset(id) {
    return this.assets.find(a => a.id === id) || null;
  }

  getTrustBoundary(id) {
    return this.trustBoundaries.find(tb => tb.id === id) || null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      actors: this.actors.map(a => a.toJSON()),
      assets: this.assets.map(a => a.toJSON()),
      trustBoundaries: this.trustBoundaries.map(tb => tb.toJSON()),
      attackSurface: this.attackSurface.toJSON(),
      securityInvariants: this.securityInvariants.map(si => si.toJSON()),
      assumptions: [...this.assumptions],
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new ThreatModel(json);
  }
}
