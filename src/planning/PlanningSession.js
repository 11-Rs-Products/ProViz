import { PlanTrace } from './PlanTrace.js';
import { VerificationPortfolio } from './VerificationPortfolio.js';

export class PlanningSession {
  constructor({
    id,
    goals = [],
    portfolio = new VerificationPortfolio(),
    budget = null
  } = {}) {
    this.id = id || `session_${Date.now()}`;
    this.goals = [...goals];
    this.portfolio = portfolio;
    this.budget = budget;
    this.gaps = [];
    this.candidates = [];
    this.iterations = [];
    this.trace = new PlanTrace();
    this.isPaused = false;
    this.status = 'ACTIVE';
  }

  recordIteration(iter) {
    this.iterations.push(iter);
  }

  finish(status = 'COMPLETED') {
    this.status = status;
  }

  pause() {
    this.isPaused = true;
    this.status = 'PAUSED';
  }

  resume() {
    this.isPaused = false;
    this.status = 'ACTIVE';
  }

  toJSON() {
    return {
      id: this.id,
      goals: this.goals.map(g => g.toJSON()),
      gapsCount: this.gaps.length,
      candidatesCount: this.candidates.length,
      iterationsCount: this.iterations.length,
      isPaused: this.isPaused
    };
  }
}
