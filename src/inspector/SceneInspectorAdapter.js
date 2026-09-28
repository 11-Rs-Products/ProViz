/**
 * SceneInspectorAdapter — Bridges SceneGraph presentation nodes to the ObjectInspector model.
 *
 * Translates SceneGraph node selections (e.g. 'scene_obj_7') into RuntimeState object identities ('obj_7'),
 * allowing 3D canvas selections or SceneGraph node picks to seamlessly update the Object Inspector.
 *
 * Keeps ObjectInspector core 100% decoupled from WebGL/Three.js renderers.
 */

export class SceneInspectorAdapter {
    /**
     * @param {object} params
     * @param {import('./ObjectInspector.js').ObjectInspector} params.inspector - Target ObjectInspector instance
     * @param {import('../scene/SceneGraph.js').SceneGraph|null} [params.sceneGraph=null] - SceneGraph instance
     */
    constructor({ inspector, sceneGraph = null } = {}) {
        if (!inspector) {
            throw new Error('SceneInspectorAdapter requires a valid ObjectInspector instance');
        }
        this.inspector = inspector;
        this.sceneGraph = sceneGraph;
    }

    /**
     * Update the active SceneGraph reference.
     * @param {import('../scene/SceneGraph.js').SceneGraph|null} sceneGraph
     */
    setSceneGraph(sceneGraph) {
        this.sceneGraph = sceneGraph;
    }

    /**
     * Map a SceneNode ID (e.g. 'scene_obj_7') or semanticId to objectId and select it in the inspector.
     *
     * @param {string} sceneNodeIdOrSemanticId
     * @returns {object|null} Object inspection details or null
     */
    selectFromScene(sceneNodeIdOrSemanticId) {
        if (!sceneNodeIdOrSemanticId) return null;

        let objectId = sceneNodeIdOrSemanticId;

        // If a SceneGraph is available, lookup SceneNode to resolve its semanticId
        if (this.sceneGraph && this.sceneGraph.hasNode(sceneNodeIdOrSemanticId)) {
            const node = this.sceneGraph.getNode(sceneNodeIdOrSemanticId);
            objectId = node.semanticId || node.id.replace(/^scene_/, '');
        } else if (sceneNodeIdOrSemanticId.startsWith('scene_')) {
            objectId = sceneNodeIdOrSemanticId.replace(/^scene_/, '');
        }

        return this.inspector.selectObject(objectId);
    }

    /**
     * Find the SceneNode in the current SceneGraph corresponding to a target objectId.
     *
     * @param {string} objectId (e.g. 'obj_7')
     * @returns {import('../scene/SceneNode.js').SceneNode|null}
     */
    getSceneNodeForObject(objectId) {
        if (!this.sceneGraph || !objectId) return null;

        // Try direct scene ID lookup first
        const directId = `scene_${objectId}`;
        if (this.sceneGraph.hasNode(directId)) {
            return this.sceneGraph.getNode(directId);
        }

        // Otherwise search nodes by semanticId
        for (const node of this.sceneGraph.getAllNodes()) {
            if (node.semanticId === objectId) {
                return node;
            }
        }

        return null;
    }

    /**
     * Resolve semantic objectId from a SceneNode ID.
     * @param {string} sceneNodeId
     * @returns {string|null}
     */
    getObjectIdForSceneNode(sceneNodeId) {
        if (!sceneNodeId) return null;
        if (this.sceneGraph && this.sceneGraph.hasNode(sceneNodeId)) {
            const node = this.sceneGraph.getNode(sceneNodeId);
            return node.semanticId || node.id.replace(/^scene_/, '');
        }
        return sceneNodeId.replace(/^scene_/, '');
    }
}
