/**
 * TransformationImpactPlanner.js
 * Converts transformation impact into Stage 25 verification goals and Stage 26/27 tasks.
 */

export class TransformationImpactPlanner {
  planVerificationTasks(candidate, impactResult) {
    const goals = [];
    const tasks = [];

    // 1. Goal for affected contracts/invariants
    if (candidate.transformation.preservationRequirements.includes('CONTRACTS')) {
      goals.push({
        id: `goal:contract_verify:${candidate.candidateId}`,
        type: 'CONTRACT_VERIFICATION',
        priority: 'HIGH',
        targetId: candidate.transformation.sourceScope
      });

      tasks.push({
        id: `task:contract_checker:${Date.now()}`,
        agentType: 'FORMAL_SOLVER',
        action: 'CHECK_CONTRACT_INVARIANTS',
        target: candidate.transformation.sourceScope
      });
    }

    // 2. Goal for regression tests
    if (impactResult?.staleTestIds && impactResult.staleTestIds.length > 0) {
      goals.push({
        id: `goal:regression:${candidate.candidateId}`,
        type: 'REGRESSION_VERIFICATION',
        priority: 'HIGH',
        targetIds: impactResult.staleTestIds
      });

      tasks.push({
        id: `task:test_executor:${Date.now()}`,
        agentType: 'TEST_RUNNER',
        action: 'RUN_TEST_SUITE',
        targetIds: impactResult.staleTestIds
      });
    }

    return {
      candidateId: candidate.candidateId,
      goals,
      tasks
    };
  }
}
