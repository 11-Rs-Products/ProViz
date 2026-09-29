/**
 * TransformationBuilder — Builds concrete Transformation objects from RepairHypotheses.
 */

import { Transformation } from './Transformation.js';
import { Patch } from './Patch.js';
import { PatchSet } from './PatchSet.js';

export class TransformationBuilder {
    /**
     * Build a Transformation from structured edits and location.
     *
     * @param {object} params
     * @param {string} params.kind
     * @param {object} params.location - { fileId, line, col }
     * @param {Array<Patch|object>} params.patches
     * @param {string} [params.precondition='']
     * @param {string} [params.expectedEffect='']
     * @returns {Transformation}
     */
    static buildTransformation({
        kind,
        location,
        patches = [],
        precondition = '',
        expectedEffect = '',
    }) {
        const patchObjects = patches.map(p => p instanceof Patch ? p : new Patch(p));
        const patchSet = new PatchSet({ edits: patchObjects });

        return new Transformation({
            kind,
            sourceLocation: location,
            precondition,
            edits: patchSet,
            expectedEffect,
        });
    }

    /**
     * Create an insert transformation before a specific line.
     * @param {object} params
     * @param {string} params.fileId
     * @param {number} params.line
     * @param {string} params.codeToInsert
     * @param {string} params.kind
     * @param {string} [params.expectedEffect]
     * @returns {Transformation}
     */
    static insertBeforeLine({
        fileId = 'main.py',
        line,
        codeToInsert,
        kind = 'GUARD_INSERTION',
        expectedEffect = 'Guard execution',
    }) {
        const patch = new Patch({
            fileId,
            startLine: line,
            startColumn: 1,
            endLine: line,
            endColumn: 1,
            replacement: codeToInsert + '\n',
            originalText: '',
        });

        return this.buildTransformation({
            kind,
            location: { fileId, line, col: 1 },
            patches: [patch],
            expectedEffect,
        });
    }
}
