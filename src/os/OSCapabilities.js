/**
 * OSCapabilities.js
 * Hardware, memory, thread pool, and solver capabilities discovered at runtime boot.
 */

export class OSCapabilities {
  /**
   * @param {Object} [options]
   * @param {number} [options.concurrencyLimit=8]
   * @param {boolean} [options.symbolicSolverAvailable=true]
   * @param {boolean} [options.distributedFederationSupported=true]
   * @param {boolean} [options.concurrencyModelCheckerSupported=true]
   * @param {boolean} [options.continuousFileWatchSupported=true]
   * @param {number} [options.maxHeapMemoryMb=4096]
   */
  constructor({
    concurrencyLimit = 8,
    symbolicSolverAvailable = true,
    distributedFederationSupported = true,
    concurrencyModelCheckerSupported = true,
    continuousFileWatchSupported = true,
    maxHeapMemoryMb = 4096
  } = {}) {
    this.concurrencyLimit = concurrencyLimit;
    this.symbolicSolverAvailable = Boolean(symbolicSolverAvailable);
    this.distributedFederationSupported = Boolean(distributedFederationSupported);
    this.concurrencyModelCheckerSupported = Boolean(concurrencyModelCheckerSupported);
    this.continuousFileWatchSupported = Boolean(continuousFileWatchSupported);
    this.maxHeapMemoryMb = maxHeapMemoryMb;
    Object.freeze(this);
  }

  toJSON() {
    return {
      concurrencyLimit: this.concurrencyLimit,
      symbolicSolverAvailable: this.symbolicSolverAvailable,
      distributedFederationSupported: this.distributedFederationSupported,
      concurrencyModelCheckerSupported: this.concurrencyModelCheckerSupported,
      continuousFileWatchSupported: this.continuousFileWatchSupported,
      maxHeapMemoryMb: this.maxHeapMemoryMb
    };
  }

  static fromJSON(json) {
    return new OSCapabilities(json);
  }
}
