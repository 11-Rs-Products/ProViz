import { LinearSolverBackend, SMTSolverBackend, BitVectorSolverBackend, IntervalSolverBackend, ConcreteSearchSolverBackend } from './SolverBackend.js';
import { SolverConsensus } from './SolverConsensus.js';

/**
 * Executes a portfolio of diverse solvers across mathematical and constraint domains
 */
export class SolverPortfolio {
  constructor(solvers = []) {
    this.solvers = solvers.length > 0 ? solvers : [
      new LinearSolverBackend(),
      new SMTSolverBackend(),
      new BitVectorSolverBackend(),
      new IntervalSolverBackend(),
      new ConcreteSearchSolverBackend()
    ];
  }

  addSolver(solver) {
    this.solvers.push(solver);
  }

  getSolvers() {
    return [...this.solvers];
  }

  solve(constraint) {
    const applicableSolvers = this.solvers.filter(s => s.supports(constraint));
    const results = [];

    for (const solver of applicableSolvers) {
      try {
        const res = solver.solve(constraint);
        results.push(res);
      } catch (err) {
        results.push({
          solverId: solver.backendId,
          status: 'ERROR',
          error: err.message
        });
      }
    }

    const consensus = SolverConsensus.evaluate(constraint, results);
    return {
      constraint,
      results,
      consensus
    };
  }

  prove(property) {
    const applicableSolvers = this.solvers.filter(s => s.supports(property));
    const results = [];

    for (const solver of applicableSolvers) {
      try {
        const res = solver.prove(property);
        results.push(res);
      } catch (err) {
        results.push({
          solverId: solver.backendId,
          status: 'ERROR',
          error: err.message
        });
      }
    }

    const consensus = SolverConsensus.evaluate(property, results);
    return {
      property,
      results,
      consensus
    };
  }
}
