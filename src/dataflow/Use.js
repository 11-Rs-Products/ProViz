/**
 * Use — Represents a read/use of a variable, parameter, object field, or collection element.
 */

export class Use {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.variableName - Variable or key read
     * @param {string} [params.targetType] - 'variable' | 'field' | 'element'
     * @param {string|null} [params.objectId] - Associated heap object ID
     * @param {object|null} [params.value] - Structured runtime Value
     * @param {object|null} [params.sourceLocation] - Location descriptor
     * @param {number} [params.frameIndex] - Frame index where use occurred
     * @param {string} [params.callFrameId] - Call frame identifier
     * @param {string} [params.scopeId] - Scope ID
     * @param {string|null} [params.definitionId] - Definition ID this use reads from
     * @param {string|null} [params.nodeId] - Associated DataflowNode ID
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        variableName,
        targetType = 'variable',
        objectId = null,
        value = null,
        sourceLocation = null,
        frameIndex = 0,
        callFrameId = 'frame_0',
        scopeId = 'local',
        definitionId = null,
        nodeId = null,
        metadata = {},
    }) {
        if (!variableName) {
            throw new Error('Use requires a valid variableName');
        }
        this.variableName = variableName;
        this.targetType = targetType;
        this.objectId = objectId;
        this.value = value ? { ...value } : null;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.frameIndex = typeof frameIndex === 'number' ? frameIndex : 0;
        this.callFrameId = callFrameId;
        this.scopeId = scopeId;
        this.definitionId = definitionId;
        this.nodeId = nodeId;
        this.metadata = { ...metadata };

        const fileSlug = String(sourceLocation?.fileId || sourceLocation?.file || 'main').replace(/[^a-zA-Z0-9_]/g, '_');
        const line = sourceLocation?.line ?? 0;
        this.id = id || `df_use_f${this.frameIndex}_${fileSlug}_L${line}_${variableName}`;
    }

    toJSON() {
        return {
            id: this.id,
            variableName: this.variableName,
            targetType: this.targetType,
            objectId: this.objectId,
            value: this.value,
            sourceLocation: this.sourceLocation,
            frameIndex: this.frameIndex,
            callFrameId: this.callFrameId,
            scopeId: this.scopeId,
            definitionId: this.definitionId,
            nodeId: this.nodeId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new Use(json);
    }
}
