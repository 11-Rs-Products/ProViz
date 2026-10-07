/**
 * PerformanceOptimizationCandidate.js
 * Represents candidate performance optimizations:
 * algorithm change, cache, memoization, allocation reduction, IO batching, data structure replacement, parallelization, lazy eval.
 */

export const OptimizationStrategy = Object.freeze({
  ALGORITHM_REPLACEMENT: 'ALGORITHM_REPLACEMENT',
  MEMOIZATION: 'MEMOIZATION',
  CACHE: 'CACHE',
  ALLOCATION_REDUCTION: 'ALLOCATION_REDUCTION',
  IO_BATCHING: 'IO_BATCHING',
  DATA_STRUCTURE_REPLACEMENT: 'DATA_STRUCTURE_REPLACEMENT',
  PARALLELIZATION: 'PARALLELIZATION',
  LAZY_EVALUATION: 'LAZY_EVALUATION'
});

export class PerformanceOptimizationCandidate {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.targetSymbol
   * @param {string} options.strategy - OptimizationStrategy
   * @param {string} options.targetFile
   * @param {string} options.patchContent
   * @param {number} [options.predictedSpeedup=1.2]
   * @param {number} [options.predictedMemoryReduction=0.1]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    targetSymbol,
    strategy = OptimizationStrategy.MEMOIZATION,
    targetFile,
    patchContent,
    predictedSpeedup = 1.2,
    predictedMemoryReduction = 0.1,
    metadata = {}
  }) {
    if (!id || !targetSymbol || !targetFile || !patchContent) {
      throw new Error('PerformanceOptimizationCandidate requires id, targetSymbol, targetFile, and patchContent');
    }
    this.id = id;
    this.targetSymbol = targetSymbol;
    this.strategy = strategy;
    this.targetFile = targetFile;
    this.patchContent = patchContent;
    this.predictedSpeedup = Math.max(1.0, Number(predictedSpeedup) || 1.2);
    this.predictedMemoryReduction = Math.max(0.0, Math.min(1.0, Number(predictedMemoryReduction) || 0.1));
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      targetSymbol: this.targetSymbol,
      strategy: this.strategy,
      targetFile: this.targetFile,
      patchContent: this.patchContent,
      predictedSpeedup: this.predictedSpeedup,
      predictedMemoryReduction: this.predictedMemoryReduction,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new PerformanceOptimizationCandidate(json);
  }
}
