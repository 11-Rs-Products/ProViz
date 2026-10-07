import { DependencyRelation } from './TaskDependency.js';

export class TaskGraphAnalyzer {
  static analyze(graph) {
    const hasCycles = graph.detectCycles();
    const tasks = graph.getAllTasks();
    const isolatedTasks = [];
    const criticalPathTasks = [];
    const bottleneckTasks = [];

    for (const task of tasks) {
      const prereqs = graph.getPrerequisites(task.taskId);
      const dependents = graph.getDependents(task.taskId);

      if (prereqs.length === 0 && dependents.length === 0) {
        isolatedTasks.push(task);
      }
      if (dependents.length >= 3) {
        bottleneckTasks.push({
          taskId: task.taskId,
          dependentsCount: dependents.length,
          severity: 'HIGH'
        });
      }
    }

    return {
      totalTasks: tasks.length,
      hasCycles,
      isolatedTasksCount: isolatedTasks.length,
      bottlenecks: bottleneckTasks,
      isExecutable: !hasCycles
    };
  }

  static computeCriticalPath(graph) {
    if (graph.detectCycles()) return [];
    const topo = graph.topologicalOrder();
    const longestPath = new Map(); // taskId -> { length: number, path: Array<string> }

    for (const task of topo) {
      const id = task.taskId;
      longestPath.set(id, { length: 1, path: [id] });
    }

    for (const task of topo) {
      const id = task.taskId;
      const current = longestPath.get(id);
      const dependents = graph.getDependents(id);

      for (const dep of dependents) {
        const depId = dep.taskId;
        const depCurrent = longestPath.get(depId);
        if (depCurrent && current.length + 1 > depCurrent.length) {
          longestPath.set(depId, {
            length: current.length + 1,
            path: [...current.path, depId]
          });
        }
      }
    }

    let maxPathObj = { length: 0, path: [] };
    for (const pathObj of longestPath.values()) {
      if (pathObj.length > maxPathObj.length) {
        maxPathObj = pathObj;
      }
    }

    return maxPathObj.path;
  }
}
