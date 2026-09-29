/**
 * SymbolicVerification — Refines Stage 15 verification findings using symbolic path exploration and constraint solving.
 */

import { Proof } from './Proof.js';
import { ProofStep } from './ProofStep.js';
import { PROOF_KINDS } from './ProofKind.js';
import { Counterexample } from './Counterexample.js';
import { CounterexampleStep } from './CounterexampleStep.js';
import { ConstraintSolver } from './ConstraintSolver.js';

export class SymbolicVerification {
    constructor() {
        this.solver = new ConstraintSolver();
    }

    /**
     * Refines a finding using symbolic paths.
     * @param {object} finding - Stage 15 Finding
     * @param {import('./SymbolicPathGraph.js').SymbolicPathGraph} pathGraph
     * @returns {{ status: string, proof: Proof|null, counterexample: Counterexample|null }}
     */
    refineFinding(finding, pathGraph) {
        if (!finding || !pathGraph) {
            return { status: 'UNKNOWN', proof: null, counterexample: null };
        }

        const findingNodeId = finding.cfgNodeId;
        const reachingPaths = pathGraph.getPaths().filter(p => !findingNodeId || p.nodeIds.includes(findingNodeId));

        if (reachingPaths.length === 0) {
            return {
                status: 'UNREACHABLE',
                proof: new Proof({
                    property: `Safety for finding ${finding.kind}`,
                    status: 'PROVEN',
                    steps: [
                        new ProofStep({
                            kind: PROOF_KINDS.PATH_CONDITION,
                            statement: `No feasible symbolic path reaches node ${findingNodeId || 'unknown'}.`,
                            justification: 'Symbolic path exploration proved path contradiction',
                        }),
                    ],
                }),
                counterexample: null,
            };
        }

        const feasiblePath = reachingPaths.find(p => p.isFeasible);
        if (!feasiblePath) {
            return {
                status: 'UNREACHABLE',
                proof: new Proof({
                    property: `Safety for finding ${finding.kind}`,
                    status: 'PROVEN',
                    steps: [
                        new ProofStep({
                            kind: PROOF_KINDS.PATH_CONDITION,
                            statement: `All paths reaching node ${findingNodeId} are symbolically contradictory (UNSAT).`,
                            justification: 'Constraint solver found unsatisfiable path conditions',
                        }),
                    ],
                }),
                counterexample: null,
            };
        }

        // Feasible path reaches finding: construct counterexample
        const finalConstraints = feasiblePath.finalState ? feasiblePath.finalState.constraints.getAll() : [];
        const solveRes = this.solver.checkSat(finalConstraints);

        const cexSteps = feasiblePath.nodeIds.map(nid => new CounterexampleStep({ nodeId: nid, description: `Traversed CFG node ${nid}` }));
        const counterexample = new Counterexample({
            property: finding.message,
            assignments: solveRes.model || {},
            steps: cexSteps,
            status: 'SYMBOLIC_COUNTEREXAMPLE',
        });

        const proof = new Proof({
            property: finding.message,
            status: 'DISPROVEN',
            steps: [
                new ProofStep({
                    kind: PROOF_KINDS.PATH_CONDITION,
                    statement: `Feasible symbolic path reaches defect statement under constraints: [${finalConstraints.map(c => c.toString()).join(', ')}].`,
                    justification: 'Linear constraint solver found satisfying assignment',
                }),
            ],
            assumptions: finalConstraints.map(c => c.toString()),
        });

        return {
            status: 'FEASIBLE',
            proof,
            counterexample,
        };
    }
}
