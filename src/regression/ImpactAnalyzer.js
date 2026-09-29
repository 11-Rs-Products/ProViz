/**
 * ImpactAnalyzer — Builds the global ImpactGraph and computes affected entities across multi-file boundaries.
 */

import { ImpactGraph } from './ImpactGraph.js';
import { ImpactNode, IMPACT_NODE_KINDS } from './ImpactNode.js';
import { ImpactEdge, IMPACT_EDGE_KINDS } from './ImpactEdge.js';
import { ImpactPropagator } from './ImpactPropagator.js';
import { AffectedSymbol } from './AffectedSymbol.js';
import { AffectedFunction } from './AffectedFunction.js';
import { AffectedModule } from './AffectedModule.js';
import { AffectedPath } from './AffectedPath.js';
import { AffectedObject } from './AffectedObject.js';
import { AffectedProperty } from './AffectedProperty.js';

export class ImpactAnalyzer {
    /**
     * @param {object} [options={}]
     */
    constructor(options = {}) {
        this.options = options;
    }

    /**
     * Build ImpactGraph for a WorkspaceSnapshot and optional test suite.
     *
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} snapshot
     * @param {Array<import('../testing/TestCase.js').TestCase>|import('../testing/TestSuite.js').TestSuite} [testSuite=[]]
     * @returns {ImpactGraph}
     */
    buildGraph(snapshot, testSuite = []) {
        const graph = new ImpactGraph();
        if (!snapshot) return graph;

        const files = snapshot.getAllFiles();
        const tests = Array.isArray(testSuite) ? testSuite : (testSuite?.testCases || []);

        // 1. Files & Modules
        for (const file of files) {
            const fileNode = new ImpactNode({
                id: file.id,
                kind: IMPACT_NODE_KINDS.FILE,
                name: file.name,
                metadata: { path: file.path },
            });
            graph.addNode(fileNode);

            if (file.moduleId) {
                const modNode = new ImpactNode({
                    id: file.moduleId,
                    kind: IMPACT_NODE_KINDS.MODULE,
                    name: file.moduleId,
                });
                graph.addNode(modNode);
                graph.addEdge(new ImpactEdge({
                    fromId: file.moduleId,
                    toId: file.id,
                    kind: IMPACT_EDGE_KINDS.DEFINES,
                }));
            }

            // Extract basic functions and symbols from file
            const lines = file.content.split('\n');
            let currentFunc = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const funcMatch = line.match(/^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (funcMatch) {
                    currentFunc = funcMatch[2];
                    const fnNode = new ImpactNode({
                        id: `${file.id}:${currentFunc}`,
                        kind: IMPACT_NODE_KINDS.FUNCTION,
                        name: currentFunc,
                        metadata: { fileId: file.id, line: i + 1 },
                    });
                    graph.addNode(fnNode);
                    graph.addEdge(new ImpactEdge({
                        fromId: file.id,
                        toId: fnNode.id,
                        kind: IMPACT_EDGE_KINDS.DEFINES,
                    }));
                }

                // Simple call detection (e.g. foo(...))
                const callMatches = line.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
                for (const m of callMatches) {
                    const called = m[1];
                    if (called !== 'def' && called !== 'if' && called !== 'while' && called !== 'for' && called !== 'return') {
                        const targetId = `${file.id}:${called}`;
                        if (currentFunc) {
                            graph.addEdge(new ImpactEdge({
                                fromId: `${file.id}:${currentFunc}`,
                                toId: targetId,
                                kind: IMPACT_EDGE_KINDS.CALLS,
                            }));
                        }
                    }
                }

                // Variable definitions (e.g. x = ...)
                const assignMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
                if (assignMatch) {
                    const varName = assignMatch[2];
                    const varNode = new ImpactNode({
                        id: `${file.id}:${varName}`,
                        kind: IMPACT_NODE_KINDS.SYMBOL,
                        name: varName,
                        metadata: { fileId: file.id, line: i + 1 },
                    });
                    graph.addNode(varNode);

                    if (currentFunc) {
                        graph.addEdge(new ImpactEdge({
                            fromId: `${file.id}:${currentFunc}`,
                            toId: varNode.id,
                            kind: IMPACT_EDGE_KINDS.DEFINES,
                        }));
                    } else {
                        graph.addEdge(new ImpactEdge({
                            fromId: file.id,
                            toId: varNode.id,
                            kind: IMPACT_EDGE_KINDS.DEFINES,
                        }));
                    }
                }
            }
        }

        // 2. Module Graph Imports/Exports
        if (snapshot.moduleGraph) {
            const mg = snapshot.moduleGraph;
            const edges = mg.getAllEdges ? mg.getAllEdges() : [];
            for (const edge of edges) {
                graph.addEdge(new ImpactEdge({
                    fromId: edge.fromModuleId || edge.source,
                    toId: edge.toModuleId || edge.target,
                    kind: IMPACT_EDGE_KINDS.IMPORTS,
                }));
            }
        }

        // 3. Tests & Covered Locations
        for (const t of tests) {
            const testNode = new ImpactNode({
                id: t.id,
                kind: IMPACT_NODE_KINDS.TEST,
                name: t.id,
                metadata: { targetKind: t.targetKind, targetId: t.targetId },
            });
            graph.addNode(testNode);

            // Connect test to target function / symbol / file
            if (t.targetId) {
                // Connect to matching function or symbol across files
                for (const f of files) {
                    const targetFuncId = `${f.id}:${t.targetId}`;
                    if (graph.hasNode(targetFuncId)) {
                        graph.addEdge(new ImpactEdge({
                            fromId: targetFuncId,
                            toId: t.id,
                            kind: IMPACT_EDGE_KINDS.TESTS,
                            evidence: 'Direct target test coverage',
                        }));
                    }
                }
            }
        }

        return graph;
    }

