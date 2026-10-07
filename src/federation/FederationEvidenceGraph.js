/**
 * Graph node representing an entity in the federation evidence provenance graph
 */
export class AgentEvidenceNode {
  constructor({
    id,
    type = 'AGENT', // PROGRAM, GOAL, TASK, AGENT, ENVIRONMENT, EXECUTION, RESULT, EVIDENCE, CONFIDENCE
    label,
    attributes = {}
  } = {}) {
    this.id = id;
    this.type = type;
    this.label = label || id;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json = {}) {
    return new AgentEvidenceNode(json);
  }
}

/**
 * Graph edge representing a provenance relationship in the federation evidence graph
 */
export class AgentEvidenceEdge {
  constructor({
    from,
    to,
    relation = 'PRODUCES', // TARGETS, DELEGATED_TO, RUNS_IN, EXECUTES, YIELDS, ESTABLISHES, CONFIRMS
    attributes = {}
  } = {}) {
    this.from = from;
    this.to = to;
    this.relation = relation;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      from: this.from,
      to: this.to,
      relation: this.relation,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json = {}) {
    return new AgentEvidenceEdge(json);
  }
}

/**
 * Federation Evidence Graph maintaining complete provenance chain
 */
export class FederationEvidenceGraph {
  constructor() {
    this._nodes = new Map();
    this._edges = [];
  }

  addNode(node) {
    const n = node instanceof AgentEvidenceNode ? node : AgentEvidenceNode.fromJSON(node);
    this._nodes.set(n.id, n);
    return n;
  }

  addEdge(edge) {
    const e = edge instanceof AgentEvidenceEdge ? edge : AgentEvidenceEdge.fromJSON(edge);
    this._edges.push(e);
    return e;
  }

  getNode(id) {
    return this._nodes.get(id) || null;
  }

  getNodes() {
    return Array.from(this._nodes.values());
  }

  getEdges() {
    return [...this._edges];
  }

  recordProvenanceChain({ programId, goalId, taskId, agentId, environmentFingerprint, executionId, resultId, evidenceId, confidenceScore }) {
    // 1. Nodes
    this.addNode({ id: `prog-${programId}`, type: 'PROGRAM', label: `Program: ${programId}` });
    this.addNode({ id: `goal-${goalId}`, type: 'GOAL', label: `Goal: ${goalId}` });
    this.addNode({ id: `task-${taskId}`, type: 'TASK', label: `Task: ${taskId}` });
    this.addNode({ id: `agent-${agentId}`, type: 'AGENT', label: `Agent: ${agentId}` });
    this.addNode({ id: `env-${environmentFingerprint}`, type: 'ENVIRONMENT', label: `Env: ${environmentFingerprint}` });
    this.addNode({ id: `exec-${executionId}`, type: 'EXECUTION', label: `Exec: ${executionId}` });
    this.addNode({ id: `res-${resultId}`, type: 'RESULT', label: `Result: ${resultId}` });
    this.addNode({ id: `ev-${evidenceId}`, type: 'EVIDENCE', label: `Evidence: ${evidenceId}` });
    this.addNode({ id: `conf-${evidenceId}`, type: 'CONFIDENCE', label: `Confidence: ${confidenceScore}` });

    // 2. Edges
    this.addEdge({ from: `prog-${programId}`, to: `goal-${goalId}`, relation: 'TARGETS' });
    this.addEdge({ from: `goal-${goalId}`, to: `task-${taskId}`, relation: 'DECOMPOSES_TO' });
    this.addEdge({ from: `task-${taskId}`, to: `agent-${agentId}`, relation: 'DELEGATED_TO' });
    this.addEdge({ from: `agent-${agentId}`, to: `env-${environmentFingerprint}`, relation: 'RUNS_IN' });
    this.addEdge({ from: `task-${taskId}`, to: `exec-${executionId}`, relation: 'EXECUTES' });
    this.addEdge({ from: `exec-${executionId}`, to: `res-${resultId}`, relation: 'YIELDS' });
    this.addEdge({ from: `res-${resultId}`, to: `ev-${evidenceId}`, relation: 'ESTABLISHES' });
    this.addEdge({ from: `ev-${evidenceId}`, to: `conf-${evidenceId}`, relation: 'CALIBRATES' });
  }

  toJSON() {
    return {
      nodes: this.getNodes().map(n => n.toJSON()),
      edges: this.getEdges().map(e => e.toJSON())
    };
  }

  static fromJSON(json = {}) {
    const graph = new FederationEvidenceGraph();
    if (Array.isArray(json.nodes)) {
      for (const n of json.nodes) graph.addNode(AgentEvidenceNode.fromJSON(n));
    }
    if (Array.isArray(json.edges)) {
      for (const e of json.edges) graph.addEdge(AgentEvidenceEdge.fromJSON(e));
    }
    return graph;
  }
}
