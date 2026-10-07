/**
 * AutonomousVerificationPipeline.js
 * Master coordinator unifying observation, impact analysis, verification, diagnosis, repair, reverification, governance, and certification into a continuous autonomous pipeline.
 */

import { PipelinePlanner } from './PipelinePlanner.js';
import { PipelineExecutor } from './PipelineExecutor.js';
import { PipelineRecovery } from './PipelineRecovery.js';
import { VerificationPhase } from './VerificationPhase.js';

export class AutonomousVerificationPipeline {
  /**
   * @param {Object} [options]
   * @param {PipelinePlanner} [options.planner]
   * @param {PipelineExecutor} [options.executor]
   */
  constructor(options = {}) {
    this.planner = options.planner || new PipelinePlanner();
    this.executor = options.executor || new PipelineExecutor();
    this.recovery = new PipelineRecovery();
  }

  registerPhaseHandler(phase, handler) {
    this.executor.registerPhaseHandler(phase, handler);
  }

  async runPipeline(options = {}, context = {}) {
    const plan = this.planner.plan(options);
    return await this.executor.execute(plan, context);
  }
}
