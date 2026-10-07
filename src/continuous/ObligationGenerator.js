/**
 * ObligationGenerator.js
 * Generates verification obligations from ChangeSets and Stage 29 semantic blast radius.
 */

import { VerificationObligation, ObligationKind } from './VerificationObligation.js';
import { ChangeCategory } from './ChangeClassifier.js';

export class ObligationGenerator {
  /**
   * Generates verification obligations for a given ChangeSet and semantic impact context.
   * @param {import('./ChangeSet.js').ChangeSet} changeSet
   * @param {Object} [semanticImpact={ affectedNodes: [], riskLevel: 'LOW' }]
   * @returns {Array<VerificationObligation>}
   */
  generateObligations(changeSet, semanticImpact = {}) {
    const obligations = [];
    let obligationId = 1;

    const affected = semanticImpact.affectedNodes && semanticImpact.affectedNodes.length > 0
      ? semanticImpact.affectedNodes
      : [...changeSet.modifiedFiles, ...changeSet.modifiedFunctions];

    if (affected.length === 0) {
      affected.push('workspace_root');
    }

    for (const entity of affected) {
      // 1. Functional & Contract Preservation
      obligations.push(new VerificationObligation({
        id: `obl-${obligationId++}`,
        kind: ObligationKind.CONTRACT_PRESERVATION,
        targetEntity: entity,
        property: 'Contract Invariants & Functional Behavior',
        risk: semanticImpact.riskLevel === 'CRITICAL' ? 5.0 : 2.0,
        impact: 2.0,
        cost: 1.0
      }));

      // 2. Type & Null Safety
      obligations.push(new VerificationObligation({
        id: `obl-${obligationId++}`,
        kind: ObligationKind.NULL_SAFETY,
        targetEntity: entity,
        property: 'Null Safety & Type Soundness',
        risk: 1.5,
        impact: 1.5,
        cost: 0.5
      }));

      // 3. Security verification if security-relevant
      if (changeSet.description?.toLowerCase().includes('security') ||
          changeSet.description?.toLowerCase().includes('auth') ||
          changeSet.modifiedApis.length > 0) {
        obligations.push(new VerificationObligation({
          id: `obl-${obligationId++}`,
          kind: ObligationKind.SECURITY_PROPERTY,
          targetEntity: entity,
          property: 'No Privilege Escalation & Memory Safety',
          risk: 5.0,
          impact: 4.0,
          cost: 2.0
        }));
      }

      // 4. Performance if performance-relevant or batch change
      if (changeSet.description?.toLowerCase().includes('perf') ||
          changeSet.description?.toLowerCase().includes('optimiz')) {
        obligations.push(new VerificationObligation({
          id: `obl-${obligationId++}`,
          kind: ObligationKind.PERFORMANCE_THRESHOLD,
          targetEntity: entity,
          property: 'Latency & Memory Resource Bounds',
          risk: 3.0,
          impact: 3.0,
          cost: 2.0
        }));
      }

      // 5. Concurrency if lock/async/thread modified
      if (changeSet.description?.toLowerCase().includes('lock') ||
          changeSet.description?.toLowerCase().includes('async') ||
          changeSet.description?.toLowerCase().includes('race')) {
        obligations.push(new VerificationObligation({
          id: `obl-${obligationId++}`,
          kind: ObligationKind.RACE_FREEDOM,
          targetEntity: entity,
          property: 'Data Race Freedom & Lock Hierarchy Ordering',
          risk: 4.5,
          impact: 4.0,
          cost: 2.5
        }));
      }

      // 6. Test adequacy & regression
      obligations.push(new VerificationObligation({
        id: `obl-${obligationId++}`,
        kind: ObligationKind.TEST_ADEQUACY,
        targetEntity: entity,
        property: 'Regression Test Suite Pass & Mutation Coverage',
        risk: 2.0,
        impact: 2.0,
        cost: 1.0
      }));
    }

    return obligations;
  }
}
