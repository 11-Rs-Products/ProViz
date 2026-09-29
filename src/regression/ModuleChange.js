/**
 * ModuleChange — Specialized change descriptor for module imports, exports, and dependency graph shifts.
 */

import { SemanticChange } from './SemanticChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';

export class ModuleChange extends SemanticChange {
    /**
     * @param {object} params
     * @param {string} params.moduleName
     * @param {Array<string>} [params.oldImports=[]]
     * @param {Array<string>} [params.newImports=[]]
     * @param {Array<string>} [params.oldExports=[]]
     * @param {Array<string>} [params.newExports=[]]
     */
    constructor({
        moduleName,
        oldImports = [],
        newImports = [],
        oldExports = [],
        newExports = [],
        kind = CHANGE_KINDS.MODULE_MODIFIED,
        severity = CHANGE_SEVERITIES.MAJOR,
        ...rest
    } = {}) {
        super({
            kind,
            severity,
            moduleId: moduleName,
            before: { imports: oldImports, exports: oldExports },
            after: { imports: newImports, exports: newExports },
            metadata: {
                moduleName,
                oldImports,
                newImports,
                oldExports,
                newExports,
                ...(rest.metadata || {}),
            },
            ...rest,
        });
        this.moduleName = moduleName;
        this.oldImports = Object.freeze([...oldImports]);
        this.newImports = Object.freeze([...newImports]);
        this.oldExports = Object.freeze([...oldExports]);
        this.newExports = Object.freeze([...newExports]);
        Object.freeze(this);
    }
}
