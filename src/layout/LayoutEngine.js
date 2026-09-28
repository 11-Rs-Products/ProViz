/**
 * LayoutEngine — Master spatial coordinator mapping SceneGraphs to deterministic LayoutStates.
 *
 * Responsibilities:
 *  - Regional spatial segregation (CallStack, Globals, Heap)
 *  - Stable variable slot allocation
 *  - Incremental layout & position preservation across frames
 *  - Deterministic collision avoidance without physics engines
 *  - Zero Three.js/WebGL/DOM dependencies
 */

import { LayoutNode } from './LayoutNode.js';
import { LayoutGraph } from './LayoutGraph.js';
import { LayoutState } from './LayoutState.js';
import { LayoutStrategies, LAYOUT_STRATEGY_NAMES } from './LayoutStrategies.js';
import { NODE_TYPES } from '../scene/SceneNode.js';

export class LayoutEngine {
    /**
     * @param {object} [config={}]
     * @param {boolean} [config.preservePositions=true] - Preserve positions of unchanged nodes
     * @param {boolean} [config.collisionAvoidance=true] - Detect and resolve bounding box overlaps
     * @param {number} [config.spacing=2.8] - Default spacing
     * @param {number} [config.maxDepth=20] - Maximum recursion safety limit
     */
    constructor(config = {}) {
        this.config = {
            preservePositions: config.preservePositions !== false,
            collisionAvoidance: config.collisionAvoidance !== false,
            spacing: config.spacing || 2.8,
            maxDepth: config.maxDepth || 20,
            regions: {
                Heap: { originX: -4.5, originY: 1.2, spacingX: 3.6, spacingY: 2.2 },
                Globals: { originX: -5.5, originY: -2.6, spacingX: 2.8, spacingY: 1.8 },
                CallStack: { originX: 5.5, originY: 3.5, spacingY: 1.8 },
                ...(config.regions || {}),
            },
        };

        // Stable slot cache for variable positions: scopeName -> Map<varName, slotIndex>
        this.variableSlots = new Map();
    }

