/**
 * SpecificationQueries — Read-only query interface operating on immutable SpecificationSnapshots.
 */

export class SpecificationQueries {
    /**
     * @param {SpecificationSnapshot} snapshot
     */
    constructor(snapshot) {
        this.snapshot = snapshot;
        Object.freeze(this);
    }

    getSpecifications() {
        return this.snapshot.specifications;
    }

    getSpecification(id) {
        return this.snapshot.specifications.get(id);
    }

    getSpecificationsForFunction(functionId) {
        return this.snapshot.specifications.getBySubject(functionId);
    }

    getSpecificationsAtLocation(location) {
        return this.snapshot.specifications.filter(s =>
            s.sourceLocations.some(l => l.line === location.line || (l.fileId === location.fileId && l.line === location.line))
        );
    }

    getSpecificationsForObject(objectId) {
        return this.snapshot.specifications.filter(s =>
            s.subject?.objectId === objectId || s.subject?.targetObject === objectId
        );
    }

    getSpecificationsForWatch(watchId) {
        return this.snapshot.specifications.filter(s =>
            s.subject?.watchId === watchId || s.evidence.some(e => e.includes(watchId))
        );
    }

    getBehaviorModel() {
        return this.snapshot.behaviorModel;
    }

    getStateModel() {
        return this.snapshot.behaviorModel.states;
    }

    getTransitionModel() {
        return this.snapshot.behaviorModel.transitions;
    }

    getOracles() {
        return this.snapshot.oracles;
    }

    getOracle(id) {
        return this.snapshot.oracles.find(o => o.id === id) || null;
    }

    getTestObjectives() {
        return this.snapshot.objectives;
    }

    getTestObjective(id) {
        return this.snapshot.objectives.find(o => o.id === id) || null;
    }

    getGeneratedTests() {
        return this.snapshot.generatedTests;
    }

    getSemanticTest(id) {
        return this.snapshot.generatedTests.get(id);
    }

    getAdequacy() {
        return this.snapshot.adequacyResults;
    }

    getSpecificationCoverage() {
        return this.snapshot.adequacyResults.specificationCoverage;
    }

    getBehavioralCoverage() {
        return this.snapshot.adequacyResults.behavioralCoverage;
    }

    getGaps() {
        return this.snapshot.gaps;
    }

    getGap(id) {
        return this.snapshot.gaps.find(g => g.id === id) || null;
    }

    explainSpecification(id) {
        const spec = this.getSpecification(id);
        if (!spec) return null;
        return {
            specificationId: spec.id,
            kind: spec.kind,
            status: spec.status,
            confidence: spec.confidence,
            source: spec.source,
            evidence: spec.evidence,
            explanation: `Specification ${spec.id} (${spec.kind}) inferred via ${spec.source} with confidence ${spec.confidence}.`,
        };
    }

    explainOracle(id) {
        const oracle = this.getOracle(id);
        if (!oracle) return null;
        return {
            oracleId: oracle.id,
            kind: oracle.kind,
            confidence: oracle.confidence,
            expected: oracle.expected || oracle.expectedException || oracle.expression?.expression,
            evidence: oracle.evidence,
            explanation: `Oracle ${oracle.id} checks for ${oracle.kind} with confidence ${oracle.confidence}.`,
        };
    }

    explainGap(id) {
        const gap = this.getGap(id);
        if (!gap) return null;
        return {
            gapId: gap.id,
            kind: gap.kind,
            reason: gap.reason,
            priority: gap.priority,
            evidence: gap.evidence,
            suggestedObjective: gap.suggestedObjective,
            explanation: `Gap ${gap.id} represents ${gap.kind}: ${gap.reason}`,
        };
    }

    getSpecificationSnapshot() {
        return this.snapshot;
    }
}
