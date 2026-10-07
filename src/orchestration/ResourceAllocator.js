import { ResourceBudget } from './ResourceBudget.js';
import { ResourceUsage } from './ResourceUsage.js';
import { ResourceAvailability } from './ResourceAvailability.js';

export class ResourceAllocator {
  constructor({ budget = new ResourceBudget() } = {}) {
    this.budget = budget instanceof ResourceBudget ? budget : new ResourceBudget(budget);
    this.allocated = new Map(); // taskId -> ResourceUsage
    this.currentUsage = new ResourceUsage();
  }

  getAvailability() {
    return new ResourceAvailability({
      budget: this.budget,
      currentUsage: this.currentUsage
    });
  }

  canAllocate(task) {
    const reqs = task.resourceRequirements || { cpu: 1, memoryMb: 128, processes: 1 };
    return this.getAvailability().canAdmit(reqs);
  }

  allocate(task) {
    const taskId = String(task.taskId || task.id);
    if (this.allocated.has(taskId)) {
      return this.allocated.get(taskId);
    }

    const reqs = task.resourceRequirements || { cpu: 1, memoryMb: 128, processes: 1 };
    if (!this.canAllocate(task)) {
      return null;
    }

    const taskUsage = new ResourceUsage(reqs);
    this.allocated.set(taskId, taskUsage);
    this.currentUsage = this.currentUsage.add(taskUsage);
    return taskUsage;
  }

  release(taskOrId) {
    const taskId = typeof taskOrId === 'string' ? taskOrId : String(taskOrId.taskId || taskOrId.id);
    if (!this.allocated.has(taskId)) {
      return false;
    }

    const taskUsage = this.allocated.get(taskId);
    this.allocated.delete(taskId);
    this.currentUsage = this.currentUsage.subtract(taskUsage);
    return true;
  }

  reset() {
    this.allocated.clear();
    this.currentUsage = new ResourceUsage();
  }

  toJSON() {
    return {
      budget: this.budget.toJSON(),
      currentUsage: this.currentUsage.toJSON(),
      allocatedTasksCount: this.allocated.size
    };
  }
}
