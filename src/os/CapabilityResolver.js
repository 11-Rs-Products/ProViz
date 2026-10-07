/**
 * CapabilityResolver.js
 * Topological dependency resolver sorting required capabilities into safe execution order.
 */

export class CapabilityResolver {
  /**
   * @param {import('./CapabilityRegistry.js').CapabilityRegistry} registry
   */
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Resolve execution sequence for requested capabilities
   * @param {string[]} requestedCapabilityIds
   */
  resolveExecutionOrder(requestedCapabilityIds) {
    const visited = new Set();
    const order = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const cap = this.registry.getCapability(id);
      if (!cap) {
        throw new Error(`Capability ${id} is not registered in CapabilityRegistry`);
      }

      for (const depId of cap.dependencies) {
        visit(depId);
      }
      order.push(id);
    };

    for (const req of requestedCapabilityIds) {
      visit(req);
    }

    return order;
  }
}
