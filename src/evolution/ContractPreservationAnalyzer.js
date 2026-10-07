/**
 * ContractPreservationAnalyzer.js
 * Verifies that preconditions, postconditions, and API contracts remain satisfied.
 */

export class ContractPreservationAnalyzer {
  evaluate(candidate, originalModel, transformedModel) {
    const origNode = originalModel?.getNode ? originalModel.getNode(candidate.transformation.sourceScope) : null;
    const transNode = transformedModel?.getNode ? transformedModel.getNode(candidate.transformation.targetScope) : null;

    const originalContracts = origNode?.specRelationships || [];
    const transformedContracts = transNode?.specRelationships || [];

    const missingContracts = originalContracts.filter(c => !transformedContracts.includes(c));
    const isPreserved = missingContracts.length === 0;

    return {
      candidateId: candidate.candidateId,
      isPreserved,
      originalContracts,
      transformedContracts,
      missingContracts,
      confidence: isPreserved ? 0.90 : 0.95,
      summary: isPreserved
        ? `All ${originalContracts.length} contracts preserved`
        : `Contract violation: ${missingContracts.length} contracts dropped or weakened`
    };
  }
}
