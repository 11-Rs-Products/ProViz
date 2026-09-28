/**
 * TypeInference — Fixed-point abstract interpretation and type flow engine over CFG and SSA.
 */

import { TypeEnvironment } from './TypeEnvironment.js';
import { TypeState } from './TypeState.js';
import { TypeTransfer } from './TypeTransfer.js';
import { TypeWidening } from './TypeWidening.js';
import { TypeFlowGraph } from './TypeFlowGraph.js';
import { TypeFlowNode, TYPEFLOW_NODE_TYPES } from './TypeFlowNode.js';
import { TypeFlowEdge, TYPEFLOW_EDGE_TYPES } from './TypeFlowEdge.js';
import { TypeDiagnostic, DIAGNOSTIC_CODES, DIAGNOSTIC_SEVERITY } from './TypeDiagnostics.js';
import { AbstractType, TYPE_KINDS } from './AbstractType.js';
import { AbstractValue, VALUE_CONFIDENCE } from './AbstractValue.js';
import { NULLABILITY } from './Nullability.js';
import { CFG_NODE_TYPES } from '../analysis/ControlFlowNode.js';
import { CFG_EDGE_TYPES } from '../analysis/ControlFlowEdge.js';

export class TypeInference {
    /**
     * @param {object} [options]
     * @param {import('../analysis/ControlFlowGraph.js').ControlFlowGraph} options.cfg
     * @param {import('../analysis/SSAFunction.js').SSAFunction} [options.ssa]
     * @param {import('./LanguageTypeAdapter.js').LanguageTypeAdapter} [options.adapter]
     * @param {number} [options.maxIterations=64]
     */
    constructor({
        cfg,
        ssa = null,
        adapter = null,
        maxIterations = 64,
    }) {
        this.cfg = cfg;
        this.ssa = ssa;
        this.transfer = new TypeTransfer({ adapter });
        this.maxIterations = maxIterations;

        this.nodeStates = new Map(); // nodeId -> TypeState
        this.latestBindings = new Map(); // varName -> AbstractValue
        this.typeFlowGraph = new TypeFlowGraph({
            functionId: cfg?.functionId || '<module>',
            moduleId: cfg?.moduleId || 'main',
            fileId: cfg?.fileId || 'main.py',
        });
        this.diagnostics = [];
        this.returnTypes = [];
        this.functionSignature = null;
    }

