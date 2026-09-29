/**
 * MutationResult — Aggregated outcome of testing and classifying an individual mutant.
 */

import { MutationCandidate } from './MutationCandidate.js';
import { MUTATION_STATUS } from './MutationStatus.js';

export class MutationResult {
    /**
     * @param {object} params
     * @param {MutationCandidate|object} params.mutant
     * @param {string} [params.status=MUTATION_STATUS.GENERATED]
     * @param {string} [params.classification='UNKNOWN']
     * @param {Array<string>} [params.testsRun=[]]
     * @param {Array<string>} [params.killingTests=[]]
     * @param {Array<string>} [params.survivingTests=[]]
     * @param {object|null} [params.coverage=null]
     * @param {object|null} [params.behavioralDelta=null]
     * @param {object|null} [params.equivalence=null]
     * @param {object|null} [params.symbolicEvidence=null]
     * @param {object|null} [params.concolicEvidence=null]
     * @param {string} [params.explanation='']
     */
    constructor({
        mutant,
        status = MUTATION_STATUS.GENERATED,
        classification = 'UNKNOWN',
        testsRun = [],
        killingTests = [],
        survivingTests = [],
        coverage = null,
        behavioralDelta = null,
        equivalence = null,
        symbolicEvidence = null,
        concolicEvidence = null,
        explanation = '',
    } = {}) {
        this.mutant = mutant instanceof MutationCandidate ? mutant : new MutationCandidate(mutant);
        this.status = status;
        this.classification = classification;
        this.testsRun = Object.freeze([...testsRun]);
        this.killingTests = Object.freeze([...killingTests]);
        this.survivingTests = Object.freeze([...survivingTests]);
        this.coverage = coverage ? Object.freeze({ ...coverage }) : null;
        this.behavioralDelta = behavioralDelta ? Object.freeze({ ...behavioralDelta }) : null;
        this.equivalence = equivalence ? Object.freeze({ ...equivalence }) : null;
        this.symbolicEvidence = symbolicEvidence ? Object.freeze({ ...symbolicEvidence }) : null;
        this.concolicEvidence = concolicEvidence ? Object.freeze({ ...concolicEvidence }) : null;
        this.explanation = String(explanation || '');
        Object.freeze(this);
    }

    get isKilled() {
        return this.status === MUTATION_STATUS.KILLED;
    }

    toJSON() {
        return {
            mutant: this.mutant.toJSON(),
            status: this.status,
            classification: this.classification,
            testsRun: this.testsRun,
            killingTests: this.killingTests,
            survivingTests: this.survivingTests,
            coverage: this.coverage,
            behavioralDelta: this.behavioralDelta,
            equivalence: this.equivalence,
            symbolicEvidence: this.symbolicEvidence,
            concolicEvidence: this.concolicEvidence,
            explanation: this.explanation,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationResult({
            ...json,
            mutant: MutationCandidate.fromJSON(json.mutant),
        });
    }
}
