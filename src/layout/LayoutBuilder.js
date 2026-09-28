/**
 * LayoutBuilder — Integration bridge connecting LayoutEngine to Stage 8 AnimationPlans.
 */

import { LayoutEngine } from './LayoutEngine.js';
import { LayoutState } from './LayoutState.js';
import { AnimationPlan } from '../animation/AnimationPlan.js';
import { AnimationClip, CLIP_CATEGORIES } from '../animation/AnimationClip.js';

export class LayoutBuilder {
    /**
     * @param {object} [config={}]
     */
    constructor(config = {}) {
        this.engine = new LayoutEngine(config);
    }

    /**
     * Compute LayoutState from SceneGraph.
     *
     * @param {import('../scene/SceneGraph.js').SceneGraph} sceneGraph
     * @param {LayoutState|null} [previousLayoutState=null]
     * @param {object} [options={}]
     * @returns {LayoutState}
     */
    build(sceneGraph, previousLayoutState = null, options = {}) {
        return this.engine.layout(sceneGraph, previousLayoutState, options);
    }

    /**
     * Compare two layout states.
     *
     * @param {LayoutState|null} prevState
     * @param {LayoutState|null} nextState
     * @returns {{ added: LayoutNode[], removed: LayoutNode[], moved: LayoutNode[], resized: LayoutNode[], unchanged: LayoutNode[] }}
     */
    diff(prevState, nextState) {
        if (!nextState) {
            return { added: [], removed: [], moved: [], resized: [], unchanged: [] };
        }
        return nextState.diff(prevState);
    }

    /**
     * Convert spatial layout diff into an AnimationPlan.
     *
     * @param {{ moved: LayoutNode[] }} layoutDiff
     * @param {LayoutState} prevState
     * @param {LayoutState} nextState
     * @param {object} [options={}]
     * @returns {AnimationPlan}
     */
    toAnimationPlan(layoutDiff, prevState, nextState, options = {}) {
        const duration = options.duration ?? 0.5;
        const plan = new AnimationPlan({
            fromFrame: prevState?.frameIndex ?? options.fromFrame ?? null,
            toFrame: nextState?.frameIndex ?? options.toFrame ?? null,
            duration,
        });

        if (!layoutDiff || !Array.isArray(layoutDiff.moved)) {
            return plan;
        }

        for (const mNode of layoutDiff.moved) {
            const pNode = prevState?.getNode(mNode.id);
            if (pNode) {
                plan.addClip(new AnimationClip({
                    id: `${mNode.id}_layout_move`,
                    targetId: mNode.id,
                    property: 'transform.position',
                    from: { ...pNode.position },
                    to: { ...mNode.position },
                    duration,
                    easing: 'easeInOut',
                    category: CLIP_CATEGORIES.MOVE,
                }));
            }
        }

        return plan;
    }
}
