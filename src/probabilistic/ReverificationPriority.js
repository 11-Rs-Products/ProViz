export const PriorityLevel = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
});

export class ReverificationPriority {
  constructor({
    subject,
    priorityLevel = PriorityLevel.MEDIUM,
    priorityScore = 0.5,
    reasons = []
  }) {
    this.subject = subject;
    this.priorityLevel = priorityLevel;
    this.priorityScore = priorityScore;
    this.reasons = Object.freeze([...reasons]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      priorityLevel: this.priorityLevel,
      priorityScore: this.priorityScore,
      reasons: this.reasons
    };
  }
}
