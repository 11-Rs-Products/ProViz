/**
 * LayoutNode — Renderer-independent spatial representation of a SceneNode.
 *
 * Defines absolute 3D position, rotation, scale, bounding box, and layout region.
 * Contains zero Three.js, WebGL, or DOM dependencies.
 */

export class LayoutNode {
    /**
     * @param {object} params
     * @param {string} params.id - Matches SceneNode ID (e.g. 'scene_obj_1', 'scene_var_0_x')
     * @param {object} [params.position] - Spatial coordinates { x, y, z }
     * @param {object} [params.rotation] - Rotation Euler { x, y, z }
     * @param {object} [params.scale] - Scale vector { x, y, z }
     * @param {object} [params.size] - Bounding dimensions { x, y, z }
     * @param {string|null} [params.parentId=null] - Parent layout container ID
     * @param {number} [params.depth=0] - Hierarchy depth
     * @param {string} [params.layer='default'] - Visual layer ('heap', 'stack', 'globals')
     * @param {string} [params.region='default'] - Region name
     * @param {object} [params.metadata={}] - Derived layout metadata
     */
    constructor({
        id,
        position = null,
        rotation = null,
        scale = null,
        size = null,
        parentId = null,
        depth = 0,
        layer = 'default',
        region = 'default',
        metadata = {},
    }) {
        this.id = id;
        this.position = { x: 0, y: 0, z: 0, ...(position || {}) };
        this.rotation = { x: 0, y: 0, z: 0, ...(rotation || {}) };
        this.scale = { x: 1, y: 1, z: 1, ...(scale || {}) };
        this.size = { x: 2.0, y: 1.0, z: 1.0, ...(size || {}) };
        this.parentId = parentId;
        this.depth = Math.max(0, depth);
        this.layer = layer;
        this.region = region;
        this.metadata = { ...metadata };
    }

    /**
     * Compute axis-aligned bounding box for collision detection.
     * @returns {{ min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } }}
     */
    get bounds() {
        const halfX = (this.size.x * this.scale.x) / 2;
        const halfY = (this.size.y * this.scale.y) / 2;
        const halfZ = (this.size.z * this.scale.z) / 2;

        return {
            min: {
                x: this.position.x - halfX,
                y: this.position.y - halfY,
                z: this.position.z - halfZ,
            },
            max: {
                x: this.position.x + halfX,
                y: this.position.y + halfY,
                z: this.position.z + halfZ,
            },
        };
    }

    /**
     * Check if this node's bounding box intersects with another node.
     *
     * @param {LayoutNode} other
     * @param {number} [padding=0.1] - Minimum clearance padding
     * @returns {boolean}
     */
    intersects(other, padding = 0.1) {
        if (!other || other.id === this.id) return false;
        const bA = this.bounds;
        const bB = other.bounds;

        const overlapX = bA.min.x - padding <= bB.max.x && bA.max.x + padding >= bB.min.x;
        const overlapY = bA.min.y - padding <= bB.max.y && bA.max.y + padding >= bB.min.y;
        const overlapZ = bA.min.z - padding <= bB.max.z && bA.max.z + padding >= bB.min.z;

        return overlapX && overlapY && overlapZ;
    }

    clone() {
        return new LayoutNode({
            id: this.id,
            position: { ...this.position },
            rotation: { ...this.rotation },
            scale: { ...this.scale },
            size: { ...this.size },
            parentId: this.parentId,
            depth: this.depth,
            layer: this.layer,
            region: this.region,
            metadata: { ...this.metadata },
        });
    }

    equals(other) {
        if (!other || !(other instanceof LayoutNode)) return false;
        return (
            this.id === other.id &&
            this.parentId === other.parentId &&
            this.depth === other.depth &&
            this.layer === other.layer &&
            this.region === other.region &&
            JSON.stringify(this.position) === JSON.stringify(other.position) &&
            JSON.stringify(this.rotation) === JSON.stringify(other.rotation) &&
            JSON.stringify(this.scale) === JSON.stringify(other.scale) &&
            JSON.stringify(this.size) === JSON.stringify(other.size) &&
            JSON.stringify(this.metadata) === JSON.stringify(other.metadata)
        );
    }

    toJSON() {
        return {
            id: this.id,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            size: this.size,
            bounds: this.bounds,
            parentId: this.parentId,
            depth: this.depth,
            layer: this.layer,
            region: this.region,
            metadata: this.metadata,
        };
    }
}
