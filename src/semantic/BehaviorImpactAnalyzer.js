/**
 * BehaviorImpactAnalyzer.js
 * Combines static dependencies, execution traces, and probabilistic models
 * to predict behavioral divergence across program outputs, exceptions, and side effects.
 */

import { BehaviorImpact, BehaviorImpactDimension } from './BehaviorImpact.js';
import { SemanticChangeType } from './SemanticChange.js';

export class BehaviorImpactAnalyzer {
  analyze(change, programGraph, historicalExecutions = []) {
    const dims = new Set();
    let prob = 0.1;
    const predictedChanges = {};

    switch (change.type) {
      case SemanticChangeType.CONTROL_FLOW_CHANGED:
        dims.add(BehaviorImpactDimension.ORDER);
        dims.add(BehaviorImpactDimension.RETURN_VALUE);
        prob = 0.75;
        predictedChanges.controlFlow = 'Branch condition or path sequence modified';
        break;
      case SemanticChangeType.DATA_FLOW_CHANGED:
        dims.add(BehaviorImpactDimension.RETURN_VALUE);
        dims.add(BehaviorImpactDimension.STATE);
        prob = 0.70;
        predictedChanges.dataFlow = 'Variable assignment or computation altered';
        break;
      case SemanticChangeType.MEMORY_BEHAVIOR_CHANGED:
        dims.add(BehaviorImpactDimension.HEAP);
        dims.add(BehaviorImpactDimension.SIDE_EFFECT);
        prob = 0.80;
        predictedChanges.memory = 'Allocation or heap mutation altered';
        break;
      case SemanticChangeType.TYPE_CHANGED:
        dims.add(BehaviorImpactDimension.EXCEPTION);
        dims.add(BehaviorImpactDimension.RETURN_VALUE);
        prob = 0.65;
        predictedChanges.types = 'Type signature or coercion changed';
        break;
      case SemanticChangeType.ENVIRONMENT_CHANGED:
        dims.add(BehaviorImpactDimension.IO);
        dims.add(BehaviorImpactDimension.TIMING);
        prob = 0.50;
        predictedChanges.env = 'Runtime environment or configuration changed';
        break;
      default:
        dims.add(BehaviorImpactDimension.STATE);
        prob = 0.30;
    }

    // Historical sensitivity booster
    if (historicalExecutions && historicalExecutions.length > 0) {
      prob = Math.min(1.0, prob + 0.1);
    }

    return new BehaviorImpact({
      targetId: change.targetId,
      affectedDimensions: Array.from(dims),
      divergenceProbability: prob,
      predictedChanges,
      evidence: [`analysis_change_type:${change.type}`]
    });
  }
}
