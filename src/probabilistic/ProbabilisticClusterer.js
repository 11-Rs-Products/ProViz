import { ProbabilisticBehaviorCluster } from './ProbabilisticBehaviorCluster.js';
import { BehaviorClusterDistribution } from './BehaviorClusterDistribution.js';

export class ProbabilisticClusterer {
  /**
   * Soft cluster behavioral observations using fuzzy distance or outcome matching.
   */
  static cluster(observations = [], numClusters = 2) {
    if (observations.length === 0) return { clusters: [], distributions: new Map() };

    const clustersMap = new Map();
    const distributions = new Map();

    // Group roughly by outcome type / value similarity
    for (const obs of observations) {
      const clusterId = obs.isException && obs.isException() ? 'cluster_exception' : 'cluster_normal';
      if (!clustersMap.has(clusterId)) {
        clustersMap.set(clusterId, []);
      }
      clustersMap.get(clusterId).push(obs.id);
    }

    const clusters = [];
    for (const [cId, members] of clustersMap.entries()) {
      const memProbs = new Map();
      for (const m of members) {
        memProbs.set(m, 0.95);
      }
      clusters.push(
        new ProbabilisticBehaviorCluster({
          clusterId: cId,
          description: `Cluster ${cId}`,
          members,
          membershipProbabilities: memProbs
        })
      );
    }

    for (const obs of observations) {
      const isExc = obs.isException && obs.isException();
      const distMap = new Map();
      distMap.set('cluster_normal', isExc ? 0.05 : 0.95);
      distMap.set('cluster_exception', isExc ? 0.95 : 0.05);
      distributions.set(obs.id, new BehaviorClusterDistribution({ observationId: obs.id, clusterProbabilities: distMap }));
    }

    return { clusters, distributions };
  }
}
