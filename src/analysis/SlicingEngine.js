/**
 * SlicingEngine — Computes backward, forward, and dynamic program slices with static/dynamic comparisons.
 */

import { ProgramSlice, SLICE_DIRECTIONS, SLICE_MODES } from './ProgramSlice.js';
import { DominatorTree } from './DominatorTree.js';

export class SlicingEngine {
    /**
     * Computes a static backward program slice for a given criterion.
     *
     * @param {object} criterion - { variable: string, line: number, nodeId?: string }
     * @param {import('./ControlFlowGraph.js').ControlFlowGraph} cfg
     * @param {import('./SSAFunction.js').SSAFunction} [ssaFunction=null]
     * @param {object} [options]
     * @param {boolean} [options.includeControlDependencies=true]
     * @param {number} [options.maxDepth=32]
     * @param {number} [options.maxNodes=256]
     * @returns {ProgramSlice}
     */
    static computeBackwardSlice(criterion, cfg, ssaFunction = null, {
        includeControlDependencies = true,
        maxDepth = 32,
        maxNodes = 256,
    } = {}) {
        const targetVar = criterion.variable;
        const targetLine = criterion.line;
        const nodes = cfg.getNodes();
        const domTree = includeControlDependencies ? (cfg._cachedDomTree || (cfg._cachedDomTree = new DominatorTree(cfg))) : null;

        const sliceNodes = new Set();
        const sliceStatements = new Set();
        const sliceLocations = [];
        const dependencies = new Set();

        // 1. Identify seed nodes
        const seedNodes = nodes.filter(n => {
            if (criterion.nodeId && n.id === criterion.nodeId) return true;
            if (targetLine && n.sourceLocations.some(l => l.line === targetLine)) {
                if (targetVar && n.metadata?.targetVariable === targetVar) return true;
                if (!targetVar) return true;
            }
            if (targetVar && n.metadata?.targetVariable === targetVar) return true;
            return false;
        });

        const workList = seedNodes.map(n => ({ node: n, depth: 0 }));
        const visited = new Set(seedNodes.map(n => n.id));

        while (workList.length > 0 && sliceNodes.size < maxNodes) {
            const { node, depth } = workList.shift();
            sliceNodes.add(node);

            if (node.label) sliceStatements.add(node.label);
            if (node.sourceLocations.length > 0) {
                sliceLocations.push(...node.sourceLocations);
            }

            if (depth >= maxDepth) continue;

            // (A) Data Dependencies from node metadata or SSA
            const dataDeps = node.metadata?.dependencies || [];
            for (const depVar of dataDeps) {
                dependencies.add(depVar);
                // Find producer definitions in CFG
                const producers = nodes.filter(n => n.metadata?.targetVariable === depVar);
                for (const p of producers) {
                    if (!visited.has(p.id)) {
                        visited.add(p.id);
                        workList.push({ node: p, depth: depth + 1 });
                    }
                }
            }

            // (B) Control Dependencies (controlling if/while branch conditions)
            if (includeControlDependencies && domTree) {
                const ctrlDeps = domTree.getControlDependencies(node.id);
                for (const ctrlId of ctrlDeps) {
                    const ctrlNode = cfg.getNode(ctrlId);
                    if (ctrlNode && !visited.has(ctrlNode.id)) {
                        visited.add(ctrlNode.id);
                        workList.push({ node: ctrlNode, depth: depth + 1 });
                    }
                }
            }
        }

        // Deduplicate source locations
        const uniqueLocations = Array.from(new Set(
            sliceLocations.map(l => JSON.stringify({ fileId: l.fileId || l.file || 'main.py', line: l.line }))
        )).map(s => JSON.parse(s));

        return new ProgramSlice({
            criterion,
            direction: SLICE_DIRECTIONS.BACKWARD,
            mode: SLICE_MODES.STATIC,
            nodes: Array.from(sliceNodes),
            sourceLocations: uniqueLocations,
            statements: Array.from(sliceStatements),
            dependencies: Array.from(dependencies),
            metadata: { totalNodes: sliceNodes.size },
        });
    }

