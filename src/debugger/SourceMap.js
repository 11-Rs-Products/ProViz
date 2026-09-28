/**
 * SourceMap — Bidirectional mapping between trace timeline events/frames and Workspace source locations.
 *
 * Responsibilities:
 *  - Resolves any UET event or timeline frame to its exact SourceLocation.
 *  - Indexes events and frames by fileId, path, and line number for O(1) breakpoint checks & stepping.
 *  - Preserves immutable association with the WorkspaceSnapshot captured at execution time.
 */

import { SourceLocation } from '../workspace/SourceLocation.js';

export class SourceMap {
    /**
     * @param {object} [params]
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot|null} [params.workspaceSnapshot=null]
     * @param {object|null} [params.uetTrace=null]
     */
    constructor({ workspaceSnapshot = null, uetTrace = null } = {}) {
        this.workspaceSnapshot = workspaceSnapshot;
        this.uetTrace = uetTrace;

        this._eventLocations = new Map(); // eventId -> SourceLocation
        this._frameLocations = []; // frameIndex -> SourceLocation
        this._fileEvents = new Map(); // fileKey -> Set<eventId>
        this._fileLineEvents = new Map(); // `${fileKey}:${line}` -> Set<eventId>
        this._fileFrames = new Map(); // fileKey -> Set<frameIndex>
        this._fileLineFrames = new Map(); // `${fileKey}:${line}` -> Set<frameIndex>

        if (workspaceSnapshot || uetTrace) {
            this.build(workspaceSnapshot, uetTrace);
        }
    }

    /**
     * Builds mapping indices from a workspace snapshot and UET trace.
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} workspaceSnapshot
     * @param {object} uetTrace
     */
    build(workspaceSnapshot, uetTrace) {
        this.workspaceSnapshot = workspaceSnapshot || this.workspaceSnapshot;
        this.uetTrace = uetTrace || this.uetTrace;

        this._eventLocations.clear();
        this._frameLocations = [];
        this._fileEvents.clear();
        this._fileLineEvents.clear();
        this._fileFrames.clear();
        this._fileLineFrames.clear();

        if (!this.uetTrace || !Array.isArray(this.uetTrace.events)) {
            return;
        }

        const events = this.uetTrace.events;
        let frameIdx = 0;

        for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            const rawSource = ev.source || {};

            let path = rawSource.path || rawSource.file || this.uetTrace.source?.entrypoint || 'main.py';
            let fileId = rawSource.fileId || null;
            let moduleId = rawSource.moduleId || null;
            const line = typeof rawSource.line === 'number' ? rawSource.line : null;
            const column = typeof rawSource.column === 'number' ? rawSource.column : null;

            // Resolve fileId/moduleId from WorkspaceSnapshot if available
            if (this.workspaceSnapshot) {
                const file = this.workspaceSnapshot.getFileByPath(path) || (fileId ? this.workspaceSnapshot.getFile(fileId) : null);
                if (file) {
                    fileId = file.id;
                    path = file.path;
                    if (!moduleId && file.moduleId) {
                        moduleId = file.moduleId;
                    }
                }
            }

            const loc = new SourceLocation({
                fileId,
                moduleId,
                path,
                line,
                column,
            });

            this._eventLocations.set(ev.id, loc);

            // Index by file and file:line for events
            this._indexItem(this._fileEvents, this._fileLineEvents, fileId, path, line, ev.id);

            // If this is an actionable visualization frame event
            if (['line', 'call', 'return', 'exception', 'program_end'].includes(ev.type)) {
                this._frameLocations[frameIdx] = loc;
                this._indexItem(this._fileFrames, this._fileLineFrames, fileId, path, line, frameIdx);
                frameIdx++;
            }
        }
    }

    _indexItem(fileMap, fileLineMap, fileId, path, line, item) {
        const keys = new Set();
        if (fileId) keys.add(fileId);
        if (path) {
            keys.add(path);
            const baseName = path.split(/[\/\\]/).pop();
            if (baseName) keys.add(baseName);
        }

        for (const k of keys) {
            if (!fileMap.has(k)) fileMap.set(k, new Set());
            fileMap.get(k).add(item);

            if (line !== null) {
                const lineKey = `${k}:${line}`;
                if (!fileLineMap.has(lineKey)) fileLineMap.set(lineKey, new Set());
                fileLineMap.get(lineKey).add(item);
            }
        }
    }

    /**
     * Resolves a SourceLocation from an event object or event ID.
     * @param {object|number} eventOrId
     * @returns {SourceLocation}
     */
    getLocation(eventOrId) {
        const eventId = typeof eventOrId === 'number' ? eventOrId : eventOrId?.id;
        if (typeof eventId === 'number' && this._eventLocations.has(eventId)) {
            return this._eventLocations.get(eventId);
        }
        if (eventOrId && typeof eventOrId === 'object' && eventOrId.source) {
            return SourceLocation.from(eventOrId.source);
        }
        return new SourceLocation({ path: 'main.py' });
    }

    /**
     * Resolves a SourceLocation for a 0-indexed timeline frame.
     * @param {number} frameIndex
     * @returns {SourceLocation}
     */
    getFrameLocation(frameIndex) {
        if (typeof frameIndex === 'number' && frameIndex >= 0 && frameIndex < this._frameLocations.length) {
            return this._frameLocations[frameIndex];
        }
        return new SourceLocation({ path: 'main.py' });
    }

    /**
     * Returns all event IDs occurring in the given file.
     * @param {string} fileIdOrPath
     * @returns {Array<number>}
     */
    getEventsForFile(fileIdOrPath) {
        const set = this._fileEvents.get(String(fileIdOrPath));
        return set ? Array.from(set) : [];
    }

    /**
     * Returns all event IDs occurring at file:line.
     * @param {string} fileIdOrPath
     * @param {number} line
     * @returns {Array<number>}
     */
    getEventsForLine(fileIdOrPath, line) {
        const lineKey = `${fileIdOrPath}:${line}`;
        const set = this._fileLineEvents.get(lineKey);
        return set ? Array.from(set) : [];
    }

    /**
     * Returns all timeline frame indices occurring in the given file.
     * @param {string} fileIdOrPath
     * @returns {Array<number>}
     */
    getFramesForFile(fileIdOrPath) {
        const set = this._fileFrames.get(String(fileIdOrPath));
        return set ? Array.from(set) : [];
    }

    /**
     * Returns all timeline frame indices occurring at file:line.
     * @param {string} fileIdOrPath
     * @param {number} line
     * @returns {Array<number>}
     */
    getFramesForLine(fileIdOrPath, line) {
        const lineKey = `${fileIdOrPath}:${line}`;
        const set = this._fileLineFrames.get(lineKey);
        return set ? Array.from(set) : [];
    }

    /**
     * Resolves a SourceFile from the attached WorkspaceSnapshot.
     * @param {string} fileIdOrPath
     * @returns {import('../workspace/SourceFile.js').SourceFile|null}
     */
    resolveFile(fileIdOrPath) {
        if (!this.workspaceSnapshot) return null;
        return this.workspaceSnapshot.getFile(fileIdOrPath) || this.workspaceSnapshot.getFileByPath(fileIdOrPath);
    }

    /**
     * Resolves a Module from the attached WorkspaceSnapshot.
     * @param {string} moduleId
     * @returns {import('../workspace/Module.js').Module|null}
     */
    resolveModule(moduleId) {
        if (!this.workspaceSnapshot) return null;
        return this.workspaceSnapshot.getModule(moduleId);
    }
}
