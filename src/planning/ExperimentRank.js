export class ExperimentRank {
  constructor({
    candidate,
    rank = 1,
    score = 0.0,
    policy = 'BALANCED',
    reasons = []
  }) {
    this.candidate = candidate;
    this.rank = Number(rank);
    this.score = Number(score);
    this.policy = policy;
    this.reasons = Object.freeze([...reasons]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      candidate: this.candidate ? this.candidate.toJSON() : null,
      rank: this.rank,
      score: this.score,
      policy: this.policy,
      reasons: this.reasons
    };
  }
}
