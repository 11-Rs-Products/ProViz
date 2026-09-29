/**
 * MutationSiteAnalyzer — Scans source code and static analyses to discover valid mutation sites.
 */

import { MutationSite } from './MutationSite.js';
import { MUTATION_OPERATOR_KINDS } from './MutationOperatorKind.js';

export class MutationSiteAnalyzer {
    /**
     * Scan source code for mutation sites.
     *
     * @param {string} sourceCode
     * @param {object} [context={}]
     * @param {string} [context.fileId='main.py']
     * @param {object} [context.coverage=null]
     * @returns {Array<MutationSite>}
     */
    static findSites(sourceCode, context = {}) {
        const fileId = context.fileId || 'main.py';
        const lines = String(sourceCode || '').split('\n');
        const sites = [];

        for (let l = 0; l < lines.length; l++) {
            const lineNum = l + 1;
            const lineText = lines[l];
            const trimmed = lineText.trim();

            if (!trimmed || trimmed.startsWith('#')) continue;

            // 1. Relational operators
            const relOps = ['==', '!=', '<=', '>=', '<', '>'];
            for (const op of relOps) {
                const idx = lineText.indexOf(op);
                if (idx !== -1) {
                    // Check if it's inside quotes or comments
                    sites.push(new MutationSite({
                        fileId,
                        sourceLocation: { line: lineNum, col: idx + 1, endLine: lineNum, endCol: idx + 1 + op.length },
                        operatorKinds: [MUTATION_OPERATOR_KINDS.RELATIONAL, MUTATION_OPERATOR_KINDS.COMPARISON],
                        originalValue: op,
                        coverage: context.coverage,
                    }));
                }
            }

            // 2. Arithmetic operators
            const arithOps = ['+', '-', '*', '/'];
            for (const op of arithOps) {
                // Avoid matching comments, decorators, or multichar tokens
                const regex = new RegExp(`\\s+(\\${op})\\s+`, 'g');
                let match;
                while ((match = regex.exec(lineText)) !== null) {
                    const col = match.index + match[0].indexOf(op) + 1;
                    sites.push(new MutationSite({
                        fileId,
                        sourceLocation: { line: lineNum, col, endLine: lineNum, endCol: col + 1 },
                        operatorKinds: [MUTATION_OPERATOR_KINDS.ARITHMETIC],
                        originalValue: op,
                        coverage: context.coverage,
                    }));
                }
            }

            // 3. Boolean operators (and, or, not)
            const boolMatches = [
                { token: ' and ', op: 'and' },
                { token: ' or ', op: 'or' },
                { token: 'not ', op: 'not' },
            ];
            for (const { token, op } of boolMatches) {
                const idx = lineText.indexOf(token);
                if (idx !== -1) {
                    const col = idx + (token.startsWith(' ') ? 2 : 1);
                    sites.push(new MutationSite({
                        fileId,
                        sourceLocation: { line: lineNum, col, endLine: lineNum, endCol: col + op.length },
                        operatorKinds: [MUTATION_OPERATOR_KINDS.BOOLEAN, MUTATION_OPERATOR_KINDS.NEGATION],
                        originalValue: op,
                        coverage: context.coverage,
                    }));
                }
            }

            // 4. Constants (0, 1, True, False, None)
            const constMatches = [
                { token: 'True', op: 'True' },
                { token: 'False', op: 'False' },
                { token: 'None', op: 'None' },
                { token: ' 0', op: '0' },
                { token: ' 1', op: '1' },
            ];
            for (const { token, op } of constMatches) {
                const idx = lineText.indexOf(token);
                if (idx !== -1) {
                    const col = idx + (token.startsWith(' ') ? 2 : 1);
                    sites.push(new MutationSite({
                        fileId,
                        sourceLocation: { line: lineNum, col, endLine: lineNum, endCol: col + op.length },
                        operatorKinds: [MUTATION_OPERATOR_KINDS.CONSTANT],
                        originalValue: op,
                        coverage: context.coverage,
                    }));
                }
            }

            // 5. Conditional statements (if ...)
            if (trimmed.startsWith('if ')) {
                const col = lineText.indexOf('if ') + 1;
                sites.push(new MutationSite({
                    fileId,
                    sourceLocation: { line: lineNum, col, endLine: lineNum, endCol: col + 2 },
                    operatorKinds: [MUTATION_OPERATOR_KINDS.CONDITIONAL],
                    originalValue: 'if',
                    coverage: context.coverage,
                }));
            }

            // 6. Return statements
            if (trimmed.startsWith('return ')) {
                const col = lineText.indexOf('return ') + 1;
                sites.push(new MutationSite({
                    fileId,
                    sourceLocation: { line: lineNum, col, endLine: lineNum, endCol: lineText.length + 1 },
                    operatorKinds: [MUTATION_OPERATOR_KINDS.RETURN],
                    originalValue: trimmed,
                    coverage: context.coverage,
                }));
            }
        }

        return sites;
    }
}
