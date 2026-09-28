/**
 * ModuleDebugger — Multi-file and module-aware debugging orchestrator.
 *
 * Provides module and workspace awareness around the central Debugger controller:
 *  - Resolves active SourceFile and Module at current frame.
 *  - Manages cross-file and per-file breakpoints.
 *  - Provides enriched call stack views carrying module ownership and source locations.
 *  - Preserves immutable WorkspaceSnapshot for historical trace stability.
 *  - Does NOT duplicate debugger state machine logic; Debugger remains authoritative.
 */

import { Debugger } from './Debugger.js';
import { SourceMap } from './SourceMap.js';
import { Workspace } from '../workspace/Workspace.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';
import { SourceLocation } from '../workspace/SourceLocation.js';

export class ModuleDebugger {
    /**
     * @param {object} [params]
     * @param {Debugger} [params.debuggerInstance] - Underlying Debugger instance
     * @param {Workspace|WorkspaceSnapshot|null} [params.workspace=null] - Program Workspace or Snapshot
     */
    constructor({ debuggerInstance = null, workspace = null } = {}) {
        this.debugger = debuggerInstance || new Debugger();
        this._workspace = null;
        this._workspaceSnapshot = null;
        this._sourceMap = new SourceMap();

        if (workspace) {
            this.setWorkspace(workspace);
        }
    }

    /**
     * Set the current workspace or workspace snapshot.
     * @param {Workspace|WorkspaceSnapshot} workspace
     */
    setWorkspace(workspace) {
        if (workspace instanceof WorkspaceSnapshot) {
            this._workspaceSnapshot = workspace;
            this._workspace = null;
        } else if (workspace instanceof Workspace) {
            this._workspace = workspace;
            this._workspaceSnapshot = workspace.createSnapshot();
        } else if (workspace && typeof workspace === 'object') {
            this._workspace = Workspace.fromJSON(workspace);
            this._workspaceSnapshot = this._workspace.createSnapshot();
        }

        if (this.debugger._uetTrace) {
            this._sourceMap.build(this._workspaceSnapshot, this.debugger._uetTrace);
        }
    }

    /**
     * Load an execution trace with optional associated Workspace or Snapshot.
     * @param {object} input - UET trace or ExecutionRequest
     * @param {Workspace|WorkspaceSnapshot|object} [workspace=null]
     * @param {object} [problemConfig={}]
     * @returns {import('./DebuggerState.js').DebuggerState}
     */
    loadExecution(input, workspace = null, problemConfig = {}) {
        if (workspace) {
            this.setWorkspace(workspace);
        } else if (!this._workspaceSnapshot && !this._workspace && input?.source?.files && typeof input.source.files === 'object') {
            // Auto-construct workspace from trace source files if not explicitly provided
            const ws = Workspace.fromFiles(input.source.files);
            this.setWorkspace(ws);
        }

        const state = this.debugger.loadExecution(input, problemConfig);
        this._sourceMap.build(this._workspaceSnapshot, this.debugger._uetTrace);
        return state;
    }

    /**
     * Returns the currently active SourceFile being debugged.
     * @returns {import('../workspace/SourceFile.js').SourceFile|null}
     */
    getCurrentFile() {
        const loc = this.getCurrentLocation();
        if (loc.fileId && this._workspaceSnapshot) {
            const byId = this._workspaceSnapshot.getFile(loc.fileId);
            if (byId) return byId;
        }
        if (loc.path && this._workspaceSnapshot) {
            return this._workspaceSnapshot.getFileByPath(loc.path);
        }
        return null;
    }

    /**
     * Returns the currently active Module being debugged.
     * @returns {import('../workspace/Module.js').Module|null}
     */
    getCurrentModule() {
        const loc = this.getCurrentLocation();
        if (loc.moduleId && this._workspaceSnapshot) {
            const byId = this._workspaceSnapshot.getModule(loc.moduleId);
            if (byId) return byId;
        }
        const file = this.getCurrentFile();
        if (file?.moduleId && this._workspaceSnapshot) {
            return this._workspaceSnapshot.getModule(file.moduleId);
        }
        return null;
    }

    /**
     * Returns the current SourceLocation.
     * @returns {SourceLocation}
     */
    getCurrentLocation() {
        const frameIdx = this.debugger.frameIndex;
        if (frameIdx >= 0) {
            const loc = this._sourceMap.getFrameLocation(frameIdx);
            if (loc && (loc.fileId || loc.path)) {
                return loc;
            }
        }
        const stateLoc = this.debugger.getSourceLocation();
        return SourceLocation.from(stateLoc);
    }

