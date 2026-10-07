/**
 * Represents the execution environment of a verification agent
 */
export class FederatedEnvironment {
  constructor({
    runtime = 'node',
    runtimeVersion = '20.0.0',
    os = 'darwin',
    architecture = 'arm64',
    compiler = null,
    interpreter = null,
    dependencies = {},
    environmentVariables = {},
    locale = 'en_US.UTF-8',
    timezone = 'UTC',
    hardware = { cores: 8, memoryGB: 16 },
    container = null,
    fingerprint = null
  } = {}) {
    this.runtime = runtime;
    this.runtimeVersion = runtimeVersion;
    this.os = os;
    this.architecture = architecture;
    this.compiler = compiler;
    this.interpreter = interpreter;
    this.dependencies = Object.freeze({ ...dependencies });
    this.environmentVariables = Object.freeze({ ...environmentVariables });
    this.locale = locale;
    this.timezone = timezone;
    this.hardware = Object.freeze({ ...hardware });
    this.container = container;
    this.fingerprint = fingerprint || this._computeFingerprint();
    Object.freeze(this);
  }

  _computeFingerprint() {
    return `${this.runtime}-${this.runtimeVersion}:${this.os}-${this.architecture}:${this.locale}`;
  }

  toJSON() {
    return {
      runtime: this.runtime,
      runtimeVersion: this.runtimeVersion,
      os: this.os,
      architecture: this.architecture,
      compiler: this.compiler,
      interpreter: this.interpreter,
      dependencies: { ...this.dependencies },
      environmentVariables: { ...this.environmentVariables },
      locale: this.locale,
      timezone: this.timezone,
      hardware: { ...this.hardware },
      container: this.container,
      fingerprint: this.fingerprint
    };
  }

  static fromJSON(json = {}) {
    return new FederatedEnvironment(json);
  }
}
