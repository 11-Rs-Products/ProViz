/**
 * LayoutConstraint — Declarative spatial relationships and positioning constraints.
 */

export const CONSTRAINT_TYPES = Object.freeze({
    SAME_ROW: 'same_row',
    SAME_COLUMN: 'same_column',
    HORIZONTAL_SEQUENCE: 'horizontal_sequence',
    VERTICAL_SEQUENCE: 'vertical_sequence',
    INSIDE: 'inside',
    OUTSIDE: 'outside',
    NEAR: 'near',
    FAR: 'far',
    ALIGNED: 'aligned',
    CENTERED: 'centered',
    AVOID_OVERLAP: 'avoid_overlap',
    MINIMUM_SPACING: 'minimum_spacing',
    PREFERRED_SPACING: 'preferred_spacing',
    FIXED_POSITION: 'fixed_position',
});

export class LayoutConstraint {
    /**
     * @param {object} params
     * @param {string} [params.id=''] - Constraint identifier
     * @param {string} params.type - One of CONSTRAINT_TYPES
     * @param {string[]} [params.nodes=[]] - Participant node IDs
     * @param {string|null} [params.targetId=null] - Anchor or target node ID
     * @param {number} [params.spacing=2.0] - Desired spacing in world units
     * @param {object} [params.offset] - Desired offset { x, y, z }
     * @param {object} [params.metadata={}] - Arbitrary metadata
     */
    constructor({
        id = '',
        type = CONSTRAINT_TYPES.HORIZONTAL_SEQUENCE,
        nodes = [],
        targetId = null,
        spacing = 2.0,
        offset = null,
        metadata = {},
    }) {
        this.type = type;
        this.nodes = Array.isArray(nodes) ? [...nodes] : [];
        this.targetId = targetId;
        this.spacing = typeof spacing === 'number' ? spacing : 2.0;
        this.offset = { x: 0, y: 0, z: 0, ...(offset || {}) };
        this.id = id || `${type}_${this.nodes.join('_')}_${targetId || 'global'}`;
        this.metadata = { ...metadata };
    }

    clone() {
        return new LayoutConstraint({
            id: this.id,
            type: this.type,
            nodes: [...this.nodes],
            targetId: this.targetId,
            spacing: this.spacing,
            offset: { ...this.offset },
            metadata: { ...this.metadata },
        });
    }

    equals(other) {
        if (!other || !(other instanceof LayoutConstraint)) return false;
        return (
            this.id === other.id &&
            this.type === other.type &&
            this.targetId === other.targetId &&
            this.spacing === other.spacing &&
            JSON.stringify(this.nodes) === JSON.stringify(other.nodes) &&
            JSON.stringify(this.offset) === JSON.stringify(other.offset) &&
            JSON.stringify(this.metadata) === JSON.stringify(other.metadata)
        );
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            nodes: this.nodes,
            targetId: this.targetId,
            spacing: this.spacing,
            offset: this.offset,
            metadata: this.metadata,
        };
    }
}
