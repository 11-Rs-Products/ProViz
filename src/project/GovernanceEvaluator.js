/**
 * GovernanceEvaluator.js
 * Evaluates ProjectGraph, architecture, and verification state against GovernancePolicySet.
 * Invariant: Governance evaluates actual available evidence without manufacturing it.
 */

import { GovernanceRuleKind } from './GovernanceRule.js';
import { GovernanceViolation } from './GovernanceViolation.js';
import { GovernanceDecision, DecisionOutcome } from './GovernanceDecision.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class GovernanceEvaluator {
  /**
   * @param {import('./GovernancePolicySet.js').GovernancePolicySet} policySet
   */
  constructor(policySet) {
    this.policySet = policySet;
  }

  /**
   * Evaluate project state against policies
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {Object} [evidenceData={}]
   * @param {Object} [evidenceData.architectureAnalysis]
   * @param {Object} [evidenceData.verificationState]
   * @param {Object} [evidenceData.securityPosture]
   * @param {Object} [evidenceData.performancePosture]
   * @param {Object} [evidenceData.concurrencyPosture]
   * @param {Object} [evidenceData.staleEvidenceIds]
   * @param {Object} [evidenceData.approvals]
   */
  evaluate(graph, evidenceData = {}) {
    if (!this.policySet) throw new Error('GovernanceEvaluator requires policySet');
    const violations = [];
    const blockingReasons = [];

    const rules = this.policySet.getAllRules();

    for (const rule of rules) {
      // Find parent policy ID
      let policyId = 'GLOBAL_POLICY';
      for (const p of this.policySet.getPolicies()) {
        if (p.rules.some(r => r.id === rule.id)) {
          policyId = p.id;
          break;
        }
      }

      switch (rule.kind) {
        case GovernanceRuleKind.NO_DEPENDENCY_CYCLES: {
          const cycles = graph.findCycles(ProjectRelationKind.DEPENDS_ON);
          if (cycles.length > 0) {
            for (const cycle of cycles) {
              const v = new GovernanceViolation({
                policyId,
                ruleId: rule.id,
                ruleKind: rule.kind,
                severity: rule.severity,
                targetScope: cycle.join('->'),
                message: `Dependency cycle forbidden: ${cycle.join(' -> ')}`,
                evidence: { cycle }
              });
              violations.push(v);
              if (rule.severity === 'BLOCKER' || rule.severity === 'ERROR') {
                blockingReasons.push(v.message);
              }
            }
          }
          break;
        }

        case GovernanceRuleKind.NO_FORBIDDEN_ARCHITECTURE_EDGES: {
          const arch = evidenceData.architectureAnalysis;
          if (arch && arch.violations) {
            for (const av of arch.violations) {
              const v = new GovernanceViolation({
                policyId,
                ruleId: rule.id,
                ruleKind: rule.kind,
                severity: rule.severity,
                targetScope: `${av.source}->${av.target}`,
                message: av.message || 'Forbidden architecture edge detected',
                evidence: av
              });
              violations.push(v);
              if (rule.severity === 'BLOCKER' || rule.severity === 'ERROR') {
                blockingReasons.push(v.message);
              }
            }
          }
          break;
        }

        case GovernanceRuleKind.PUBLIC_APIS_REQUIRE_CONTRACTS: {
          const apiNodes = graph.getNodes().filter(n => n.kind === 'API');
          for (const api of apiNodes) {
            const contracts = graph.getIncomingEdges(api.id, ProjectRelationKind.DEFINES_CONTRACT);
            if (contracts.length === 0 && !api.attributes.hasContract) {
              const v = new GovernanceViolation({
                policyId,
                ruleId: rule.id,
                ruleKind: rule.kind,
                severity: rule.severity,
                targetScope: api.id,
                message: `Public API ${api.id} lacks formal contract specification`,
                evidence: { apiId: api.id }
              });
              violations.push(v);
              if (rule.severity === 'BLOCKER') blockingReasons.push(v.message);
            }
          }
          break;
        }

        case GovernanceRuleKind.SECURITY_PATHS_REQUIRE_VERIFICATION: {
          const sec = evidenceData.securityPosture;
          if (sec && (sec.unmitigatedThreatsCount > 0 || (sec.unmitigatedThreats && sec.unmitigatedThreats.length > 0))) {
            const count = sec.unmitigatedThreatsCount || sec.unmitigatedThreats.length;
            const v = new GovernanceViolation({
              policyId,
              ruleId: rule.id,
              ruleKind: rule.kind,
              severity: rule.severity,
              targetScope: 'security_path',
              message: `Unverified security paths detected (${count} unmitigated threats)`,
              evidence: sec
            });
            violations.push(v);
            if (rule.severity === 'BLOCKER' || rule.severity === 'ERROR') {
              blockingReasons.push(v.message);
            }
          }
          break;
        }

        case GovernanceRuleKind.PERFORMANCE_SENSITIVE_REQUIRE_EVIDENCE: {
          const perf = evidenceData.performancePosture;
          if (perf && (perf.unverifiedCount > 0 || perf.regressionsCount > 0)) {
            const v = new GovernanceViolation({
              policyId,
              ruleId: rule.id,
              ruleKind: rule.kind,
              severity: rule.severity,
              targetScope: 'performance_path',
              message: `Performance regression or unverified performance bounds detected`,
              evidence: perf
            });
            violations.push(v);
            if (rule.severity === 'BLOCKER') blockingReasons.push(v.message);
          }
          break;
        }

        case GovernanceRuleKind.CONCURRENCY_REQUIRE_SCHEDULE_EXPLORATION: {
          const conc = evidenceData.concurrencyPosture;
          if (conc && (conc.unexploredSchedulesCount > 0 || conc.racesCount > 0)) {
            const v = new GovernanceViolation({
              policyId,
              ruleId: rule.id,
              ruleKind: rule.kind,
              severity: rule.severity,
              targetScope: 'concurrency_path',
              message: `Concurrent pathways require schedule exploration and race-freedom proof`,
              evidence: conc
            });
            violations.push(v);
            if (rule.severity === 'BLOCKER') blockingReasons.push(v.message);
          }
          break;
        }

        case GovernanceRuleKind.NO_STALE_CRITICAL_EVIDENCE: {
          const stale = evidenceData.staleEvidenceIds || [];
          if (stale.length > 0) {
            const v = new GovernanceViolation({
              policyId,
              ruleId: rule.id,
              ruleKind: rule.kind,
              severity: rule.severity,
              targetScope: stale.join(','),
              message: `Stale critical verification evidence detected: ${stale.length} items`,
              evidence: { staleEvidenceIds: stale }
            });
            violations.push(v);
            if (rule.severity === 'BLOCKER' || rule.severity === 'ERROR') {
              blockingReasons.push(v.message);
            }
          }
          break;
        }

        case GovernanceRuleKind.HIGH_RISK_REQUIRE_APPROVAL: {
          const approvals = evidenceData.approvals || {};
          if (rule.params.requiresHumanApproval && !approvals.humanApproved) {
            const v = new GovernanceViolation({
              policyId,
              ruleId: rule.id,
              ruleKind: rule.kind,
              severity: rule.severity,
              targetScope: 'release_gate',
              message: 'High risk project modification requires human approval before release',
              evidence: approvals
            });
            violations.push(v);
            if (rule.severity === 'BLOCKER') blockingReasons.push(v.message);
          }
          break;
        }
      }
    }

    let outcome = DecisionOutcome.PASSED;
    if (blockingReasons.length > 0) {
      outcome = DecisionOutcome.BLOCKED;
    } else if (violations.length > 0) {
      outcome = DecisionOutcome.CONDITIONALLY_PASSED;
    }

    return new GovernanceDecision({
      policySetVersion: this.policySet.version,
      outcome,
      violations,
      blockingReasons,
      summary: {
        totalRulesEvaluated: rules.length,
        violationCount: violations.length,
        blockingCount: blockingReasons.length
      },
      timestamp: Date.now()
    });
  }
}
