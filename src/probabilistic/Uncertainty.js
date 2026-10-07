import { UncertaintyKind } from './UncertaintyKind.js';
export { UncertaintyKind };

export class Uncertainty {
  constructor({
    kind = UncertaintyKind.UNKNOWN,
    score = 1.0, // 0.0 (fully certain) to 1.0 (completely uncertain)
    sources = [],
    description = '',
    metadata = {}
  }) {
    this.kind = kind;
    this.score = Math.max(0.0, Math.min(1.0, score));
    this.sources = Object.freeze([...sources]);
    this.description = description;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  isCertain(threshold = 0.05) {
    return this.score <= threshold;
  }

  isHigh(threshold = 0.6) {
    return this.score >= threshold;
  }

  toJSON() {
    return {
      kind: this.kind,
      score: this.score,
      sources: this.sources.map(s => (s.toJSON ? s.toJSON() : s)),
      description: this.description,
      metadata: this.metadata
    };
  }
}
