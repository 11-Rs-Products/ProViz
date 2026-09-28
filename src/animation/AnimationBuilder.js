/**
 * AnimationBuilder — Translates a SemanticTransitionPlan into a deterministic AnimationPlan.
 *
 * Responsibilities:
 *  - Maps high-level semantic transition operations into property AnimationTracks and AnimationClips.
 *  - Preserves exact semantic node and relationship identities.
 *  - Supports both forward and reverse animation plan construction.
 *  - Zero Three.js/DOM dependencies.
 */

import { AnimationPlan } from './AnimationPlan.js';
import { AnimationClip, CLIP_CATEGORIES } from './AnimationClip.js';
import { TRANSITION_OP_TYPES } from '../scene/SemanticTransition.js';

export class AnimationBuilder {
    /**
     * @param {object} [options={}]
     * @param {number} [options.defaultDuration=0.5] - Base duration for transitions
     */
    constructor(options = {}) {
        this.defaultDuration = Math.max(0.1, options.defaultDuration || 0.5);
    }

    /**
     * Convert a SemanticTransitionPlan into a forward AnimationPlan.
     *
     * @param {import('../scene/SemanticTransition.js').SemanticTransitionPlan} transitionPlan
     * @param {object} [options={}]
     * @returns {AnimationPlan}
     */
    build(transitionPlan, options = {}) {
        const duration = options.duration ?? this.defaultDuration;
        const fromFrame = transitionPlan?.fromFrame ?? options.fromFrame ?? null;
        const toFrame = transitionPlan?.toFrame ?? options.toFrame ?? null;

        const plan = new AnimationPlan({
            id: options.id || `plan_${fromFrame ?? 'x'}_to_${toFrame ?? 'y'}_forward`,
            fromFrame,
            toFrame,
            direction: 'forward',
            duration,
            operations: transitionPlan?.operations || [],
            metadata: { ...options.metadata, summary: transitionPlan?.summary },
        });

        if (!transitionPlan || transitionPlan.isNoOp) {
            return plan;
        }

        const operations = transitionPlan.operations || [];

        for (const op of operations) {
            const opType = op.type;

            switch (opType) {
                case TRANSITION_OP_TYPES.CREATE_NODE: {
                    const nodeId = op.nodeId;
                    // Appearance: scale 0 -> target scale, opacity 0 -> 1
                    const targetScale = op.transform?.scale || { x: 1, y: 1, z: 1 };
                    plan.addClip(new AnimationClip({
                        id: `${nodeId}_create_scale`,
                        targetId: nodeId,
                        property: 'transform.scale',
                        from: { x: 0, y: 0, z: 0 },
                        to: targetScale,
                        duration,
                        easing: 'easeOut',
                        category: CLIP_CATEGORIES.CREATE,
                    }));
                    plan.addClip(new AnimationClip({
                        id: `${nodeId}_create_opacity`,
                        targetId: nodeId,
                        property: 'style.opacity',
                        from: 0,
                        to: 1,
                        duration: duration * 0.8,
                        easing: 'easeOut',
                        category: CLIP_CATEGORIES.CREATE,
                    }));
                    break;
                }

                case TRANSITION_OP_TYPES.REMOVE_NODE: {
                    const nodeId = op.nodeId;
                    // Disappearance: scale 1 -> 0, opacity 1 -> 0
                    plan.addClip(new AnimationClip({
                        id: `${nodeId}_remove_scale`,
                        targetId: nodeId,
                        property: 'transform.scale',
                        from: { x: 1, y: 1, z: 1 },
                        to: { x: 0, y: 0, z: 0 },
                        duration,
                        easing: 'easeIn',
                        category: CLIP_CATEGORIES.REMOVE,
                    }));
                    plan.addClip(new AnimationClip({
                        id: `${nodeId}_remove_opacity`,
                        targetId: nodeId,
                        property: 'style.opacity',
                        from: 1,
                        to: 0,
                        duration,
                        easing: 'easeIn',
                        category: CLIP_CATEGORIES.REMOVE,
                    }));
                    break;
                }

                case TRANSITION_OP_TYPES.UPDATE_NODE: {
                    const nodeId = op.nodeId;
                    const changes = op.changes || {};

                    if (changes.transform) {
                        const { from, to } = changes.transform;
                        if (from.position && to.position) {
                            plan.addClip(new AnimationClip({
                                id: `${nodeId}_update_position`,
                                targetId: nodeId,
                                property: 'transform.position',
                                from: from.position,
                                to: to.position,
                                duration,
                                easing: 'easeInOut',
                                category: CLIP_CATEGORIES.MOVE,
                            }));
                        }
                        if (from.scale && to.scale) {
                            plan.addClip(new AnimationClip({
                                id: `${nodeId}_update_scale`,
                                targetId: nodeId,
                                property: 'transform.scale',
                                from: from.scale,
                                to: to.scale,
                                duration,
                                easing: 'easeInOut',
                                category: CLIP_CATEGORIES.TRANSFORM,
                            }));
                        }
                    }

                    if (changes.style) {
                        const { from, to } = changes.style;
                        if (from.colorHint !== to.colorHint) {
                            plan.addClip(new AnimationClip({
                                id: `${nodeId}_update_colorHint`,
                                targetId: nodeId,
                                property: 'style.colorHint',
                                from: from.colorHint,
                                to: to.colorHint,
                                duration,
                                category: CLIP_CATEGORIES.STYLE,
                            }));
                        }
                        if (from.emphasis !== to.emphasis) {
                            plan.addClip(new AnimationClip({
                                id: `${nodeId}_update_emphasis`,
                                targetId: nodeId,
                                property: 'style.emphasis',
                                from: from.emphasis,
                                to: to.emphasis,
                                duration,
                                category: CLIP_CATEGORIES.STYLE,
                            }));
                        }
                    }

                    if (changes.value) {
                        plan.addClip(new AnimationClip({
                            id: `${nodeId}_update_value`,
                            targetId: nodeId,
                            property: 'value',
                            from: changes.value.from,
                            to: changes.value.to,
                            duration,
                            category: CLIP_CATEGORIES.VALUE,
                        }));
                    }

                    if (changes.label) {
                        plan.addClip(new AnimationClip({
                            id: `${nodeId}_update_label`,
                            targetId: nodeId,
                            property: 'label',
                            from: changes.label.from,
                            to: changes.label.to,
                            duration,
                            category: CLIP_CATEGORIES.VALUE,
                        }));
                    }
                    break;
                }

                case TRANSITION_OP_TYPES.REBIND_VARIABLE: {
                    const varId = op.variableNodeId;
                    plan.addClip(new AnimationClip({
                        id: `${varId}_rebind_target`,
                        targetId: varId,
                        property: 'relationship.target',
                        from: op.fromTarget,
                        to: op.toTarget,
                        duration,
                        easing: 'easeInOut',
                        category: CLIP_CATEGORIES.RELATIONSHIP,
                    }));
                    // Temporary rebind pulse
                    plan.addClip(new AnimationClip({
                        id: `${varId}_rebind_emphasis`,
                        targetId: varId,
                        property: 'style.emphasis',
                        from: 'active',
                        to: 'default',
                        duration,
                        category: CLIP_CATEGORIES.HIGHLIGHT,
                    }));
                    break;
                }

                case TRANSITION_OP_TYPES.MUTATE_OBJECT: {
                    const objId = op.objectNodeId;
                    // Scale pulse: 1 -> 1.15 -> 1
                    const halfDur = duration * 0.5;
                    plan.addClip(new AnimationClip({
                        id: `${objId}_mutate_pulse_up`,
                        targetId: objId,
                        property: 'transform.scale',
                        from: { x: 1, y: 1, z: 1 },
                        to: { x: 1.15, y: 1.15, z: 1.15 },
                        duration: halfDur,
                        delay: 0,
                        easing: 'easeOut',
                        category: CLIP_CATEGORIES.STRUCTURAL,
                    }));
                    plan.addClip(new AnimationClip({
                        id: `${objId}_mutate_pulse_down`,
                        targetId: objId,
                        property: 'transform.scale',
                        from: { x: 1.15, y: 1.15, z: 1.15 },
                        to: { x: 1, y: 1, z: 1 },
                        duration: halfDur,
                        delay: halfDur,
                        easing: 'easeIn',
                        category: CLIP_CATEGORIES.STRUCTURAL,
                    }));
                    if (op.newLabel) {
                        plan.addClip(new AnimationClip({
                            id: `${objId}_mutate_label`,
                            targetId: objId,
                            property: 'label',
                            from: op.changes?.label?.from || '',
                            to: op.newLabel,
                            duration,
                            category: CLIP_CATEGORIES.VALUE,
                        }));
                    }
                    break;
                }

                case TRANSITION_OP_TYPES.ENTER_FRAME: {
                    const frameId = op.frameNodeId;
                    plan.addClip(new AnimationClip({
                        id: `${frameId}_enter_opacity`,
                        targetId: frameId,
                        property: 'style.opacity',
                        from: 0,
                        to: 1,
                        duration,
                        easing: 'easeOut',
                        category: CLIP_CATEGORIES.LIFECYCLE,
                    }));
                    break;
                }

                case TRANSITION_OP_TYPES.EXIT_FRAME: {
                    const frameId = op.frameNodeId;
                    plan.addClip(new AnimationClip({
                        id: `${frameId}_exit_opacity`,
                        targetId: frameId,
                        property: 'style.opacity',
                        from: 1,
                        to: 0,
                        duration,
                        easing: 'easeIn',
                        category: CLIP_CATEGORIES.LIFECYCLE,
                    }));
                    break;
                }

                case TRANSITION_OP_TYPES.HIGHLIGHT_NODE: {
                    const nodeId = op.nodeId;
                    plan.addClip(new AnimationClip({
                        id: `${nodeId}_highlight`,
                        targetId: nodeId,
                        property: 'style.emphasis',
                        from: 'active',
                        to: 'default',
                        duration,
                        category: CLIP_CATEGORIES.HIGHLIGHT,
                    }));
                    break;
                }

                case TRANSITION_OP_TYPES.ADD_RELATIONSHIP: {
                    const relId = `rel_${op.fromId}_to_${op.toId}`;
                    plan.addClip(new AnimationClip({
                        id: `${relId}_add_opacity`,
                        targetId: relId,
                        property: 'style.opacity',
                        from: 0,
                        to: 1,
                        duration,
                        category: CLIP_CATEGORIES.RELATIONSHIP,
                    }));
                    break;
                }

                case TRANSITION_OP_TYPES.REMOVE_RELATIONSHIP: {
                    const relId = `rel_${op.fromId}_to_${op.toId}`;
                    plan.addClip(new AnimationClip({
                        id: `${relId}_remove_opacity`,
                        targetId: relId,
                        property: 'style.opacity',
                        from: 1,
                        to: 0,
                        duration,
                        category: CLIP_CATEGORIES.RELATIONSHIP,
                    }));
                    break;
                }

                case TRANSITION_OP_TYPES.UPDATE_RELATIONSHIP: {
                    const relId = `rel_${op.fromId}_to_${op.toId}`;
                    if (op.previousToId !== op.toId) {
                        plan.addClip(new AnimationClip({
                            id: `${relId}_target_change`,
                            targetId: relId,
                            property: 'relationship.toId',
                            from: op.previousToId,
                            to: op.toId,
                            duration,
                            category: CLIP_CATEGORIES.RELATIONSHIP,
                        }));
                    }
                    break;
                }
            }
        }

        return plan;
    }

    /**
     * Create a reverse AnimationPlan from a SemanticTransitionPlan.
     *
     * @param {import('../scene/SemanticTransition.js').SemanticTransitionPlan} transitionPlan
     * @param {object} [options={}]
     * @returns {AnimationPlan}
     */
    buildReverse(transitionPlan, options = {}) {
        const forwardPlan = this.build(transitionPlan, options);
        return forwardPlan.reverse();
    }
}
