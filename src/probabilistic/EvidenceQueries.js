export class EvidenceQueries {
  static getSupportingEvidence(graph, subjectId) {
    return graph.getSupportingNodes(subjectId);
  }

  static getContradictingEvidence(graph, subjectId) {
    return graph.getContradictingNodes(subjectId);
  }

  static getTestsForSubject(graph, subjectId) {
    const nodes = graph.getIncomingEdges(subjectId)
      .map(e => graph.getNode(e.from))
      .filter(n => n && (n.type === 'TEST' || n.type === 'EXECUTION'));
    return nodes;
  }
}
