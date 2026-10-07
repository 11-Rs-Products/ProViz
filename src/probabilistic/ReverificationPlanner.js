import { ReverificationPriority, PriorityLevel } from './ReverificationPriority.js';

export class ReverificationPlanner {
  /**
   * Prioritize subjects for re-verification.
   */
  static plan(subjects = [], context = {}) {
    const priorities = [];

    for (const sub of subjects) {
      let score = 0.3;
      const reasons = [];

      if (context.regressedSubjects?.includes(sub)) {
        score += 0.5;
        reasons.push('Recent regression detected');
      }
      if (context.survivedMutants?.includes(sub)) {
        score += 0.3;
        reasons.push('Surviving mutant in subject');
      }
      if (context.lowConfidenceSubjects?.includes(sub)) {
        score += 0.2;
        reasons.push('Degraded confidence');
      }
      if (context.staleSubjects?.includes(sub)) {
        score += 0.1;
        reasons.push('Stale verification evidence');
      }

      score = Math.min(1.0, score);
      let level = PriorityLevel.LOW;
      if (score >= 0.8) level = PriorityLevel.CRITICAL;
      else if (score >= 0.6) level = PriorityLevel.HIGH;
      else if (score >= 0.4) level = PriorityLevel.MEDIUM;

      priorities.push(
        new ReverificationPriority({
          subject: sub,
          priorityLevel: level,
          priorityScore: score,
          reasons
        })
      );
    }

    return priorities.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
