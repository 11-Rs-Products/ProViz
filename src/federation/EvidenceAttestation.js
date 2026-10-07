/**
 * Cryptographic / verifiable attestation of execution provenance for Byzantine resistance
 */
export class EvidenceAttestation {
  constructor({
    agentIdentity,
    agentVersion = '1.0.0',
    environment = 'default-env',
    taskFingerprint,
    inputFingerprint,
    outputFingerprint,
    executionTrace = [],
    timestamp = Date.now(),
    signature = null
  } = {}) {
    this.agentIdentity = agentIdentity;
    this.agentVersion = agentVersion;
    this.environment = environment;
    this.taskFingerprint = taskFingerprint;
    this.inputFingerprint = inputFingerprint;
    this.outputFingerprint = outputFingerprint;
    this.executionTrace = Object.freeze([...executionTrace]);
    this.timestamp = timestamp;
    this.signature = signature || this._computeSignature();
    Object.freeze(this);
  }

  _computeSignature() {
    return `attest-${this.agentIdentity}:${this.taskFingerprint}:${this.outputFingerprint}`;
  }

  toJSON() {
    return {
      agentIdentity: this.agentIdentity,
      agentVersion: this.agentVersion,
      environment: this.environment,
      taskFingerprint: this.taskFingerprint,
      inputFingerprint: this.inputFingerprint,
      outputFingerprint: this.outputFingerprint,
      executionTrace: [...this.executionTrace],
      timestamp: this.timestamp,
      signature: this.signature
    };
  }

  static fromJSON(json = {}) {
    return new EvidenceAttestation(json);
  }
}
