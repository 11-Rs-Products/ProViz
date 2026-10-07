/**
 * ConcurrencyRepairAnalyzer.js
 * Proposes, ranks, and validates concurrency repairs against security, performance, and reliability invariants.
 */

export const RepairKind = Object.freeze({
  ADD_LOCK: 'ADD_LOCK',
  CHANGE_LOCK_ORDER: 'CHANGE_LOCK_ORDER',
  EXPAND_CRITICAL_SECTION: 'EXPAND_CRITICAL_SECTION',
  REDUCE_CRITICAL_SECTION: 'REDUCE_CRITICAL_SECTION',
  ADD_ATOMIC_OPERATION: 'ADD_ATOMIC_OPERATION',
  ADD_RETRY: 'ADD_RETRY',
  ADD_TIMEOUT: 'ADD_TIMEOUT',
  ADD_IDEMPOTENCY: 'ADD_IDEMPOTENCY',
  SERIALIZE_OPERATION: 'SERIALIZE_OPERATION',
  CHANGE_MESSAGE_PROTOCOL: 'CHANGE_MESSAGE_PROTOCOL'
});

export class ConcurrencyRepairCandidate {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.kind
   * @param {string} options.targetResource
   * @param {string} options.description
   * @param {number} [options.rank=1]
   * @param {Object} [options.patch={}]
   * @param {Object} [options.invariants={}]
   */
  constructor({
    id,
    kind,
    targetResource,
    description,
    rank = 1,
    patch = {},
    invariants = { securityPreserved: true, performanceImpactPct: 2.0, reliabilityPreserved: true }
  }) {
    this.id = id;
    this.kind = kind;
    this.targetResource = targetResource;
    this.description = description;
    this.rank = rank;
    this.patch = Object.freeze({ ...patch });
    this.invariants = Object.freeze({ ...invariants });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      targetResource: this.targetResource,
      description: this.description,
      rank: this.rank,
      patch: { ...this.patch },
      invariants: { ...this.invariants }
    };
  }
}

export class ConcurrencyRepairAnalyzer {
  /**
   * Synthesizes repair candidates for a detected defect.
   * @param {import('./ConcurrencyCounterexample.js').ConcurrencyCounterexample|Object} defect
   * @returns {Array<ConcurrencyRepairCandidate>}
   */
  synthesizeRepairs(defect) {
    const repairs = [];
    const defectType = defect.defectType || 'RACE';

    if (defectType === 'RACE') {
      const res = defect.resourceId || defect.failurePoint?.resourceId || 'shared_variable';
      repairs.push(new ConcurrencyRepairCandidate({
        id: 'repair-add-mutex',
        kind: RepairKind.ADD_LOCK,
        targetResource: res,
        description: `Protect access to '${res}' using a canonical Mutex lock.`,
        rank: 1,
        invariants: { securityPreserved: true, performanceImpactPct: 1.5, reliabilityPreserved: true }
      }));
      repairs.push(new ConcurrencyRepairCandidate({
        id: 'repair-atomic-op',
        kind: RepairKind.ADD_ATOMIC_OPERATION,
        targetResource: res,
        description: `Convert read/write operations on '${res}' into hardware atomic CAS / fetch-and-add.`,
        rank: 2,
        invariants: { securityPreserved: true, performanceImpactPct: 0.2, reliabilityPreserved: true }
      }));
    } else if (defectType === 'DEADLOCK') {
      repairs.push(new ConcurrencyRepairCandidate({
        id: 'repair-order-locks',
        kind: RepairKind.CHANGE_LOCK_ORDER,
        targetResource: 'locks',
        description: 'Impose a global canonical hierarchy order on lock acquisitions.',
        rank: 1,
        invariants: { securityPreserved: true, performanceImpactPct: 0.1, reliabilityPreserved: true }
      }));
    } else if (defectType === 'TEMPORAL' || defectType === 'LIVENESS') {
      repairs.push(new ConcurrencyRepairCandidate({
        id: 'repair-add-timeout',
        kind: RepairKind.ADD_TIMEOUT,
        targetResource: 'channel/queue',
        description: 'Introduce bounded wait timeout with exponential backoff retry.',
        rank: 1,
        invariants: { securityPreserved: true, performanceImpactPct: 0.5, reliabilityPreserved: true }
      }));
    } else {
      repairs.push(new ConcurrencyRepairCandidate({
        id: 'repair-serialize',
        kind: RepairKind.SERIALIZE_OPERATION,
        targetResource: 'queue',
        description: 'Route concurrent access through an actor/channel queue.',
        rank: 1,
        invariants: { securityPreserved: true, performanceImpactPct: 3.0, reliabilityPreserved: true }
      }));
    }

    return repairs;
  }

  /**
   * Validates a repair against cross-stage preservation invariants.
   * @param {ConcurrencyRepairCandidate} repair
   * @param {Object} [constraints={}]
   * @param {boolean} [constraints.requireSecurity=true]
   * @param {number} [constraints.maxPerformanceRegressionPct=5.0]
   * @param {boolean} [constraints.requireReliability=true]
   * @returns {{ valid: boolean, violations: Array<string> }}
   */
  validateRepair(repair, {
    requireSecurity = true,
    maxPerformanceRegressionPct = 5.0,
    requireReliability = true
  } = {}) {
    const violations = [];

    if (requireSecurity && !repair.invariants.securityPreserved) {
      violations.push('Security invariant violated: repair exposes unauthorized access or breaks Stage 31 rules.');
    }

    if (repair.invariants.performanceImpactPct > maxPerformanceRegressionPct) {
      violations.push(`Performance regression exceeded: ${repair.invariants.performanceImpactPct}% > ${maxPerformanceRegressionPct}%.`);
    }

    if (requireReliability && !repair.invariants.reliabilityPreserved) {
      violations.push('Reliability invariant violated: repair degrades availability or error recovery.');
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}
