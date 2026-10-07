/**
 * AllocationAnalyzer.js
 * Tracks allocation frequency, rate, and allocation hotspots across functions and loops.
 */

export class AllocationHotspot {
  constructor({ functionId, allocationRateBytesPerSec, totalAllocationsBytes, objectCount = 0 }) {
    this.functionId = functionId;
    this.allocationRateBytesPerSec = allocationRateBytesPerSec;
    this.totalAllocationsBytes = totalAllocationsBytes;
    this.objectCount = objectCount;
    Object.freeze(this);
  }

  toJSON() {
    return {
      functionId: this.functionId,
      allocationRateBytesPerSec: this.allocationRateBytesPerSec,
      totalAllocationsBytes: this.totalAllocationsBytes,
      objectCount: this.objectCount
    };
  }
}

export class AllocationAnalyzer {
  /**
   * Identifies allocation hotspots from profile or execution context.
   * @param {Object} profileResult
   * @param {number} [durationSeconds=1]
   * @returns {Array<AllocationHotspot>}
   */
  findAllocationHotspots(profileResult = {}, durationSeconds = 1) {
    const samples = profileResult.samples || [];
    const hotspots = [];
    const sec = Math.max(0.1, durationSeconds);

    for (const s of samples) {
      if (s.allocationsBytes > 0) {
        hotspots.push(new AllocationHotspot({
          functionId: s.functionId,
          totalAllocationsBytes: s.allocationsBytes,
          allocationRateBytesPerSec: Math.round(s.allocationsBytes / sec),
          objectCount: Math.round(s.allocationsBytes / 64)
        }));
      }
    }

    hotspots.sort((a, b) => b.totalAllocationsBytes - a.totalAllocationsBytes);
    return hotspots;
  }
}
