/**
 * TransformationCheckpoint.js
 * Checkpoint snapshot preserving complete multi-stage state before and after transformation steps.
 */

export class TransformationCheckpoint {
  /**
   * @param {Object} options
   * @param {string} options.id - Checkpoint identifier
   * @param {string} options.name - Descriptive name
   * @param {Object} options.sourceState - file -> content
   * @param {Object} options.semanticGraphState - JSON data of SemanticProgramGraph
   * @param {Object} [options.knowledgeGraphState=null] - JSON data of VerificationKnowledgeGraph
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    name,
    sourceState = {},
    semanticGraphState,
    knowledgeGraphState = null,
    timestamp = Date.now()
  }) {
    if (!id || !name) {
      throw new Error('TransformationCheckpoint requires id and name');
    }

    this.id = id;
    this.name = name;
    this.sourceState = Object.freeze(JSON.parse(JSON.stringify(sourceState)));
    this.semanticGraphState = Object.freeze(JSON.parse(JSON.stringify(semanticGraphState || {})));
    this.knowledgeGraphState = knowledgeGraphState ? Object.freeze(JSON.parse(JSON.stringify(knowledgeGraphState))) : null;
    this.timestamp = timestamp;

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sourceState: this.sourceState,
      semanticGraphState: this.semanticGraphState,
      knowledgeGraphState: this.knowledgeGraphState,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new TransformationCheckpoint(json);
  }
}
