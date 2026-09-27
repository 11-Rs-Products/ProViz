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
     * Clear all rendered objects.
     */
    clear() {
        if (this.baseVisualizer) {
            this.baseVisualizer.clearAll();
        }
        this.renderedNodes.clear();
    }
}
