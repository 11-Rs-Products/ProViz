import { PlanningSession } from './PlanningSession.js';

export class PlanningCampaign {
  constructor({
    id,
    name = 'Autonomous Verification Campaign',
    goals = [],
    policy = 'BALANCED'
  } = {}) {
    this.id = id || `campaign_${Date.now()}`;
    this.name = name;
    this.goals = [...goals];
    this.policy = policy;
    this.session = new PlanningSession({ goals });
    this.status = 'CREATED';
  }

  addGoal(goal) {
    this.goals.push(goal);
    if (this.session) {
      this.session.goals.push(goal);
    }
  }

  start() {
    this.status = 'RUNNING';
  }

  finish() {
    this.status = 'COMPLETED';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      policy: this.policy,
      session: this.session.toJSON()
    };
  }
}
