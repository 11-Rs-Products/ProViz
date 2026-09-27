/**
 * SceneGraph — Complete renderer-independent visual presentation graph.
 *
 * Holds the set of semantic SceneNodes and directed SceneRelationships describing
 * the exact visual state of the execution environment at a given step.
 */

import { SceneNode } from './SceneNode.js';
import { SceneRelationship } from './SceneRelationship.js';

export class SceneGraph {
    /**
     * @param {object} [params]
     * @param {Record<string, SceneNode>} [params.nodes={}]
     * @param {Array<SceneRelationship>} [params.relationships=[]]
     * @param {string[]} [params.rootNodes=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        nodes = {},
        relationships = [],
        rootNodes = [],
        metadata = {},
    } = {}) {
        this.nodes = {};
        for (const [id, node] of Object.entries(nodes)) {
            this.nodes[id] = node instanceof SceneNode ? node : new SceneNode(node);
        }

        this.relationships = Array.isArray(relationships)
            ? relationships.map(r => (r instanceof SceneRelationship ? r : new SceneRelationship(r)))
            : [];

        this.rootNodes = Array.isArray(rootNodes) ? [...rootNodes] : [];
        this.metadata = { ...metadata };
    }

    addNode(node) {
        if (!node || !node.id) return;
        const sceneNode = node instanceof SceneNode ? node : new SceneNode(node);
        this.nodes[sceneNode.id] = sceneNode;
        if (!this.rootNodes.includes(sceneNode.id) && !sceneNode.id.includes('__elem_')) {
            this.rootNodes.push(sceneNode.id);
        }
        return sceneNode;
    }

    getNode(id) {
        return this.nodes[id] || null;
    }

    hasNode(id) {
        return Boolean(this.nodes[id]);
    }

    removeNode(id) {
        delete this.nodes[id];
        this.rootNodes = this.rootNodes.filter(nId => nId !== id);
        this.relationships = this.relationships.filter(r => r.fromId !== id && r.toId !== id);
    }

    getAllNodes() {
        return Object.values(this.nodes);
    }

    addRelationship(rel) {
        if (!rel || !rel.fromId || !rel.toId) return;
        const sceneRel = rel instanceof SceneRelationship ? rel : new SceneRelationship(rel);
        this.relationships.push(sceneRel);
        return sceneRel;
    }

    getRelationships() {
        return [...this.relationships];
    }

    getRelationshipsFrom(fromId) {
        return this.relationships.filter(r => r.fromId === fromId);
    }

    getRelationshipsTo(toId) {
        return this.relationships.filter(r => r.toId === toId);
    }

    equals(other) {
        if (!other || !(other instanceof SceneGraph)) return false;

        const keysA = Object.keys(this.nodes).sort();
        const keysB = Object.keys(other.nodes).sort();
        if (keysA.length !== keysB.length) return false;

        for (let i = 0; i < keysA.length; i++) {
            if (keysA[i] !== keysB[i]) return false;
            const nodeA = this.nodes[keysA[i]];
            const nodeB = other.nodes[keysB[i]];
            if (!nodeA.equals(nodeB)) return false;
        }

        if (this.relationships.length !== other.relationships.length) return false;

        for (let i = 0; i < this.relationships.length; i++) {
            const rA = this.relationships[i];
            const hasMatch = other.relationships.some(rB => rA.equals(rB));
            if (!hasMatch) return false;
        }

        return true;
    }

    clone() {
        const clonedNodes = {};
        for (const [id, node] of Object.entries(this.nodes)) {
            clonedNodes[id] = node.clone();
        }

        return new SceneGraph({
            nodes: clonedNodes,
            relationships: this.relationships.map(r => r.clone()),
            rootNodes: [...this.rootNodes],
            metadata: { ...this.metadata },
        });
    }

    toJSON() {
        return {
            nodes: Object.fromEntries(Object.entries(this.nodes).map(([k, v]) => [k, v.toJSON()])),
            relationships: this.relationships.map(r => r.toJSON()),
            rootNodes: this.rootNodes,
            metadata: this.metadata,
        };
    }
}
