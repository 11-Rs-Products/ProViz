/**
 * Bridges Knowledge Gaps to autonomous verification plans and federated tasks
 */
export class KnowledgeTaskPlanner {
  constructor(knowledgeGapAnalyzer) {
    this.gapAnalyzer = knowledgeGapAnalyzer;
  }

  generatePlanningGoals() {
    const gaps = this.gapAnalyzer.detectGaps();
    const goals = [];

    for (const gap of gaps) {
      let goalKind = 'PROPERTY';
      let targetKind = 'STATIC_PROOF';

      if (gap.gapKind === 'UNKNOWN_CAUSE') {
        goalKind = 'FINDING';
        targetKind = 'ROOT_CAUSE_ANALYSIS';
      } else if (gap.gapKind === 'UNSUPPORTED_CLAIM') {
        goalKind = 'PROPERTY';
        targetKind = 'FORMAL_PROOF';
      } else if (gap.gapKind === 'ORPHAN_EVIDENCE') {
        goalKind = 'ORACLE';
        targetKind = 'EVIDENCE_RECONCILIATION';
      }

      goals.push({
        goalId: `goal-gap-${gap.entityId}`,
        goalKind,
        targetTaskKind: targetKind,
        targetEntityId: gap.entityId,
        priority: gap.severity === 'HIGH' ? 10 : 5,
        description: gap.description,
        originGap: gap
      });
    }

    return goals;
  }
}
