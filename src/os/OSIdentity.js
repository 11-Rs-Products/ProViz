/**
 * OSIdentity.js
 * Unique identity and environment attestation for a ProViz OS runtime instance.
 */

import { OSVersion } from './OSVersion.js';

export class OSIdentity {
  /**
   * @param {Object} [options]
   * @param {string} [options.instanceId]
   * @param {string} [options.nodeId]
   * @param {string} [options.clusterId]
   * @param {number} [options.startTime]
   * @param {Object} [options.environment]
   */
  constructor({
    instanceId,
    nodeId = 'proviz-node-01',
    clusterId = 'local-cluster',
    startTime = Date.now(),
    environment = {}
  } = {}) {
    this.instanceId = instanceId || `proviz-os-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.nodeId = nodeId;
    this.clusterId = clusterId;
    this.startTime = startTime;
    this.version = OSVersion.VERSION;
    this.environment = Object.freeze({
      arch: typeof process !== 'undefined' ? process.arch : 'wasm',
      platform: typeof process !== 'undefined' ? process.platform : 'browser',
      nodeVersion: typeof process !== 'undefined' ? process.version : 'v22',
      ...environment
    });
    Object.freeze(this);
  }

  toJSON() {
    return {
      instanceId: this.instanceId,
      nodeId: this.nodeId,
      clusterId: this.clusterId,
      startTime: this.startTime,
      version: this.version,
      environment: this.environment
    };
  }

  static fromJSON(json) {
    return new OSIdentity(json);
  }
}
