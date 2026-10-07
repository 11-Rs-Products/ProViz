import { VerificationTaskStatus } from './VerificationTaskStatus.js';

export class IncrementalTaskPlanner {
  /**
   * Plans selective re-execution when source or dependencies change.
   */
  static planIncrementalTasks(allTasks = [], changedSubjects = [], dependencyGraph = null) {
    const changedSet = new Set(changedSubjects.map(String));
    const affectedTaskIds = new Set();

    // 1. Direct matches
    for (const task of allTasks) {
      if (changedSet.has(task.subject)) {
        affectedTaskIds.add(task.taskId);
      }
    }

    // 2. Transitive dependents if dependency graph is available
    if (dependencyGraph) {
      for (const id of Array.from(affectedTaskIds)) {
        const dependents = dependencyGraph.getDependents(id);
        for (const dep of dependents) {
          affectedTaskIds.add(dep.taskId);
        }
      }
    }

    const tasksToRun = [];
    const tasksToPreserve = [];

    for (const task of allTasks) {
      if (affectedTaskIds.has(task.taskId)) {
        tasksToRun.push(task.withStatus ? task.withStatus(VerificationTaskStatus.QUEUED) : task);
      } else {
        tasksToPreserve.push(task);
      }
    }

    return {
      tasksToRun,
      tasksToPreserve,
      affectedCount: tasksToRun.length,
      preservedCount: tasksToPreserve.length
    };
  }
}
