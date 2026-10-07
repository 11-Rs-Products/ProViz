/**
 * SemanticDiff.js
 * Compares two semantic program graphs or snapshots and computes semantic diffs beyond textual diffs.
 */

export class SemanticDiff {
  /**
   * @param {Object} options
   * @param {boolean} options.textChanged
   * @param {boolean} options.astChanged
   * @param {boolean} options.dataFlowChanged
   * @param {boolean} options.behaviorChanged
   * @param {string} options.specImpact - 'NONE' | 'LOW' | 'MODERATE' | 'HIGH'
   * @param {string} options.verificationImpact - 'NONE' | 'LOW' | 'MODERATE' | 'HIGH'
   * @param {Array<string>} [options.addedNodes=[]]
   * @param {Array<string>} [options.removedNodes=[]]
   * @param {Array<string>} [options.modifiedNodes=[]]
   * @param {Array<string>} [options.addedEdges=[]]
   * @param {Array<string>} [options.removedEdges=[]]
   */
  constructor({
    textChanged = false,
    astChanged = false,
    dataFlowChanged = false,
    behaviorChanged = false,
    specImpact = 'NONE',
    verificationImpact = 'NONE',
    addedNodes = [],
    removedNodes = [],
    modifiedNodes = [],
    addedEdges = [],
    removedEdges = []
  }) {
    this.textChanged = textChanged;
    this.astChanged = astChanged;
    this.dataFlowChanged = dataFlowChanged;
    this.behaviorChanged = behaviorChanged;
    this.specImpact = specImpact;
    this.verificationImpact = verificationImpact;
    this.addedNodes = Object.freeze([...addedNodes]);
    this.removedNodes = Object.freeze([...removedNodes]);
    this.modifiedNodes = Object.freeze([...modifiedNodes]);
    this.addedEdges = Object.freeze([...addedEdges]);
    this.removedEdges = Object.freeze([...removedEdges]);

    Object.freeze(this);
  }

  toJSON() {
    return {
      textChanged: this.textChanged,
      astChanged: this.astChanged,
      dataFlowChanged: this.dataFlowChanged,
      behaviorChanged: this.behaviorChanged,
      specImpact: this.specImpact,
      verificationImpact: this.verificationImpact,
      addedNodes: [...this.addedNodes],
      removedNodes: [...this.removedNodes],
      modifiedNodes: [...this.modifiedNodes],
      addedEdges: [...this.addedEdges],
      removedEdges: [...this.removedEdges]
    };
  }

  static compareGraphs(graphA, graphB) {
    const nodesA = new Map((graphA.queryNodes ? graphA.queryNodes() : []).map(n => [n.id, n]));
    const nodesB = new Map((graphB.queryNodes ? graphB.queryNodes() : []).map(n => [n.id, n]));

    const addedNodes = [];
    const removedNodes = [];
    const modifiedNodes = [];

    for (const [id, nodeB] of nodesB.entries()) {
      if (!nodesA.has(id)) {
        addedNodes.push(id);
      } else {
        const nodeA = nodesA.get(id);
        if (JSON.stringify(nodeA.typeInfo) !== JSON.stringify(nodeB.typeInfo) ||
            nodeA.verificationState !== nodeB.verificationState) {
          modifiedNodes.push(id);
        }
      }
    }

    for (const id of nodesA.keys()) {
      if (!nodesB.has(id)) {
        removedNodes.push(id);
      }
    }

    const astChanged = addedNodes.length > 0 || removedNodes.length > 0 || modifiedNodes.length > 0;
    const dataFlowChanged = modifiedNodes.length > 0;
    const behaviorChanged = modifiedNodes.length > 0 || addedNodes.length > 0;

    let specImpact = 'NONE';
    if (modifiedNodes.length > 3) specImpact = 'HIGH';
    else if (modifiedNodes.length > 0) specImpact = 'LOW';

    let verificationImpact = 'NONE';
    if (removedNodes.length > 0 || modifiedNodes.length > 0) verificationImpact = 'HIGH';

    return new SemanticDiff({
      textChanged: astChanged,
      astChanged,
      dataFlowChanged,
      behaviorChanged,
      specImpact,
      verificationImpact,
      addedNodes,
      removedNodes,
      modifiedNodes,
      addedEdges: [],
      removedEdges: []
    });
  }
}
