/**
 * WorkspaceSnapshot — Immutable snapshot of a Workspace at an exact point in time.
 *
 * Guarantees Historical Trace Integrity:
 * If the user modifies editor source code while a previous execution trace exists,
 * the historical trace remains bound to this immutable WorkspaceSnapshot.
 * Debugging historical traces will never silently display modified source lines.
 */

import { SourceFile } from './SourceFile.js';
import { Module } from './Module.js';
import { ModuleGraph } from './ModuleGraph.js';

export class WorkspaceSnapshot {
    /**
     * @param {object} params
     * @param {string} params.workspaceId - Parent workspace ID
     * @param {number} params.version - Workspace version number at snapshot time
     * @param {string} [params.snapshotId] - Unique snapshot ID
     * @param {Array<SourceFile|object>} [params.files=[]] - Frozen array of source files
     * @param {Array<Module|object>} [params.modules=[]] - Frozen array of modules
     * @param {ModuleGraph|object|null} [params.moduleGraph=null] - Frozen module graph
     * @param {object} [params.metadata={}] - Snapshot metadata
     * @param {number} [params.timestamp] - Snapshot creation timestamp
     */
    constructor({
        workspaceId,
        version = 1,
        snapshotId = null,
        files = [],
        modules = [],
        moduleGraph = null,
        metadata = {},
        timestamp = null,
    } = {}) {
        this.workspaceId = workspaceId ? String(workspaceId) : 'workspace_default';
        this.version = typeof version === 'number' ? version : 1;
        this.timestamp = typeof timestamp === 'number' ? timestamp : Date.now();
        this.snapshotId = snapshotId || `${this.workspaceId}_v${this.version}_${this.timestamp}`;
        this.metadata = Object.freeze({ ...metadata });

        // Freeze files
        this._filesById = new Map();
        this._filesByPath = new Map();
        for (const f of files) {
            const file = f instanceof SourceFile ? f.clone() : new SourceFile(f);
            this._filesById.set(file.id, Object.freeze(file));
            this._filesByPath.set(file.path, file);
        }

        // Freeze modules
        this._modulesById = new Map();
        for (const m of modules) {
            const mod = m instanceof Module ? m.clone() : new Module(m);
            this._modulesById.set(mod.id, Object.freeze(mod));
        }

        // Freeze module graph
        if (moduleGraph instanceof ModuleGraph) {
            this._moduleGraph = moduleGraph.clone();
        } else if (moduleGraph && typeof moduleGraph === 'object') {
            this._moduleGraph = ModuleGraph.fromJSON(moduleGraph);
        } else {
            this._moduleGraph = new ModuleGraph({ modules: Array.from(this._modulesById.values()) });
        }

        Object.freeze(this);
    }

    /**
     * Look up a source file by its stable ID.
     * @param {string} fileId
     * @returns {SourceFile|null}
     */
    getFile(fileId) {
        return this._filesById.get(String(fileId)) || null;
    }

    /**
     * Look up a source file by its path.
     * @param {string} path
     * @returns {SourceFile|null}
     */
    getFileByPath(path) {
        if (!path) return null;
        const target = String(path);
        if (this._filesByPath.has(target)) {
            return this._filesByPath.get(target);
        }
        for (const [p, file] of this._filesByPath.entries()) {
            if (p.endsWith('/' + target) || target.endsWith('/' + p)) {
                return file;
            }
        }
        return null;
    }

    /**
     * Returns an array of all source files in the snapshot.
     * @returns {Array<SourceFile>}
     */
    getFiles() {
        return Array.from(this._filesById.values());
    }

    /**
     * Look up a module by ID.
     * @param {string} moduleId
     * @returns {Module|null}
     */
    getModule(moduleId) {
        return this._modulesById.get(String(moduleId)) || null;
    }

    /**
     * Returns an array of all modules in the snapshot.
     * @returns {Array<Module>}
     */
    getModules() {
        return Array.from(this._modulesById.values());
    }

    /**
     * Returns the module dependency graph.
     * @returns {ModuleGraph}
     */
    getModuleGraph() {
        return this._moduleGraph;
    }

    toJSON() {
        return {
            workspaceId: this.workspaceId,
            version: this.version,
            snapshotId: this.snapshotId,
            timestamp: this.timestamp,
            metadata: this.metadata,
            files: this.getFiles().map(f => f.toJSON()),
            modules: this.getModules().map(m => m.toJSON()),
            moduleGraph: this._moduleGraph.toJSON(),
        };
    }

    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct WorkspaceSnapshot from null/undefined');
        return new WorkspaceSnapshot({
            workspaceId: json.workspaceId,
            version: json.version,
            snapshotId: json.snapshotId,
            timestamp: json.timestamp,
            metadata: json.metadata || {},
            files: (json.files || []).map(f => SourceFile.fromJSON(f)),
            modules: (json.modules || []).map(m => Module.fromJSON(m)),
            moduleGraph: json.moduleGraph ? ModuleGraph.fromJSON(json.moduleGraph) : null,
        });
    }

    /**
     * Creates an immutable snapshot from an active Workspace instance.
     * @param {import('./Workspace.js').Workspace} workspace
     * @returns {WorkspaceSnapshot}
     */
    static fromWorkspace(workspace) {
        if (!workspace) throw new Error('Cannot create snapshot from null workspace');
        return new WorkspaceSnapshot({
            workspaceId: workspace.id,
            version: workspace.version,
            files: workspace.getFiles().map(f => f.clone()),
            modules: workspace.getModules().map(m => m.clone()),
            moduleGraph: workspace.getModuleGraph().clone(),
            metadata: { ...workspace.metadata },
        });
    }
}
