/**
 * SceneRenderer — Presentation bridge translating SceneGraph into Three.js rendering commands.
 *
 * Responsibilities:
 *  - Accepts a pure SceneGraph representation
 *  - Maps SceneNodes to visual 3D mesh instances or group hierarchies
 *  - Operates purely on SceneGraph data without knowledge of Python AST, UET, or RuntimeState.
 */

export class SceneRenderer {
    /**
     * @param {object} params
     * @param {any} [params.scene] - Three.js Scene instance
     * @param {any} [params.group] - Three.js Group instance
     * @param {any} [params.baseVisualizer] - BaseVisualizer instance for block creation
     */
    constructor({ scene = null, group = null, baseVisualizer = null } = {}) {
        this.scene = scene;
        this.group = group;
        this.baseVisualizer = baseVisualizer;
        this.renderedNodes = new Map(); // sceneNodeId -> rendered mesh/block ID
    }

    /**
     * Render or synchronize the 3D scene from a SceneGraph.
     *
     * @param {import('../scene/SceneGraph.js').SceneGraph} sceneGraph
     * @returns {Promise<void>}
     */
    async render(sceneGraph) {
        if (!sceneGraph || !this.baseVisualizer) {
            return;
        }

        const currentNodes = sceneGraph.getAllNodes();
        const activeIds = new Set(currentNodes.map(n => n.id));

        // 1. Remove nodes no longer present in the SceneGraph
        for (const [nodeId, blockId] of this.renderedNodes.entries()) {
            if (!activeIds.has(nodeId)) {
                await this.baseVisualizer.remove(blockId);
                this.renderedNodes.delete(nodeId);
            }
        }

        // 2. Spawn or update active SceneNodes
        const promises = [];
        for (const node of currentNodes) {
            const blockId = `vis_${node.id}`;
            const colorKey = node.style?.colorHint || 'DEFAULT';
            const { x, y, z } = node.transform.position;

            if (!this.renderedNodes.has(node.id)) {
                this.renderedNodes.set(node.id, blockId);
                promises.push(this.baseVisualizer.spawn(blockId, node.label, colorKey, x, y, z));
            } else {
                promises.push(this.baseVisualizer.update(blockId, node.label, colorKey));
            }
        }

        await Promise.all(promises);
    }

    /**
     * Apply a SemanticTransitionPlan or SceneDiff incrementally to the 3D visualizer.
     *
     * @param {import('../scene/SemanticTransition.js').SemanticTransitionPlan|import('../scene/SceneDiff.js').SceneDiff} plan
     * @returns {Promise<void>}
     */
    async applyTransitionPlan(plan) {
        if (!plan || !this.baseVisualizer) {
            return;
        }

        // Handle raw SceneDiff if passed
        const operations = plan.operations || [];
        const promises = [];

        for (const op of operations) {
            const nodeId = op.nodeId || op.objectNodeId || op.variableNodeId || op.frameNodeId;
            if (!nodeId) continue;

            if (op.type === 'remove_node' || op.type === 'exit_frame') {
                const blockId = this.renderedNodes.get(nodeId);
                if (blockId) {
                    promises.push(this.baseVisualizer.remove(blockId));
                    this.renderedNodes.delete(nodeId);
                }
            } else if (op.type === 'create_node' || op.type === 'enter_frame') {
                const blockId = `vis_${nodeId}`;
                const colorKey = op.style?.colorHint || 'DEFAULT';
                const { x = 0, y = 0, z = 0 } = op.transform?.position || {};
                this.renderedNodes.set(nodeId, blockId);
                promises.push(this.baseVisualizer.spawn(blockId, op.label || nodeId, colorKey, x, y, z));
            } else if (op.type === 'update_node' || op.type === 'mutate_object' || op.type === 'rebind_variable') {
                const blockId = this.renderedNodes.get(nodeId);
                if (blockId) {
                    const colorKey = op.style?.colorHint || 'DEFAULT';
                    promises.push(this.baseVisualizer.update(blockId, op.label || op.newLabel || nodeId, colorKey));
                }
            }
        }

        await Promise.all(promises);
    }

