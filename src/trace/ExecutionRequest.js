import { Workspace } from '../workspace/Workspace.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';

export class ExecutionRequest {
    /**
     * @param {object|string} input - Either a source code string or a request configuration object.
     * @param {string} [input.language='python'] - Language identifier
     * @param {string} [input.code] - Source code string for single-file executions
     * @param {object} [input.files] - Multi-file source dictionary { [filename]: content }
     * @param {Workspace|WorkspaceSnapshot} [input.workspace] - Workspace or Snapshot instance
     * @param {string} [input.entrypoint='main.py'] - Entrypoint file name
     * @param {string} [input.entryFileId] - Entrypoint file ID
     * @param {string} [input.entryModuleId] - Entrypoint module ID
     * @param {object} [input.options] - Execution options (trace, maxEvents, timeoutMs)
     * @param {object|null} [input.context=null] - Optional educational / problem context (null for freeform execution)
     */
    constructor(input = '') {
        if (typeof input === 'string') {
            this.language = 'python';
            this.entrypoint = 'main.py';
            this.entryFileId = 'file_main';
            this.entryModuleId = 'module_main';
            this.files = { 'main.py': input };
            this.workspaceSnapshot = null;
            this.options = { trace: true, maxEvents: 50000, timeoutMs: 5000 };
            this.context = null;
        } else {
            this.language = input.language || 'python';
            this.entrypoint = input.entrypoint || 'main.py';
            this.entryFileId = input.entryFileId || null;
            this.entryModuleId = input.entryModuleId || null;

            if (input.workspace instanceof WorkspaceSnapshot) {
                this.workspaceSnapshot = input.workspace;
                this.files = {};
                for (const f of this.workspaceSnapshot.getFiles()) {
                    this.files[f.path] = f.content;
                }
                if (this.entryFileId) {
                    const f = this.workspaceSnapshot.getFile(this.entryFileId);
                    if (f) this.entrypoint = f.path;
                }
            } else if (input.workspace instanceof Workspace) {
                this.workspaceSnapshot = input.workspace.createSnapshot();
                this.files = {};
                for (const f of this.workspaceSnapshot.getFiles()) {
                    this.files[f.path] = f.content;
                }
                if (this.entryFileId) {
                    const f = this.workspaceSnapshot.getFile(this.entryFileId);
                    if (f) this.entrypoint = f.path;
                }
            } else if (input.files && typeof input.files === 'object') {
                this.files = { ...input.files };
                this.workspaceSnapshot = Workspace.fromFiles(this.files, { language: this.language }).createSnapshot();
            } else if (typeof input.code === 'string') {
                this.files = { [this.entrypoint]: input.code };
                this.workspaceSnapshot = null;
            } else {
                this.files = { [this.entrypoint]: '' };
                this.workspaceSnapshot = null;
            }

            this.options = {
                trace: input.options?.trace !== false,
                maxEvents: input.options?.maxEvents || 50000,
                timeoutMs: input.options?.timeoutMs || 5000,
                ...input.options,
            };

            this.context = input.context || null;
        }
    }

    /**
     * Helper to get the primary source code string.
     * @returns {string}
     */
    getMainCode() {
        return this.files[this.entrypoint] || '';
    }

    /**
     * Checks if this request has attached problem context.
     * @returns {boolean}
     */
    hasProblemContext() {
        return Boolean(this.context && (this.context.problemId || this.context.visualization));
    }

    /**
     * Creates an ExecutionRequest from raw code string.
     * @param {string} code
     * @param {object} [options]
     * @returns {ExecutionRequest}
     */
    static fromCode(code, options = {}) {
        return new ExecutionRequest({
            code,
            entrypoint: options.entrypoint || 'main.py',
            language: options.language || 'python',
            options,
            context: options.context || null,
        });
    }

    /**
     * Creates an ExecutionRequest from a Workspace or Snapshot.
     * @param {Workspace|WorkspaceSnapshot} workspace
     * @param {string} [entryFileIdOrPath]
     * @param {object} [options]
     * @returns {ExecutionRequest}
     */
    static fromWorkspace(workspace, entryFileIdOrPath = null, options = {}) {
        let entrypoint = 'main.py';
        let entryFileId = null;

        if (workspace) {
            const files = typeof workspace.getFiles === 'function' ? workspace.getFiles() : [];
            if (entryFileIdOrPath) {
                const target = String(entryFileIdOrPath);
                const found = (typeof workspace.getFile === 'function' ? workspace.getFile(target) : null) ||
                              (typeof workspace.getFileByPath === 'function' ? workspace.getFileByPath(target) : null);
                if (found) {
                    entrypoint = found.path;
                    entryFileId = found.id;
                } else {
                    entrypoint = target;
                }
            } else if (files.length > 0) {
                // Find main.py or first file
                const mainFile = files.find(f => f.name === 'main.py' || f.path === 'main.py') || files[0];
                entrypoint = mainFile.path;
                entryFileId = mainFile.id;
            }
        }

        return new ExecutionRequest({
            workspace,
            entrypoint,
            entryFileId,
            language: options.language || 'python',
            options,
            context: options.context || null,
        });
    }
}

/**
 * Factory helper to create an ExecutionRequest.
 * @param {object|string} input
 * @returns {ExecutionRequest}
 */
export function createExecutionRequest(input) {
    return new ExecutionRequest(input);
}
