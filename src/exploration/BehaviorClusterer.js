import { BehaviorCluster } from './BehaviorCluster.js';
import { BehavioralFingerprint } from './BehavioralFingerprint.js';

export class BehaviorClusterer {
    constructor() {
        this.clusterMap = new Map(); // hash -> BehaviorCluster
    }

    get clusters() {
        return [...this.clusterMap.values()];
    }

    cluster(outcomeOrFp) {
        if (!outcomeOrFp) return null;
        let fp;
        let member = outcomeOrFp;

        if (outcomeOrFp instanceof BehavioralFingerprint) {
            fp = outcomeOrFp;
        } else if (outcomeOrFp.fingerprint instanceof BehavioralFingerprint) {
            fp = outcomeOrFp.fingerprint;
        } else {
            fp = BehavioralFingerprint.fromOutcome(outcomeOrFp);
        }

        const hash = typeof fp.hash === 'function' ? fp.hash() : (fp.hash || fp.hashValue);
        if (!this.clusterMap.has(hash)) {
            const newCluster = new BehaviorCluster({
                id: `cluster_${hash}`,
                representative: fp,
                members: [member],
            });
            this.clusterMap.set(hash, newCluster);
            return newCluster;
        } else {
            const current = this.clusterMap.get(hash);
            const updated = current.addMember(member);
            this.clusterMap.set(hash, updated);
            return updated;
        }
    }

    static cluster(outcomes = []) {
        const clusterer = new BehaviorClusterer();
        for (const outcome of outcomes) {
            clusterer.cluster(outcome);
        }
        return clusterer.clusters;
    }
}
