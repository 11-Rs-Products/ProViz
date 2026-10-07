/**
 * TransformationWorkspace.js
 * Isolated sandboxed workspace for safe transformation staging and verification.
 */

import { SemanticProgramGraph } from '../semantic/SemanticProgramGraph.js';

export class TransformationWorkspace {
  /**
   * @param {Object} options
   * @param {string} options.workspaceId
   * @param {Object} options.originalSourceMap - file -> sourceCode
   * @param {SemanticProgramGraph} options.originalSemanticGraph
   */
  constructor({
    workspaceId,
    originalSourceMap = {},
    originalSemanticGraph
  }) {
    if (!workspaceId) {
      throw new Error('TransformationWorkspace requires workspaceId');
    }

    this.workspaceId = workspaceId;
    this.originalSourceMap = Object.freeze({ ...originalSourceMap });
    this.originalSemanticGraph = originalSemanticGraph;

    this.stagedSourceMap = { ...originalSourceMap };
    this.stagedSemanticGraph = originalSemanticGraph
      ? SemanticProgramGraph.fromJSON(originalSemanticGraph.toJSON())
      : new SemanticProgramGraph();

    this.isCommitted = false;
  }

  applyCandidate(candidate) {
    for (const edit of candidate.edits) {
      const currentSource = this.stagedSourceMap[edit.file] || '';
      this.stagedSourceMap[edit.file] = edit.applyToSource(currentSource);
    }
    return this.stagedSourceMap;
  }

  getTransformedSource(file) {
    return this.stagedSourceMap[file] || null;
  }

  commit() {
    this.isCommitted = true;
    return {
      workspaceId: this.workspaceId,
      committedSourceMap: { ...this.stagedSourceMap },
      isCommitted: true
    };
  }

  reset() {
    this.stagedSourceMap = { ...this.originalSourceMap };
    this.stagedSemanticGraph = this.originalSemanticGraph
      ? SemanticProgramGraph.fromJSON(this.originalSemanticGraph.toJSON())
      : new SemanticProgramGraph();
    this.isCommitted = false;
  }
}
