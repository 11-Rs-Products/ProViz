/**
 * AttackSynthesizer.js
 * Synthesizes candidate attack scenarios based on ThreatModel, AttackGraph, and AttackGoals.
 */

import { AttackPathAnalyzer } from './AttackPathAnalyzer.js';
import { AdversarialInputGenerator } from './AdversarialInputGenerator.js';

export class AttackCandidate {
  constructor({
    id,
    goalId,
    targetAssetId,
    entryNodeId,
    sinkNodeId,
    attackPath,
    adversarialInput,
    reachability = 0.9,
    impact = 0.8,
    exploitability = 0.7,
    evidenceStrength = 0.85
  }) {
    if (!id || !targetAssetId) throw new Error('AttackCandidate requires id and targetAssetId');
    this.id = id;
    this.goalId = goalId;
    this.targetAssetId = targetAssetId;
    this.entryNodeId = entryNodeId;
    this.sinkNodeId = sinkNodeId;
    this.attackPath = attackPath;
    this.adversarialInput = adversarialInput;
    this.reachability = reachability;
    this.impact = impact;
    this.exploitability = exploitability;
    this.evidenceStrength = evidenceStrength;
    Object.freeze(this);
  }

  get attackValue() {
    return this.reachability * this.impact * this.exploitability * this.evidenceStrength;
  }

  toJSON() {
    return {
      id: this.id,
      goalId: this.goalId,
      targetAssetId: this.targetAssetId,
      entryNodeId: this.entryNodeId,
      sinkNodeId: this.sinkNodeId,
      attackPath: this.attackPath ? this.attackPath.toJSON() : null,
      adversarialInput: this.adversarialInput ? this.adversarialInput.toJSON() : null,
      reachability: this.reachability,
      impact: this.impact,
      exploitability: this.exploitability,
      evidenceStrength: this.evidenceStrength,
      attackValue: this.attackValue
    };
  }
}

export class AttackSynthesizer {
  constructor() {
    this.pathAnalyzer = new AttackPathAnalyzer();
    this.inputGenerator = new AdversarialInputGenerator();
  }

  /**
   * Synthesizes attacks for a threat goal.
   * @param {AttackGoal} goal
   * @param {ThreatModel} threatModel
   * @param {AttackGraph} attackGraph
   * @returns {Array<AttackCandidate>}
   */
  synthesizeAttacks(goal, threatModel, attackGraph) {
    const candidates = [];
    const entries = threatModel?.attackSurface?.getEntries() || [];
    const sinkId = goal.targetSinkId || goal.targetAssetId;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const paths = this.pathAnalyzer.findAttackPaths(attackGraph, entry.targetNodeId, sinkId, { maxPaths: 3 });

      for (let j = 0; j < paths.length; j++) {
        const path = paths[j];
        const inputs = this.inputGenerator.generateForParameter(entry.exposedParameters[0] || 'input', 'string');

        candidates.push(new AttackCandidate({
          id: `attack:${goal.id}_${entry.id}_p${j}`,
          goalId: goal.id,
          targetAssetId: goal.targetAssetId,
          entryNodeId: entry.targetNodeId,
          sinkNodeId: sinkId,
          attackPath: path,
          adversarialInput: inputs[0] || null,
          reachability: 0.95,
          impact: goal.severity,
          exploitability: path.exploitabilityScore,
          evidenceStrength: 0.90
        }));
      }
    }

    // Default synthetic fallback if no explicit path found
    if (candidates.length === 0) {
      candidates.push(new AttackCandidate({
        id: `attack:${goal.id}_fallback`,
        goalId: goal.id,
        targetAssetId: goal.targetAssetId,
        entryNodeId: entries[0]?.targetNodeId || 'entry_root',
        sinkNodeId: sinkId,
        attackPath: null,
        adversarialInput: null,
        reachability: 0.50,
        impact: goal.severity,
        exploitability: 0.40,
        evidenceStrength: 0.60
      }));
    }

    return candidates;
  }
}
