/**
 * VariableVisualizer — Renders tracked Python variables as 3D blocks.
 *
 * Given a VisualizationFrame, spawns/updates/removes blocks for all variables.
 *  - New variable → ORANGE block, spawns with bounce
 *  - Changed variable → flashes YELLOW then settles to BLUE
 *  - Unchanged variable → stays grey (DEFAULT)
 *
 * Layout: variables are arranged in a horizontal row at the bottom of the scene.
 */

import { BaseVisualizer } from './BaseVisualizer.js';

const ROW_START_X = -5.2;
const ROW_Y       = -3.0;
const COL_SPACING = 3.0;
const MAX_PER_ROW = 4;

export class VariableVisualizer extends BaseVisualizer {
    constructor(scene, group) {
        super(scene, group);
        this._varOrder = []; // tracks insertion order for layout
    }

    /** Called once when a question is loaded to reset state. */
    reset() {
        this.clearAll();
        this._varOrder = [];
    }

    /**
     * Consume a visualization frame and update the 3D scene.
     * @param {object} frame - VisualizationFrame
     * @returns {Promise}
     */
    async consumeFrame(frame) {
        const variables = frame.variables || {};
        const promises   = [];

        // Spawn or update each variable
        for (const [name, info] of Object.entries(variables)) {
            const label   = `${name}=${info.value}`;
            const blockId = `var_${name}`;

            if (!this.blocks[blockId]) {
                // New block
                this._varOrder.push(name);
                const [x, y] = this._getPosition(this._varOrder.length - 1);
                promises.push(this.spawn(blockId, label, 'ORANGE', x, y, 0));
            } else if (info.changed) {
                promises.push(this.update(blockId, label, 'YELLOW'));
            }
            // Unchanged — do nothing (avoids visual noise)
        }

        await Promise.all(promises);

        // Settle changed vars back to a blue color after a short delay
        const settlePromises = [];
        for (const [name, info] of Object.entries(variables)) {
            if (info.changed && !info.is_new) {
                const blockId = `var_${name}`;
                await new Promise(r => setTimeout(r, 300));
                settlePromises.push(this.update(blockId, `${name}=${info.value}`, 'BLUE'));
            }
        }
        await Promise.all(settlePromises);
    }

    _getPosition(idx) {
        const col = idx % MAX_PER_ROW;
        const row = Math.floor(idx / MAX_PER_ROW);
        const x   = ROW_START_X + col * COL_SPACING;
        const y   = ROW_Y - row * 2.0;
        return [x, y];
    }
}
