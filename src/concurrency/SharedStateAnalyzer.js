/**
 * SharedStateAnalyzer.js
 * Connects SSA/dataflow analysis with concurrency access patterns to identify shared resources.
 */

export class SharedStateAnalyzer {
  /**
   * Analyzes a SharedStateModel to find resources accessed by multiple execution contexts.
   * @param {import('./SharedStateModel.js').SharedStateModel} model
   * @returns {Array<{ resourceId: string, contexts: Array<string>, writeCount: number, readCount: number, isShared: boolean }>}
   */
  analyzeSharedResources(model) {
    const results = [];
    for (const resourceId of model.getAllResources()) {
      const accesses = model.getAccesses(resourceId);
      const contexts = model.getContextsAccessingResource(resourceId);
      const writeCount = accesses.filter(a => a.isWrite()).length;
      const readCount = accesses.filter(a => a.isRead()).length;

      results.push({
        resourceId,
        contexts,
        writeCount,
        readCount,
        isShared: contexts.length > 1
      });
    }
    return results;
  }

  /**
   * Finds all potential memory access conflicts across execution contexts.
   * @param {import('./SharedStateModel.js').SharedStateModel} model
   * @returns {Array<import('./AccessConflict.js').AccessConflict>}
   */
  findConflicts(model) {
    const { AccessConflict } = require ? {} : {}; // AccessConflict imported or used directly
    const conflicts = [];
    const allAccesses = model.getAllAccesses();

    for (let i = 0; i < allAccesses.length; i++) {
      for (let j = i + 1; j < allAccesses.length; j++) {
        const conflict = allAccesses[i].constructor.name === 'MemoryAccess'
          ? (typeof allAccesses[i].isWrite === 'function' ? this._checkAccesses(allAccesses[i], allAccesses[j]) : null)
          : null;
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    return conflicts;
  }

  _checkAccesses(accessA, accessB) {
    if (accessA.contextId === accessB.contextId) return null;
    if (accessA.resourceId !== accessB.resourceId) return null;
    if (accessA.field !== accessB.field && accessA.field !== '*' && accessB.field !== '*') return null;

    const aWrite = accessA.isWrite();
    const bWrite = accessB.isWrite();
    if (!aWrite && !bWrite) return null;
    if (accessA.isAtomic() && accessB.isAtomic()) return null;

    let type = 'WRITE_WRITE';
    if (!aWrite && bWrite) type = 'READ_WRITE';
    else if (aWrite && !bWrite) type = 'WRITE_READ';

    return {
      accessA,
      accessB,
      type,
      resourceId: accessA.resourceId,
      field: accessA.field
    };
  }
}
