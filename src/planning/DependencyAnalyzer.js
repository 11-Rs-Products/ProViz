export class DependencyAnalyzer {
  constructor(graph = null) {
    this.graph = graph;
  }

  getTransitiveDependents(rootId, maxDepth = 20) {
    return DependencyAnalyzer.getTransitiveDependents(this.graph, rootId, maxDepth);
  }

  /**
   * Identifies all transitive dependents that become stale when a node changes.
   */
  static getTransitiveDependents(graph, rootId, maxDepth = 20) {
    const visited = new Set();
    const result = [];

    function dfs(currId, depth) {
      if (depth > maxDepth || visited.has(currId)) return;
      visited.add(currId);

      const deps = graph.getDependents(currId);
      for (const d of deps) {
        result.push(d.targetId);
        dfs(d.targetId, depth + 1);
      }
    }

    dfs(String(rootId), 0);
    return Array.from(new Set(result));
  }
}
