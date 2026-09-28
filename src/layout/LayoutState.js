/**
 * LayoutState — Immutable, serializable spatial snapshot of all nodes.
 *
 * Provides deterministic bounding box calculations, region groupings, and layout diffs.
 */

import { LayoutNode } from './LayoutNode.js';

export class LayoutState {
    /**
     * @param {object} params
     * @param {number|null} [params.frameIndex=null]
     * @param {LayoutNode[]|Record<string, LayoutNode>|Map<string, LayoutNode>} [params.nodes={}]
     * @param {Record<string, { bounds: object, nodeIds: string[] }>} [params.regions={}]
     * @param {object} [params.metadata={}]
     */
    constructor({
        frameIndex = null,
        nodes = {},
        regions = {},
        metadata = {},
    } = {}) {
        this.frameIndex = frameIndex;
        this.nodes = new Map();
        this.regions = { ...regions };
        this.metadata = { ...metadata };

        if (nodes instanceof Map) {
            for (const [id, node] of nodes.entries()) {
                this.nodes.set(id, node instanceof LayoutNode ? node : new LayoutNode(node));
            }
        } else if (Array.isArray(nodes)) {
            for (const node of nodes) {
                const lNode = node instanceof LayoutNode ? node : new LayoutNode(node);
                this.nodes.set(lNode.id, lNode);
            }
        } else if (nodes && typeof nodes === 'object') {
            for (const [id, node] of Object.entries(nodes)) {
                this.nodes.set(id, node instanceof LayoutNode ? node : new LayoutNode(node));
            }
        }
    }

    /**
     * Total count of laid out nodes.
     * @returns {number}
     */
    get totalNodes() {
        return this.nodes.size;
    }

    getNode(id) {
        return this.nodes.get(id) || null;
    }

    hasNode(id) {
        return this.nodes.has(id);
    }

    getAllNodes() {
        const sortedIds = Array.from(this.nodes.keys()).sort();
        return sortedIds.map(id => this.nodes.get(id));
    }

    getNodesInRegion(regionName) {
        return this.getAllNodes().filter(n => n.region === regionName);
    }

    /**
     * Compute bounding box enclosing all active LayoutNodes.
     * @returns {{ min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number }, size: { x: number, y: number, z: number } }}
     */
    get bounds() {
        if (this.nodes.size === 0) {
            return {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 0, y: 0, z: 0 },
                size: { x: 0, y: 0, z: 0 },
            };
        }

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (const node of this.nodes.values()) {
            const b = node.bounds;
            if (b.min.x < minX) minX = b.min.x;
            if (b.min.y < minY) minY = b.min.y;
            if (b.min.z < minZ) minZ = b.min.z;
            if (b.max.x > maxX) maxX = b.max.x;
            if (b.max.y > maxY) maxY = b.max.y;
            if (b.max.z > maxZ) maxZ = b.max.z;
        }

        return {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ },
            size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
        };
    }

    /**
     * Compare this layout with another to produce spatial differences.
     *
     * @param {LayoutState|null} previousState
     * @returns {{ added: LayoutNode[], removed: LayoutNode[], moved: LayoutNode[], resized: LayoutNode[], unchanged: LayoutNode[] }}
     */
    diff(previousState) {
        const prevNodes = previousState instanceof LayoutState ? previousState.nodes : new Map();
        const currNodes = this.nodes;

        const added = [];
        const removed = [];
        const moved = [];
        const resized = [];
        const unchanged = [];

        const allIds = new Set([...prevNodes.keys(), ...currNodes.keys()]);
        const sortedIds = Array.from(allIds).sort();

        for (const id of sortedIds) {
            const pNode = prevNodes.get(id);
            const cNode = currNodes.get(id);

            if (!pNode && cNode) {
                added.push(cNode.clone());
            } else if (pNode && !cNode) {
                removed.push(pNode.clone());
            } else if (pNode && cNode) {
                const posChanged =
                    pNode.position.x !== cNode.position.x ||
                    pNode.position.y !== cNode.position.y ||
                    pNode.position.z !== cNode.position.z;

                const sizeChanged =
                    pNode.size.x !== cNode.size.x ||
                    pNode.size.y !== cNode.size.y ||
                    pNode.size.z !== cNode.size.z ||
                    pNode.scale.x !== cNode.scale.x ||
                    pNode.scale.y !== cNode.scale.y ||
                    pNode.scale.z !== cNode.scale.z;

                if (posChanged) {
                    moved.push(cNode.clone());
                } else if (sizeChanged) {
                    resized.push(cNode.clone());
                } else {
                    unchanged.push(cNode.clone());
                }
            }
        }

        return { added, removed, moved, resized, unchanged };
    }

    clone() {
        const clonedNodes = new Map();
        for (const [id, node] of this.nodes.entries()) {
            clonedNodes.set(id, node.clone());
        }
        return new LayoutState({
            frameIndex: this.frameIndex,
            nodes: clonedNodes,
            regions: { ...this.regions },
            metadata: { ...this.metadata },
        });
    }

    equals(other) {
        if (!other || !(other instanceof LayoutState)) return false;
        if (this.nodes.size !== other.nodes.size) return false;

        const nodesA = this.getAllNodes();
        const nodesB = other.getAllNodes();

        for (let i = 0; i < nodesA.length; i++) {
            if (!nodesA[i].equals(nodesB[i])) return false;
        }

        return true;
    }

    toJSON() {
        const nodesObj = {};
        for (const node of this.getAllNodes()) {
            nodesObj[node.id] = node.toJSON();
        }

        return {
            frameIndex: this.frameIndex,
            totalNodes: this.totalNodes,
            bounds: this.bounds,
            nodes: nodesObj,
            regions: this.regions,
            metadata: this.metadata,
        };
    }
}
