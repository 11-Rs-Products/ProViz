import { BehaviorHealth } from './BehaviorHealth.js';
import { SpecificationHealth } from './SpecificationHealth.js';
import { OracleHealth } from './OracleHealth.js';
import { ExplorationHealth } from './ExplorationHealth.js';

export class VerificationHealth {
  constructor({
    behaviorHealth = new BehaviorHealth({ subject: 'overall' }),
    specificationHealth = new SpecificationHealth(),
    oracleHealth = new OracleHealth(),
    explorationHealth = new ExplorationHealth(),
    compositeHealthScore = 1.0,
    timestamp = Date.now()
  }) {
    this.behaviorHealth = behaviorHealth;
    this.specificationHealth = specificationHealth;
    this.oracleHealth = oracleHealth;
    this.explorationHealth = explorationHealth;
    this.compositeHealthScore = compositeHealthScore;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      behaviorHealth: this.behaviorHealth.toJSON(),
      specificationHealth: this.specificationHealth.toJSON(),
      oracleHealth: this.oracleHealth.toJSON(),
      explorationHealth: this.explorationHealth.toJSON(),
      compositeHealthScore: this.compositeHealthScore,
      timestamp: this.timestamp
    };
  }
}
