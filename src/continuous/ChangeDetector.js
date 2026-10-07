/**
 * ChangeDetector.js
 * Detects modifications across project files, AST symbols, configs, and dependencies.
 */

import { ChangeSet } from './ChangeSet.js';

export class ChangeDetector {
  /**
   * Compares previous and current workspace file snapshots to construct a ChangeSet.
   * @param {Map<string, string>|Object} previousFiles Map of filePath -> content/hash
   * @param {Map<string, string>|Object} currentFiles Map of filePath -> content/hash
   * @param {Object} [metadata={}]
   * @returns {ChangeSet}
   */
  detectChanges(previousFiles, currentFiles, metadata = {}) {
    const prevMap = previousFiles instanceof Map ? previousFiles : new Map(Object.entries(previousFiles || {}));
    const currMap = currentFiles instanceof Map ? currentFiles : new Map(Object.entries(currentFiles || {}));

    const addedFiles = [];
    const modifiedFiles = [];
    const deletedFiles = [];
    const modifiedFunctions = [];
    const modifiedConfigs = [];
    const modifiedTests = [];

    // Detect added and modified
    for (const [path, content] of currMap.entries()) {
      if (!prevMap.has(path)) {
        addedFiles.push(path);
      } else if (prevMap.get(path) !== content) {
        modifiedFiles.push(path);
      }

      if (path.endsWith('.json') || path.endsWith('.yaml') || path.endsWith('.config.js')) {
        modifiedConfigs.push(path);
      }
      if (path.includes('test') || path.endsWith('.test.js') || path.endsWith('.spec.js')) {
        modifiedTests.push(path);
      }
    }

    // Detect deleted
    for (const path of prevMap.keys()) {
      if (!currMap.has(path)) {
        deletedFiles.push(path);
      }
    }

    return new ChangeSet({
      id: `change-${Date.now()}`,
      revision: metadata.revision || `rev-${Date.now()}`,
      addedFiles,
      modifiedFiles,
      deletedFiles,
      modifiedFunctions: metadata.modifiedFunctions || [],
      modifiedClasses: metadata.modifiedClasses || [],
      modifiedModules: metadata.modifiedModules || [],
      modifiedDependencies: metadata.modifiedDependencies || [],
      modifiedApis: metadata.modifiedApis || [],
      modifiedConfigs,
      modifiedTests,
      description: metadata.description || 'Workspace change detected'
    });
  }
}