    /**
     * Analyze impact of a SemanticChangeSet on a snapshot.
     *
     * @param {import('./SemanticChangeSet.js').SemanticChangeSet} changeSet
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} snapshot
     * @param {Array<import('../testing/TestCase.js').TestCase>} [testSuite=[]]
     * @param {object} [options={}]
     * @returns {object}
     */
    analyze(changeSet, snapshot, testSuite = [], options = {}) {
        const graph = this.buildGraph(snapshot, testSuite);

        // Inject seeds for changes
        for (const c of changeSet.changes) {
            const cNode = new ImpactNode({
                id: c.id,
                kind: IMPACT_NODE_KINDS.STATEMENT,
                name: c.kind,
            });
            graph.addNode(cNode);

            if (c.fileId) {
                graph.addEdge(new ImpactEdge({
                    fromId: c.fileId,
                    toId: c.id,
                    kind: IMPACT_EDGE_KINDS.AFFECTS,
                }));
                graph.addEdge(new ImpactEdge({
                    fromId: c.id,
                    toId: c.fileId,
                    kind: IMPACT_EDGE_KINDS.AFFECTS,
                }));
            }

            for (const fn of c.functionIds) {
                const fnTarget = `${c.fileId}:${fn}`;
                if (graph.hasNode(fnTarget)) {
                    graph.addEdge(new ImpactEdge({
                        fromId: c.id,
                        toId: fnTarget,
                        kind: IMPACT_EDGE_KINDS.AFFECTS,
                    }));
                }
            }

            for (const sym of c.symbolIds) {
                const symTarget = `${c.fileId}:${sym}`;
                if (graph.hasNode(symTarget)) {
                    graph.addEdge(new ImpactEdge({
                        fromId: c.id,
                        toId: symTarget,
                        kind: IMPACT_EDGE_KINDS.AFFECTS,
                    }));
                }
            }
        }

        const propResult = ImpactPropagator.propagate(changeSet, graph, options);

        // Group affected entities
        const affectedSymbols = [];
        const affectedFunctions = [];
        const affectedModules = [];
        const affectedTests = [];
        const affectedProperties = [];
        const affectedPaths = [];
        const affectedObjects = [];

        for (const [nodeId, entry] of propResult.impactedNodes.entries()) {
            const node = entry.node;
            if (!node) continue;

            if (node.kind === IMPACT_NODE_KINDS.SYMBOL) {
                affectedSymbols.push(new AffectedSymbol({
                    symbolName: node.name,
                    depth: entry.depth,
                    path: entry.path,
                    reasons: entry.reasons,
                }));
            } else if (node.kind === IMPACT_NODE_KINDS.FUNCTION) {
                affectedFunctions.push(new AffectedFunction({
                    functionName: node.name,
                    depth: entry.depth,
                    path: entry.path,
                    reasons: entry.reasons,
                }));
            } else if (node.kind === IMPACT_NODE_KINDS.MODULE) {
                affectedModules.push(new AffectedModule({
                    moduleId: node.name,
                    depth: entry.depth,
                    path: entry.path,
                    reasons: entry.reasons,
                }));
            } else if (node.kind === IMPACT_NODE_KINDS.TEST) {
                affectedTests.push({
                    testId: node.id,
                    depth: entry.depth,
                    path: entry.path,
                    reasons: entry.reasons,
                });
            } else if (node.kind === IMPACT_NODE_KINDS.PROPERTY) {
                affectedProperties.push(new AffectedProperty({
                    propertyId: node.id,
                    reasons: entry.reasons,
                }));
            } else if (node.kind === IMPACT_NODE_KINDS.SYMBOLIC_PATH) {
                affectedPaths.push(new AffectedPath({
                    pathId: node.id,
                    reasons: entry.reasons,
                }));
            } else if (node.kind === IMPACT_NODE_KINDS.RUNTIME_OBJECT) {
                affectedObjects.push(new AffectedObject({
                    objectId: node.id,
                    reasons: entry.reasons,
                }));
            }
        }

        return {
            graph,
            propagation: propResult,
            affectedSymbols: Object.freeze(affectedSymbols),
            affectedFunctions: Object.freeze(affectedFunctions),
            affectedModules: Object.freeze(affectedModules),
            affectedTests: Object.freeze(affectedTests),
            affectedProperties: Object.freeze(affectedProperties),
            affectedPaths: Object.freeze(affectedPaths),
            affectedObjects: Object.freeze(affectedObjects),
            explainImpact: (id) => propResult.explain(id),
        };
    }
}
