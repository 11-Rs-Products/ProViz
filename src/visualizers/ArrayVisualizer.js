/**
 * ArrayVisualizer — Renders a Python list/array as a row of 3D blocks with indices.
 *
 * Features:
 *  - Display values horizontally
 *  - Show index labels below each element
 *  - Highlight current element being accessed
 *  - Highlight elements being compared
 *  - Show pointer variables (e.g. `i`, `left`, `right`) as colored indicators above
 */

import { BaseVisualizer } from './BaseVisualizer.js';

const ELEMENT_SPACING = 1.8;
const CENTER_X = 0;
const ARRAY_Y  = 1.4;
const INDEX_Y  = 0.1;
const POINTER_Y = 2.7;

export class ArrayVisualizer extends BaseVisualizer {
    constructor(scene, group) {
        super(scene, group);
        this._arrayName   = null;
        this._arrayValues = [];
        this._pointers    = {}; // varName -> index
    }

    /** Initialize with the array values. Called from question's setupScene. */
    initialize(arrayName, values) {
        this.clearAll();
        this._arrayName   = arrayName;
        this._arrayValues = [...values];
        this._pointers    = {};
        this._renderAll();
    }

    _renderAll() {
        const n = this._arrayValues.length;
        const startX = CENTER_X - ((n - 1) / 2) * ELEMENT_SPACING;

        for (let i = 0; i < n; i++) {
            const x = startX + i * ELEMENT_SPACING;
            // Value block
            this.spawn(`arr_el_${i}`, String(this._arrayValues[i]), 'DEFAULT', x, ARRAY_Y, 0);
            // Index label
            this.spawn(`arr_idx_${i}`, String(i), 'TEAL', x, INDEX_Y, 0);
        }
    }

    /** Consume a visualization frame — look for pointer variable changes. */
    async consumeFrame(frame, pointerVars = []) {
        const variables = frame.variables || {};
        const promises  = [];

        for (const ptrName of pointerVars) {
            const info = variables[ptrName];
            if (!info) continue;
            const idx = parseInt(info.value, 10);
            if (isNaN(idx) || idx < 0 || idx >= this._arrayValues.length) continue;

            const prevIdx = this._pointers[ptrName];
            if (prevIdx !== undefined && prevIdx !== idx) {
                // De-highlight previous
                promises.push(this.highlight(`arr_el_${prevIdx}`, 'DEFAULT'));
            }
            // Highlight new position
            promises.push(this.highlight(`arr_el_${idx}`, 'YELLOW'));
            this._pointers[ptrName] = idx;

            // Show pointer label above array
            const n = this._arrayValues.length;
            const startX = CENTER_X - ((n - 1) / 2) * ELEMENT_SPACING;
            const x = startX + idx * ELEMENT_SPACING;
            const ptrId = `arr_ptr_${ptrName}`;
            if (this.blocks[ptrId]) {
                promises.push(this.move(ptrId, x, POINTER_Y, 0));
                promises.push(this.update(ptrId, ptrName, 'CYAN'));
            } else {
                promises.push(this.spawn(ptrId, ptrName, 'CYAN', x, POINTER_Y, 0));
            }
        }

        await Promise.all(promises);
    }

    /** Update a single element value (e.g. after swap/assignment). */
    async updateElement(idx, newValue, colorKey = 'GREEN') {
        this._arrayValues[idx] = newValue;
        await this.update(`arr_el_${idx}`, String(newValue), colorKey);
    }

    /** Highlight two elements (comparison). */
    async highlightComparison(i, j) {
        await Promise.all([
            this.highlight(`arr_el_${i}`, 'YELLOW'),
            this.highlight(`arr_el_${j}`, 'ORANGE'),
        ]);
    }

    /** Swap two elements with animation. */
    async swapElements(i, j) {
        const posI = this.getPosition(`arr_el_${i}`);
        const posJ = this.getPosition(`arr_el_${j}`);
        if (!posI || !posJ) return;

        await Promise.all([
            this.move(`arr_el_${i}`, posJ.x, posJ.y, posJ.z),
            this.move(`arr_el_${j}`, posI.x, posI.y, posI.z),
        ]);

        // Swap in internal array
        [this._arrayValues[i], this._arrayValues[j]] = [this._arrayValues[j], this._arrayValues[i]];

        // Swap block registry keys
        const tmp = this.blocks[`arr_el_${i}`];
        this.blocks[`arr_el_${i}`] = this.blocks[`arr_el_${j}`];
        this.blocks[`arr_el_${j}`] = tmp;
    }
}
