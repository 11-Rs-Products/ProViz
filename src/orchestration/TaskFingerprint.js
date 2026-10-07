export class TaskFingerprint {
  static compute(task, workspaceFingerprint = 'default') {
    const raw = [
      workspaceFingerprint,
      task.kind || 'UNKNOWN',
      task.subject || 'root',
      JSON.stringify(task.inputs || {}),
      JSON.stringify(task.environmentRequirements || {})
    ].join('::');

    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `fp_${task.kind}_${Math.abs(hash).toString(16)}`;
  }
}
