import { TaskFingerprint } from './TaskFingerprint.js';
import { TaskReusePolicy } from './TaskReusePolicy.js';

export class DuplicateTaskDetector {
  constructor({ policy = TaskReusePolicy.REUSE_IDENTICAL } = {}) {
    this.policy = policy;
    this.fingerprintIndex = new Map(); // fingerprint -> VerificationTask / result
  }

  registerCompletedTask(task, result) {
    const fp = TaskFingerprint.compute(task);
    this.fingerprintIndex.set(fp, { task, result, timestamp: Date.now() });
  }

  findDuplicate(task) {
    if (this.policy === TaskReusePolicy.NEVER_REUSE) return null;
    const fp = TaskFingerprint.compute(task);
    if (this.fingerprintIndex.has(fp)) {
      return this.fingerprintIndex.get(fp);
    }
    return null;
  }

  isDuplicate(task) {
    return this.findDuplicate(task) !== null;
  }

  filterDuplicates(tasks = []) {
    const unique = [];
    const seen = new Set();

    for (const task of tasks) {
      const fp = TaskFingerprint.compute(task);
      if (!seen.has(fp) && !this.isDuplicate(task)) {
        seen.add(fp);
        unique.push(task);
      }
    }
    return unique;
  }
}
