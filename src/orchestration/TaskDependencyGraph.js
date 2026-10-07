import { TaskDependency, DependencyRelation } from './TaskDependency.js';
import { VerificationTaskStatus } from './VerificationTaskStatus.js';

export class TaskDependencyGraph {
  constructor() {
    this.tasks = new Map(); // taskId -> VerificationTask
    this.outgoing = new Map(); // taskId -> Array<TaskDependency> (dependents waiting on this task)
    this.incoming = new Map(); // taskId -> Array<TaskDependency> (prerequisites this task waits on)
  }

  addTask(task) {
    const id = String(task.taskId || task.id);
    this.tasks.set(id, task);
    if (!this.outgoing.has(id)) this.outgoing.set(id, []);
    if (!this.incoming.has(id)) this.incoming.set(id, []);

    // If task defines dependencies internally, register them
    if (Array.isArray(task.dependencies)) {
      for (const prereqId of task.dependencies) {
        this.addDependency(new TaskDependency({
          sourceTaskId: String(prereqId),
          targetTaskId: id,
          relation: DependencyRelation.REQUIRED
        }));
      }
    }
    return this;
  }

  addDependency(dep) {
    const d = dep instanceof TaskDependency ? dep : new TaskDependency(dep);
    if (!this.tasks.has(d.sourceTaskId)) {
      if (!this.outgoing.has(d.sourceTaskId)) this.outgoing.set(d.sourceTaskId, []);
      if (!this.incoming.has(d.sourceTaskId)) this.incoming.set(d.sourceTaskId, []);
    }
    if (!this.tasks.has(d.targetTaskId)) {
      if (!this.outgoing.has(d.targetTaskId)) this.outgoing.set(d.targetTaskId, []);
      if (!this.incoming.has(d.targetTaskId)) this.incoming.set(d.targetTaskId, []);
    }

    this.outgoing.get(d.sourceTaskId).push(d);
    this.incoming.get(d.targetTaskId).push(d);
    return this;
  }

  getTask(id) {
    return this.tasks.get(String(id)) || null;
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  getPrerequisites(taskId) {
    const incomingDeps = this.incoming.get(String(taskId)) || [];
    return incomingDeps.map(d => this.tasks.get(d.sourceTaskId) || { taskId: d.sourceTaskId });
  }

  getDependents(taskId) {
    const outgoingDeps = this.outgoing.get(String(taskId)) || [];
    return outgoingDeps.map(d => this.tasks.get(d.targetTaskId) || { taskId: d.targetTaskId });
  }

  getReadyTasks(completedTaskIds = new Set()) {
    const ready = [];
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === VerificationTaskStatus.COMPLETED || completedTaskIds.has(id)) {
        continue;
      }
      if (task.status === VerificationTaskStatus.RUNNING || task.status === VerificationTaskStatus.CANCELLED) {
        continue;
      }

      const prereqs = this.incoming.get(id) || [];
      const requiredPrereqs = prereqs.filter(d => d.relation === DependencyRelation.REQUIRED);
      const allPrereqsMet = requiredPrereqs.every(d => {
        const prereqTask = this.tasks.get(d.sourceTaskId);
        return (prereqTask && prereqTask.status === VerificationTaskStatus.COMPLETED) || completedTaskIds.has(d.sourceTaskId);
      });

      if (allPrereqsMet) {
        ready.push(task);
      }
    }
    return ready;
  }

  getBlockedTasks(completedTaskIds = new Set()) {
    const readyIds = new Set(this.getReadyTasks(completedTaskIds).map(t => t.taskId));
    const blocked = [];
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === VerificationTaskStatus.COMPLETED || completedTaskIds.has(id) || readyIds.has(id)) {
        continue;
      }
      blocked.push(task);
    }
    return blocked;
  }

  detectCycles() {
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = this.outgoing.get(nodeId) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.targetTaskId)) {
          if (dfs(edge.targetTaskId)) return true;
        } else if (recursionStack.has(edge.targetTaskId)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.tasks.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) return true;
      }
    }
    return false;
  }

  topologicalOrder() {
    if (this.detectCycles()) {
      throw new Error('Cyclic dependency detected in task graph');
    }

    const inDegree = new Map();
    for (const id of this.tasks.keys()) {
      inDegree.set(id, 0);
    }

    for (const edges of this.outgoing.values()) {
      for (const e of edges) {
        if (inDegree.has(e.targetTaskId)) {
          inDegree.set(e.targetTaskId, inDegree.get(e.targetTaskId) + 1);
        }
      }
    }

    const queue = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    // Sort queue by deterministic task ID
    queue.sort();

    const result = [];
    while (queue.length > 0) {
      const curr = queue.shift();
      const task = this.tasks.get(curr);
      if (task) result.push(task);

      const neighbors = this.outgoing.get(curr) || [];
      for (const e of neighbors) {
        if (inDegree.has(e.targetTaskId)) {
          const nextDeg = inDegree.get(e.targetTaskId) - 1;
          inDegree.set(e.targetTaskId, nextDeg);
          if (nextDeg === 0) {
            queue.push(e.targetTaskId);
            queue.sort();
          }
        }
      }
    }

    return result;
  }

  toJSON() {
    const edges = [];
    for (const deps of this.outgoing.values()) {
      for (const d of deps) edges.push(d.toJSON());
    }
    return {
      tasks: Array.from(this.tasks.values()).map(t => t.toJSON()),
      dependencies: edges
    };
  }
}
