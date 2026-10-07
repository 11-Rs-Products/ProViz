/**
 * OSHealth.js
 * Multi-subsystem operational health telemetry and safe mode control.
 */

export class SubsystemHealth {
  /**
   * @param {Object} options
   * @param {string} options.subsystemId
   * @param {boolean} [options.isAvailable=true]
   * @param {number} [options.latencyMs=0]
   * @param {number} [options.errorCount=0]
   * @param {string|null} [options.lastError=null]
   */
  constructor({
    subsystemId,
    isAvailable = true,
    latencyMs = 0,
    errorCount = 0,
    lastError = null
  }) {
    this.subsystemId = subsystemId;
    this.isAvailable = Boolean(isAvailable);
    this.latencyMs = latencyMs;
    this.errorCount = errorCount;
    this.lastError = lastError;
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      subsystemId: this.subsystemId,
      isAvailable: this.isAvailable,
      latencyMs: this.latencyMs,
      errorCount: this.errorCount,
      lastError: this.lastError,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new SubsystemHealth(json);
  }
}

export class OSHealth {
  /**
   * @param {Object} options
   * @param {boolean} options.isHealthy
   * @param {boolean} options.isInSafeMode
   * @param {Object<string, SubsystemHealth>} [options.subsystems={}]
   * @param {string[]} [options.alerts=[]]
   */
  constructor({
    isHealthy = true,
    isInSafeMode = false,
    subsystems = {},
    alerts = []
  } = {}) {
    this.isHealthy = Boolean(isHealthy);
    this.isInSafeMode = Boolean(isInSafeMode);
    this.subsystems = Object.freeze({ ...subsystems });
    this.alerts = Object.freeze([...alerts]);
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      isHealthy: this.isHealthy,
      isInSafeMode: this.isInSafeMode,
      subsystems: this.subsystems,
      alerts: [...this.alerts],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new OSHealth(json);
  }
}

export class SafeModeController {
  constructor() {
    this._isSafeMode = false;
    this._safeModeReason = null;
  }

  get isInSafeMode() {
    return this._isSafeMode;
  }

  get reason() {
    return this._safeModeReason;
  }

  enter(reason = 'Critical safety anomaly') {
    this._isSafeMode = true;
    this._safeModeReason = reason;
  }

  exit() {
    this._isSafeMode = false;
    this._safeModeReason = null;
  }
}

export class SelfDiagnosticEngine {
  constructor() {
    this.safeModeController = new SafeModeController();
    /** @type {Map<string, SubsystemHealth>} */
    this._subsystems = new Map();
  }

  recordSubsystemHealth(healthData) {
    const health = healthData instanceof SubsystemHealth ? healthData : new SubsystemHealth(healthData);
    this._subsystems.set(health.subsystemId, health);
    return health;
  }

  runDiagnostics() {
    const alerts = [];
    let isAllAvailable = true;

    for (const [id, sub] of this._subsystems.entries()) {
      if (!sub.isAvailable) {
        isAllAvailable = false;
        alerts.push(`Subsystem ${id} is unavailable: ${sub.lastError || 'heartbeat timeout'}`);
      }
      if (sub.errorCount > 10) {
        alerts.push(`High error count in subsystem ${id} (${sub.errorCount} errors)`);
      }
    }

    const isHealthy = isAllAvailable && alerts.length === 0;
    if (!isHealthy && !this.safeModeController.isInSafeMode) {
      // Auto enter safe mode if core subsystem failed
      if (!isAllAvailable) {
        this.safeModeController.enter('Core subsystem failure detected during diagnostics');
      }
    }

    return new OSHealth({
      isHealthy,
      isInSafeMode: this.safeModeController.isInSafeMode,
      subsystems: Object.fromEntries(this._subsystems),
      alerts
    });
  }
}
