/**
 * RepairPlanner.js
 * Plans whether and how an automated self-healing repair should be generated and verified.
 */

import { RepairCandidateRanker } from './RepairCandidateRanker.js';

export class RepairPlanner {
  constructor(ranker = new RepairCandidateRanker()) {
    this.ranker = ranker;
  }

  /**
   * Plans automated repairs for a detected failure cluster.
   * @param {import('./FailureCluster.js').FailureCluster} cluster
   * @returns {Array<Object>} Ranked candidate repairs
   */
  planRepairs(cluster) {
    const candidates = [];
    const entity = cluster.affectedEntities[0] || 'target_entity';
    let repairId = 1;

    if (cluster.rootCauseSummary.includes('NULL_SAFETY')) {
      candidates.push({
        id: `repair-${repairId++}`,
        type: 'ADD_NULL_GUARD',
        targetEntity: entity,
        description: `Add null / undefined check guard before accessing properties of '${entity}'.`,
        benefit: 10.0,
        risk: 0.5,
        verificationCost: 0.5,
        rollbackCost: 0.2
      });
    } else if (cluster.rootCauseSummary.includes('SECURITY')) {
      candidates.push({
        id: `repair-${repairId++}`,
        type: 'ADD_SANITIZATION',
        targetEntity: entity,
        description: `Introduce strict input sanitization and authorization boundary check on '${entity}'.`,
        benefit: 15.0,
        risk: 1.0,
        verificationCost: 1.0,
        rollbackCost: 0.3
      });
    } else if (cluster.rootCauseSummary.includes('RACE')) {
      candidates.push({
        id: `repair-${repairId++}`,
        type: 'ADD_SYNCHRONIZATION_LOCK',
        targetEntity: entity,
        description: `Wrap critical shared access in '${entity}' with a mutual exclusion lock.`,
        benefit: 12.0,
        risk: 1.5,
        verificationCost: 1.5,
        rollbackCost: 0.5
      });
    } else {
      candidates.push({
        id: `repair-${repairId++}`,
        type: 'GENERAL_ASSERTION_PATCH',
        targetEntity: entity,
        description: `Apply targeted assertion and invariant patch for '${entity}'.`,
        benefit: 8.0,
        risk: 1.0,
        verificationCost: 1.0,
        rollbackCost: 0.5
      });
    }

    return this.ranker.rank(candidates);
  }
}
