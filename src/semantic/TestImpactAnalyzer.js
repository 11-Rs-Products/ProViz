/**
 * TestImpactAnalyzer.js
 * Ranks tests according to semantic test value:
 * TestValue(t) = Coverage(t) * DependencyOverlap(t) * HistoricalSensitivity(t) * BehavioralRelevance(t)
 */

import { SemanticEntityKind } from './SemanticEntityKind.js';
import { DependencyClosure } from './DependencyClosure.js';

export class TestImpactAnalyzer {
  /**
   * Evaluates and ranks tests for a given semantic change.
   */
  rankTests(change, programGraph, testMetadata = {}) {
    const closure = DependencyClosure.buildFromProgramGraph(programGraph);
    const affectedNodeIds = new Set([change.targetId, ...closure.getReverseClosure(change.targetId)]);

    const allTestNodes = programGraph.queryNodes({ kind: SemanticEntityKind.TEST });
    const scoredTests = [];

    for (const testNode of allTestNodes) {
      const meta = testMetadata[testNode.id] || {};

      // 1. Coverage(t): Does this test cover the changed node?
      const directDeps = closure.getDependencies(testNode.id);
      const coversTarget = directDeps.some(d => d.targetId === change.targetId) || affectedNodeIds.has(testNode.id);
      const coverage = coversTarget ? (meta.coverage || 0.9) : (meta.coverage || 0.3);

      // 2. DependencyOverlap(t)
      const testDependencies = closure.getDependencies(testNode.id).map(d => d.targetId);
      const overlapCount = testDependencies.filter(id => affectedNodeIds.has(id)).length;
      const dependencyOverlap = testDependencies.length > 0
        ? Math.min(1.0, (overlapCount + 1) / (testDependencies.length + 1))
        : 0.5;

      // 3. HistoricalSensitivity(t)
      const historicalSensitivity = meta.sensitivity !== undefined ? meta.sensitivity : 0.8;

      // 4. BehavioralRelevance(t)
      const behavioralRelevance = meta.behavioralRelevance !== undefined ? meta.behavioralRelevance : 0.85;

      const score = coverage * dependencyOverlap * historicalSensitivity * behavioralRelevance;

      scoredTests.push({
        testId: testNode.id,
        testName: testNode.name,
        score,
        factors: {
          coverage,
          dependencyOverlap,
          historicalSensitivity,
          behavioralRelevance
        }
      });
    }

    // Sort descending by score, deterministic tie-breaking
    scoredTests.sort((a, b) => b.score - a.score || a.testId.localeCompare(b.testId));
    return scoredTests;
  }
}
