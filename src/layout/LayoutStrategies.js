/**
 * LayoutStrategies — Modular, deterministic spatial layout algorithms.
 *
 * Implements pure geometric positioning strategies (grid, horizontal, vertical, stack, tree, radial, graph)
 * and automatic semantic strategy selection.
 */

import { NODE_TYPES } from '../scene/SceneNode.js';

export const LAYOUT_STRATEGY_NAMES = Object.freeze({
    AUTO: 'auto',
    GRID: 'grid',
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    STACK: 'stack',
    TREE: 'tree',
    RADIAL: 'radial',
    GRAPH: 'graph',
});

export class LayoutStrategies {
    /**
     * Horizontal sequential layout along X-axis.
     * @param {import('./LayoutNode.js').LayoutNode[]} nodes
     * @param {object} [options={}]
     */
    static horizontal(nodes, options = {}) {
        const startX = options.startX ?? 0;
        const y = options.y ?? 0;
        const z = options.z ?? 0;
        const spacing = options.spacing ?? 2.8;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            node.position.x = startX + i * spacing;
            node.position.y = y;
            node.position.z = z;
        }
    }

    /**
     * Vertical sequential layout along Y-axis.
     * @param {import('./LayoutNode.js').LayoutNode[]} nodes
     * @param {object} [options={}]
     */
    static vertical(nodes, options = {}) {
        const x = options.x ?? 0;
        const startY = options.startY ?? 0;
        const z = options.z ?? 0;
        const spacing = options.spacing ?? 1.8;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            node.position.x = x;
            node.position.y = startY - i * spacing;
            node.position.z = z;
        }
    }

    /**
     * 2D Grid layout.
     * @param {import('./LayoutNode.js').LayoutNode[]} nodes
     * @param {object} [options={}]
     */
    static grid(nodes, options = {}) {
        const cols = options.columns || Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
        const startX = options.startX ?? 0;
        const startY = options.startY ?? 0;
        const spacingX = options.spacingX ?? 2.8;
        const spacingY = options.spacingY ?? 1.8;
        const z = options.z ?? 0;

        for (let i = 0; i < nodes.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const node = nodes[i];
            node.position.x = startX + col * spacingX;
            node.position.y = startY - row * spacingY;
            node.position.z = z;
        }
    }

    /**
     * Stack layout for call frames.
     * @param {import('./LayoutNode.js').LayoutNode[]} nodes
     * @param {object} [options={}]
     */
    static stack(nodes, options = {}) {
        const x = options.x ?? 5.5;
        const startY = options.startY ?? 3.5;
        const spacingY = options.spacingY ?? 1.8;
        const z = options.z ?? 0;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            node.position.x = x;
            node.position.y = startY - i * spacingY;
            node.position.z = z;
        }
    }

    /**
     * Hierarchical Tree layout with cycle protection.
     *
     * @param {import('./LayoutGraph.js').LayoutGraph} layoutGraph
     * @param {string} rootId
     * @param {object} [options={}]
     */
    static tree(layoutGraph, rootId, options = {}) {
        const root = layoutGraph.getNode(rootId);
        if (!root) return;

        const originX = options.originX ?? 0;
        const originY = options.originY ?? 0;
        const levelHeight = options.levelHeight ?? 2.0;
        const siblingSpacing = options.siblingSpacing ?? 2.5;

        // BFS with visited check to prevent cycle loops
        const levels = [];
        const visited = new Set([rootId]);
        let currentLevel = [rootId];

        while (currentLevel.length > 0) {
            levels.push(currentLevel);
            const nextLevel = [];

            for (const id of currentLevel) {
                const children = layoutGraph.getChildren(id);
                for (const childId of children) {
                    if (!visited.has(childId) && layoutGraph.hasNode(childId)) {
                        visited.add(childId);
                        nextLevel.push(childId);
                    }
                }
            }
            currentLevel = nextLevel;
        }

        // Position nodes per level
        for (let lvl = 0; lvl < levels.length; lvl++) {
            const nodeIds = levels[lvl];
            const totalWidth = (nodeIds.length - 1) * siblingSpacing;
            const startX = originX - totalWidth / 2;

            for (let i = 0; i < nodeIds.length; i++) {
                const node = layoutGraph.getNode(nodeIds[i]);
                if (node) {
                    node.position.x = startX + i * siblingSpacing;
                    node.position.y = originY - lvl * levelHeight;
                    node.position.z = 0;
                }
            }
        }
    }

    /**
     * Radial / Circular arrangement around a center point.
     *
     * @param {import('./LayoutGraph.js').LayoutGraph} layoutGraph
     * @param {string[]} nodeIds
     * @param {object} [options={}]
     */
    static radial(layoutGraph, nodeIds, options = {}) {
        const centerX = options.centerX ?? 0;
        const centerY = options.centerY ?? 0;
        const radius = options.radius ?? 3.5;
        const count = nodeIds.length;
        if (count === 0) return;

        const angleStep = (2 * Math.PI) / count;
        for (let i = 0; i < count; i++) {
            const node = layoutGraph.getNode(nodeIds[i]);
            if (node) {
                const angle = i * angleStep;
                node.position.x = centerX + radius * Math.cos(angle);
                node.position.y = centerY + radius * Math.sin(angle);
                node.position.z = 0;
            }
        }
    }

    /**
     * General deterministic graph layout for arbitrary/cyclic structures.
     *
     * @param {import('./LayoutGraph.js').LayoutGraph} layoutGraph
     * @param {string[]} nodeIds
     * @param {object} [options={}]
     */
    static graph(layoutGraph, nodeIds, options = {}) {
        // Deterministic multi-layer ring layout
        const centerX = options.centerX ?? 0;
        const centerY = options.centerY ?? 0;
        const count = nodeIds.length;

        if (count <= 1) {
            const node = layoutGraph.getNode(nodeIds[0]);
            if (node) {
                node.position.x = centerX;
                node.position.y = centerY;
                node.position.z = 0;
            }
            return;
        }

        if (count <= 8) {
            LayoutStrategies.radial(layoutGraph, nodeIds, { centerX, centerY, radius: 2.8 });
        } else {
            // Inner and outer rings
            const innerCount = Math.min(6, Math.floor(count / 2));
            const innerIds = nodeIds.slice(0, innerCount);
            const outerIds = nodeIds.slice(innerCount);

            LayoutStrategies.radial(layoutGraph, innerIds, { centerX, centerY, radius: 2.2 });
            LayoutStrategies.radial(layoutGraph, outerIds, { centerX, centerY, radius: 4.8 });
        }
    }

    /**
     * Automatic strategy selector based on semantic type and topology.
     *
     * @param {import('./LayoutNode.js').LayoutNode} node
     * @param {import('./LayoutGraph.js').LayoutGraph} layoutGraph
     * @returns {string} Strategy name from LAYOUT_STRATEGY_NAMES
     */
    static selectAutoStrategy(node, layoutGraph) {
        if (!node) return LAYOUT_STRATEGY_NAMES.GRID;

        const sType = node.metadata?.type;
        if (sType === NODE_TYPES.CALL_FRAME) {
            return LAYOUT_STRATEGY_NAMES.STACK;
        }

        if (sType === NODE_TYPES.VARIABLE) {
            return LAYOUT_STRATEGY_NAMES.GRID;
        }

        if (sType === NODE_TYPES.OBJECT) {
            const valType = node.metadata?.valueType;
            if (valType === 'list' || valType === 'tuple') {
                return LAYOUT_STRATEGY_NAMES.HORIZONTAL;
            }
            if (valType === 'dict' || valType === 'set') {
                return LAYOUT_STRATEGY_NAMES.GRID;
            }
        }

        // Check if node is part of a cyclic graph
        const neighbors = layoutGraph.getNeighbors(node.id);
        if (neighbors.size > 2) {
            return LAYOUT_STRATEGY_NAMES.GRAPH;
        }

        return LAYOUT_STRATEGY_NAMES.GRID;
    }
}
