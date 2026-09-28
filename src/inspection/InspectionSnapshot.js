/**
 * InspectionSnapshot — Immutable serializable snapshot of watch evaluation results at a specific frame.
 *
 * Facilitates:
 *  - Deterministic replay & test assertions
 *  - Frame-to-frame watch expression diffing
 *  - Debugging recording exports & snapshots
 */

import { EvaluationResult } from './EvaluationResult.js';
import { WatchExpression } from './WatchExpression.js';
import { valuesEqual } from '../runtime/Value.js';

export class InspectionSnapshot {
    /**
     * @param {object} params
     * @param {number} [params.frameIndex=-1]
     * @param {object|null} [params.sourceLocation=null]
     * @param {number} [params.workspaceVersion=1]
     * @param {Record<string, EvaluationResult|object>|Map<string, EvaluationResult>} [params.results={}]
     * @param {Array<WatchExpression|object>} [params.watches=[]]
     * @param {number} [params.timestamp]
     */
    constructor({
        frameIndex = -1,
        sourceLocation = null,
        workspaceVersion = 1,
        results = {},
        watches = [],
        timestamp = null,
    } = {}) {
        this.frameIndex = frameIndex;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.workspaceVersion = workspaceVersion;
        this.timestamp = typeof timestamp === 'number' ? timestamp : Date.now();

        this.watches = Array.isArray(watches)
            ? watches.map(w => (w instanceof WatchExpression ? w.clone() : WatchExpression.fromJSON(w)))
            : [];

        this.results = {};
        if (results instanceof Map) {
            for (const [k, v] of results.entries()) {
                this.results[k] = v instanceof EvaluationResult ? v : new EvaluationResult(v);
            }
        } else if (results && typeof results === 'object') {
            for (const [k, v] of Object.entries(results)) {
                this.results[k] = v instanceof EvaluationResult ? v : new EvaluationResult(v);
            }
        }

        Object.freeze(this);
    }

    /**
     * Retrieves the EvaluationResult for a given watch ID.
     * @param {string} watchId
     * @returns {EvaluationResult|null}
     */
    getResult(watchId) {
        return this.results[watchId] || null;
    }

    /**
     * Diffs this snapshot against another snapshot (e.g. from an earlier or later frame).
     * @param {InspectionSnapshot} otherSnapshot
     * @returns {{ changed: Array<object>, added: Array<string>, removed: Array<string> }}
     */
    diff(otherSnapshot) {
        if (!otherSnapshot || !(otherSnapshot instanceof InspectionSnapshot)) {
            return { changed: [], added: [], removed: [] };
        }

        const myKeys = Object.keys(this.results);
        const otherKeys = Object.keys(otherSnapshot.results);

        const added = myKeys.filter(k => !otherKeys.includes(k));
        const removed = otherKeys.filter(k => !myKeys.includes(k));
        const common = myKeys.filter(k => otherKeys.includes(k));

        const changed = [];
        for (const k of common) {
            const resA = otherSnapshot.results[k];
            const resB = this.results[k];

            const aVal = resA.value;
            const bVal = resB.value;

            const isDifferent = resA.status !== resB.status || !valuesEqual(aVal, bVal);
            if (isDifferent) {
                changed.push({
                    watchId: k,
                    fromStatus: resA.status,
                    toStatus: resB.status,
                    fromDisplay: resA.display,
                    toDisplay: resB.display,
                    fromValue: aVal,
                    toValue: bVal,
                });
            }
        }

        return {
            changed,
            added,
            removed,
        };
    }

    toJSON() {
        const jsonResults = {};
        for (const [k, v] of Object.entries(this.results)) {
            jsonResults[k] = v.toJSON();
        }

        return {
            frameIndex: this.frameIndex,
            sourceLocation: this.sourceLocation,
            workspaceVersion: this.workspaceVersion,
            timestamp: this.timestamp,
            watches: this.watches.map(w => w.toJSON()),
            results: jsonResults,
        };
    }

    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct InspectionSnapshot from null/undefined');
        return new InspectionSnapshot({
            frameIndex: json.frameIndex,
            sourceLocation: json.sourceLocation,
            workspaceVersion: json.workspaceVersion,
            timestamp: json.timestamp,
            watches: json.watches || [],
            results: json.results || {},
        });
    }
}
