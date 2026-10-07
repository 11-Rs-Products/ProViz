/**
 * VerificationFailureAnalyzer.js
 * Analyzes verification task failures and clusters them based on common targets, error patterns, and causal history.
 */

import { FailureCluster } from './FailureCluster.js';

export class VerificationFailureAnalyzer {
  /**
   * Clusters a list of verification failures by common target entity, file, or error pattern.
   * @param {Array<Object>} failures
   * @returns {Array<FailureCluster>}
   */
  clusterFailures(failures) {
    if (!failures || failures.length === 0) return [];

    const groupMap = new Map(); // key -> Array<Failure>

    for (const fail of failures) {
      const target = fail.targetEntity || fail.file || fail.symbol || 'global';
      const kind = fail.kind || fail.type || 'VERIFICATION_FAILURE';
      const key = `${target}:${kind}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key).push(fail);
    }

    let clusterId = 1;
    const clusters = [];

    for (const [key, failList] of groupMap.entries()) {
      const [target, kind] = key.split(':');
      const affectedEntities = Array.from(new Set(failList.map(f => f.targetEntity || f.file).filter(Boolean)));

      clusters.push(new FailureCluster({
        id: `cluster-${clusterId++}`,
        rootCauseSummary: `${kind} defect originating from '${target}' affecting ${failList.length} verification checks.`,
        failures: failList,
        affectedEntities,
        severity: failList.some(f => f.severity === 'CRITICAL' || f.kind?.includes('SECURITY')) ? 'CRITICAL' : 'HIGH'
      }));
    }

    return clusters;
  }
}
