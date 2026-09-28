/**
 * Workspace — Owns all source files and module graph definitions for an executable program.
 *
 * Responsibilities:
 *  - Maintains collection of SourceFiles with stable file IDs.
 *  - Manages Module definitions and ModuleGraph relationships.
 *  - Tracks Workspace versioning across edits (version 1 -> version 2 -> ...).
 *  - Produces immutable WorkspaceSnapshots for deterministic historical debugging.
 *  - Language-agnostic, serializable, and independent of UI/editor DOM.
 */

import { SourceFile } from './SourceFile.js';
import { Module } from './Module.js';
import { ModuleGraph } from './ModuleGraph.js';
import { WorkspaceSnapshot } from './WorkspaceSnapshot.js';

export class Workspace {
    /**
     * @param {object} [params]
     * @param {string} [params.id='workspace_default'] - Workspace identifier
     * @param {number} [params.version=1] - Version counter
     * @param {Array<SourceFile|object>} [params.files=[]] - Initial files
     * @param {Array<Module|object>} [params.modules=[]] - Initial modules
     * @param {ModuleGraph|object|null} [params.moduleGraph=null] - Module graph
     * @param {object} [params.metadata={}] - Arbitrary metadata
     */
    constructor({
        id = 'workspace_default',
        version = 1,
        files = [],
        modules = [],
        moduleGraph = null,
        metadata = {},
    } = {}) {
        this.id = String(id);
        this.version = typeof version === 'number' ? version : 1;
        this.metadata = { ...metadata };

        this._files = new Map(); // fileId -> SourceFile
        this._filesByPath = new Map(); // path -> fileId
        this._moduleGraph = moduleGraph instanceof ModuleGraph
            ? moduleGraph
            : (moduleGraph ? ModuleGraph.fromJSON(moduleGraph) : new ModuleGraph());

        for (const m of modules) {
            this.addModule(m);
        }

        for (const f of files) {
            this.addFile(f);
        }
    }

    /**
     * Adds a source file to the workspace.
     * @param {SourceFile|object} file
     * @returns {SourceFile} Added SourceFile instance
     */
    addFile(file) {
        let sourceFile;
        if (file instanceof SourceFile) {
            sourceFile = file;
        } else if (file && typeof file === 'object') {
            const fileId = file.id || `file_${file.path ? file.path.replace(/[^a-zA-Z0-9_]/g, '_') : this._files.size + 1}`;
            sourceFile = new SourceFile({ ...file, id: fileId });
        } else {
            throw new Error('Invalid file passed to addFile');
        }

        this._files.set(sourceFile.id, sourceFile);
        this._filesByPath.set(sourceFile.path, sourceFile.id);

        // Auto-associate with module if moduleId specified
        if (sourceFile.moduleId) {
            let mod = this.getModule(sourceFile.moduleId);
            if (!mod) {
                mod = this.addModule(new Module({
                    id: sourceFile.moduleId,
                    name: sourceFile.name,
                    path: sourceFile.path,
                    language: sourceFile.language,
                }));
            }
            mod.addFileId(sourceFile.id);
        }

        return sourceFile;
    }

    /**
     * Removes a source file by ID.
     * @param {string} fileId
     * @returns {boolean} True if removed
     */
    removeFile(fileId) {
        const id = String(fileId);
        const file = this._files.get(id);
        if (!file) return false;

        this._files.delete(id);
        this._filesByPath.delete(file.path);

        if (file.moduleId) {
            const mod = this.getModule(file.moduleId);
            if (mod) mod.removeFileId(id);
        }

        this.version += 1;
        return true;
    }

    /**
     * Updates the content of an existing source file and increments workspace version.
     * @param {string} fileId
     * @param {string} newContent
     * @returns {SourceFile}
     */
    updateFile(fileId, newContent) {
        const file = this.getFile(fileId);
        if (!file) {
            throw new Error(`File with id "${fileId}" not found in workspace`);
        }
        file.updateContent(newContent);
        this.version += 1;
        return file;
    }

    /**
     * Retrieves a file by its ID.
     * @param {string} fileId
     * @returns {SourceFile|null}
     */
    getFile(fileId) {
        return this._files.get(String(fileId)) || null;
    }