    /**
     * Executes fixed-point type inference over the CFG.
     */
    infer() {
        if (!this.cfg) return this;
        const nodes = this.cfg.getNodes();
        const entry = this.cfg.getEntry();
        if (!entry || nodes.length === 0) return this;

        // Initialize state for each CFG node
        for (const node of nodes) {
            this.nodeStates.set(node.id, new TypeState({
                nodeId: node.id,
                inEnv: new TypeEnvironment({ scopeName: this.cfg.functionId }),
                outEnv: new TypeEnvironment({ scopeName: this.cfg.functionId }),
            }));
        }

        // Fixed-point iteration
        let changed = true;
        let iteration = 0;

        const hasBackEdges = this.cfg.getBackEdges().length > 0;

        while (changed && iteration < this.maxIterations) {
            changed = false;
            iteration++;

            for (const node of nodes) {
                const state = this.nodeStates.get(node.id);
                if (!state) continue;

                // 1. Join incoming states from predecessors
                const incomingEdges = this.cfg.getIncoming(node.id);
                let joinedIn;

                if (incomingEdges.length === 0) {
                    joinedIn = new TypeEnvironment({ scopeName: this.cfg.functionId });
                } else if (incomingEdges.length === 1) {
                    const edge = incomingEdges[0];
                    const predState = this.nodeStates.get(edge.fromId);
                    let predOut = predState ? predState.outEnv : new TypeEnvironment({ scopeName: this.cfg.functionId });
                    if (edge.type === CFG_EDGE_TYPES.TRUE_BRANCH || edge.type === CFG_EDGE_TYPES.FALSE_BRANCH) {
                        const predNode = this.cfg.getNode(edge.fromId);
                        const condExpr = predNode?.metadata?.condition;
                        if (condExpr) {
                            predOut = this.transfer.adapter.inferBranchNarrowing(
                                condExpr,
                                edge.type === CFG_EDGE_TYPES.TRUE_BRANCH,
                                predOut
                            );
                        }
                    }
                    joinedIn = predOut;
                } else {
                    joinedIn = new TypeEnvironment({ scopeName: this.cfg.functionId });
                    for (const edge of incomingEdges) {
                        const predState = this.nodeStates.get(edge.fromId);
                        if (!predState) continue;
                        let predOut = predState.outEnv;
                        if (edge.type === CFG_EDGE_TYPES.TRUE_BRANCH || edge.type === CFG_EDGE_TYPES.FALSE_BRANCH) {
                            const predNode = this.cfg.getNode(edge.fromId);
                            const condExpr = predNode?.metadata?.condition;
                            if (condExpr) {
                                predOut = this.transfer.adapter.inferBranchNarrowing(
                                    condExpr,
                                    edge.type === CFG_EDGE_TYPES.TRUE_BRANCH,
                                    predOut
                                );
                            }
                        }
                        joinedIn = joinedIn.join(predOut);
                    }
                }

                // 2. Transfer: compute OUT state from IN state
                let nextOut = joinedIn;
                const stmt = node.metadata;

                if (stmt?.targetVariable) {
                    nextOut = joinedIn.clone();
                    const varName = stmt.targetVariable;
                    const expr = stmt.statement || stmt.expression || node.label;
                    let inferredVal = AbstractValue.unknown();

                    // Parse RHS expression
                    if (expr && expr.includes('=')) {
                        const rhs = expr.split(/=(.+)/)[1]?.trim();
                        if (rhs) {
                            inferredVal = this.transfer.evaluateExpression(rhs, joinedIn);
                        }
                    } else if (expr) {
                        inferredVal = this.transfer.evaluateExpression(expr, joinedIn);
                    }

                    // Apply widening on loop back edges to guarantee convergence
                    if (iteration > 4) {
                        inferredVal = TypeWidening.widen(inferredVal);
                    }

                    nextOut.set(varName, inferredVal);
                    const prevBinding = this.latestBindings.get(varName);
                    this.latestBindings.set(varName, prevBinding ? prevBinding.join(inferredVal) : inferredVal);

                    // Add to TypeFlowGraph on first iteration
                    if (iteration === 1) {
                        const varNode = this.typeFlowGraph.addNode(TypeFlowNode.createVariableNode({
                            variableName: varName,
                            functionId: this.cfg.functionId,
                            abstractValue: inferredVal,
                            line: stmt.line || node.sourceLocations?.[0]?.line,
                            fileId: this.cfg.fileId,
                        }));

                        // Connect flow from dependent variables
                        for (const dep of (stmt.dependencies || [])) {
                            const depNode = this.typeFlowGraph.getNode(`tfn_var_${String(this.cfg.functionId).replace(/[^a-zA-Z0-9_]/g, '_')}_${dep}`);
                            if (depNode) {
                                this.typeFlowGraph.addEdge(new TypeFlowEdge({
                                    type: TYPEFLOW_EDGE_TYPES.VALUE_FLOWS_TO,
                                    fromId: depNode.id,
                                    toId: varNode.id,
                                }));
                            }
                        }
                    }
                }

                // Record Return values
                if (node.type === CFG_NODE_TYPES.RETURN) {
                    const retExpr = node.label.replace(/^return\s*/, '').trim();
                    if (retExpr) {
                        const retVal = this.transfer.evaluateExpression(retExpr, joinedIn);
                        this.returnTypes.push(retVal);
                    } else {
                        this.returnTypes.push(AbstractValue.fromConstant(ConstantValue.none()));
                    }
                }

                // Check for convergence
                if (state.inEnv !== joinedIn || state.outEnv !== nextOut) {
                    state.inEnv = joinedIn;
                    state.outEnv = nextOut;
                    changed = true;
                }
            }

            // Acyclic graphs converge in a single forward pass
            if (!hasBackEdges && iteration >= 1) {
                break;
            }
        }

        // Generate static type diagnostics
        this._generateDiagnostics();
        return this;
    }

    _generateDiagnostics() {
        for (const [nodeId, state] of this.nodeStates.entries()) {
            const node = this.cfg.getNode(nodeId);
            if (!node) continue;

            const stmt = node.metadata;
            if (stmt?.dependencies) {
                for (const dep of stmt.dependencies) {
                    const absVal = state.inEnv.get(dep);
                    // Check possible None dereference
                    if (absVal && (absVal.nullability === NULLABILITY.NULL || absVal.nullability === NULLABILITY.MAYBE_NULL)) {
                        if (node.label && (node.label.includes(`${dep}.`) || node.label.includes(`${dep}[`))) {
                            this.diagnostics.push(new TypeDiagnostic({
                                severity: DIAGNOSTIC_SEVERITY.WARNING,
                                code: DIAGNOSTIC_CODES.POSSIBLE_NONE_ACCESS,
                                message: `Variable '${dep}' may be None when accessed here.`,
                                sourceLocation: node.sourceLocations?.[0] || null,
                                confidence: absVal.nullability === NULLABILITY.NULL ? VALUE_CONFIDENCE.STATIC_GUARANTEE : VALUE_CONFIDENCE.STATIC_INFERENCE,
                            }));
                        }
                    }
                }
            }
        }
    }

    getReturnType() {
        if (this.returnTypes.length === 0) return AbstractType.none();
        let joinedVal = this.returnTypes[0];
        for (let i = 1; i < this.returnTypes.length; i++) {
            joinedVal = joinedVal.join(this.returnTypes[i]);
        }
        return joinedVal.typeSet.first() || AbstractType.unknown();
    }
}
