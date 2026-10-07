export class VerificationWorkspace {
  constructor({
    workspaceId,
    sourceSnapshot = {},
    dependencySnapshot = {},
    configurationSnapshot = {},
    environmentFingerprint = 'default_env',
    evidenceSnapshot = []
  } = {}) {
    this.workspaceId = workspaceId || `ws_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.sourceSnapshot = Object.freeze({ ...sourceSnapshot });
    this.dependencySnapshot = Object.freeze({ ...dependencySnapshot });
    this.configurationSnapshot = Object.freeze({ ...configurationSnapshot });
    this.environmentFingerprint = String(environmentFingerprint);
    this.evidenceSnapshot = Object.freeze([...evidenceSnapshot]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      workspaceId: this.workspaceId,
      sourceSnapshot: this.sourceSnapshot,
      dependencySnapshot: this.dependencySnapshot,
      configurationSnapshot: this.configurationSnapshot,
      environmentFingerprint: this.environmentFingerprint,
      evidenceCount: this.evidenceSnapshot.length
    };
  }
}
