/**
 * SpecificationSnapshot — Immutable serializable snapshot of all specification and test synthesis artifacts.
 */

import { SpecificationSet } from './SpecificationSet.js';
import { BehaviorModel } from './BehaviorModel.js';
import { ObservationSet } from './ObservationSet.js';
import { Oracle } from './Oracle.js';
import { SemanticTestSuite } from './SemanticTestSuite.js';
import { AdequacyResult } from './AdequacyResult.js';
import { Gap } from './Gap.js';

export class SpecificationSnapshot {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {SpecificationSet|object} [params.specifications]
     * @param {BehaviorModel|object} [params.behaviorModel]
     * @param {ObservationSet|object} [params.observations]
     * @param {Array<Oracle>} [params.oracles=[]]
     * @param {Array<object>} [params.objectives=[]]
     * @param {SemanticTestSuite|object} [params.generatedTests]
     * @param {AdequacyResult|object} [params.adequacyResults]
     * @param {Array<Gap>} [params.gaps=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        specifications = new SpecificationSet(),
        behaviorModel = new BehaviorModel(),
        observations = new ObservationSet(),
        oracles = [],
        objectives = [],
        generatedTests = new SemanticTestSuite(),
        adequacyResults = new AdequacyResult(),
        gaps = [],
        metadata = {},
    } = {}) {
        this.specifications = specifications instanceof SpecificationSet
            ? specifications
            : SpecificationSet.fromJSON(specifications);
        this.behaviorModel = behaviorModel instanceof BehaviorModel
            ? behaviorModel
            : BehaviorModel.fromJSON(behaviorModel);
        this.observations = observations instanceof ObservationSet
            ? observations
            : ObservationSet.fromJSON(observations);
        this.oracles = Object.freeze(oracles.map(o => o instanceof Oracle ? o : Oracle.fromJSON(o)));
        this.objectives = Object.freeze([...objectives]);
        this.generatedTests = generatedTests instanceof SemanticTestSuite
            ? generatedTests
            : SemanticTestSuite.fromJSON(generatedTests);
        this.adequacyResults = adequacyResults instanceof AdequacyResult
            ? adequacyResults
            : AdequacyResult.fromJSON(adequacyResults);
        this.gaps = Object.freeze(gaps.map(g => g instanceof Gap ? g : Gap.fromJSON(g)));
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            specCount: this.specifications.size,
            obsCount: this.observations.size,
            oracleCount: this.oracles.length,
            objCount: this.objectives.length,
            testCount: this.generatedTests.size,
            gapCount: this.gaps.length,
        });

        this.id = id || `spec_snap_${SpecificationSnapshot.computeHash(hashPayload)}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            id: this.id,
            specifications: this.specifications.toJSON(),
            behaviorModel: this.behaviorModel.toJSON(),
            observations: this.observations.toJSON(),
            oracles: this.oracles.map(o => o.toJSON()),
            objectives: this.objectives,
            generatedTests: this.generatedTests.toJSON(),
            adequacyResults: this.adequacyResults.toJSON(),
            gaps: this.gaps.map(g => g.toJSON()),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SpecificationSnapshot({
            id: json.id,
            specifications: SpecificationSet.fromJSON(json.specifications),
            behaviorModel: BehaviorModel.fromJSON(json.behaviorModel),
            observations: ObservationSet.fromJSON(json.observations),
            oracles: (json.oracles || []).map(o => Oracle.fromJSON(o)),
            objectives: json.objectives || [],
            generatedTests: SemanticTestSuite.fromJSON(json.generatedTests),
            adequacyResults: AdequacyResult.fromJSON(json.adequacyResults),
            gaps: (json.gaps || []).map(g => Gap.fromJSON(g)),
            metadata: json.metadata || {},
        });
    }
}
