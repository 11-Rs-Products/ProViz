/**
 * WorkloadGenerator.js
 * Generates synthetic or replayed workload profiles (NORMAL, BOUNDARY, PEAK, BURST, SUSTAINED, RAMP, RANDOM, ADVERSARIAL).
 */

import { WorkloadModel, WorkloadProfile } from './WorkloadModel.js';

export class WorkloadGenerator {
  /**
   * Generates a workload for a specified profile and scale factor.
   * @param {string} profile - WorkloadProfile
   * @param {number} scaleFactor
   * @param {Object} [customParams]
   * @returns {WorkloadModel}
   */
  generateWorkload(profile = WorkloadProfile.NORMAL, scaleFactor = 1.0, customParams = {}) {
    const id = `wl:${profile.toLowerCase()}_s${scaleFactor}_${Date.now()}`;
    const baseConcurrency = customParams.concurrency || 1;
    const baseRate = customParams.requestRate || 100;
    const baseSize = customParams.inputSize || 1000;

    let concurrency = Math.round(baseConcurrency * scaleFactor);
    let requestRate = Math.round(baseRate * scaleFactor);
    let inputSize = Math.round(baseSize * scaleFactor);
    let duration = customParams.durationSeconds || 10;

    switch (profile) {
      case WorkloadProfile.BOUNDARY:
        inputSize = 0; // Empty / boundary condition
        break;
      case WorkloadProfile.PEAK:
        requestRate = baseRate * 5 * scaleFactor;
        concurrency = baseConcurrency * 4 * scaleFactor;
        break;
      case WorkloadProfile.BURST:
        requestRate = baseRate * 10 * scaleFactor;
        duration = 2; // High intensity, short duration
        break;
      case WorkloadProfile.SUSTAINED:
        duration = 60; // Long-running stability test
        break;
      case WorkloadProfile.RAMP:
        requestRate = baseRate * 2 * scaleFactor;
        break;
      case WorkloadProfile.ADVERSARIAL:
        inputSize = baseSize * 50 * scaleFactor;
        concurrency = baseConcurrency * 10 * scaleFactor;
        break;
      default:
        break;
    }

    return new WorkloadModel({
      id,
      name: `${profile} Workload (Scale ${scaleFactor}x)`,
      profile,
      concurrency: Math.max(1, concurrency),
      requestRate: Math.max(1, requestRate),
      inputSize: Math.max(0, inputSize),
      durationSeconds: duration,
      parameters: customParams
    });
  }
}
