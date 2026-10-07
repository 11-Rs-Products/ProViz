/**
 * StalenessAnalyzer.js
 * Analyzes evidence freshness and determines which prior verification artifacts remain valid after a change.
 */

import { VerificationFreshness } from './VerificationFreshness.js';

export class StalenessAnalyzer {
  /**
   * Evaluates freshness of an evidence item against a ChangeSet and semantic blast radius.
   * @param {Object} evidence Cached evidence record
   * @param {import('./ChangeSet.js').ChangeSet} changeSet
   * @param {Array<string>} [affectedEntities=[]]
   * @returns {{ status: string, isApplicable: boolean, reason: string }}
   */
  evaluateFreshness(evidence, changeSet, affectedEntities = []) {
    const target = evidence.targetEntity || evidence.symbol || evidence.file;
    const assumptions = evidence.assumptions || [];

    // If target entity itself was directly modified -> INVALIDATED
    if (changeSet.modifiedFiles.includes(target) ||
        changeSet.modifiedFunctions.includes(target) ||
        changeSet.deletedFiles.includes(target)) {
      return {
        status: VerificationFreshness.INVALIDATED,
        isApplicable: false,
        reason: `Target entity '${target}' was directly modified in current change.`
      };
    }

    // If target entity is in transitive affected blast radius -> STALE
    if (affectedEntities.includes(target)) {
      return {
        status: VerificationFreshness.STALE,
        isApplicable: false,
        reason: `Target entity '${target}' is in the affected dependency blast radius.`
      };
    }

    // Check if any assumptions were invalidated
    for (const assumption of assumptions) {
      if (changeSet.modifiedFiles.includes(assumption) || changeSet.modifiedFunctions.includes(assumption)) {
        return {
          status: VerificationFreshness.INVALIDATED,
          isApplicable: false,
          reason: `Assumption '${assumption}' was modified.`
        };
      }
    }

    // Unaffected evidence remains FRESH
    return {
      status: VerificationFreshness.FRESH,
      isApplicable: true,
      reason: 'Evidence is unaffected by recent changes and all assumptions hold.'
    };
  }
}
