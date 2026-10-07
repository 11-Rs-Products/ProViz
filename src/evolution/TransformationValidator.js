/**
 * TransformationValidator.js
 * Comprehensive multi-stage validator coordinating syntactic, structural,
 * semantic, contract, behavioral, and regression validation.
 */

import { BehaviorPreservationAnalyzer } from './BehaviorPreservationAnalyzer.js';
import { ContractPreservationAnalyzer } from './ContractPreservationAnalyzer.js';
import { InvariantPreservationAnalyzer } from './InvariantPreservationAnalyzer.js';
import { SemanticPreservationAnalyzer } from './SemanticPreservationAnalyzer.js';

export class TransformationValidator {
  constructor() {
    this.behaviorAnalyzer = new BehaviorPreservationAnalyzer();
    this.contractAnalyzer = new ContractPreservationAnalyzer();
    this.invariantAnalyzer = new InvariantPreservationAnalyzer();
    this.semanticAnalyzer = new SemanticPreservationAnalyzer();
  }

  validate(candidate, originalModel, transformedModel, options = {}) {
    const issues = [];
    let isValid = true;

    // 1. Syntactic Validation
    for (const edit of candidate.edits) {
      if (!edit.replacement && edit.operation !== 'DELETE') {
        issues.push(`Edit ${edit.id} has empty replacement text`);
        isValid = false;
      }
    }

    // 2. Behavioral Validation
    const behaviorRes = this.behaviorAnalyzer.evaluate(candidate, originalModel, transformedModel, options);
    if (!behaviorRes.isPreserved) {
      issues.push('Behavioral divergence detected during validation');
      isValid = false;
    }

    // 3. Contract Validation
    const contractRes = this.contractAnalyzer.evaluate(candidate, originalModel, transformedModel);
    if (!contractRes.isPreserved) {
      issues.push(`Contract validation failed: ${contractRes.missingContracts.length} contracts dropped`);
      isValid = false;
    }

    // 4. Invariant Validation
    const invariantRes = this.invariantAnalyzer.evaluate(candidate, originalModel, transformedModel, options.knownInvariants || []);
    if (!invariantRes.isPreserved) {
      issues.push(`Invariant validation failed: ${invariantRes.violatedInvariants.length} invariants violated`);
      isValid = false;
    }

    // 5. Semantic Graph Preservation
    const semanticRes = this.semanticAnalyzer.evaluate(candidate, originalModel, transformedModel);
    if (semanticRes.status === 'VIOLATED') {
      issues.push('Semantic graph invariant violated after transformation');
      isValid = false;
    }

    const confidence = Math.min(
      behaviorRes.confidence,
      contractRes.confidence,
      invariantRes.confidence,
      semanticRes.confidence || 0.90
    );

    return {
      candidateId: candidate.candidateId,
      isValid,
      issues,
      confidence,
      stages: {
        behavior: behaviorRes,
        contract: contractRes,
        invariant: invariantRes,
        semantic: semanticRes
      }
    };
  }
}
