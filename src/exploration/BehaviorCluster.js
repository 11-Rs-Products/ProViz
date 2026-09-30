/**
 * BehaviorCluster — Cluster grouping executions with equivalent or near-identical behavioral fingerprints.
 */

export class BehaviorCluster {
    /**
     * @param {object} params
     * @param {string} params.id
     * @param {BehavioralFingerprint} params.representative
     * @param {Array<any>} [params.members=[]]
     */
    constructor({
        id,
        representative,
        members = [],
    } = {}) {
        this.id = String(id);
        this.representative = representative;
        this.members = Object.freeze([...members]);
        Object.freeze(this);
    }

    addMember(member) {
        return new BehaviorCluster({
            id: this.id,
            representative: this.representative,
            members: [...this.members, member],
        });
    }

    toJSON() {
        return {
            id: this.id,
            representative: this.representative?.toJSON?.() || this.representative,
            members: this.members,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BehaviorCluster(json);
    }
}
