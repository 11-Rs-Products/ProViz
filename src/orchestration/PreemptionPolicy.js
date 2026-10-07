export class PreemptionPolicy {
  constructor({
    allowPreemption = true,
    minPriorityDelta = 5,
    preemptibleKinds = []
  } = {}) {
    this.allowPreemption = Boolean(allowPreemption);
    this.minPriorityDelta = Number(minPriorityDelta);
    this.preemptibleKinds = Object.freeze([...preemptibleKinds]);
    Object.freeze(this);
  }

  shouldPreempt(runningTask, candidateTask) {
    if (!this.allowPreemption) return false;
    const pDiff = (candidateTask.priority || 0) - (runningTask.priority || 0);
    return pDiff >= this.minPriorityDelta;
  }
}
