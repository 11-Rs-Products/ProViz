/**
 * ProjectRecommendation.js
 * Actionable engineering or architecture recommendation backed by evidence.
 */

import { RecommendationEvidence } from './RecommendationEvidence.js';
import { RecommendationKind } from './RecommendationKind.js';

export class ProjectRecommendation {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.kind - from RecommendationKind
   * @param {string} options.title
   * @param {string} options.reason
   * @param {RecommendationEvidence} options.evidence
   * @param {string[]} [options.affectedScope=[]]
   * @param {string} options.expectedBenefit
   * @param {string} [options.risk='LOW'] - 'LOW' | 'MEDIUM' | 'HIGH'
   * @param {number} [options.estimatedCost=1.0]
   * @param {number} [options.verificationCost=1.0]
   * @param {number} [options.confidence=0.85]
   * @param {boolean} [options.requiredApproval=false]
   */
  constructor({
    id,
    kind = RecommendationKind.REFACTOR,
    title,
    reason,
    evidence,
    affectedScope = [],
    expectedBenefit,
    risk = 'LOW',
    estimatedCost = 1.0,
    verificationCost = 1.0,
    confidence = 0.85,
    requiredApproval = false
  }) {
    if (!id || !title || !reason || !evidence) {
      throw new Error('ProjectRecommendation requires id, title, reason, and evidence');
    }
    this.id = id;
    this.kind = kind;
    this.title = title;
    this.reason = reason;
    this.evidence = evidence instanceof RecommendationEvidence ? evidence : new RecommendationEvidence(evidence);
    this.affectedScope = Object.freeze([...affectedScope]);
    this.expectedBenefit = expectedBenefit;
    this.risk = risk;
    this.estimatedCost = estimatedCost;
    this.verificationCost = verificationCost;
    this.confidence = confidence;
    this.requiredApproval = Boolean(requiredApproval);
    this.priorityScore = Number(((this.confidence * 10) / Math.max(0.5, this.estimatedCost + this.verificationCost)).toFixed(2));
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      title: this.title,
      reason: this.reason,
      evidence: this.evidence.toJSON(),
      affectedScope: [...this.affectedScope],
      expectedBenefit: this.expectedBenefit,
      risk: this.risk,
      estimatedCost: this.estimatedCost,
      verificationCost: this.verificationCost,
      confidence: this.confidence,
      requiredApproval: this.requiredApproval,
      priorityScore: this.priorityScore
    };
  }

  static fromJSON(json) {
    return new ProjectRecommendation(json);
  }
}
