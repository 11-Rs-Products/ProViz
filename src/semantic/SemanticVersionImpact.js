/**
 * SemanticVersionImpact.js
 * Infers semantic version recommendation (PATCH, MINOR, MAJOR, UNKNOWN) from semantic changes.
 */

import { CompatibilityStatus } from './APICompatibilityAnalyzer.js';
import { SemanticChangeType } from './SemanticChange.js';

export const SemVerLevel = Object.freeze({
  PATCH: 'PATCH',
  MINOR: 'MINOR',
  MAJOR: 'MAJOR',
  UNKNOWN: 'UNKNOWN'
});

export class SemanticVersionImpact {
  /**
   * Infers SemVer bump based on API compatibility analysis and change descriptors.
   */
  static evaluate(compatibilityResult, changes = []) {
    if (compatibilityResult && (compatibilityResult.status === CompatibilityStatus.BREAKING || compatibilityResult.status === CompatibilityStatus.SOURCE_BREAK)) {
      return {
        level: SemVerLevel.MAJOR,
        reason: 'Breaking API or signature changes detected',
        compatibilityResult
      };
    }

    const hasNewFeatures = changes.some(c => c.type === SemanticChangeType.ADDED);
    if (hasNewFeatures || (compatibilityResult && compatibilityResult.status === CompatibilityStatus.POTENTIALLY_BREAKING)) {
      return {
        level: SemVerLevel.MINOR,
        reason: 'Backward-compatible features or optional API additions detected',
        compatibilityResult
      };
    }

    const hasInternalFixes = changes.some(c => c.type === SemanticChangeType.MODIFIED || c.type === SemanticChangeType.DATA_FLOW_CHANGED);
    if (hasInternalFixes) {
      return {
        level: SemVerLevel.PATCH,
        reason: 'Internal implementation bugfix or non-breaking modification',
        compatibilityResult
      };
    }

    return {
      level: SemVerLevel.PATCH,
      reason: 'No breaking changes detected',
      compatibilityResult
    };
  }
}
