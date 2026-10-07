/**
 * EngineeringHealthAnalyzer.js
 * Computes multidimensional EngineeringHealth from project graph, verification state, architecture violations, debt, and security/performance models.
 */

import { EngineeringHealth } from './EngineeringHealth.js';
import { EngineeringHealthDimension } from './EngineeringHealthDimension.js';
import { StructuralHealthAnalyzer } from './StructuralHealthAnalyzer.js';

export class EngineeringHealthAnalyzer {
  constructor() {
    this.structuralAnalyzer = new StructuralHealthAnalyzer();
  }

  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {Object} [inputs={}]
   * @param {Object} [inputs.architectureAnalysis]
   * @param {Object} [inputs.verificationState]
   * @param {Object} [inputs.securityPosture]
   * @param {Object} [inputs.performancePosture]
   * @param {Object} [inputs.concurrencyPosture]
   * @param {Object} [inputs.technicalDebt]
   * @param {Object} [inputs.verificationDebt]
   * @param {Object} [inputs.testAdequacy]
   * @param {Object} [inputs.specCoverage]
   */
  analyze(graph, inputs = {}) {
    if (!graph) throw new Error('EngineeringHealthAnalyzer requires graph');
    const {
      architectureAnalysis,
      verificationState,
      securityPosture,
      performancePosture,
      concurrencyPosture,
      technicalDebt,
      verificationDebt,
      testAdequacy,
      specCoverage
    } = inputs;

    const structuralRes = this.structuralAnalyzer.analyze(graph);

    // Architecture score
    const archViolations = architectureAnalysis ? (architectureAnalysis.violationCount || (architectureAnalysis.violations || []).length) : 0;
    const archScore = Math.max(0.0, 1.0 - (archViolations * 0.15));

    // Correctness score
    let correctnessScore = 1.0;
    if (verificationState) {
      const verified = verificationState.verifiedObligations || verificationState.passedCount || 0;
      const total = verificationState.totalObligations || (verified + (verificationState.failedCount || 0)) || 1;
      correctnessScore = total > 0 ? verified / total : 1.0;
    }

    // Security score
    let securityScore = 1.0;
    if (securityPosture) {
      const vuln = securityPosture.vulnerabilitiesCount || (securityPosture.threats || []).length || 0;
      securityScore = Math.max(0.0, 1.0 - (vuln * 0.2));
    }

    // Performance score
    let performanceScore = 1.0;
    if (performancePosture) {
      const reg = performancePosture.regressionsCount || (performancePosture.regressions || []).length || 0;
      performanceScore = Math.max(0.0, 1.0 - (reg * 0.2));
    }

    // Concurrency score
    let concurrencyScore = 1.0;
    if (concurrencyPosture) {
      const race = concurrencyPosture.racesCount || (concurrencyPosture.violations || []).length || 0;
      concurrencyScore = Math.max(0.0, 1.0 - (race * 0.2));
    }

    // Reliability score
    const reliabilityScore = Number(((correctnessScore * 0.5) + (performanceScore * 0.25) + (concurrencyScore * 0.25)).toFixed(4));

    // Maintainability score
    const maintainabilityScore = structuralRes.score;

    // Test adequacy & verification coverage
    const testScore = testAdequacy ? (testAdequacy.score || testAdequacy.coverage || 0.9) : 0.85;
    const verifCoverageScore = verificationDebt ? Math.max(0.0, 1.0 - (verificationDebt.debtScore || 0.1)) : 0.9;

    // Technical debt score (inverse of debt)
    const techDebtScore = technicalDebt ? Math.max(0.0, 1.0 - (technicalDebt.totalDebtScore ? Math.min(1.0, technicalDebt.totalDebtScore / 100) : 0.1)) : 0.9;

    const dimensions = {
      [EngineeringHealthDimension.CORRECTNESS]: correctnessScore,
      [EngineeringHealthDimension.SECURITY]: securityScore,
      [EngineeringHealthDimension.PERFORMANCE]: performanceScore,
      [EngineeringHealthDimension.RELIABILITY]: reliabilityScore,
      [EngineeringHealthDimension.CONCURRENCY]: concurrencyScore,
      [EngineeringHealthDimension.ARCHITECTURE]: archScore,
      [EngineeringHealthDimension.MAINTAINABILITY]: maintainabilityScore,
      [EngineeringHealthDimension.TEST_ADEQUACY]: testScore,
      [EngineeringHealthDimension.VERIFICATION_COVERAGE]: verifCoverageScore,
      [EngineeringHealthDimension.CHANGE_SAFETY]: Number(((archScore + maintainabilityScore) / 2).toFixed(4)),
      [EngineeringHealthDimension.SPECIFICATION_COVERAGE]: specCoverage ? (specCoverage.coverage || 0.85) : 0.85,
      [EngineeringHealthDimension.TECHNICAL_DEBT]: techDebtScore,
      [EngineeringHealthDimension.VERIFICATION_DEBT]: verifCoverageScore
    };

    const evidence = {
      architectureViolations: archViolations,
      structuralMetrics: structuralRes.metrics,
      rawInputs: { ...inputs }
    };

    return new EngineeringHealth({
      dimensions,
      evidence,
      timestamp: Date.now()
    });
  }
}
