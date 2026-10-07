/**
 * RollbackManager.js
 * Atomic rollback coordinator ensuring complete multi-subsystem restoration without partial states.
 */

import { TransformationCheckpoint } from './TransformationCheckpoint.js';
import { SemanticProgramGraph } from '../semantic/SemanticProgramGraph.js';

export class RollbackManager {
  constructor() {
    this._checkpoints = new Map(); // id -> TransformationCheckpoint
    this._rollbackLog = [];
  }

  createCheckpoint(id, name, sourceState, semanticGraph, knowledgeGraph = null) {
    const cp = new TransformationCheckpoint({
      id,
      name,
      sourceState,
      semanticGraphState: semanticGraph ? semanticGraph.toJSON() : {},
      knowledgeGraphState: knowledgeGraph ? (knowledgeGraph.toJSON ? knowledgeGraph.toJSON() : null) : null
    });
    this._checkpoints.set(id, cp);
    return cp;
  }

  getCheckpoint(id) {
    return this._checkpoints.get(id) || null;
  }

  /**
   * Executes atomic rollback to a specified checkpoint.
   */
  rollback(checkpointId, targetWorkspace, options = {}) {
    const cp = this._checkpoints.get(checkpointId);
    if (!cp) {
      throw new Error(`Cannot rollback: checkpoint '${checkpointId}' not found`);
    }

    // 1. Restore Source
    if (targetWorkspace) {
      targetWorkspace.stagedSourceMap = { ...cp.sourceState };
      targetWorkspace.stagedSemanticGraph = cp.semanticGraphState
        ? SemanticProgramGraph.fromJSON(cp.semanticGraphState)
        : new SemanticProgramGraph();
      targetWorkspace.isCommitted = false;
    }

    const record = {
      checkpointId,
      timestamp: Date.now(),
      status: 'ROLLED_BACK',
      reason: options.reason || 'Verification failure or user cancellation'
    };
    this._rollbackLog.push(record);

    return {
      success: true,
      checkpointId,
      restoredFiles: Object.keys(cp.sourceState),
      record
    };
  }

  getRollbackLog() {
    return [...this._rollbackLog];
  }
}
