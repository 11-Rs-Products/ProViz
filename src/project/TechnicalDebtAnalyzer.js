/**
 * TechnicalDebtAnalyzer.js
 * Scans project architecture, code metrics, test adequacy, and verification states to compile technical debt.
 */

import { TechnicalDebt, TechnicalDebtItem, DebtCategory } from './TechnicalDebt.js';

export class TechnicalDebtAnalyzer {
  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {Object} [inputs={}]
   * @param {Object} [inputs.architectureAnalysis]
   * @param {Object} [inputs.structuralHealth]
   * @param {Object} [inputs.verificationGaps]
   */
  analyze(graph, inputs = {}) {
    if (!graph) throw new Error('TechnicalDebtAnalyzer requires graph');
    const items = [];
    const { architectureAnalysis, structuralHealth, verificationGaps } = inputs;

    // 1. Architecture violations debt
    if (architectureAnalysis && architectureAnalysis.violations) {
      for (const v of architectureAnalysis.violations) {
        items.push(new TechnicalDebtItem({
          id: `DEBT_ARCH_${v.id || items.length}`,
          title: `Architecture Violation: ${v.message || v.kind}`,
          category: DebtCategory.ARCHITECTURE,
          targetEntityId: v.source || 'global',
          risk: v.severity === 'CRITICAL' ? 0.9 : 0.6,
          scope: 2.0,
          age: 5.0,
          uncertainty: 0.1,
          remediationCost: 3.0,
          evidence: v
        }));
      }
    }

    // 2. Structural Coupling / Cycle debt
    if (structuralHealth && structuralHealth.cycles) {
      for (const cycle of structuralHealth.cycles) {
        items.push(new TechnicalDebtItem({
          id: `DEBT_CYCLE_${cycle.join('_')}`,
          title: `Cyclic Dependency in Architecture`,
          category: DebtCategory.DEPENDENCY,
          targetEntityId: cycle[0],
          risk: 0.8,
          scope: cycle.length,
          age: 7.0,
          uncertainty: 0.2,
          remediationCost: 4.0,
          evidence: { cycle }
        }));
      }
    }

    // 3. Verification Gaps debt
    if (verificationGaps && verificationGaps.gaps) {
      for (const gap of verificationGaps.gaps) {
        items.push(new TechnicalDebtItem({
          id: `DEBT_VERIF_${gap.id || items.length}`,
          title: `Unverified Requirement / Stale Evidence: ${gap.description || gap.obligationId}`,
          category: DebtCategory.VERIFICATION,
          targetEntityId: gap.entityId || 'system',
          risk: gap.criticality === 'HIGH' ? 0.85 : 0.5,
          scope: 1.5,
          age: gap.ageDays || 3.0,
          uncertainty: 0.3,
          remediationCost: 2.0,
          evidence: gap
        }));
      }
    }

    return new TechnicalDebt({
      items,
      timestamp: Date.now()
    });
  }
}
