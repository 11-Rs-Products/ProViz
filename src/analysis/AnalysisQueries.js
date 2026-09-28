/**
 * AnalysisQueries — High-level query engine for CFG, SSA, dominators, reaching definitions, and program slicing.
 */

import { Reachability } from './Reachability.js';
import { SlicingEngine } from './SlicingEngine.js';

export class AnalysisQueries {
    /**
     * @param {object} params
     * @param {import('./ControlFlowGraph.js').ControlFlowGraph} params.cfg
     * @param {import('./DominatorTree.js').DominatorTree} params.domTree
     * @param {import('./SSAFunction.js').SSAFunction} params.ssa
     * @param {import('./StaticDataflow.js').StaticDataflow} params.staticDataflow
     * @param {import('../dataflow/DataflowGraph.js').DataflowGraph|null} [params.dataflowGraph=null]
     */
    constructor({ cfg, domTree, ssa, staticDataflow, dataflowGraph = null }) {
        this.cfg = cfg;
        this.domTree = domTree;
        this.ssa = ssa;
        this.staticDataflow = staticDataflow;
        this.dataflowGraph = dataflowGraph;
    }

    getControlFlow() {
        return this.cfg;
    }

    getBasicBlocks() {
        return this.cfg.getBasicBlocks();
    }

    getReachability(fromId, toId, limits = {}) {
        return Reachability.isReachable(fromId, toId, this.cfg, limits);
    }

    getDominators(nodeId) {
        return this.domTree.getDominators(nodeId);
    }

    getPostDominators(nodeId) {
        return this.domTree.getPostDominators(nodeId);
    }

    getControlDependencies(nodeId) {
        return this.domTree.getControlDependencies(nodeId);
    }

    getSSA() {
        return this.ssa;
    }

    getSSAValue(variable, version) {
        const id = `ssa_${String(this.cfg.functionId).replace(/[^a-zA-Z0-9_]/g, '_')}_${variable}_${version}`;
        return this.ssa.getValue(id);
    }

    getReachingDefinitions(nodeId) {
        return this.staticDataflow.getReachingDefinitions(nodeId);
    }

    getLiveVariables(blockId) {
        return this.staticDataflow.getLiveVariables(blockId);
    }

    getBackwardSlice(criterion, options = {}) {
        return SlicingEngine.computeBackwardSlice(criterion, this.cfg, this.ssa, options);
    }

    getForwardSlice(criterion, options = {}) {
        return SlicingEngine.computeForwardSlice(criterion, this.cfg, this.ssa, options);
    }

    getDynamicSlice(criterion, frameIndex = 0, options = {}) {
        if (!this.dataflowGraph) {
            return SlicingEngine.computeBackwardSlice(criterion, this.cfg, this.ssa, options);
        }
        return SlicingEngine.computeDynamicSlice(criterion, frameIndex, this.dataflowGraph);
    }

    compareStaticDynamicSlice(criterion, frameIndex = 0) {
        const staticSlice = this.getBackwardSlice(criterion);
        const dynamicSlice = this.getDynamicSlice(criterion, frameIndex);
        return SlicingEngine.compareStaticDynamicSlice(criterion, frameIndex, staticSlice, dynamicSlice);
    }

    explainBranch({ conditionNodeId, observedValue = null, frameIndex = 0 }) {
        const condNode = this.cfg.getNode(conditionNodeId);
        const branches = Reachability.getReachableBranches(conditionNodeId, this.cfg);

        return {
            conditionNode: condNode,
            conditionExpression: condNode?.metadata?.condition || condNode?.label,
            observedValue,
            selectedBranch: observedValue === true ? 'TRUE_BRANCH' : (observedValue === false ? 'FALSE_BRANCH' : 'UNKNOWN'),
            branches,
            frameIndex,
            summary: `Branch at line ${condNode?.sourceLocations?.[0]?.line || 0} evaluated with condition '${condNode?.metadata?.condition || ''}' -> ${observedValue}`,
        };
    }

    explainUnreachable(nodeId) {
        if (!this.cfg || !this.cfg.hasNode(nodeId)) {
            return {
                nodeId,
                node: null,
                unreachable: true,
                reason: 'Node is unreachable or not present in active control-flow graph',
                sourceLocations: [],
            };
        }
        const isUnreachable = Reachability.getUnreachableNodes(this.cfg).some(n => n.id === nodeId);
        const node = this.cfg.getNode(nodeId);

        return {
            nodeId,
            node,
            unreachable: isUnreachable,
            reason: isUnreachable ? 'No active control-flow path exists from Entry to this node' : 'Reachable from Entry',
            sourceLocations: node?.sourceLocations || [],
        };
    }

    explainDefinition(useNodeId, targetVariable) {
        const reachingDefs = this.staticDataflow.getReachingDefinitions(useNodeId);
        const ssaValues = this.ssa.getValuesForVariable(targetVariable);

        return {
            useNodeId,
            targetVariable,
            reachingDefinitions: reachingDefs,
            ssaVersions: ssaValues,
            summary: `Variable '${targetVariable}' at use site has ${reachingDefs.length} reaching definition(s) and ${ssaValues.length} SSA version(s).`,
        };
    }
}
