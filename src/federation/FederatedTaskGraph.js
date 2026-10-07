import { FederatedTask } from './FederatedTask.js';

/**
 * Dependency graph of cross-agent federated verification tasks
 */
export class FederatedTaskGraph {
  constructor() {
    this._tasks = new Map();
    this._dependencies = new Map(); // taskId -> Set of prerequisite taskIds
    this._dependents = new Map();   // taskId -> Set of successor taskIds
  }

  addTask(task) {
    const verified = task instanceof FederatedTask ? task : FederatedTask.fromJSON(task);
    this._tasks.set(verified.taskId, verified);
    if (!this._dependencies.has(verified.taskId)) {
      this._dependencies.set(verified.taskId, new Set());
    }
    if (!this._dependents.has(verified.taskId)) {
      this._dependents.set(verified.taskId, new Set());
    }

    if (verified.dependencies) {
      for (const depId of verified.dependencies) {
        this.addDependency(depId, verified.taskId);
      }
    }
    return verified;
  }

  addDependency(fromTaskId, toTaskId) {
    if (!this._dependencies.has(toTaskId)) {
      this._dependencies.set(toTaskId, new Set());
    }
    if (!this._dependents.has(fromTaskId)) {
      this._dependents.set(fromTaskId, new Set());
    }
    this._dependencies.get(toTaskId).add(fromTaskId);
    this._dependents.get(fromTaskId).add(toTaskId);
  }

  getTask(taskId) {
    return this._tasks.get(taskId) || null;
  }

  getAllTasks() {
    return Array.from(this._tasks.values());
  }

  getDependencies(taskId) {
    return Array.from(this._dependencies.get(taskId) || []);
  }

  getDependents(taskId) {
    return Array.from(this._dependents.get(taskId) || []);
  }

  eliminateDuplicates() {
    const fingerprints = new Map();
    const removed = [];

    for (const [taskId, task] of this._tasks.entries()) {
      const fp = `${task.agentId}:${task.taskKind}:${JSON.stringify(task.inputPayload)}`;
      if (fingerprints.has(fp)) {
        removed.push(taskId);
      } else {
        fingerprints.set(fp, taskId);
      }
    }

    for (const taskId of removed) {
      this._tasks.delete(taskId);
      this._dependencies.delete(taskId);
      this._dependents.delete(taskId);
    }
    return removed;
  }

  getExecutionOrder() {
    const visited = new Set();
    const order = [];
    const visiting = new Set();

    const visit = (taskId) => {
      if (visiting.has(taskId)) {
        throw new Error(`Cycle detected in FederatedTaskGraph involving task: ${taskId}`);
      }
      if (visited.has(taskId)) return;

      visiting.add(taskId);
      const prereqs = this._dependencies.get(taskId) || new Set();
      // Deterministic sort of prereqs
      const sortedPrereqs = Array.from(prereqs).sort();
      for (const p of sortedPrereqs) {
        if (this._tasks.has(p)) {
          visit(p);
        }
      }
      visiting.delete(taskId);
      visited.add(taskId);
      order.push(this._tasks.get(taskId));
    };

    const taskIds = Array.from(this._tasks.keys()).sort();
    for (const id of taskIds) {
      if (!visited.has(id)) {
        visit(id);
      }
    }

    return order;
  }

  toJSON() {
    return {
      tasks: this.getAllTasks().map(t => t.toJSON())
    };
  }

  static fromJSON(json = {}) {
    const graph = new FederatedTaskGraph();
    if (Array.isArray(json.tasks)) {
      for (const t of json.tasks) {
        graph.addTask(FederatedTask.fromJSON(t));
      }
    }
    return graph;
  }
}
