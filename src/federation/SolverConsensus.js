import { SolverDisagreement } from './SolverDisagreement.js';

/**
 * Determines whether portfolio solver outputs agree or disagree
 */
export class SolverConsensus {
  static evaluate(constraint, solverResults = []) {
    if (!solverResults || solverResults.length === 0) {
      return {
        status: 'NO_RESULTS',
        isConsensus: false,
        consensusStatus: null,
        disagreement: null,
        results: []
      };
    }

    const statuses = new Set(solverResults.map(r => r.status).filter(Boolean));

    if (statuses.size === 1) {
      const singleStatus = Array.from(statuses)[0];
      return {
        status: 'UNANIMOUS',
        isConsensus: true,
        consensusStatus: singleStatus,
        disagreement: null,
        results: solverResults
      };
    }

    // Check if there is a conflict (e.g. SAT vs UNSAT, or PROVED vs COUNTEREXAMPLE)
    const hasSat = statuses.has('SAT');
    const hasUnsat = statuses.has('UNSAT');
    const hasProved = statuses.has('PROVED');
    const hasCounterexample = statuses.has('COUNTEREXAMPLE_FOUND') || statuses.has('COUNTEREXAMPLE');

    if ((hasSat && hasUnsat) || (hasProved && hasCounterexample)) {
      const disagreement = new SolverDisagreement({
        constraint,
        solverResults,
        conflictingStatuses: Array.from(statuses),
        details: { message: 'Solvers produced fundamentally conflicting results' }
      });

      return {
        status: 'CONFLICTING',
        isConsensus: false,
        consensusStatus: null,
        disagreement,
        results: solverResults
      };
    }

    // Non-conflicting mixed statuses (e.g. SAT and UNKNOWN/TIMEOUT)
    const definiteStatus = solverResults.find(r => ['SAT', 'UNSAT', 'PROVED', 'COUNTEREXAMPLE_FOUND'].includes(r.status));
    if (definiteStatus) {
      return {
        status: 'DEFINITE_MAJORITY',
        isConsensus: true,
        consensusStatus: definiteStatus.status,
        disagreement: null,
        results: solverResults
      };
    }

    return {
      status: 'INCONCLUSIVE',
      isConsensus: false,
      consensusStatus: null,
      disagreement: null,
      results: solverResults
    };
  }
}
