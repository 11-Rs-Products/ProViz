/**
 * RecommendationGenerator.js
 * Analyzes architecture violations, debt, gaps, and hotspots to generate concrete ProjectRecommendations.
 */

import { ProjectRecommendation } from './ProjectRecommendation.js';
import { RecommendationKind } from './RecommendationKind.js';
import { RecommendationEvidence } from './RecommendationEvidence.js';

export class RecommendationGenerator {
  /**
   * @param {Object} inputs
   * @param {Object} [inputs.architectureAnalysis]
   * @param {Object} [inputs.architectureDrift]
   * @param {Object} [inputs.verificationGaps]
   * @param {Object} [inputs.technicalDebt]
   * @param {Object} [inputs.riskHotspots]
   */
  generate(inputs = {}) {
    const recommendations = [];
    const {
      architectureAnalysis,
      architectureDrift,
      verificationGaps,
      technicalDebt,
      riskHotspots
    } = inputs;

    // 1. Architecture Violations / Cycles
    if (architectureAnalysis && architectureAnalysis.violations) {
      for (const v of architectureAnalysis.violations) {
        if (v.kind === 'ARCHITECTURAL_CYCLE') {
          recommendations.push(new ProjectRecommendation({
            id: `REC_CYCLE_${Date.now()}_${recommendations.length}`,
            kind: RecommendationKind.BREAK_DEPENDENCY_CYCLE,
            title: `Break architectural cycle between ${v.cycle.join(' and ')}`,
            reason: 'Cyclic dependencies degrade modularity, impede testing, and cause cascading invalidations',
            evidence: new RecommendationEvidence({
              sourceMetric: 'ARCHITECTURAL_CYCLE',
              observedValue: v.cycle.join(' -> '),
              thresholdValue: 'acyclic',
              supportingData: v
            }),
            affectedScope: v.cycle,
            expectedBenefit: 'Restore acyclic architecture and eliminate dependency deadlock risk',
            risk: 'MEDIUM',
            estimatedCost: 2.0,
            verificationCost: 1.0,
            confidence: 0.95
          }));
        } else if (v.kind === 'LAYER_VIOLATION') {
          recommendations.push(new ProjectRecommendation({
            id: `REC_LAYER_${Date.now()}_${recommendations.length}`,
            kind: RecommendationKind.REFACTOR,
            title: `Refactor forbidden dependency: ${v.source} -> ${v.target}`,
            reason: v.message,
            evidence: new RecommendationEvidence({
              sourceMetric: 'LAYER_VIOLATION',
              observedValue: `${v.sourceLayer} -> ${v.targetLayer}`,
              thresholdValue: 'allowed layer transitions only',
              supportingData: v
            }),
            affectedScope: [v.source, v.target],
            expectedBenefit: 'Restore clean layer isolation and architectural compliance',
            risk: 'LOW',
            estimatedCost: 1.5,
            verificationCost: 1.0,
            confidence: 0.90
          }));
        }
      }
    }

    // 2. Architecture Drift
    if (architectureDrift && architectureDrift.hasDrift && architectureDrift.severity !== 'NONE') {
      recommendations.push(new ProjectRecommendation({
        id: `REC_DRIFT_${Date.now()}_${recommendations.length}`,
        kind: RecommendationKind.REPAIR_ARCHITECTURE_DRIFT,
        title: `Repair architectural drift (${architectureDrift.severity}) from baseline`,
        reason: `Detected ${architectureDrift.addedDependencies.length} added dependencies diverging from approved architecture baseline`,
        evidence: new RecommendationEvidence({
          sourceMetric: 'ARCHITECTURE_DRIFT',
          observedValue: architectureDrift.severity,
          thresholdValue: 'NONE',
          supportingData: architectureDrift
        }),
        affectedScope: architectureDrift.addedDependencies,
        expectedBenefit: 'Re-align project evolution with baseline architectural invariants',
        risk: 'MEDIUM',
        estimatedCost: 3.0,
        verificationCost: 1.5,
        confidence: 0.85
      }));
    }

    // 3. Verification Gaps
    if (verificationGaps && verificationGaps.gaps) {
      for (const gap of verificationGaps.gaps) {
        if (gap.gapKind === 'MISSING_CONTRACT') {
          recommendations.push(new ProjectRecommendation({
            id: `REC_CONTRACT_${gap.id}`,
            kind: RecommendationKind.ADD_CONTRACT,
            title: `Add formal contract for API ${gap.entityId}`,
            reason: gap.description,
            evidence: new RecommendationEvidence({
              sourceMetric: 'MISSING_CONTRACT',
              observedValue: 0,
              thresholdValue: 1,
              supportingData: gap
            }),
            affectedScope: [gap.entityId],
            expectedBenefit: 'Enable automated bounded verification and prevent contract regression',
            risk: 'LOW',
            estimatedCost: 1.0,
            verificationCost: 0.5,
            confidence: 0.95
          }));
        } else if (gap.gapKind === 'MISSING_SECURITY_VERIFICATION') {
          recommendations.push(new ProjectRecommendation({
            id: `REC_SEC_${gap.id}`,
            kind: RecommendationKind.ADD_SECURITY_VERIFICATION,
            title: `Verify security boundary ${gap.entityId}`,
            reason: gap.description,
            evidence: new RecommendationEvidence({
              sourceMetric: 'MISSING_SECURITY_VERIFICATION',
              observedValue: 'unverified',
              thresholdValue: 'formally verified',
              supportingData: gap
            }),
            affectedScope: [gap.entityId],
            expectedBenefit: 'Eliminate adversarial vulnerability risks at security boundary',
            risk: 'HIGH',
            estimatedCost: 3.0,
            verificationCost: 2.0,
            confidence: 0.90,
            requiredApproval: true
          }));
        }
      }
    }

    // 4. Risk Hotspots
    if (riskHotspots && riskHotspots.hotspots) {
      for (const spot of riskHotspots.hotspots.slice(0, 3)) {
        if (spot.severity === 'CRITICAL' || spot.severity === 'HIGH') {
          recommendations.push(new ProjectRecommendation({
            id: `REC_HOTSPOT_${spot.entityId}`,
            kind: RecommendationKind.REVIEW_HIGH_RISK_COMPONENT,
            title: `Review and add regression tests for high-risk hotspot ${spot.entityId}`,
            reason: `High risk concentration (Risk: ${spot.hotspotRisk}, Blast radius: ${spot.blastRadius})`,
            evidence: new RecommendationEvidence({
              sourceMetric: 'HOTSPOT_RISK',
              observedValue: spot.hotspotRisk,
              thresholdValue: 0.02,
              supportingData: spot
            }),
            affectedScope: [spot.entityId],
            expectedBenefit: 'Mitigate systemic blast radius and reduce catastrophic regression risk',
            risk: 'MEDIUM',
            estimatedCost: 2.0,
            verificationCost: 1.0,
            confidence: 0.85
          }));
        }
      }
    }

    return recommendations;
  }
}
