import { AgentDisagreement } from './AgentDisagreement.js';

/**
 * Classifies discrepancies between agents into first-class root-cause categories
 */
export class DisagreementAnalyzer {
  static analyze({
    agentA,
    agentB,
    claim,
    resultA,
    resultB,
    scopeA,
    scopeB,
    environmentA,
    environmentB
  }) {
    if (!resultA || !resultB) {
      return new AgentDisagreement({
        agentA,
        agentB,
        claim,
        resultA,
        resultB,
        scopeA,
        scopeB,
        environmentA,
        environmentB,
        classification: 'INSUFFICIENT_INFORMATION',
        details: { reason: 'One or both agent results are missing' }
      });
    }

    // Check scope mismatch
    if (scopeA && scopeB && scopeA !== scopeB) {
      return new AgentDisagreement({
        agentA,
        agentB,
        claim,
        resultA,
        resultB,
        scopeA,
        scopeB,
        environmentA,
        environmentB,
        classification: 'SCOPE_MISMATCH',
        details: { reason: `Analysis scopes differ: '${scopeA}' vs '${scopeB}'` }
      });
    }

    // Check environment mismatch
    const envFingerprintA = typeof environmentA === 'string' ? environmentA : environmentA?.fingerprint;
    const envFingerprintB = typeof environmentB === 'string' ? environmentB : environmentB?.fingerprint;
    if (envFingerprintA && envFingerprintB && envFingerprintA !== envFingerprintB) {
      return new AgentDisagreement({
        agentA,
        agentB,
        claim,
        resultA,
        resultB,
        scopeA,
        scopeB,
        environmentA,
        environmentB,
        classification: 'ENVIRONMENT_MISMATCH',
        details: { reason: `Execution environments differ: '${envFingerprintA}' vs '${envFingerprintB}'` }
      });
    }

    // Check solver disagreement
    const isSolverA = agentA?.kind === 'SYMBOLIC_SOLVER' || agentA?.kind === 'EXTERNAL_SOLVER';
    const isSolverB = agentB?.kind === 'SYMBOLIC_SOLVER' || agentB?.kind === 'EXTERNAL_SOLVER';
    if (isSolverA && isSolverB) {
      return new AgentDisagreement({
        agentA,
        agentB,
        claim,
        resultA,
        resultB,
        scopeA,
        scopeB,
        environmentA,
        environmentB,
        classification: 'SOLVER_DISAGREEMENT',
        details: { reason: 'Different solver backends disagreed on satisfiability or proof status' }
      });
    }

    // Check oracle disagreement
    const isOracleA = agentA?.kind === 'ORACLE_ENGINE';
    const isOracleB = agentB?.kind === 'ORACLE_ENGINE';
    if (isOracleA || isOracleB) {
      return new AgentDisagreement({
        agentA,
        agentB,
        claim,
        resultA,
        resultB,
        scopeA,
        scopeB,
        environmentA,
        environmentB,
        classification: 'ORACLE_DISAGREEMENT',
        details: { reason: 'Test oracle assertions produced conflicting verdicts' }
      });
    }

    // Check runtime variance
    const isRuntimeA = agentA?.kind === 'RUNTIME_ANALYZER' || agentA?.kind === 'TEST_EXECUTOR';
    const isRuntimeB = agentB?.kind === 'RUNTIME_ANALYZER' || agentB?.kind === 'TEST_EXECUTOR';
    if (isRuntimeA && isRuntimeB) {
      return new AgentDisagreement({
        agentA,
        agentB,
        claim,
        resultA,
        resultB,
        scopeA,
        scopeB,
        environmentA,
        environmentB,
        classification: 'RUNTIME_VARIANCE',
        details: { reason: 'Flakiness or timing variance detected across dynamic executions' }
      });
    }

    // Default to true contradiction
    return new AgentDisagreement({
      agentA,
      agentB,
      claim,
      resultA,
      resultB,
      scopeA,
      scopeB,
      environmentA,
      environmentB,
      classification: 'TRUE_CONTRADICTION',
      details: { reason: 'Direct logical contradiction between agent verification outputs' }
    });
  }
}
