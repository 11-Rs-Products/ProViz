export class TaskWorkspace {
  constructor({
    taskId,
    baseWorkspaceId,
    scratchDirectory = `/tmp/proviz_task_${taskId}`,
    isolatedEnvironment = {},
    localModifications = {}
  } = {}) {
    this.taskId = String(taskId);
    this.baseWorkspaceId = String(baseWorkspaceId || 'root');
    this.scratchDirectory = scratchDirectory;
    this.isolatedEnvironment = Object.freeze({ ...isolatedEnvironment });
    this.localModifications = Object.freeze({ ...localModifications });
    Object.freeze(this);
  }

  withModification(key, value) {
    return new TaskWorkspace({
      taskId: this.taskId,
      baseWorkspaceId: this.baseWorkspaceId,
      scratchDirectory: this.scratchDirectory,
      isolatedEnvironment: this.isolatedEnvironment,
      localModifications: {
        ...this.localModifications,
        [key]: value
      }
    });
  }

  toJSON() {
    return {
      taskId: this.taskId,
      baseWorkspaceId: this.baseWorkspaceId,
      scratchDirectory: this.scratchDirectory,
      isolatedEnvironment: this.isolatedEnvironment,
      localModifications: this.localModifications
    };
  }
}
