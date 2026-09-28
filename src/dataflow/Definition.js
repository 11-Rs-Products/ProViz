/**
 * Definition — Represents a semantic point where a variable, field, parameter, or collection element is defined/bound.
 */

export class Definition {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.variableName - Variable name or identifier
     * @param {string} [params.targetType] - 'variable' | 'field' | 'element' | 'parameter' | 'return'
     * @param {string|number|null} [params.targetKey] - Key or index (e.g. field name or list index)
     * @param {string|null} [params.objectId] - Associated heap objectId if applicable
     * @param {object|null} [params.value] - Structured runtime Value
     * @param {object|null} [params.sourceLocation] - Location descriptor
     * @param {number} [params.frameIndex] - Frame index where definition occurred
     * @param {string} [params.callFrameId] - Call frame identifier
     * @param {string} [params.scopeId] - Scope ID ('local', 'global')
     * @param {string|null} [params.nodeId] - Associated DataflowNode ID
     * @param {Array<string>} [params.dependencies] - Variable names or node IDs this definition depends on
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        variableName,
        targetType = 'variable',
        targetKey = null,
        objectId = null,
        value = null,
        sourceLocation = null,
        frameIndex = 0,
        callFrameId = 'frame_0',
        scopeId = 'local',
        nodeId = null,
        dependencies = [],
        metadata = {},
    }) {
        if (!variableName) {
            throw new Error('Definition requires a valid variableName');
        }
        this.variableName = variableName;
        this.targetType = targetType;
        this.targetKey = targetKey;
        this.objectId = objectId;
        this.value = value ? { ...value } : null;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.frameIndex = typeof frameIndex === 'number' ? frameIndex : 0;
        this.callFrameId = callFrameId;
        this.scopeId = scopeId;
        this.nodeId = nodeId;
        this.dependencies = Array.isArray(dependencies) ? [...dependencies] : [];
        this.metadata = { ...metadata };

        const fileSlug = String(sourceLocation?.fileId || sourceLocation?.file || 'main').replace(/[^a-zA-Z0-9_]/g, '_');
        const line = sourceLocation?.line ?? 0;
        this.id = id || `df_def_f${this.frameIndex}_${fileSlug}_L${line}_${variableName}`;
    }

    toJSON() {
        return {
            id: this.id,
            variableName: this.variableName,
            targetType: this.targetType,
            targetKey: this.targetKey,
            objectId: this.objectId,
            value: this.value,
            sourceLocation: this.sourceLocation,
            frameIndex: this.frameIndex,
            callFrameId: this.callFrameId,
            scopeId: this.scopeId,
            nodeId: this.nodeId,
            dependencies: this.dependencies,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new Definition(json);
    }
}
