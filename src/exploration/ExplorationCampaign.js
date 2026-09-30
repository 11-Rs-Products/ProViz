import { ExplorationStatus } from './ExplorationStatus.js';
import { ExplorationBudget } from './ExplorationBudget.js';
import { ExplorationPlan } from './ExplorationPlan.js';
import { ExplorationResult } from './ExplorationResult.js';
import { ExplorationQueue } from './ExplorationQueue.js';
import { ExplorationPolicy } from './ExplorationPolicy.js';
import { NoveltyDetector } from './NoveltyDetector.js';

export class ExplorationCampaign {
  constructor({
    id,
    name = 'Exploration Campaign',
    strategy = 'ADAPTIVE',
    budget = null,
    plan = null,
    policy = null,
    generators = [],
    metamorphicRelations = [],
    objectives = [],
    metadata = {}
  } = {}) {
    this.id = id || `campaign_${Math.random().toString(36).substring(2, 9)}`;
    this.name = name;
    this.strategy = strategy;
    this.budget = budget instanceof ExplorationBudget ? budget : new ExplorationBudget(budget || {});
    this.plan = plan instanceof ExplorationPlan ? plan : new ExplorationPlan(plan || {});
    this.policy = policy instanceof ExplorationPolicy ? policy : new ExplorationPolicy(policy || {});
    this.generators = generators;
    this.metamorphicRelations = metamorphicRelations;
    this.objectives = objectives;
    this.metadata = metadata;

    this.queue = new ExplorationQueue();
    this.noveltyDetector = new NoveltyDetector();
    this.candidates = [];
    this.executedCandidates = [];
    this.findings = [];
    this.clusters = [];
    this.status = ExplorationStatus.PENDING || 'PENDING';
    this.stepCount = 0;
  }

  addGenerator(gen) {
    this.generators.push(gen);
  }

  addMetamorphicRelation(mr) {
    this.metamorphicRelations.push(mr);
  }

  addObjective(obj) {
    this.objectives.push(obj);
  }

  enqueueCandidate(candidate) {
    this.candidates.push(candidate);
    this.queue.enqueue(candidate);
  }

  recordFinding(finding) {
    this.findings.push(finding);
  }

  start() {
    this.status = ExplorationStatus.RUNNING || 'RUNNING';
  }

  step() {
    if (this.budget.isExhausted()) {
      this.status = ExplorationStatus.COMPLETED || 'COMPLETED';
      return null;
    }
    const candidate = this.queue.dequeue();
    if (candidate) {
      this.executedCandidates.push(candidate);
      this.budget.consumeIteration();
      this.stepCount++;
    }
    return candidate;
  }

  finish() {
    this.status = ExplorationStatus.COMPLETED || 'COMPLETED';
    return new ExplorationResult({
      campaignId: this.id,
      status: this.status,
      totalCandidates: this.candidates.length,
      executedCandidates: this.executedCandidates.length,
      findings: this.findings,
      clusters: this.noveltyDetector.clusterer.clusters,
      novelBehaviors: this.noveltyDetector.novelFingerprints,
      budgetUsed: this.budget.toJSON(),
      metadata: this.metadata
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      strategy: this.strategy,
      status: this.status,
      stepCount: this.stepCount,
      candidatesCount: this.candidates.length,
      findingsCount: this.findings.length,
      budget: this.budget.toJSON()
    };
  }
}
