/**
 * ExplorationRequest — Configuration and parameters for starting a concolic exploration.
 */

export class ExplorationRequest {
    /**
     * @param {object} [params]
     * @param {string} [params.sourceCode='']
     * @param {Array<import('../testing/TestCase.js').TestCase>} [params.initialTests=[]]
     * @param {string} [params.strategy='DFS']
     * @param {number} [params.maxPaths=20]
     * @param {number} [params.maxDepth=50]
     * @param {number} [params.maxLoopIterations=10]
     * @param {number} [params.maxExplorations=50]
     * @param {number} [params.timeoutMs=2000]
     * @param {string|null} [params.target=null]
     * @param {string|null} [params.findingTarget=null]
     * @param {string|null} [params.branchTarget=null]
     * @param {string|null} [params.functionTarget=null]
     */
    constructor({
        sourceCode = '',
        initialTests = [],
        strategy = 'DFS',
        maxPaths = 20,
        maxDepth = 50,
        maxLoopIterations = 10,
        maxExplorations = 50,
        timeoutMs = 2000,
        target = null,
        findingTarget = null,
        branchTarget = null,
        functionTarget = null,
    } = {}) {
        this.sourceCode = String(sourceCode);
        this.initialTests = Object.freeze([...initialTests]);
        this.strategy = strategy;
        this.maxPaths = Number(maxPaths);
        this.maxDepth = Number(maxDepth);
        this.maxLoopIterations = Number(maxLoopIterations);
        this.maxExplorations = Number(maxExplorations);
        this.timeoutMs = Number(timeoutMs);
        this.target = target;
        this.findingTarget = findingTarget;
        this.branchTarget = branchTarget;
        this.functionTarget = functionTarget;
        Object.freeze(this);
    }
}
