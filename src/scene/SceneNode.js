/**
 * SceneNode — Renderer-independent semantic node representing a visual entity.
 *
 * Separates Semantic Identity (e.g. runtime object 'obj_1') from Scene Identity ('scene_obj_1')
 * and downstream Three.js Object3D UUIDs.
 */

export const NODE_TYPES = Object.freeze({
    VARIABLE: 'variable',
    OBJECT: 'object',
    PRIMITIVE: 'primitive',
    SCOPE: 'scope',
    CALL_FRAME: 'call_frame',
    CONTAINER: 'container',
});

export class SceneNode {
    /**
     * @param {object} params
     * @param {string} params.id - Unique SceneNode ID (e.g. 'scene_obj_1', 'scene_var_x')
     * @param {string} [params.type='object'] - Node type from NODE_TYPES
     * @param {string} [params.semanticId=''] - Runtime identity (e.g. 'obj_1', 'x', 'frame_1')
     * @param {string} [params.label=''] - Human-readable label
     * @param {any} [params.value=null] - Structured value payload or representation
     * @param {object} [params.transform] - Spatial transform { position: {x,y,z}, rotation: {x,y,z}, scale: {x,y,z} }
     * @param {object} [params.style] - Semantic styling { category, emphasis, visible, colorHint }
     * @param {object} [params.metadata] - Arbitrary non-rendering metadata
     * @param {string[]} [params.children] - Child SceneNode IDs
     */
    constructor({
        id,
        type = NODE_TYPES.OBJECT,
        semanticId = '',
        label = '',
        value = null,
        transform = null,
        style = null,
        metadata = {},
        children = [],
    }) {
        this.id = id;
        this.type = type;
        this.semanticId = semanticId || id;
        this.label = label || '';
        this.value = value ? (typeof value === 'object' ? { ...value } : value) : null;

        this.transform = {
            position: { x: 0, y: 0, z: 0, ...(transform?.position || {}) },
            rotation: { x: 0, y: 0, z: 0, ...(transform?.rotation || {}) },
            scale: { x: 1, y: 1, z: 1, ...(transform?.scale || {}) },
        };

        this.style = {
            category: style?.category || type,
            emphasis: style?.emphasis || 'default',
            visible: style?.visible !== false,
            colorHint: style?.colorHint || null,
        };

        this.metadata = { ...metadata };
        this.children = Array.isArray(children) ? [...children] : [];
    }

    addChild(childId) {
        if (childId && !this.children.includes(childId)) {
            this.children.push(childId);
        }
    }

    removeChild(childId) {
        this.children = this.children.filter(id => id !== childId);
    }

    equals(other) {
        if (!other || !(other instanceof SceneNode)) return false;
        if (
            this.id !== other.id ||
            this.type !== other.type ||
            this.semanticId !== other.semanticId ||
            this.label !== other.label
        ) {
            return false;
        }

        if (JSON.stringify(this.value) !== JSON.stringify(other.value)) return false;
        if (JSON.stringify(this.transform) !== JSON.stringify(other.transform)) return false;
        if (JSON.stringify(this.style) !== JSON.stringify(other.style)) return false;
        if (JSON.stringify(this.metadata) !== JSON.stringify(other.metadata)) return false;
        if (JSON.stringify(this.children) !== JSON.stringify(other.children)) return false;

        return true;
    }

    clone() {
        return new SceneNode({
            id: this.id,
            type: this.type,
            semanticId: this.semanticId,
            label: this.label,
            value: this.value && typeof this.value === 'object' ? { ...this.value } : this.value,
            transform: {
                position: { ...this.transform.position },
                rotation: { ...this.transform.rotation },
                scale: { ...this.transform.scale },
            },
            style: { ...this.style },
            metadata: { ...this.metadata },
            children: [...this.children],
        });
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            semanticId: this.semanticId,
            label: this.label,
            value: this.value,
            transform: this.transform,
            style: this.style,
            metadata: this.metadata,
            children: this.children,
        };
    }
}
