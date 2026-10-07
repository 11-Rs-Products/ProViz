import { CapabilityGap } from './CapabilityGap.js';

/**
 * Matches verification goals/requests against candidate verification agents
 */
export class CapabilityMatcher {
  static matchAgent(agent, requirements = {}) {
    if (!agent) {
      return { isMatch: false, score: 0, missing: ['AGENT_NOT_FOUND'] };
    }

    const missing = [];
    let score = 1.0;

    // Language match
    if (requirements.language) {
      if (!agent.capabilities.supportsLanguage(requirements.language)) {
        missing.push(`LANGUAGE:${requirements.language}`);
        score -= 0.5;
      }
    }

    // Property match
    if (requirements.propertyKind) {
      if (!agent.capabilities.supportsProperty(requirements.propertyKind)) {
        missing.push(`PROPERTY:${requirements.propertyKind}`);
        score -= 0.3;
      }
    }

    // Constraint match
    if (requirements.constraintKind) {
      if (!agent.capabilities.supportsConstraint(requirements.constraintKind)) {
        missing.push(`CONSTRAINT:${requirements.constraintKind}`);
        score -= 0.3;
      }
    }

    // Proof / Evidence match
    if (requirements.preferredEvidence) {
      if (!agent.supportedEvidence.includes(requirements.preferredEvidence) && !agent.supportedEvidence.includes('*')) {
        missing.push(`EVIDENCE:${requirements.preferredEvidence}`);
        score -= 0.2;
      }
    }

    // Agent kind match
    if (requirements.agentKind && agent.kind !== requirements.agentKind) {
      missing.push(`AGENT_KIND:${requirements.agentKind}`);
      score -= 0.4;
    }

    // Environment compatibility
    if (requirements.environmentFingerprint && agent.environmentFingerprint !== requirements.environmentFingerprint) {
      // Not necessarily fatal, but penalizes score
      score -= 0.1;
    }

    const isMatch = missing.length === 0;
    return {
      isMatch,
      score: Math.max(0, score),
      missing: Object.freeze(missing)
    };
  }

  static findGaps(requirements, availableAgents = []) {
    const matchingAgents = availableAgents.filter(a => this.matchAgent(a, requirements).isMatch);
    if (matchingAgents.length > 0) {
      return null;
    }

    const missingLanguages = [];
    const missingProperties = [];
    const missingConstraints = [];
    const missingEvidence = [];

    if (requirements.language && !availableAgents.some(a => a.capabilities.supportsLanguage(requirements.language))) {
      missingLanguages.push(requirements.language);
    }
    if (requirements.propertyKind && !availableAgents.some(a => a.capabilities.supportsProperty(requirements.propertyKind))) {
      missingProperties.push(requirements.propertyKind);
    }
    if (requirements.constraintKind && !availableAgents.some(a => a.capabilities.supportsConstraint(requirements.constraintKind))) {
      missingConstraints.push(requirements.constraintKind);
    }
    if (requirements.preferredEvidence && !availableAgents.some(a => a.supportedEvidence.includes(requirements.preferredEvidence))) {
      missingEvidence.push(requirements.preferredEvidence);
    }

    return new CapabilityGap({
      goalId: requirements.goalId || requirements.taskId || 'gap-goal',
      requiredCapability: requirements.requiredCapability || requirements.propertyKind || 'GENERIC_CAPABILITY',
      missingLanguages,
      missingProperties,
      missingConstraints,
      missingEvidence,
      description: `No registered agent satisfies requirements: ${JSON.stringify(requirements)}`,
      severity: 'HIGH'
    });
  }
}