    /**
     * Alias for applyTransitionPlan.
     *
     * @param {import('../scene/SemanticTransition.js').SemanticTransitionPlan|object} transition
     * @returns {Promise<void>}
     */
    async applyTransition(transition) {
        return this.applyTransitionPlan(transition);
    }

    /**
     * Apply an evaluated AnimationState snapshot to the rendered 3D scene.
     *
     * @param {import('../animation/AnimationState.js').AnimationState|object} state
     * @returns {Promise<void>}
     */
    async applyAnimationState(state) {
        if (!state || !this.baseVisualizer) {
            return;
        }

        const nodeStates = state.nodeStates || {};
        const promises = [];

        for (const [nodeId, nState] of Object.entries(nodeStates)) {
            const blockId = this.renderedNodes.get(nodeId);
            const label = nState.label || nodeId;
            const colorKey = nState.style?.colorHint || 'DEFAULT';

            if (blockId) {
                // If opacity is 0 or scale is near 0 after removal
                if (nState.style?.opacity === 0 || (nState.transform?.scale?.x === 0 && nState.transform?.scale?.y === 0)) {
                    // Node disappearing
                    if (state.isComplete) {
                        promises.push(this.baseVisualizer.remove(blockId));
                        this.renderedNodes.delete(nodeId);
                        continue;
                    }
                }
                promises.push(this.baseVisualizer.update(blockId, label, colorKey));
            } else if (nState.style?.opacity > 0 && !nState.id?.startsWith('scene_rel_')) {
                // Spawn appearing node
                const newBlockId = `vis_${nodeId}`;
                const pos = nState.transform?.position || { x: 0, y: 0, z: 0 };
                this.renderedNodes.set(nodeId, newBlockId);
                promises.push(this.baseVisualizer.spawn(newBlockId, label, colorKey, pos.x, pos.y, pos.z));
            }
        }

        await Promise.all(promises);
    }

    /**
     * Apply an AnimationPlan directly to the renderer by seeking to completion.
     *
     * @param {import('../animation/AnimationPlan.js').AnimationPlan} plan
     * @returns {Promise<void>}
     */
    async applyAnimationPlan(plan) {
        if (!plan) return;
        // Apply raw operations if present
        if (plan.operations && plan.operations.length > 0) {
            await this.applyTransitionPlan({ operations: plan.operations });
        }
    }

    /**
     * Reset active animation state on the renderer.
     */
    clearAnimation() {
        // Safe no-op or clear tracking
    }

    /**
     * Apply a LayoutState to synchronize rendered mesh positions in the 3D visualizer.
     *
     * @param {import('../layout/LayoutState.js').LayoutState} layoutState
     * @returns {Promise<void>}
     */
    async applyLayout(layoutState) {
        if (!layoutState || !this.baseVisualizer) {
            return;
        }

        this.currentLayoutState = layoutState;
        const nodes = typeof layoutState.getAllNodes === 'function' ? layoutState.getAllNodes() : Object.values(layoutState.nodes || {});
        const promises = [];

        for (const node of nodes) {
            const blockId = this.renderedNodes.get(node.id);
            if (blockId) {
                const colorKey = node.metadata?.colorHint || 'DEFAULT';
                const label = node.metadata?.label || node.id;
                promises.push(this.baseVisualizer.update(blockId, label, colorKey));
            }
        }

        await Promise.all(promises);
    }

    /**
     * Return currently applied LayoutState.
     * @returns {import('../layout/LayoutState.js').LayoutState|null}
     */
    getLayoutState() {
        return this.currentLayoutState || null;
    }

    /**
     * Clear cached layout state.
     */
    clearLayout() {
        this.currentLayoutState = null;
    }

    /**
     * Clear all rendered objects.
     */
    clear() {
        if (this.baseVisualizer) {
            this.baseVisualizer.clearAll();
        }
        this.renderedNodes.clear();
    }
}
