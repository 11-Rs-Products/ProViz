/**
 * PythonMutationAdapter — Synthesizes concrete Python AST/code mutation patches.
 */

import { LanguageMutationAdapter } from './LanguageMutationAdapter.js';
import { MutationSiteAnalyzer } from './MutationSiteAnalyzer.js';
import { Patch } from '../repair/Patch.js';
import { PatchSet } from '../repair/PatchSet.js';
import { MutationCandidate } from './MutationCandidate.js';
import { MUTATION_OPERATOR_KINDS } from './MutationOperatorKind.js';

export class PythonMutationAdapter extends LanguageMutationAdapter {
    constructor() {
        super('python');
    }

    enumerateMutationSites(sourceCode, context = {}) {
        return MutationSiteAnalyzer.findSites(sourceCode, context);
    }

    /**
     * Build mutation candidates for a given site.
     * @param {import('./MutationSite.js').MutationSite} site
     * @param {string} sourceCode
     * @param {object} [context={}]
     * @returns {Array<MutationCandidate>}
     */
    buildMutations(site, sourceCode, context = {}) {
        const candidates = [];
        const loc = site.sourceLocation;
        const val = site.originalValue;
        const fileId = site.fileId;
        const wsId = context.workspaceSnapshotId || 'snap_default';

        // 1. Relational mutations
        const relMap = {
            '==': ['!='],
            '!=': ['=='],
            '<': ['<=', '>'],
            '<=': ['<', '>='],
            '>': ['>=', '<'],
            '>=': ['>', '<='],
        };
        if (relMap[val]) {
            for (const repl of relMap[val]) {
                const patch = new Patch({
                    fileId,
                    startLine: loc.line,
                    startColumn: loc.col,
                    endLine: loc.endLine || loc.line,
                    endColumn: loc.endCol || (loc.col + val.length),
                    replacement: repl,
                    originalText: val,
                });
                candidates.push(new MutationCandidate({
                    workspaceSnapshotId: wsId,
                    fileId,
                    sourceLocation: loc,
                    operatorId: `OP_REL_${val}_TO_${repl}`,
                    category: MUTATION_OPERATOR_KINDS.RELATIONAL,
                    originalExpression: val,
                    mutatedExpression: repl,
                    patch: new PatchSet({ edits: [patch] }),
                }));
            }
        }

        // 2. Arithmetic mutations
        const arithMap = {
            '+': ['-'],
            '-': ['+'],
            '*': ['/'],
            '/': ['*'],
        };
        if (arithMap[val]) {
            for (const repl of arithMap[val]) {
                const patch = new Patch({
                    fileId,
                    startLine: loc.line,
                    startColumn: loc.col,
                    endLine: loc.endLine || loc.line,
                    endColumn: loc.endCol || (loc.col + val.length),
                    replacement: repl,
                    originalText: val,
                });
                candidates.push(new MutationCandidate({
                    workspaceSnapshotId: wsId,
                    fileId,
                    sourceLocation: loc,
                    operatorId: `OP_ARITH_${val}_TO_${repl}`,
                    category: MUTATION_OPERATOR_KINDS.ARITHMETIC,
                    originalExpression: val,
                    mutatedExpression: repl,
                    patch: new PatchSet({ edits: [patch] }),
                }));
            }
        }

        // 3. Boolean mutations
        const boolMap = {
            'and': ['or'],
            'or': ['and'],
            'not': [''],
        };
        if (boolMap[val]) {
            for (const repl of boolMap[val]) {
                const patch = new Patch({
                    fileId,
                    startLine: loc.line,
                    startColumn: loc.col,
                    endLine: loc.endLine || loc.line,
                    endColumn: loc.endCol || (loc.col + val.length),
                    replacement: repl,
                    originalText: val,
                });
                candidates.push(new MutationCandidate({
                    workspaceSnapshotId: wsId,
                    fileId,
                    sourceLocation: loc,
                    operatorId: `OP_BOOL_${val}_TO_${repl || 'NONE'}`,
                    category: MUTATION_OPERATOR_KINDS.BOOLEAN,
                    originalExpression: val,
                    mutatedExpression: repl,
                    patch: new PatchSet({ edits: [patch] }),
                }));
            }
        }

        // 4. Constant mutations
        const constMap = {
            'True': ['False'],
            'False': ['True'],
            'None': ['0'],
            '0': ['1'],
            '1': ['0'],
        };
        if (constMap[val]) {
            for (const repl of constMap[val]) {
                const patch = new Patch({
                    fileId,
                    startLine: loc.line,
                    startColumn: loc.col,
                    endLine: loc.endLine || loc.line,
                    endColumn: loc.endCol || (loc.col + val.length),
                    replacement: repl,
                    originalText: val,
                });
                candidates.push(new MutationCandidate({
                    workspaceSnapshotId: wsId,
                    fileId,
                    sourceLocation: loc,
                    operatorId: `OP_CONST_${val}_TO_${repl}`,
                    category: MUTATION_OPERATOR_KINDS.CONSTANT,
                    originalExpression: val,
                    mutatedExpression: repl,
                    patch: new PatchSet({ edits: [patch] }),
                }));
            }
        }

        return candidates;
    }
}
