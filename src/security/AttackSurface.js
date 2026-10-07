/**
 * AttackSurface.js
 * Identifies and classifies externally reachable or exposed semantic program nodes.
 */

export const EntryPointKind = Object.freeze({
  PUBLIC_API: 'PUBLIC_API',
  INPUT_PARSER: 'INPUT_PARSER',
  FILE_READER: 'FILE_READER',
  NETWORK_ENDPOINT: 'NETWORK_ENDPOINT',
  DESERIALIZATION: 'DESERIALIZATION',
  CONFIGURATION: 'CONFIGURATION',
  PLUGIN_INTERFACE: 'PLUGIN_INTERFACE',
  ENV_VARIABLE: 'ENV_VARIABLE',
  CLI_ARGUMENT: 'CLI_ARGUMENT',
  CUSTOM: 'CUSTOM'
});

export class AttackSurfaceEntry {
  constructor({ id, kind = EntryPointKind.PUBLIC_API, targetNodeId, file = '', exposedParameters = [], trustBoundaryId = null }) {
    if (!id || !targetNodeId) throw new Error('AttackSurfaceEntry requires id and targetNodeId');
    this.id = id;
    this.kind = kind;
    this.targetNodeId = targetNodeId;
    this.file = file;
    this.exposedParameters = Object.freeze([...exposedParameters]);
    this.trustBoundaryId = trustBoundaryId;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      targetNodeId: this.targetNodeId,
      file: this.file,
      exposedParameters: [...this.exposedParameters],
      trustBoundaryId: this.trustBoundaryId
    };
  }
}

export class AttackSurface {
  /**
   * @param {Object} [options]
   * @param {Array<AttackSurfaceEntry>} [options.entries=[]]
   */
  constructor({ entries = [] } = {}) {
    this._entries = new Map();
    for (const e of entries) {
      this.addEntry(e instanceof AttackSurfaceEntry ? e : new AttackSurfaceEntry(e));
    }
  }

  addEntry(entry) {
    const e = entry instanceof AttackSurfaceEntry ? entry : new AttackSurfaceEntry(entry);
    this._entries.set(e.id, e);
    return this;
  }

  getEntry(id) {
    return this._entries.get(id) || null;
  }

  getEntries() {
    return Array.from(this._entries.values());
  }

  getEntriesForNode(nodeId) {
    return this.getEntries().filter(e => e.targetNodeId === nodeId);
  }

  size() {
    return this._entries.size;
  }

  toJSON() {
    return {
      entries: this.getEntries().map(e => e.toJSON())
    };
  }

  static fromJSON(json) {
    return new AttackSurface({
      entries: (json.entries || []).map(e => AttackSurfaceEntry.fromJSON ? AttackSurfaceEntry.fromJSON(e) : new AttackSurfaceEntry(e))
    });
  }
}
