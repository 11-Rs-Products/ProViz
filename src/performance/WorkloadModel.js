/**
 * WorkloadModel.js
 * Represents operational workload configurations and traffic distributions.
 */

export const WorkloadDimension = Object.freeze({
  REQUEST_RATE: 'REQUEST_RATE',
  INPUT_SIZE: 'INPUT_SIZE',
  DATASET_SIZE: 'DATASET_SIZE',
  CONCURRENCY: 'CONCURRENCY',
  TRANSACTION_VOLUME: 'TRANSACTION_VOLUME',
  MESSAGE_RATE: 'MESSAGE_RATE',
  BATCH_SIZE: 'BATCH_SIZE',
  ITERATION_COUNT: 'ITERATION_COUNT'
});

export const WorkloadProfile = Object.freeze({
  NORMAL: 'NORMAL',
  BOUNDARY: 'BOUNDARY',
  PEAK: 'PEAK',
  BURST: 'BURST',
  SUSTAINED: 'SUSTAINED',
  RAMP: 'RAMP',
  RANDOM: 'RANDOM',
  ADVERSARIAL: 'ADVERSARIAL',
  PRODUCTION_REPLAY: 'PRODUCTION_REPLAY'
});

export class WorkloadModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.profile=WorkloadProfile.NORMAL]
   * @param {number} [options.concurrency=1]
   * @param {number} [options.requestRate=100] - requests per second
   * @param {number} [options.inputSize=1000] - elements / bytes
   * @param {number} [options.durationSeconds=10]
   * @param {Object} [options.parameters={}]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    profile = WorkloadProfile.NORMAL,
    concurrency = 1,
    requestRate = 100,
    inputSize = 1000,
    durationSeconds = 10,
    parameters = {},
    metadata = {}
  }) {
    if (!id) throw new Error('WorkloadModel requires id');
    this.id = id;
    this.name = name || id;
    this.profile = profile;
    this.concurrency = concurrency !== undefined ? Math.max(1, Number(concurrency)) : 1;
    this.requestRate = requestRate !== undefined ? Math.max(0, Number(requestRate)) : 100;
    this.inputSize = inputSize !== undefined ? Math.max(0, Number(inputSize)) : 1000;
    this.durationSeconds = durationSeconds !== undefined ? Math.max(0.1, Number(durationSeconds)) : 10;
    this.parameters = Object.freeze({ ...parameters });
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  get totalOperations() {
    return Math.round(this.requestRate * this.durationSeconds);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      profile: this.profile,
      concurrency: this.concurrency,
      requestRate: this.requestRate,
      inputSize: this.inputSize,
      durationSeconds: this.durationSeconds,
      totalOperations: this.totalOperations,
      parameters: { ...this.parameters },
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new WorkloadModel(json);
  }
}
