/**
 * StressTest.js
 * Defines multi-dimensional stress testing campaigns: LOAD, CONCURRENCY, INPUT_SIZE, MEMORY_PRESSURE, CPU_PRESSURE, IO_PRESSURE, NETWORK_PRESSURE, QUEUE_PRESSURE.
 */

export const StressDimension = Object.freeze({
  LOAD: 'LOAD',
  CONCURRENCY: 'CONCURRENCY',
  INPUT_SIZE: 'INPUT_SIZE',
  MEMORY_PRESSURE: 'MEMORY_PRESSURE',
  CPU_PRESSURE: 'CPU_PRESSURE',
  IO_PRESSURE: 'IO_PRESSURE',
  NETWORK_PRESSURE: 'NETWORK_PRESSURE',
  QUEUE_PRESSURE: 'QUEUE_PRESSURE'
});

export class StressTest {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.dimension=StressDimension.LOAD]
   * @param {number} [options.intensityLevel=5] - 1 to 10
   * @param {number} [options.durationSeconds=10]
   * @param {Object} [options.parameters={}]
   */
  constructor({
    id,
    name = '',
    dimension = StressDimension.LOAD,
    intensityLevel = 5,
    durationSeconds = 10,
    parameters = {}
  }) {
    if (!id) throw new Error('StressTest requires id');
    this.id = id;
    this.name = name || id;
    this.dimension = dimension;
    this.intensityLevel = Math.max(1, Math.min(10, Number(intensityLevel) || 5));
    this.durationSeconds = Math.max(1, Number(durationSeconds) || 10);
    this.parameters = Object.freeze({ ...parameters });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      dimension: this.dimension,
      intensityLevel: this.intensityLevel,
      durationSeconds: this.durationSeconds,
      parameters: { ...this.parameters }
    };
  }

  static fromJSON(json) {
    return new StressTest(json);
  }
}
