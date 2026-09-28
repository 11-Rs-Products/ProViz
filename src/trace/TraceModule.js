/**
 * TraceModule — Module-aware trace summary abstraction.
 *
 * Encapsulates execution trace metadata for a distinct module:
 *  - moduleId: Stable module ID
 *  - name: Module display name
 *  - fileIds: Associated source file IDs
 *  - entryEventId: First UET event ID occurring inside this module
 *  - exitEventId: Last UET event ID occurring inside this module
 *  - eventIds: Array of event IDs belonging to this module
 *  - metadata: Arbitrary runtime metadata
 */

export class TraceModule {
    /**
     * @param {object} params
     * @param {string} params.moduleId - Unique module ID
     * @param {string} [params.name=''] - Display name
     * @param {Array<string>} [params.fileIds=[]] - Source file IDs
     * @param {number|null} [params.entryEventId=null] - First event ID
     * @param {number|null} [params.exitEventId=null] - Last event ID
     * @param {Array<number>} [params.eventIds=[]] - Event IDs in trace
     * @param {object} [params.metadata={}] - Metadata
     */
    constructor({
        moduleId,
        name = '',
        fileIds = [],
        entryEventId = null,
        exitEventId = null,
        eventIds = [],
        metadata = {},
    } = {}) {
        if (!moduleId) {
            throw new Error('TraceModule requires a moduleId');
        }
        this.moduleId = String(moduleId);
        this.name = name || this.moduleId;
        this.fileIds = Array.isArray(fileIds) ? fileIds.map(String) : [];
        this.entryEventId = typeof entryEventId === 'number' ? entryEventId : null;
        this.exitEventId = typeof exitEventId === 'number' ? exitEventId : null;
        this.eventIds = Array.isArray(eventIds) ? [...eventIds] : [];
        this.metadata = { ...metadata };
    }

    /**
     * Records an event ID occurrence in this module.
     * @param {number} eventId
     */
    recordEvent(eventId) {
        if (typeof eventId !== 'number') return;
        this.eventIds.push(eventId);
        if (this.entryEventId === null || eventId < this.entryEventId) {
            this.entryEventId = eventId;
        }
        if (this.exitEventId === null || eventId > this.exitEventId) {
            this.exitEventId = eventId;
        }
    }

    toJSON() {
        return {
            moduleId: this.moduleId,
            name: this.name,
            fileIds: [...this.fileIds],
            entryEventId: this.entryEventId,
            exitEventId: this.exitEventId,
            eventCount: this.eventIds.length,
            metadata: this.metadata,
        };
    }
}
