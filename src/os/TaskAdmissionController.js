/**
 * TaskAdmissionController.js
 * Controls admission of incoming verification tasks into the active execution queue based on resource quotas.
 */

export class TaskAdmissionController {
  /**
   * @param {import('./GlobalResourceBudget.js').ResourceBudgetManager} budgetManager
   */
  constructor(budgetManager) {
    this.budgetManager = budgetManager;
  }

  canAdmit(task) {
    if (!this.budgetManager) return true;
    const cost = task.costEstimate || { estimatedMemoryMb: 50 };
    return this.budgetManager.canAdmitTask(cost);
  }
}