    /**
     * Compute deterministic LayoutState for a SceneGraph snapshot.
     *
     * @param {import('../scene/SceneGraph.js').SceneGraph} sceneGraph
     * @param {LayoutState|null} [previousLayoutState=null] - Preceding layout snapshot for incremental stability
     * @param {object} [options={}]
     * @returns {LayoutState} Deterministic spatial snapshot
     */
    layout(sceneGraph, previousLayoutState = null, options = {}) {
        const layoutGraph = LayoutGraph.fromSceneGraph(sceneGraph, this.config);
        const prevNodes = previousLayoutState instanceof LayoutState ? previousLayoutState.nodes : new Map();

        const heapNodes = [];
        const globalVarNodes = [];
        const callFrameNodes = [];
        const frameVarMap = new Map(); // frameId -> LayoutNode[]

        // 1. Group nodes by semantic layer / region
        const allNodes = layoutGraph.getAllNodes();
        for (const node of allNodes) {
            const sType = node.metadata?.type;
            if (sType === NODE_TYPES.CALL_FRAME) {
                callFrameNodes.push(node);
            } else if (sType === NODE_TYPES.VARIABLE) {
                const scope = node.metadata?.scope;
                if (scope === 'global' || node.layer === 'globals') {
                    globalVarNodes.push(node);
                } else {
                    // Extract frameId from parent or nodeId (e.g. scene_var_0_x)
                    const parentId = layoutGraph.parents.get(node.id) || 'default_frame';
                    if (!frameVarMap.has(parentId)) frameVarMap.set(parentId, []);
                    frameVarMap.get(parentId).push(node);
                }
            } else {
                heapNodes.push(node);
            }
        }

        // 2. Position Call Frames (Stack layout)
        const stackConfig = this.config.regions.CallStack;
        for (let i = 0; i < callFrameNodes.length; i++) {
            const frameNode = callFrameNodes[i];
            if (this.config.preservePositions && prevNodes.has(frameNode.id)) {
                const p = prevNodes.get(frameNode.id).position;
                frameNode.position = { ...p };
            } else {
                frameNode.position.x = stackConfig.originX;
                frameNode.position.y = stackConfig.originY - i * stackConfig.spacingY;
                frameNode.position.z = 0;
            }
        }

        // 3. Position Scope / Local Variables (with stable slot allocation)
        for (const [frameId, varNodes] of frameVarMap.entries()) {
            if (!this.variableSlots.has(frameId)) {
                this.variableSlots.set(frameId, new Map());
            }
            const slotMap = this.variableSlots.get(frameId);

            for (const vNode of varNodes) {
                const varName = vNode.metadata?.varName || vNode.id;
                if (!slotMap.has(varName)) {
                    slotMap.set(varName, slotMap.size);
                }
                const slotIdx = slotMap.get(varName);

                if (this.config.preservePositions && prevNodes.has(vNode.id)) {
                    vNode.position = { ...prevNodes.get(vNode.id).position };
                } else {
                    const col = slotIdx % 4;
                    const row = Math.floor(slotIdx / 4);
                    vNode.position.x = this.config.regions.Globals.originX + col * this.config.regions.Globals.spacingX;
                    vNode.position.y = this.config.regions.Globals.originY - row * this.config.regions.Globals.spacingY;
                    vNode.position.z = 0;
                }
            }
        }

        // 4. Position Global Variables (with stable slot allocation)
        if (!this.variableSlots.has('global')) {
            this.variableSlots.set('global', new Map());
        }
        const globalSlotMap = this.variableSlots.get('global');

        for (const gNode of globalVarNodes) {
            const varName = gNode.metadata?.varName || gNode.id;
            if (!globalSlotMap.has(varName)) {
                globalSlotMap.set(varName, globalSlotMap.size);
            }
            const slotIdx = globalSlotMap.get(varName);

            if (this.config.preservePositions && prevNodes.has(gNode.id)) {
                gNode.position = { ...prevNodes.get(gNode.id).position };
            } else {
                const col = slotIdx % 4;
                const row = Math.floor(slotIdx / 4);
                gNode.position.x = this.config.regions.Globals.originX + col * this.config.regions.Globals.spacingX;
                gNode.position.y = this.config.regions.Globals.originY - row * this.config.regions.Globals.spacingY;
                gNode.position.z = 0;
            }
        }

        // 5. Position Heap Objects (Horizontal/Grid sequence in Heap region)
        const heapConfig = this.config.regions.Heap;
        for (let i = 0; i < heapNodes.length; i++) {
            const hNode = heapNodes[i];
            if (this.config.preservePositions && prevNodes.has(hNode.id)) {
                hNode.position = { ...prevNodes.get(hNode.id).position };
            } else {
                hNode.position.x = heapConfig.originX + i * heapConfig.spacingX;
                hNode.position.y = heapConfig.originY;
                hNode.position.z = 0;
            }
        }

        // 6. Collision Avoidance Pass (Deterministic overlap separation)
        if (this.config.collisionAvoidance) {
            this.resolveCollisions(allNodes);
        }

        // 7. Assemble LayoutState snapshot
        const nodeMap = new Map();
        for (const n of allNodes) {
            nodeMap.set(n.id, n);
        }

        return new LayoutState({
            frameIndex: options.frameIndex ?? null,
            nodes: nodeMap,
            regions: {
                Heap: {
                    bounds: { minX: heapConfig.originX, minY: heapConfig.originY },
                    nodeIds: heapNodes.map(n => n.id),
                },
                CallStack: {
                    bounds: { minX: stackConfig.originX, minY: stackConfig.originY },
                    nodeIds: callFrameNodes.map(n => n.id),
                },
                Globals: {
                    bounds: { minX: this.config.regions.Globals.originX, minY: this.config.regions.Globals.originY },
                    nodeIds: globalVarNodes.map(n => n.id),
                },
            },
            metadata: {
                totalNodes: allNodes.length,
                preservePositions: this.config.preservePositions,
                ...options.metadata,
            },
        });
    }

    /**
     * Deterministic collision resolution across active nodes using sweep-line interval pruning.
     *
     * @param {LayoutNode[]} nodes
     */
    resolveCollisions(nodes) {
        if (!Array.isArray(nodes) || nodes.length <= 1) return;

        // 1. Partition by region to avoid comparing across disjoint zones
        const regionMap = new Map();
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const r = n.region || 'default';
            if (!regionMap.has(r)) regionMap.set(r, []);
            regionMap.get(r).push(n);
        }

        // 2. Fast sweep-line collision test per region (O(N log N))
        for (const regionNodes of regionMap.values()) {
            if (regionNodes.length <= 1) continue;

            regionNodes.sort((a, b) => (a.position.x - b.position.x) || a.id.localeCompare(b.id));

            for (let i = 0; i < regionNodes.length; i++) {
                const nodeA = regionNodes[i];
                const bA = nodeA.bounds;

                for (let j = i + 1; j < regionNodes.length; j++) {
                    const nodeB = regionNodes[j];
                    const bB = nodeB.bounds;

                    // If nodeB's left edge is beyond nodeA's right edge + padding, no further nodes can collide with nodeA
                    if (bB.min.x > bA.max.x + 0.2) {
                        break;
                    }

                    if (nodeA.intersects(nodeB, 0.2)) {
                        const shiftX = (bA.max.x - bB.min.x) + 0.5;
                        nodeB.position.x += shiftX;
                    }
                }
            }
        }
    }
}
