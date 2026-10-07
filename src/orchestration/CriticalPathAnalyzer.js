import { TaskGraphAnalyzer } from './TaskGraphAnalyzer.js';

export class CriticalPathAnalyzer {
  static computeCriticalPath(graph) {
    return TaskGraphAnalyzer.computeCriticalPath(graph);
  }

  static prioritizeCriticalPathTasks(graph, tasks = []) {
    const criticalPath = new Set(this.computeCriticalPath(graph));
    return [...tasks].map(task => {
      if (criticalPath.has(task.taskId)) {
        return task.priority !== undefined ? new task.constructor({ ...task, priority: task.priority + 10 }) : task;
      }
      return task;
    });
  }
}
