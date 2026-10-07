/**
 * VerificationPipeline.js
 * Coordinates sequential and dependent multi-engine continuous verification pipelines.
 */

import { VerificationRouter } from './VerificationRouter.js';

export class VerificationPipeline {
  /**
   * @param {Object} [options={}]
   * @param {VerificationRouter} [options.router]
   */
  constructor({ router = new VerificationRouter() } = {}) {
    this.router = router;
  }

  /**
   * Organizes obligations into sequential stages respecting pipeline hierarchy.
   * Order: Semantic (29) -> Static (15) -> Contracts (22) -> Security (31) -> Performance (32) -> Concurrency (33) -> Regression (21)
   * @param {Array<import('./VerificationObligation.js').VerificationObligation>} obligations
   * @returns {Array<{ stage: number, engineName: string, obligations: Array<import('./VerificationObligation.js').VerificationObligation> }>}
   */
  buildPipeline(obligations) {
    const stageMap = new Map();

    for (const obl of obligations) {
      const routeInfo = this.router.route(obl);
      if (!stageMap.has(routeInfo.stage)) {
        stageMap.set(routeInfo.stage, {
          stage: routeInfo.stage,
          engineName: routeInfo.engineName,
          obligations: []
        });
      }
      stageMap.get(routeInfo.stage).obligations.push(obl);
    }

    const pipelineStages = Array.from(stageMap.values());
    // Sort according to architectural stage flow
    const stagePriorityOrder = [29, 15, 22, 31, 32, 33, 21, 27];
    pipelineStages.sort((a, b) => {
      const idxA = stagePriorityOrder.indexOf(a.stage);
      const idxB = stagePriorityOrder.indexOf(b.stage);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    return pipelineStages;
  }
}
