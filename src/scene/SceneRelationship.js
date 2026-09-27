/**
 * SceneRelationship — Represents a semantic edge or relationship between two SceneNodes.
 *
 * Supported relationship types:
 *  - 'references': Variable or object references another heap object
 *  - 'contains': Frame/scope contains a variable, or collection contains elements
 *  - 'element_of': Collection element relationship
 *  - 'points_to': Pointer or index reference
 *  - 'calls': Call frame relationship
 *  - 'owns': Scope or instance ownership
 */

export const RELATIONSHIP_TYPES = Object.freeze({
    REFERENCES: 'references',
    CONTAINS: 'contains',
    ELEMENT_OF: 'element_of',
    POINTS_TO: 'points_to',
    CALLS: 'calls',
    OWNS: 'owns',
});

export class SceneRelationship {
    /**
     * @param {object} params
     * @param {string} params.fromId - Source SceneNode ID
     * @param {string} params.toId - Target SceneNode ID
     * @param {string} [params.type='references'] - Relationship type from RELATIONSHIP_TYPES
     * @param {string} [params.label=''] - Optional semantic label (e.g. key name, index, argument name)
     * @param {object} [params.metadata={}] - Semantic edge metadata
     */
    constructor({
        fromId,
        toId,
        type = RELATIONSHIP_TYPES.REFERENCES,
        label = '',
        metadata = {},
    }) {
        this.fromId = fromId;
        this.toId = toId;
        this.type = type;
        this.label = label || '';
        this.metadata = { ...metadata };
    }

    equals(other) {
        if (!other || !(other instanceof SceneRelationship)) return false;
        return (
            this.fromId === other.fromId &&
            this.toId === other.toId &&
            this.type === other.type &&
            this.label === other.label &&
            JSON.stringify(this.metadata) === JSON.stringify(other.metadata)
        );
    }

    clone() {
        return new SceneRelationship({
            fromId: this.fromId,
            toId: this.toId,
            type: this.type,
            label: this.label,
            metadata: { ...this.metadata },
        });
    }

    toJSON() {
        return {
            fromId: this.fromId,
            toId: this.toId,
            type: this.type,
            label: this.label,
            metadata: this.metadata,
        };
    }
}
