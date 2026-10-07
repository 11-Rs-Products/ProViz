/**
 * SemanticImpactPlanner.js
 * Converts semantic impact analysis and risk models into Stage 25 verification goals
 * and Stage 26/27 orchestration/federation tasks.
 */

export class SemanticImpactPlanner {
  /**
   * Translates impact and risk into verification planning directives.
   */
  planFromImpact(impactResult, riskModel, options = {}) {
    const goals = [];
    const tasks = [];

    const { change, invalidatedProofIds, staleTestIds, blastRadius } = impactResult;

    // 1. Goal for invalidated formal proofs
    if (invalidatedProofIds && invalidatedProofIds.length > 0) {
      goals.push({
        id: `goal:reprove:${change.targetId}`,
        type: 'FORMAL_REVERIFICATION',
        priority: 'CRITICAL',
        targetIds: invalidatedProofIds,
        reason: 'Formal proof invalidated by upstream change'
      });

      tasks.push({
        id: `task:formal_solver:${Date.now()}`,
        goalId: `goal:reprove:${change.targetId}`,
        agentType: 'FORMAL_SOLVER',
        action: 'REPROVE_INVARIANTS',
        targetEntities: invalidatedProofIds
      });
    }

    // 2. Goal for regression tests
    if (staleTestIds && staleTestIds.length > 0) {
      goals.push({
        id: `goal:test_regression:${change.targetId}`,
        type: 'REGRESSION_TESTING',
        priority: riskModel.riskScore > 0.4 ? 'HIGH' : 'MEDIUM',
        targetIds: staleTestIds,
        reason: 'Regression test validation needed for modified behavior'
      });

      tasks.push({
        id: `task:test_runner:${Date.now()}`,
        goalId: `goal:test_regression:${change.targetId}`,
        agentType: 'TEST_RUNNER',
        action: 'RUN_REGRESSION_TESTS',
        targetEntities: staleTestIds
      });
    }

    // 3. Goal for API boundary checks if blast radius is EXTERNAL
    if (blastRadius.scope === 'EXTERNAL') {
      goals.push({
        id: `goal:api_compat:${change.targetId}`,
        type: 'API_COMPATIBILITY_VERIFICATION',
        priority: 'HIGH',
        targetIds: blastRadius.affectedAPIs,
        reason: 'External API boundary affected by signature change'
      });
    }

    return {
      changeId: change.id,
      targetId: change.targetId,
      riskScore: riskModel.riskScore,
      plannedGoals: goals,
      plannedTasks: tasks,
      summary: `Generated ${goals.length} verification goals and ${tasks.length} execution tasks`
    };
  }
}
