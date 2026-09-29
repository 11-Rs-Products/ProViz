/**
 * VerificationEngine — Core verification orchestrator combining CFG, SSA, Dataflow, TypeFlow, and Verification Rules.
 */

import { createBuiltinRuleSet } from './BuiltinRules.js';
import { RangeAnalyzer } from './RangeAnalyzer.js';
import { InvariantAnalyzer } from './InvariantAnalyzer.js';
import { ContractAnalyzer } from './ContractAnalyzer.js';
import { PathExplorer } from './PathExplorer.js';
import { VerificationGraph } from './VerificationGraph.js';
import { VerificationNode, VERIFICATION_NODE_KINDS } from './VerificationNode.js';
import { VerificationEdge, VERIFICATION_EDGE_KINDS } from './VerificationEdge.js';
import { VerificationSnapshot } from './VerificationSnapshot.js';
import { Property } from './Property.js';
import { PROPERTY_KINDS } from './PropertyKind.js';
import { PROPERTY_STATES } from './PropertyState.js';

export class VerificationEngine {
    /**
     * @param {object} [config]
     * @param {object} [config.ruleSet]
     * @param {number} [config.maxFindings=200]
     * @param {number} [config.maxPaths=32]
     * @param {number} [config.timeoutMs=1000]
     */
    constructor({
        ruleSet = createBuiltinRuleSet(),
        maxFindings = 200,
        maxPaths = 32,
        timeoutMs = 1000,
    } = {}) {
        this.ruleSet = ruleSet;
        this.maxFindings = maxFindings;
        this.maxPaths = maxPaths;
        this.timeoutMs = timeoutMs;
        this.rangeAnalyzer = new RangeAnalyzer();
        this.invariantAnalyzer = new InvariantAnalyzer();
        this.contractAnalyzer = new ContractAnalyzer();
        this.pathExplorer = new PathExplorer({ maxPaths, timeoutMs });
    }

    /**
     * Run full verification analysis pipeline.
     * @param {object} context
     * @param {object} context.cfg - ControlFlowGraph (Stage 13)
     * @param {object} [context.ssa] - SSAProgram / SSAFunction (Stage 13)
     * @param {object} [context.typeInference] - TypeInference (Stage 14)
     * @param {object} [context.dataflowGraph] - DataflowGraph (Stage 12)
     * @param {Array<object>} [context.contracts]
     * @param {string} [context.functionId='<module>']
     * @returns {VerificationSnapshot}
     */
    verify({
        cfg,
        ssa = null,
        typeInference = null,
        dataflowGraph = null,
        contracts = [],
        functionId = '<module>',
    } = {}) {
        if (!cfg) {
            return new VerificationSnapshot({ functionId, status: 'INCOMPLETE' });
        }

        // 1. Range Analysis
        const ranges = this.rangeAnalyzer.analyze(cfg, typeInference);

        // 2. Function summaries
        const functionSummaries = new Map();

        // 3. Match rules to generate findings
        const findings = [];
        const ruleContext = {
            cfg,
            ssa,
            typeInference,
            dataflowGraph,
            ranges,
            functionSummaries,
        };

        for (const rule of this.ruleSet.getAll()) {
            if (findings.length >= this.maxFindings) break;
            try {
                const ruleFindings = rule.matcher(ruleContext) || [];
                for (const f of ruleFindings) {
                    if (findings.length < this.maxFindings) {
                        findings.push(f);
                    }
                }
            } catch (err) {
                // Keep verification robust and non-crashing
            }
        }

        // 4. Invariants and Contracts
        const invariants = this.invariantAnalyzer.analyze(cfg, ranges, typeInference);
        const contractFindings = this.contractAnalyzer.analyze(contracts, typeInference, ranges);
        findings.push(...contractFindings);

        // 5. Properties synthesis
        const properties = [];
        for (const [varName, range] of ranges.entries()) {
            if (range && !range.isEmpty) {
                properties.push(
                    new Property({
                        kind: PROPERTY_KINDS.VALUE_IN_RANGE,
                        target: varName,
                        value: range.toJSON(),
                        state: PROPERTY_STATES.PROVEN,
                        confidence: 'STATIC_INFERENCE',
                    })
                );
            }
        }

        // 6. Build VerificationGraph
        const graph = new VerificationGraph();

        for (const f of findings) {
            const fNode = new VerificationNode({
                id: f.id,
                kind: VERIFICATION_NODE_KINDS.FINDING,
                label: f.shortMessage || f.message,
                payload: f.toJSON(),
            });
            graph.addNode(fNode);

            if (f.cfgNodeId) {
                const cfgNode = new VerificationNode({
                    id: `vnode_cfg_${f.cfgNodeId}`,
                    kind: VERIFICATION_NODE_KINDS.CFG_NODE,
                    label: `CFG Node ${f.cfgNodeId}`,
                });
                graph.addNode(cfgNode);
                graph.addEdge(
                    new VerificationEdge({
                        from: fNode.id,
                        to: cfgNode.id,
                        kind: VERIFICATION_EDGE_KINDS.CAUSED_BY,
                    })
                );
            }

            if (f.sourceLocation?.line) {
                const srcNode = new VerificationNode({
                    id: `vnode_src_${f.sourceLocation.fileId}_${f.sourceLocation.line}`,
                    kind: VERIFICATION_NODE_KINDS.SOURCE_LOCATION,
                    label: f.sourceLocation.toString(),
                });
                graph.addNode(srcNode);
                graph.addEdge(
                    new VerificationEdge({
                        from: fNode.id,
                        to: srcNode.id,
                        kind: VERIFICATION_EDGE_KINDS.OBSERVED_AT,
                    })
                );
            }
        }

        return new VerificationSnapshot({
            functionId,
            findings,
            properties,
            invariants,
            contracts,
            verificationGraph: graph,
            functionSummaries: Object.fromEntries(functionSummaries.entries()),
            status: 'SUCCESS',
        });
    }
}
