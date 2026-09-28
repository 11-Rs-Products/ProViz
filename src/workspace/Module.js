/**
 * Module — Language-neutral module abstraction in the Universal Workspace.
 *
 * Broad enough to represent:
 *  - Python modules & packages
 *  - JavaScript ES modules & CommonJS modules
 *  - TypeScript modules & namespaces
 *  - Java packages / classes
 *  - C/C++ translation units
 *  - Rust modules & crates
 *
 * Encapsulates:
 *  - id: Stable unique module identifier (e.g. 'module_main', 'module_utils')
 *  - name: Display name / symbol name (e.g. 'main', 'utils', 'models')
 *  - path: Logical or file path (e.g. 'utils.py', 'src/models.py')
 *  - language: Language identifier
 *  - fileIds: Set of SourceFile IDs owned by or belonging to this module
 *  - imports: Array of module IDs / specifiers imported by this module
 *  - exports: Array of symbols / submodules exported by this module
 *  - metadata: Arbitrary module metadata
 */

export class Module {
    /**
     * @param {object} params
     * @param {string} params.id - Unique module ID
     * @param {string} params.name - Module name
     * @param {string} [params.path=''] - Logical or file path
     * @param {string} [params.language='python'] - Language identifier
     * @param {Array<string>} [params.fileIds=[]] - Associated SourceFile IDs
     * @param {Array<string>} [params.imports=[]] - Imported module IDs / specifiers
     * @param {Array<string>} [params.exports=[]] - Exported symbol names
     * @param {object} [params.metadata={}] - Arbitrary metadata
     */
    constructor({
        id,
        name,
        path = '',
        language = 'python',
        fileIds = [],
        imports = [],
        exports = [],
        metadata = {},
    }) {
        if (!id || typeof id !== 'string') {
            throw new Error('Module requires a non-empty string "id"');
        }
        this.id = id;
        this.name = name || id;
        this.path = path || '';
        this.language = (language || 'python').toLowerCase();
        this.fileIds = Array.isArray(fileIds) ? Array.from(new Set(fileIds.map(String))) : [];
        this.imports = Array.isArray(imports) ? Array.from(new Set(imports.map(String))) : [];
        this.exports = Array.isArray(exports) ? Array.from(new Set(exports.map(String))) : [];
        this.metadata = { ...metadata };
    }

    /**
     * Associates a SourceFile ID with this module.
     * @param {string} fileId
     * @returns {Module} Self
     */
    addFileId(fileId) {
        if (fileId && !this.fileIds.includes(fileId)) {
            this.fileIds.push(String(fileId));
        }
        return this;
    }

    /**
     * Removes a SourceFile ID association from this module.
     * @param {string} fileId
     * @returns {Module} Self
     */
    removeFileId(fileId) {
        const idx = this.fileIds.indexOf(String(fileId));
        if (idx >= 0) {
            this.fileIds.splice(idx, 1);
        }
        return this;
    }

    /**
     * Declares an import dependency from this module to another module/specifier.
     * @param {string} importSpecifier
     * @returns {Module} Self
     */
    addImport(importSpecifier) {
        if (importSpecifier && !this.imports.includes(importSpecifier)) {
            this.imports.push(String(importSpecifier));
        }
        return this;
    }

    /**
     * Removes an import dependency.
     * @param {string} importSpecifier
     * @returns {Module} Self
     */
    removeImport(importSpecifier) {
        const idx = this.imports.indexOf(String(importSpecifier));
        if (idx >= 0) {
            this.imports.splice(idx, 1);
        }
        return this;
    }

    /**
     * Declares an exported symbol name.
     * @param {string} exportName
     * @returns {Module} Self
     */
    addExport(exportName) {
        if (exportName && !this.exports.includes(exportName)) {
            this.exports.push(String(exportName));
        }
        return this;
    }

    clone() {
        return new Module({
            id: this.id,
            name: this.name,
            path: this.path,
            language: this.language,
            fileIds: [...this.fileIds],
            imports: [...this.imports],
            exports: [...this.exports],
            metadata: { ...this.metadata },
        });
    }

    equals(other) {
        if (!other || !(other instanceof Module)) return false;
        if (this.id !== other.id || this.name !== other.name || this.path !== other.path || this.language !== other.language) {
            return false;
        }
        if (this.fileIds.length !== other.fileIds.length || this.imports.length !== other.imports.length || this.exports.length !== other.exports.length) {
            return false;
        }
        const setSame = (a, b) => a.every(x => b.includes(x));
        return setSame(this.fileIds, other.fileIds) && setSame(this.imports, other.imports) && setSame(this.exports, other.exports);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            path: this.path,
            language: this.language,
            fileIds: [...this.fileIds],
            imports: [...this.imports],
            exports: [...this.exports],
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct Module from null/undefined');
        return new Module({
            id: json.id,
            name: json.name,
            path: json.path,
            language: json.language,
            fileIds: json.fileIds || [],
            imports: json.imports || [],
            exports: json.exports || [],
            metadata: json.metadata || {},
        });
    }
}
