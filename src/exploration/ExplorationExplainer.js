import { ExplorationFindingKind } from './ExplorationFindingKind.js';

export class ExplorationExplainer {
  static explain(finding) {
    if (!finding) return 'No exploration finding provided.';

    switch (finding.kind) {
      case ExplorationFindingKind.DISCOVERED_NEW_BEHAVIOR:
        return `Discovered new behavioral pattern with fingerprint signature ${finding.evidence?.fingerprint || 'N/A'}. This input expanded program branch/state coverage.`;

      case ExplorationFindingKind.VIOLATED_METAMORPHIC_RELATION:
        return `Metamorphic relation ${finding.metamorphicRelationId || 'MR'} violated. Input transformation produced output contradicting the relational property. Original: ${JSON.stringify(finding.evidence?.sourceOutput)}, Transformed: ${JSON.stringify(finding.evidence?.followUpOutput)}.`;

      case ExplorationFindingKind.KILLED_SURVIVING_MUTANT:
        return `Killed previously surviving mutant ${finding.mutantId}. Input exposed divergent execution behavior distinguishing mutant from baseline.`;

      case ExplorationFindingKind.CLOSED_SPECIFICATION_GAP:
        return `Closed specification gap for spec ${finding.specId}. Generated input exercised previously uncovered condition boundary.`;

      case ExplorationFindingKind.CONFLICTING_BEHAVIOR:
        return `Discovered conflicting behavior where identical input condition yielded inconsistent oracle or metamorphic evaluation results.`;

      case ExplorationFindingKind.DISCOVERED_CRASH_OR_EXCEPTION:
        return `Discovered unexpected execution exception/crash: ${finding.evidence?.error || 'Unhandled error'}.`;

      case ExplorationFindingKind.DISCOVERED_BOUNDARY_VIOLATION:
        return `Discovered boundary violation at boundary point ${finding.evidence?.boundary || 'N/A'}.`;

      case ExplorationFindingKind.MINIMIZED_COUNTEREXAMPLE:
        return `Successfully minimized counterexample from size ${finding.evidence?.originalSize || 'N/A'} to ${finding.evidence?.minimizedSize || 'N/A'}.`;

      default:
        return finding.description || 'Exploration finding recorded.';
    }
  }
}
