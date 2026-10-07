/**
 * CouplingMetrics.js
 * Computes software architectural coupling metrics:
 * Afferent Coupling (Ca), Efferent Coupling (Ce), Instability (I = Ce / (Ca + Ce)),
 * Fan-In, Fan-Out, and Dependency Density.
 */

export class CouplingMetrics {
  /**
   * @param {Object} options
   * @param {string} options.nodeId
   * @param {number} options.afferentCoupling - Incoming dependencies (Ca / Fan-In)
   * @param {number} options.efferentCoupling - Outgoing dependencies (Ce / Fan-Out)
   * @param {number} options.instability - I = Ce / (Ca + Ce)
   * @param {number} [options.dependencyDensity=0.0]
   */
  constructor({
    nodeId,
    afferentCoupling = 0,
    efferentCoupling = 0,
    instability = 0.0,
    dependencyDensity = 0.0
  }) {
    this.nodeId = nodeId;
    this.afferentCoupling = afferentCoupling;
    this.efferentCoupling = efferentCoupling;
    this.fanIn = afferentCoupling;
    this.fanOut = efferentCoupling;
    this.instability = Math.max(0.0, Math.min(1.0, instability));
    this.dependencyDensity = dependencyDensity;

    Object.freeze(this);
  }

  toJSON() {
    return {
      nodeId: this.nodeId,
      afferentCoupling: this.afferentCoupling,
      efferentCoupling: this.efferentCoupling,
      fanIn: this.fanIn,
      fanOut: this.fanOut,
      instability: this.instability,
      dependencyDensity: this.dependencyDensity
    };
  }

  static calculate(nodeId, programGraph) {
    const inEdges = programGraph.getIncomingEdges ? programGraph.getIncomingEdges(nodeId) : [];
    const outEdges = programGraph.getOutgoingEdges ? programGraph.getOutgoingEdges(nodeId) : [];

    const ca = inEdges.length;
    const ce = outEdges.length;
    const total = ca + ce;
    const instability = total > 0 ? (ce / total) : 0.0;
    const totalGraphNodes = Math.max(1, programGraph.nodeCount || 1);
    const density = total / totalGraphNodes;

    return new CouplingMetrics({
      nodeId,
      afferentCoupling: ca,
      efferentCoupling: ce,
      instability,
      dependencyDensity: density
    });
  }
}