    /**
     * Returns enriched call stack frames carrying source location and module identifiers.
     * @returns {Array<object>}
     */
    getCallStack() {
        const state = this.debugger.getDebuggerState();
        const stack = state.callStack || [];

        return stack.map((frame, idx) => {
            const rawSource = frame.source || {};
            const path = rawSource.file || rawSource.path || 'main.py';
            let fileId = rawSource.fileId || null;
            let moduleId = rawSource.moduleId || null;

            if (this._workspaceSnapshot) {
                const file = this._workspaceSnapshot.getFileByPath(path) || (fileId ? this._workspaceSnapshot.getFile(fileId) : null);
                if (file) {
                    fileId = file.id;
                    if (!moduleId && file.moduleId) {
                        moduleId = file.moduleId;
                    }
                }
            }

            const loc = new SourceLocation({
                fileId,
                moduleId,
                path,
                line: rawSource.line,
            });

            return {
                frameId: frame.frameId,
                functionName: frame.functionName,
                depth: frame.depth || idx + 1,
                sourceLocation: loc,
                fileId: loc.fileId,
                moduleId: loc.moduleId,
                file: loc.path || 'main.py',
                line: loc.line,
                locals: frame.scope?.bindings || frame.locals || {},
            };
        });
    }

    /**
     * Returns call frames belonging to a specific module.
     * @param {string} moduleId
     * @returns {Array<object>}
     */
    getModuleFrames(moduleId) {
        const modId = String(moduleId);
        return this.getCallStack().filter(f => f.moduleId === modId);
    }

    /**
     * Returns all breakpoints registered for a specific file.
     * @param {string} fileIdOrPath
     * @returns {Array<import('./Breakpoint.js').Breakpoint>}
     */
    getBreakpointsForFile(fileIdOrPath) {
        const target = String(fileIdOrPath);
        return this.debugger.getBreakpoints().filter(bp => {
            return bp.file === target || bp.fileId === target || bp.id.startsWith(`${target}:`);
        });
    }

    /**
     * Adds a breakpoint for a specific file and line.
     * @param {string} fileIdOrPath
     * @param {number} line
     * @returns {import('./Breakpoint.js').Breakpoint}
     */
    addFileBreakpoint(fileIdOrPath, line) {
        let file = String(fileIdOrPath);
        let fileId = null;

        if (this._workspaceSnapshot) {
            const f = this._workspaceSnapshot.getFile(fileIdOrPath) || this._workspaceSnapshot.getFileByPath(fileIdOrPath);
            if (f) {
                file = f.path;
                fileId = f.id;
            }
        }

        return this.debugger.addBreakpoint(file, line, fileId);
    }

    /**
     * Removes a breakpoint for a specific file and line.
     * @param {string} fileIdOrPath
     * @param {number} line
     * @returns {boolean}
     */
    removeFileBreakpoint(fileIdOrPath, line) {
        let file = String(fileIdOrPath);
        if (this._workspaceSnapshot) {
            const f = this._workspaceSnapshot.getFile(fileIdOrPath) || this._workspaceSnapshot.getFileByPath(fileIdOrPath);
            if (f) {
                file = f.path;
            }
        }
        return this.debugger.removeBreakpoint(file, line);
    }

    /**
     * Toggles a breakpoint for a specific file and line.
     * @param {string} fileIdOrPath
     * @param {number} line
     * @returns {boolean}
     */
    toggleFileBreakpoint(fileIdOrPath, line) {
        let file = String(fileIdOrPath);
        let fileId = null;
        if (this._workspaceSnapshot) {
            const f = this._workspaceSnapshot.getFile(fileIdOrPath) || this._workspaceSnapshot.getFileByPath(fileIdOrPath);
            if (f) {
                file = f.path;
                fileId = f.id;
            }
        }
        return this.debugger.toggleBreakpoint(file, line, fileId);
    }

    /**
     * Returns the entry point SourceFile if defined.
     * @returns {import('../workspace/SourceFile.js').SourceFile|null}
     */
    getEntryFile() {
        const entrypoint = this.debugger._uetTrace?.source?.entrypoint || 'main.py';
        if (this._workspaceSnapshot) {
            return this._workspaceSnapshot.getFileByPath(entrypoint) || this._workspaceSnapshot.getFile(entrypoint);
        }
        return null;
    }

    /**
     * Returns the entry point Module if defined.
     * @returns {import('../workspace/Module.js').Module|null}
     */
    getEntryModule() {
        const file = this.getEntryFile();
        if (file?.moduleId && this._workspaceSnapshot) {
            return this._workspaceSnapshot.getModule(file.moduleId);
        }
        return null;
    }

    getWorkspace() {
        return this._workspace;
    }

    getWorkspaceSnapshot() {
        return this._workspaceSnapshot;
    }

    getSourceMap() {
        return this._sourceMap;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Forwarding Controls to Authoritative Debugger Controller
    // ─────────────────────────────────────────────────────────────────────────────

    run() {
        return this.debugger.run();
    }

    pause() {
        return this.debugger.pause();
    }

    stepForward() {
        return this.debugger.stepForward();
    }

    stepBackward() {
        return this.debugger.stepBackward();
    }

    continue() {
        return this.debugger.continue();
    }

    restart() {
        return this.debugger.restart();
    }

    jumpTo(frameIndex) {
        return this.debugger.jumpTo(frameIndex);
    }

    getDebuggerState() {
        return this.debugger.getDebuggerState();
    }

    onStateChange(fn) {
        this.debugger.onStateChange(fn);
    }
}
