/**
 * RootCauseAnalyzer — Determines the causal origin, dataflow variables, and dependencies of a finding.
 */

import { RootCause, ROOT_CAUSE_EVIDENCE } from './RootCause.js';

export class RootCauseAnalyzer {
    /**
     * Analyze a verification finding or counterexample to extract its root cause.
     *
     * @param {object} finding - Verification finding
     * @param {object} [context={}]
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot|string} [context.workspace=null]
     * @param {import('../dataflow/DataflowGraph.js').DataflowGraph|object} [context.dataflow=null]
     * @param {import('../analysis/ControlFlowGraph.js').ControlFlowGraph|object} [context.cfg=null]
     * @param {import('../symbolic/SymbolicCounterexample.js').SymbolicCounterexample|object} [context.counterexample=null]
     * @returns {RootCause}
     */
    static analyzeFinding(finding, context = {}) {
        const location = finding?.location || { fileId: 'main.py', line: 1, col: 1 };
        const findingKind = String(finding?.kind || '');

        let variableName = '';
        let explanation = '';
        let evidence = ROOT_CAUSE_EVIDENCE.POSSIBLE;

        // Extract variable name from finding properties, expression, or message
        if (finding?.variableName) {
            variableName = finding.variableName;
        } else if (finding?.expression) {
            variableName = finding.expression;
        } else if (finding?.message) {
            const match = finding.message.match(/`([^`]+)`|variable '([^']+)'|operand '([^']+)'|divisor '([^']+)'/);
            if (match) {
                variableName = match[1] || match[2] || match[3] || match[4] || '';
            }
        }

        // If not extracted, attempt heuristic parsing from source line
        if (!variableName && context.workspace) {
            const file = typeof context.workspace === 'string'
                ? context.workspace
                : (context.workspace.getFile && (context.workspace.getFile(location.fileId) || context.workspace.getFileByPath(location.fileId))?.content);

            if (file) {
                const lineText = file.split('\n')[location.line - 1] || '';
                if (findingKind.includes('DIVISION')) {
                    const divMatch = lineText.match(/\/\s*([a-zA-Z0-9_]+)/);
                    if (divMatch) variableName = divMatch[1];
                } else if (findingKind.includes('NONE') || findingKind.includes('ATTRIBUTE')) {
                    const dotMatch = lineText.match(/([a-zA-Z0-9_]+)\.[a-zA-Z0-9_]+/);
                    if (dotMatch) variableName = dotMatch[1];
                } else if (findingKind.includes('INDEX')) {
                    const idxMatch = lineText.match(/([a-zA-Z0-9_]+)\[([a-zA-Z0-9_]+)\]/);
                    if (idxMatch) variableName = idxMatch[2] || idxMatch[1];
                }
            }
        }

        if (finding?.counterexample || context.counterexample) {
            evidence = ROOT_CAUSE_EVIDENCE.OBSERVED;
            explanation = `Observed failure condition via counterexample on variable '${variableName || 'target'}'`;
        } else if (finding?.severity === 'ERROR' || findingKind.startsWith('DEFINITE')) {
            evidence = ROOT_CAUSE_EVIDENCE.PROVEN;
            explanation = `Statically proven defect at line ${location.line} affecting '${variableName}'`;
        } else {
            explanation = `Potential defect location at line ${location.line} involving '${variableName}'`;
        }

        return new RootCause({
            location,
            finding,
            variableName: variableName || 'x',
            dataflowOrigins: context.dataflow ? [{ line: location.line, var: variableName }] : [],
            dependentDefinitions: [],
            controlDependencies: [],
            symbolicConstraints: [],
            concreteCounterexample: finding?.counterexample || context.counterexample || null,
            evidence,
            explanation,
        });
    }
}
