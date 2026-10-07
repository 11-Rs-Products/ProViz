/**
 * Evidence — Fundamental unit of verified, observed, tested, or synthesized evidence.
 */

import { EVIDENCE_KINDS } from './EvidenceKind.js';
import { EVIDENCE_SOURCES } from './EvidenceSource.js';
import { EVIDENCE_STRENGTHS, EvidenceStrength } from './EvidenceStrength.js';
import { EVIDENCE_POLARITIES } from './EvidencePolarity.js';
import { EVIDENCE_STATUSES } from './EvidenceStatus.js';
import { EvidenceConfidence } from './EvidenceConfidence.js';

export class Evidence {
    /**
     * @param {object} params
     */
    constructor({
        id = null,
        kind = EVIDENCE_KINDS.RUNTIME_OBSERVATION,
        source = EVIDENCE_SOURCES.RUNTIME_EXECUTION,
        subject = 'general',
        polarity = EVIDENCE_POLARITIES.SUPPORTS,
        strength = EVIDENCE_STRENGTHS.MODERATE,
        confidence = null,
        timestamp = null,
        programSnapshot = null,
        environment = null,
        provenance = {},
        observation = null,
        relatedSpecification = null,
        relatedOracle = null,
        relatedTest = null,
        relatedExploration = null,
        status = EVIDENCE_STATUSES.ACTIVE,
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.source = source;
        this.subject = String(subject);
        this.polarity = polarity;
        this.strength = strength;
        if (confidence instanceof EvidenceConfidence) {
            this.confidence = confidence;
        } else if (typeof confidence === 'number') {
            this.confidence = new EvidenceConfidence({ score: confidence });
        } else if (confidence && typeof confidence === 'object') {
            this.confidence = new EvidenceConfidence(confidence);
        } else {
            this.confidence = new EvidenceConfidence({ score: EvidenceStrength.getWeight(strength) });
        }
        this.timestamp = timestamp || Date.now();
        this.programSnapshot = programSnapshot ? Object.freeze({ ...programSnapshot }) : null;
        this.environment = environment ? Object.freeze({ ...environment }) : null;
        this.provenance = Object.freeze({ ...provenance });
        this.observation = observation ? (typeof observation === 'object' ? Object.freeze({ ...observation }) : observation) : null;
        this.relatedSpecification = relatedSpecification ? String(relatedSpecification) : null;
        this.relatedOracle = relatedOracle ? String(relatedOracle) : null;
        this.relatedTest = relatedTest ? String(relatedTest) : null;
        this.relatedExploration = relatedExploration ? String(relatedExploration) : null;
        this.status = status;
        this.metadata = Object.freeze({ ...metadata });

        this.id = id || Evidence.computeId({
            kind: this.kind,
            source: this.source,
            subject: this.subject,
            polarity: this.polarity,
            strength: this.strength,
            timestamp: this.timestamp,
            provenance: this.provenance,
        });

        Object.freeze(this);
    }

    static computeId(params) {
        let hash = 5381;
        const str = JSON.stringify(params);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return `evi_${Math.abs(hash).toString(16)}`;
    }

    withStatus(newStatus) {
        return new Evidence({
            ...this,
            status: newStatus,
        });
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            source: this.source,
            subject: this.subject,
            polarity: this.polarity,
            strength: this.strength,
            confidence: this.confidence.toJSON(),
            timestamp: this.timestamp,
            programSnapshot: this.programSnapshot,
            environment: this.environment,
            provenance: this.provenance,
            observation: this.observation,
            relatedSpecification: this.relatedSpecification,
            relatedOracle: this.relatedOracle,
            relatedTest: this.relatedTest,
            relatedExploration: this.relatedExploration,
            status: this.status,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Evidence({
            ...json,
            confidence: json.confidence ? EvidenceConfidence.fromJSON(json.confidence) : null,
        });
    }
}