    /**
     * Computes a static forward program slice for a given criterion.
     */
    static computeForwardSlice(criterion, cfg, ssaFunction = null, {
        maxDepth = 32,
        maxNodes = 256,
    } = {}) {
        const targetVar = criterion.variable;
        const targetLine = criterion.line;
        const nodes = cfg.getNodes();

        const sliceNodes = new Set();
        const sliceStatements = new Set();
        const sliceLocations = [];
        const affectedVars = new Set(targetVar ? [targetVar] : []);

        const seedNodes = nodes.filter(n => {
            if (targetLine && n.sourceLocations.some(l => l.line === targetLine)) return true;
            if (targetVar && n.metadata?.targetVariable === targetVar) return true;
            return false;
        });

        const workList = seedNodes.map(n => ({ node: n, depth: 0 }));
        const visited = new Set(seedNodes.map(n => n.id));

        while (workList.length > 0 && sliceNodes.size < maxNodes) {
            const { node, depth } = workList.shift();
            sliceNodes.add(node);

            if (node.label) sliceStatements.add(node.label);
            if (node.sourceLocations.length > 0) {
                sliceLocations.push(...node.sourceLocations);
            }

            if (depth >= maxDepth) continue;

            // Find downstream statements reading variables produced by current node
            const producedVar = node.metadata?.targetVariable;
            if (producedVar) affectedVars.add(producedVar);

            for (const other of nodes) {
                const uses = other.metadata?.dependencies || [];
                const readsAffected = uses.some(u => affectedVars.has(u));

                if (readsAffected && !visited.has(other.id)) {
                    visited.add(other.id);
                    workList.push({ node: other, depth: depth + 1 });
                }
            }
        }

        const uniqueLocations = Array.from(new Set(
            sliceLocations.map(l => JSON.stringify({ fileId: l.fileId || l.file || 'main.py', line: l.line }))
        )).map(s => JSON.parse(s));

        return new ProgramSlice({
            criterion,
            direction: SLICE_DIRECTIONS.FORWARD,
            mode: SLICE_MODES.STATIC,
            nodes: Array.from(sliceNodes),
            sourceLocations: uniqueLocations,
            statements: Array.from(sliceStatements),
            dependencies: Array.from(affectedVars),
            metadata: { totalNodes: sliceNodes.size },
        });
    }

    /**
     * Computes a dynamic program slice using Stage 12 runtime dataflow evidence.
     */
    static computeDynamicSlice(criterion, frameIndex, dataflowGraph) {
        const target = criterion.variable || criterion.target;
        const lastDef = dataflowGraph.getDefinitions(target, frameIndex);
        const def = lastDef.length > 0 ? lastDef[lastDef.length - 1] : null;

        const sliceLocations = [];
        const statements = [];
        const dependencies = new Set();

        if (def) {
            if (def.sourceLocation) sliceLocations.push(def.sourceLocation);
            if (def.metadata?.statement) statements.push(def.metadata.statement);

            for (const dep of (def.dependencies || [])) {
                dependencies.add(dep);
                const depDefs = dataflowGraph.getDefinitions(dep, frameIndex);
                if (depDefs.length > 0) {
                    const d = depDefs[depDefs.length - 1];
                    if (d.sourceLocation) sliceLocations.push(d.sourceLocation);
                    if (d.metadata?.statement) statements.push(d.metadata.statement);
                }
            }
        }

        const uniqueLocations = Array.from(new Set(
            sliceLocations.map(l => JSON.stringify({ fileId: l.fileId || l.file || 'main.py', line: l.line }))
        )).map(s => JSON.parse(s));

        return new ProgramSlice({
            criterion: { ...criterion, frameIndex },
            direction: SLICE_DIRECTIONS.BACKWARD,
            mode: SLICE_MODES.DYNAMIC,
            sourceLocations: uniqueLocations,
            statements,
            dependencies: Array.from(dependencies),
            metadata: { frameIndex },
        });
    }

    /**
     * Compares a static slice with a dynamic slice for a given criterion.
     */
    static compareStaticDynamicSlice(criterion, frameIndex, staticSlice, dynamicSlice) {
        const staticLocKey = loc => `${loc.fileId || loc.file}:${loc.line}`;

        const staticSet = new Set(staticSlice.sourceLocations.map(staticLocKey));
        const dynamicSet = new Set(dynamicSlice.sourceLocations.map(staticLocKey));

        const common = staticSlice.sourceLocations.filter(l => dynamicSet.has(staticLocKey(l)));
        const staticOnly = staticSlice.sourceLocations.filter(l => !dynamicSet.has(staticLocKey(l)));
        const dynamicOnly = dynamicSlice.sourceLocations.filter(l => !staticSet.has(staticLocKey(l)));

        return {
            criterion,
            frameIndex,
            staticSlice,
            dynamicSlice,
            staticOnly,
            dynamicOnly,
            common,
            summary: `Static slice contains ${staticSlice.sourceLocations.length} locations; dynamic slice contains ${dynamicSlice.sourceLocations.length} locations (${common.length} common).`,
        };
    }
}
