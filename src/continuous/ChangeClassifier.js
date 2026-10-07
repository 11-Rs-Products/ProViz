/**
 * ChangeClassifier.js
 * Classifies changes into semantic engineering categories.
 */

export const ChangeCategory = Object.freeze({
  BUG_FIX: 'BUG_FIX',
  FEATURE: 'FEATURE',
  REFACTOR: 'REFACTOR',
  OPTIMIZATION: 'OPTIMIZATION',
  API_CHANGE: 'API_CHANGE',
  DEPENDENCY_CHANGE: 'DEPENDENCY_CHANGE',
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE',
  TEST_CHANGE: 'TEST_CHANGE',
  SECURITY_CHANGE: 'SECURITY_CHANGE',
  PERFORMANCE_CHANGE: 'PERFORMANCE_CHANGE',
  CONCURRENCY_CHANGE: 'CONCURRENCY_CHANGE'
});

export class ChangeClassifier {
  /**
   * Classifies a ChangeSet into primary and secondary change categories.
   * @param {import('./ChangeSet.js').ChangeSet} changeSet
   * @returns {{ primaryCategory: string, categories: Array<string>, riskLevel: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL' }}
   */
  classify(changeSet) {
    const categories = new Set();

    if (changeSet.modifiedApis.length > 0) {
      categories.add(ChangeCategory.API_CHANGE);
    }
    if (changeSet.modifiedDependencies.length > 0) {
      categories.add(ChangeCategory.DEPENDENCY_CHANGE);
    }
    if (changeSet.modifiedConfigs.length > 0) {
      categories.add(ChangeCategory.CONFIGURATION_CHANGE);
    }
    if (changeSet.modifiedTests.length > 0) {
      categories.add(ChangeCategory.TEST_CHANGE);
    }

    const desc = (changeSet.description || '').toLowerCase();
    if (desc.includes('security') || desc.includes('auth') || desc.includes('sanitize') || desc.includes('token')) {
      categories.add(ChangeCategory.SECURITY_CHANGE);
    }
    if (desc.includes('perf') || desc.includes('speed') || desc.includes('optimiz') || desc.includes('cache') || desc.includes('latency')) {
      categories.add(ChangeCategory.PERFORMANCE_CHANGE);
      categories.add(ChangeCategory.OPTIMIZATION);
    }
    if (desc.includes('lock') || desc.includes('mutex') || desc.includes('thread') || desc.includes('async') || desc.includes('race') || desc.includes('concurrent')) {
      categories.add(ChangeCategory.CONCURRENCY_CHANGE);
    }
    if (desc.includes('fix') || desc.includes('bug') || desc.includes('patch')) {
      categories.add(ChangeCategory.BUG_FIX);
    }
    if (desc.includes('refactor') || desc.includes('clean') || desc.includes('extract')) {
      categories.add(ChangeCategory.REFACTOR);
    }

    if (categories.size === 0) {
      if (changeSet.addedFiles.length > 0) categories.add(ChangeCategory.FEATURE);
      else categories.add(ChangeCategory.REFACTOR);
    }

    const categoryList = Array.from(categories);
    const primaryCategory = categoryList[0] || ChangeCategory.REFACTOR;

    let riskLevel = 'LOW';
    if (categories.has(ChangeCategory.SECURITY_CHANGE) || categories.has(ChangeCategory.API_CHANGE)) {
      riskLevel = 'CRITICAL';
    } else if (categories.has(ChangeCategory.CONCURRENCY_CHANGE) || categories.has(ChangeCategory.PERFORMANCE_CHANGE)) {
      riskLevel = 'HIGH';
    } else if (categories.has(ChangeCategory.DEPENDENCY_CHANGE) || changeSet.totalChangedEntities() > 5) {
      riskLevel = 'MEDIUM';
    }

    return {
      primaryCategory,
      categories: categoryList,
      riskLevel
    };
  }
}
