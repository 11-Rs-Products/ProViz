/**
 * ExecutionRequest — Standardized request object for code execution.
 *
 * Separates "what to execute" (code, language, entrypoint) from
 * "how to visualize it" (visualizer options, question context).
 */

export class ExecutionRequest {
    /**
     * @param {object|string} input - Either a Python source code string or a request configuration object.
     * @param {string} [input.language='python'] - Language identifier
     * @param {string} [input.code] - Source code string for single-file executions
     * @param {object} [input.source] - Multi-file source dictionary { [filename]: content }
     * @param {string} [input.entrypoint='main.py'] - Entrypoint file name
     * @param {object} [input.options] - Execution options (trace, maxEvents, timeoutMs)
     * @param {object|null} [input.context=null] - Optional educational / problem context (null for freeform execution)
     */
    constructor(input = '') {
        if (typeof input === 'string') {
            this.language = 'python';
            this.entrypoint = 'main.py';
            this.files = { 'main.py': input };
            this.options = { trace: true, maxEvents: 50000, timeoutMs: 5000 };
            this.context = null;
        } else {
            this.language = input.language || 'python';
            this.entrypoint = input.entrypoint || 'main.py';

            if (input.files && typeof input.files === 'object') {
                this.files = { ...input.files };
            } else if (typeof input.code === 'string') {
                this.files = { [this.entrypoint]: input.code };
            } else {
                this.files = { [this.entrypoint]: '' };
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
}

/**
 * Factory helper to create an ExecutionRequest.
 * @param {object|string} input
 * @returns {ExecutionRequest}
 */
export function createExecutionRequest(input) {
    return new ExecutionRequest(input);
}
