/**
 * PriorityArbiter.js
 * Multi-factor deterministic priority scoring function for autonomous verification tasks.
 * Formula:
 * Priority(T) = (Risk(T) * Impact(T) * InformationValue(T) * Staleness(T)) / (Cost(T) + Latency(T) + ResourcePressure(T))
 */

export class PriorityArbiter {
  /**
   * Compute priority score for a task
   * @param {Object} task
   * @param {number} [task.risk=0.5]
   * @param {number} [task.impact=0.5]
   * @param {number} [task.informationValue=0.5]
   * @param {number} [task.staleness=1.0]
   * @param {number} [task.cost=1.0]
   * @param {number} [task.latency=1.0]
   * @param {number} [task.resourcePressure=0.1]
   */
  calculatePriority(task) {
    const risk = task.risk !== undefined ? task.risk : 0.5;
    const impact = task.impact !== undefined ? task.impact : 0.5;
    const infoVal = task.informationValue !== undefined ? task.informationValue : 0.5;
    const staleness = task.staleness !== undefined ? task.staleness : 1.0;

    const cost = task.cost !== undefined ? task.cost : 1.0;
    const latency = task.latency !== undefined ? task.latency : 1.0;
    const pressure = task.resourcePressure !== undefined ? task.resourcePressure : 0.1;

    const numerator = risk * impact * infoVal * staleness;
    const denominator = Math.max(0.01, cost + latency + pressure);

    return Number((numerator / denominator).toFixed(4));
  }

  /**
   * Sort tasks by priority with deterministic tie-breaking on task ID
   * @param {Object[]} tasks
   */
  rankTasks(tasks) {
    const list = tasks.map(t => ({
      ...t,
      priority: this.calculatePriority(t)
    }));

    list.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    return list;
  }
}
