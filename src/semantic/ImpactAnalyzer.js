/**
 * ImpactAnalyzer.js
 * Computes whole-system semantic impact of a change using the multi-factor formula:
 * Impact(C) = α*D + β*B + γ*S + δ*V + ε*E + ζ*R
 */

import { DependencyClosure } from './DependencyClosure.js';
import { BlastRadius, BlastRadiusScope, BlastRadiusSeverity } from './BlastRadius.js';
import { SemanticEntityKind } from './SemanticEntityKind.js';
import { SemanticRelationKind } from './SemanticRelationKind.js';

export class ImpactAnalyzer {
  /**
   * @param {Object} [weights]
   * @param {number} [weights.alpha=0.20] - Dependency weight (D)
   * @param {number} [weights.beta=0.20]  - Behavioral weight (B)
   * @param {number} [weights.gamma=0.20] - Specification weight (S)
   * @param {number} [weights.delta=0.15] - Verification weight (V)
   * @param {number} [weights.epsilon=0.10]- Evidence weight (E)
   * @param {number} [weights.zeta=0.15]  - Regression risk weight (R)
   */
  constructor(weights = {}) {
    this.alpha = weights.alpha !== undefined ? weights.alpha : 0.20;
    this.beta = weights.beta !== undefined ? weights.beta : 0.20;
    this.gamma = weights.gamma !== undefined ? weights.gamma : 0.20;
    this.delta = weights.delta !== undefined ? weights.delta : 0.15;
    this.epsilon = weights.epsilon !== undefined ? weights.epsilon : 0.10;
    this.zeta = weights.zeta !== undefined ? weights.zeta : 0.15;
  }

  /**
   * Evaluates impact of a SemanticChange over the SemanticProgramGraph.
   */
  analyze(change, programGraph, options = {}) {
    if (!change || !programGraph) {
      throw new Error('ImpactAnalyzer requires a valid SemanticChange and SemanticProgramGraph');
    }

    const targetNode = programGraph.getNode(change.targetId);
    const closure = DependencyClosure.buildFromProgramGraph(programGraph);
    const reverseClosureIds = closure.getReverseClosure(change.targetId, options.maxDepth || 30);

    // 1. Dependency Impact (D)
    const affectedNodeIds = [change.targetId, ...reverseClosureIds];
    const totalNodes = Math.max(1, programGraph.nodeCount);
    const D = Math.min(1.0, affectedNodeIds.length / totalNodes);

    // 2. Classify affected artifacts
    const callers = [];
    const tests = [];
    const contracts = [];
    const invariants = [];
    const proofs = [];
    const mutants = [];
    const apis = [];

    for (const id of affectedNodeIds) {
      const node = programGraph.getNode(id);
      if (!node) continue;

      if (node.kind === SemanticEntityKind.TEST) tests.push(id);
      else if (node.kind === SemanticEntityKind.CONTRACT) contracts.push(id);
      else if (node.kind === SemanticEntityKind.INVARIANT) invariants.push(id);
      else if (node.kind === SemanticEntityKind.PROOF) proofs.push(id);
      else if (node.kind === SemanticEntityKind.MUTANT) mutants.push(id);
      else if (node.kind === SemanticEntityKind.API_BOUNDARY || node.kind === SemanticEntityKind.FUNCTION) {
        if (id !== change.targetId) callers.push(id);
        if (node.kind === SemanticEntityKind.API_BOUNDARY) apis.push(id);
      }
    }

    // 3. Behavioral Impact (B)
    const isControlOrDataFlowChange = change.type.includes('FLOW') || change.type.includes('MEMORY') || change.type.includes('MODIFIED');
    const B = Math.min(1.0, (isControlOrDataFlowChange ? 0.6 : 0.2) + (callers.length * 0.05));

    // 4. Specification Impact (S)
    const S = Math.min(1.0, (contracts.length * 0.25) + (invariants.length * 0.35) + (change.type.includes('SPEC') || change.type.includes('CONTRACT') ? 0.5 : 0.0));

    // 5. Verification Impact (V)
    const V = Math.min(1.0, (proofs.length * 0.3) + (mutants.length * 0.1) + (tests.length * 0.1));

    // 6. Evidence Impact (E)
    const staleEvidenceCount = proofs.length + tests.length;
    const E = Math.min(1.0, staleEvidenceCount * 0.15);

    // 7. Regression Risk (R)
    const R = Math.min(1.0, (D * 0.3) + (B * 0.4) + (S * 0.3));

    // Compute composite score
    const impactScore = (this.alpha * D) +
                        (this.beta * B) +
                        (this.gamma * S) +
                        (this.delta * V) +
                        (this.epsilon * E) +
                        (this.zeta * R);

    // Determine Blast Radius Scope
    let scope = BlastRadiusScope.LOCAL;
    if (apis.length > 0) scope = BlastRadiusScope.EXTERNAL;
    else if (affectedNodeIds.length > 20) scope = BlastRadiusScope.SYSTEM;
    else if (affectedNodeIds.length > 10) scope = BlastRadiusScope.PROJECT;
    else if (affectedNodeIds.length > 5) scope = BlastRadiusScope.MODULE;
    else if (callers.length > 0) scope = BlastRadiusScope.FUNCTION;

    // Determine Severity
    let severity = BlastRadiusSeverity.TRIVIAL;
    if (impactScore > 0.75 || S > 0.8) severity = BlastRadiusSeverity.CRITICAL;
    else if (impactScore > 0.50 || proofs.length > 0) severity = BlastRadiusSeverity.HIGH;
    else if (impactScore > 0.25 || callers.length > 0) severity = BlastRadiusSeverity.MODERATE;
    else if (impactScore > 0.10) severity = BlastRadiusSeverity.LOW;

    const blastRadius = new BlastRadius({
      scope,
      severity,
      affectedCallers: callers,
      affectedTests: tests,
      affectedContracts: contracts,
      affectedInvariants: invariants,
      affectedProofs: proofs,
      affectedMutants: mutants,
      affectedAPIs: apis,
      totalAffectedEntities: affectedNodeIds.length
    });

    return {
      change,
      impactScore: Math.max(0.0, Math.min(1.0, impactScore)),
      breakdown: {
        dependencyImpact: D,
        behavioralImpact: B,
        specificationImpact: S,
        verificationImpact: V,
        evidenceImpact: E,
        regressionRisk: R
      },
      blastRadius,
      affectedNodeIds,
      invalidatedProofIds: proofs,
      staleTestIds: tests
    };
  }
}
