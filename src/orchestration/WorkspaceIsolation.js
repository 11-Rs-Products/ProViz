import { TaskWorkspace } from './TaskWorkspace.js';

export class WorkspaceIsolation {
  static createIsolatedContext(task, baseWorkspace) {
    return new TaskWorkspace({
      taskId: task.taskId,
      baseWorkspaceId: baseWorkspace?.workspaceId || 'root',
      isolatedEnvironment: {
        envFingerprint: baseWorkspace?.environmentFingerprint || 'standard',
        isolatedProcessId: `proc_${task.taskId}`
      }
    });
  }

  static isIsolated(taskWorkspaceA, taskWorkspaceB) {
    if (!taskWorkspaceA || !taskWorkspaceB) return true;
    return taskWorkspaceA.taskId !== taskWorkspaceB.taskId;
  }
}
