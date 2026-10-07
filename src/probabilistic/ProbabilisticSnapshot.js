import { EvidenceGraph } from './EvidenceGraph.js';

export class ProbabilisticSnapshot {
  constructor({
    id,
    programIdentity = 'default',
    evidenceGraph = new EvidenceGraph(),
    distributions = {},
    confidenceStates = {},
    uncertaintyStates = {},
    environmentFingerprints = {},
    campaignState = {},
    randomSeed = 42,
    timestamp = Date.now()
  } = {}) {
    this.id = id || `snap:${timestamp}`;
    this.programIdentity = programIdentity;
    this.evidenceGraph = evidenceGraph;
    this.distributions = Object.freeze({ ...distributions });
    this.confidenceStates = Object.freeze({ ...confidenceStates });
    this.uncertaintyStates = Object.freeze({ ...uncertaintyStates });
    this.environmentFingerprints = Object.freeze({ ...environmentFingerprints });
    this.campaignState = Object.freeze({ ...campaignState });
    this.randomSeed = randomSeed;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      programIdentity: this.programIdentity,
      evidenceGraph: this.evidenceGraph.toJSON ? this.evidenceGraph.toJSON() : this.evidenceGraph,
      distributions: this.distributions,
      confidenceStates: this.confidenceStates,
      uncertaintyStates: this.uncertaintyStates,
      environmentFingerprints: this.environmentFingerprints,
      campaignState: this.campaignState,
      randomSeed: this.randomSeed,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new ProbabilisticSnapshot({
      id: data.id,
      programIdentity: data.programIdentity,
      distributions: data.distributions,
      confidenceStates: data.confidenceStates,
      uncertaintyStates: data.uncertaintyStates,
      environmentFingerprints: data.environmentFingerprints,
      campaignState: data.campaignState,
      randomSeed: data.randomSeed,
      timestamp: data.timestamp
    });
  }
}
