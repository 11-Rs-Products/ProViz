/**
 * RegressionGapTarget / RegressionFeedback / RegressionExplorer — Integration with Stage 21 regression intelligence.
 */

export class RegressionGapTarget {
    /**
     * @param {object} params
     * @param {string} params.changeId
     * @param {string} params.kind
     * @param {string} [params.functionId='global']
     * @param {object|null} [params.location=null]
     */
    constructor({
        changeId,
        kind,
        functionId = 'global',
        location = null,
    } = {}) {
        this.changeId = String(changeId || '');
        this.kind = String(kind || '');
        this.functionId = String(functionId || 'global');
        this.location = location ? Object.freeze({ ...location }) : null;
        Object.freeze(this);
    }
}

export class RegressionFeedback {
    /**
     * @param {object} params
     * @param {Array<string>} [params.exploredChanges=[]]
     * @param {Array<string>} [params.detectedRegressions=[]]
     */
    constructor({
        exploredChanges = [],
        detectedRegressions = [],
    } = {}) {
        this.exploredChanges = Object.freeze([...exploredChanges]);
        this.detectedRegressions = Object.freeze([...detectedRegressions]);
        Object.freeze(this);
    }
}

export class RegressionExplorer {
    /**
     * @param {Array<object>} changes
     * @returns {Array<RegressionGapTarget>}
     */
    static extractTargets(changes = []) {
        return changes.map(c => new RegressionGapTarget({
            changeId: c.id,
            kind: c.kind,
            functionId: c.functionIds?.[0] || 'global',
            location: c.sourceLocationAfter || c.sourceLocationBefore,
        }));
    }
}
