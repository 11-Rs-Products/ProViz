/**
 * PipelineExecutor.js
 * Executes scheduled verification pipeline phases sequentially or concurrently with phase result tracking.
 */

import { VerificationPhaseResult } from './VerificationPhaseResult.js';

export class PipelineExecutor {
  /**
   * @param {Object} [options]
   * @param {Object<string, Function>} [options.phaseHandlers={}]
   */
  constructor(options = {}) {
    this.phaseHandlers = { ...options.phaseHandlers };
  }

  registerPhaseHandler(phase, handler) {
    this.phaseHandlers[phase] = handler;
  }

  /**
   * Execute planned pipeline
   * @param {Object} plan
   * @param {Object} context
   */
  async execute(plan, context = {}) {
    const results = [];
    let currentContext = { ...context };

    for (const phase of plan.phases) {
      const start = performance.now();
      const handler = this.phaseHandlers[phase];

      try {
        let output = {};
        if (handler) {
          output = await handler(currentContext);
          currentContext = { ...currentContext, ...output };
        }
        const durationMs = performance.now() - start;
        results.push(new VerificationPhaseResult({
          phase,
          isSuccess: true,
          output,
          durationMs
        }));
      } catch (err) {
        const durationMs = performance.now() - start;
        results.push(new VerificationPhaseResult({
          phase,
          isSuccess: false,
          errors: [err.message || String(err)],
          durationMs
        }));
        break; // Stop on unhandled phase failure
      }
    }

    const isAllSuccess = results.every(r => r.isSuccess);

    return {
      planId: plan.planId,
      isSuccess: isAllSuccess,
      results,
      finalContext: currentContext,
      completedPhaseCount: results.length
    };
  }
}
