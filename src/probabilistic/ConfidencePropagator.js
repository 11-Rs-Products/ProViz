export class ConfidencePropagator {
  /**
   * Recalculates downstream confidence values when upstream evidence changes.
   */
  static propagate(upstreamConfidence, downstreamMap = new Map(), dependencies = []) {
    const updated = new Map(downstreamMap);

    for (const dep of dependencies) {
      const current = updated.get(dep.targetId) || 0.5;
      // Downstream confidence scaled by upstream confidence and impact
      const nextVal = current * (0.5 + 0.5 * upstreamConfidence * dep.impactFactor);
      updated.set(dep.targetId, Math.max(0.0, Math.min(1.0, nextVal)));
    }

    return updated;
  }
}
