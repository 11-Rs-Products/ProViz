/**
 * PatchValidator — Validates patch bounds, original text matches, and workspace revision consistency.
 */

import { PatchSet } from './PatchSet.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';

export class PatchValidator {
    /**
     * Validate a PatchSet against a target WorkspaceSnapshot or source code string.
     *
     * @param {PatchSet|object} patchSet
     * @param {WorkspaceSnapshot|string} target
     * @param {object} [options={}]
     * @param {number} [options.expectedRevision=null]
     * @returns {{ valid: boolean, errors: Array<string> }}
     */
    static validate(patchSet, target, { expectedRevision = null } = {}) {
        const errors = [];
        const patches = patchSet instanceof PatchSet ? patchSet.edits : (patchSet.edits || []);

        if (patches.length === 0) {
            errors.push('PatchSet contains no edits.');
            return { valid: false, errors };
        }

        // 1. Revision consistency check
        if (target instanceof WorkspaceSnapshot) {
            if (expectedRevision !== null && target.version !== expectedRevision) {
                errors.push(`Stale patch revision. Expected version ${expectedRevision}, got ${target.version}`);
            }
        }

        // 2. Overlapping edits check
        for (let i = 0; i < patches.length; i++) {
            for (let j = i + 1; j < patches.length; j++) {
                if (patches[i].conflictsWith && patches[i].conflictsWith(patches[j])) {
                    errors.push(`Conflicting overlapping edits detected between patch ${i} and ${j}`);
                }
            }
        }

        // 3. Range and text match validation
        for (const patch of patches) {
            if (patch.startLine < 1 || patch.startColumn < 1) {
                errors.push(`Invalid line or column index in patch ${patch.patchId}`);
                continue;
            }

            let sourceText = '';
            if (typeof target === 'string') {
                sourceText = target;
            } else if (target instanceof WorkspaceSnapshot) {
                const file = target.getFile(patch.fileId) || target.getFileByPath(patch.fileId);
                if (!file) {
                    errors.push(`Target file ${patch.fileId} not found in workspace snapshot`);
                    continue;
                }
                sourceText = file.content;
            }

            const lines = sourceText.split('\n');
            if (patch.startLine > lines.length) {
                errors.push(`Patch startLine ${patch.startLine} exceeds file length ${lines.length}`);
                continue;
            }

            if (patch.originalText) {
                const actualSlice = this._extractRange(lines, patch.startLine, patch.startColumn, patch.endLine, patch.endColumn);
                if (actualSlice.trim() !== patch.originalText.trim()) {
                    errors.push(`Original text mismatch at line ${patch.startLine}. Expected: "${patch.originalText.trim()}", Found: "${actualSlice.trim()}"`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    static _extractRange(lines, startLine, startCol, endLine, endCol) {
        if (startLine === endLine) {
            const line = lines[startLine - 1] || '';
            return line.slice(startCol - 1, endCol - 1);
        }
        const extracted = [];
        for (let l = startLine; l <= endLine && l <= lines.length; l++) {
            const line = lines[l - 1] || '';
            if (l === startLine) {
                extracted.push(line.slice(startCol - 1));
            } else if (l === endLine) {
                extracted.push(line.slice(0, endCol - 1));
            } else {
                extracted.push(line);
            }
        }
        return extracted.join('\n');
    }
}
