export class ProbabilisticBehaviorCluster {
  constructor({
    clusterId,
    description = '',
    members = [],
    membershipProbabilities = new Map() // memberId -> probability
  }) {
    this.clusterId = clusterId;
    this.description = description;
    this.members = Object.freeze([...members]);
    this.membershipProbabilities = new Map(membershipProbabilities);
    Object.freeze(this);
  }

  getMembershipProbability(memberId) {
    return this.membershipProbabilities.get(memberId) || 0.0;
  }

  toJSON() {
    const mems = {};
    for (const [k, v] of this.membershipProbabilities.entries()) mems[k] = v;
    return {
      clusterId: this.clusterId,
      description: this.description,
      memberCount: this.members.length,
      memberships: mems
    };
  }
}