    /**
     * Retrieves a file by its path or file name.
     * @param {string} path
     * @returns {SourceFile|null}
     */
    getFileByPath(path) {
        if (!path) return null;
        const target = String(path);
        const fileId = this._filesByPath.get(target);
        if (fileId && this._files.has(fileId)) {
            return this._files.get(fileId);
        }

        // Fuzzy search for partial/relative paths
        for (const [p, id] of this._filesByPath.entries()) {
            if (p === target || p.endsWith('/' + target) || target.endsWith('/' + p)) {
                return this._files.get(id) || null;
            }
        }

        return null;
    }

    /**
     * Returns an array of all source files in the workspace.
     * @returns {Array<SourceFile>}
     */
    getFiles() {
        return Array.from(this._files.values());
    }

    /**
     * Checks if a file ID exists in the workspace.
     * @param {string} fileId
     * @returns {boolean}
     */
    hasFile(fileId) {
        return this._files.has(String(fileId));
    }

    /**
     * Adds a module to the workspace and module graph.
     * @param {Module|object} module
     * @returns {Module}
     */
    addModule(module) {
        return this._moduleGraph.addModule(module);
    }

    /**
     * Removes a module by ID.
     * @param {string} moduleId
     * @returns {boolean}
     */
    removeModule(moduleId) {
        return this._moduleGraph.removeModule(moduleId);
    }

    /**
     * Retrieves a module by ID.
     * @param {string} moduleId
     * @returns {Module|null}
     */
    getModule(moduleId) {
        return this._moduleGraph.getModule(moduleId);
    }

    /**
     * Returns an array of all modules in the workspace.
     * @returns {Array<Module>}
     */
    getModules() {
        return this._moduleGraph.getModules();
    }

    /**
     * Returns the underlying ModuleGraph.
     * @returns {ModuleGraph}
     */
    getModuleGraph() {
        return this._moduleGraph;
    }

    /**
     * Creates an immutable snapshot of the current workspace state.
     * @returns {WorkspaceSnapshot}
     */
    createSnapshot() {
        return WorkspaceSnapshot.fromWorkspace(this);
    }

    clone() {
        return new Workspace({
            id: this.id,
            version: this.version,
            files: this.getFiles().map(f => f.clone()),
            modules: this.getModules().map(m => m.clone()),
            moduleGraph: this._moduleGraph.clone(),
            metadata: { ...this.metadata },
        });
    }

    toJSON() {
        return {
            id: this.id,
            version: this.version,
            metadata: this.metadata,
            files: this.getFiles().map(f => f.toJSON()),
            modules: this.getModules().map(m => m.toJSON()),
            moduleGraph: this._moduleGraph.toJSON(),
        };
    }

    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct Workspace from null/undefined');
        return new Workspace({
            id: json.id,
            version: json.version || 1,
            metadata: json.metadata || {},
            files: (json.files || []).map(f => SourceFile.fromJSON(f)),
            modules: (json.modules || []).map(m => Module.fromJSON(m)),
            moduleGraph: json.moduleGraph ? ModuleGraph.fromJSON(json.moduleGraph) : null,
        });
    }

    /**
     * Convenience factory to build a Workspace from a files dictionary.
     * Example: Workspace.fromFiles({ 'main.py': 'import utils', 'utils.py': 'x = 10' })
     *
     * @param {Record<string, string>} filesMap
     * @param {object} [options]
     * @returns {Workspace}
     */
    static fromFiles(filesMap = {}, options = {}) {
        const ws = new Workspace({
            id: options.id || 'workspace_default',
            version: 1,
            metadata: options.metadata || {},
        });

        for (const [path, content] of Object.entries(filesMap)) {
            const cleanPath = String(path);
            const baseName = SourceFile._extractBaseName(cleanPath);
            const fileId = `file_${cleanPath.replace(/[^a-zA-Z0-9_]/g, '_')}`;
            const modId = `module_${baseName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_')}`;

            ws.addFile(new SourceFile({
                id: fileId,
                path: cleanPath,
                name: baseName,
                language: options.language || 'python',
                content: typeof content === 'string' ? content : String(content || ''),
                moduleId: modId,
            }));
        }

        return ws;
    }
}
