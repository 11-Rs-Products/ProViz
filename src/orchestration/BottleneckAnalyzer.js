export class BottleneckAnalyzer {
  static analyzeBottlenecks(scheduler, resourceAllocator, concurrencyController) {
    const bottlenecks = [];

    // Check resource bottlenecks
    const availability = resourceAllocator.getAvailability();
    if (availability.availableCpu <= 1) {
      bottlenecks.push({ type: 'CPU_STARVATION', severity: 'HIGH', detail: 'Available CPU is depleted' });
    }
    if (availability.availableMemoryMb <= 256) {
      bottlenecks.push({ type: 'MEMORY_PRESSURE', severity: 'HIGH', detail: 'Available memory is depleted' });
    }

    // Check concurrency bottlenecks
    if (concurrencyController.runningTasks.size >= concurrencyController.policy.maxConcurrentTasks) {
      bottlenecks.push({ type: 'MAX_CONCURRENCY_SATURATION', severity: 'MEDIUM', detail: 'Worker slots full' });
    }

    return bottlenecks;
  }
}
