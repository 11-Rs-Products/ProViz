export class EvidenceGraphAnalyzer {
  static traceProvenance(graph, targetId, maxDepth = 10) {
    const visited = new Set();
    const trace = [];

    function dfs(currId, depth) {
      if (depth > maxDepth || visited.has(currId)) return;
      visited.add(currId);

      const incoming = graph.getIncomingEdges(currId);
      for (const edge of incoming) {
        trace.push(edge);
        dfs(edge.from, depth + 1);
      }
    }

    dfs(targetId, 0);
    return trace;
  }
}
