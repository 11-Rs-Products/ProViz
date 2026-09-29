/**
 * RepairResult — Aggregated outcome of generating and validating a repair candidate.
 */

import { RepairCandidate } from './RepairCandidate.js';
import { FindingResolution } from './FindingResolution.js';
import { RepairValidation } from './RepairValidation.js';
import { BehavioralDelta } from './BehavioralDelta.js';
import { RepairExplanation } from './RepairExplanation.js';

export const REPAIR_RESULT_STATUS = Object.freeze({
    VALIDATED: 'VALIDATED',
    PARTIALLY_VALIDATED: 'PARTIALLY_VALIDATED',
    REJECTED: 'REJECTED',
    UNKNOWN: 'UNKNOWN',
    CONFLICT: 'CONFLICT',
    STALE: 'STALE',
});

export class RepairResult {
    /**
     * @param {object} params
     * @param {RepairCandidate|object} params.candidate
     * @param {FindingResolution|object} [params.findingResolution=null]
     * @param {RepairValidation|object} [params.validation=null]
     * @param {BehavioralDelta|object} [params.behavioralDelta=null]
     * @param {Array<object>|object} [params.regressionResults=[]]
     * @param {RepairExplanation|object} [params.explanation=null]
     * @param {object|null} [params.artifact=null]
     * @param {string} [params.status=REPAIR_RESULT_STATUS.VALIDATED]
     */
    constructor({
        candidate,
        findingResolution = null,
        validation = null,
        behavioralDelta = null,
        regressionResults = [],
        explanation = null,
        artifact = null,
        status = REPAIR_RESULT_STATUS.VALIDATED,
    } = {}) {
        this.candidate = candidate instanceof RepairCandidate ? candidate : new RepairCandidate(candidate);
        this.findingResolution = findingResolution instanceof FindingResolution
            ? findingResolution
            : (findingResolution ? new FindingResolution(findingResolution) : null);
        this.validation = validation instanceof RepairValidation
            ? validation
            : (validation ? new RepairValidation(validation) : null);
        this.behavioralDelta = behavioralDelta instanceof BehavioralDelta
            ? behavioralDelta
            : (behavioralDelta ? new BehavioralDelta(behavioralDelta) : null);
        this.regressionResults = Object.freeze(Array.isArray(regressionResults) ? [...regressionResults] : [regressionResults]);
        this.explanation = explanation instanceof RepairExplanation
            ? explanation
            : (explanation ? new RepairExplanation(explanation) : null);
        this.artifact = artifact ? Object.freeze({ ...artifact }) : null;
        this.status = status;
        Object.freeze(this);
    }

    get isValidated() {
        return this.status === REPAIR_RESULT_STATUS.VALIDATED;
    }

    toJSON() {
        return {
            candidate: this.candidate.toJSON(),
            findingResolution: this.findingResolution?.toJSON ? this.findingResolution.toJSON() : this.findingResolution,
            validation: this.validation?.toJSON ? this.validation.toJSON() : this.validation,
            behavioralDelta: this.behavioralDelta?.toJSON ? this.behavioralDelta.toJSON() : this.behavioralDelta,
            regressionResults: this.regressionResults,
            explanation: this.explanation?.toJSON ? this.explanation.toJSON() : this.explanation,
            artifact: this.artifact,
            status: this.status,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RepairResult({
            candidate: RepairCandidate.fromJSON(json.candidate),
            findingResolution: FindingResolution.fromJSON(json.findingResolution),
            validation: RepairValidation.fromJSON(json.validation),
            behavioralDelta: BehavioralDelta.fromJSON(json.behavioralDelta),
            regressionResults: json.regressionResults,
            explanation: RepairExplanation.fromJSON(json.explanation),
            artifact: json.artifact,
            status: json.status,
        });
    }
}
