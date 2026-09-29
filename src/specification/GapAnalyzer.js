/**
 * GapAnalyzer — Discovers testing and specification gaps across program models.
 */

import { Gap } from './Gap.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';

export class GapAnalyzer {
    /**
     * @param {object} params
     * @param {SpecificationSet|Array<any>} [params.specifications=[]]
     * @param {Array<any>} [params.uncoveredBranches=[]]
     * @param {Array<any>} [params.symbolicPaths=[]]
     * @param {Array<any>} [params.survivingMutants=[]]
     * @param {Array<any>} [params.changes=[]]
     * @param {Array<any>} [params.observations=[]]
     * @returns {Array<Gap>}
     */
    findGaps({
        specifications = [],
        uncoveredBranches = [],
        symbolicPaths = [],
        survivingMutants = [],
        changes = [],
        observations = [],
    } = {}) {
        const gaps = [];
        const specList = specifications.specs || (Array.isArray(specifications) ? specifications : []);

        // 1. Untested / Unvalidated specifications
        for (const spec of specList) {
            if (spec.status === 'UNTESTED' || spec.status === 'CANDIDATE') {
                gaps.push(new Gap({
                    kind: 'UNVALIDATED_PROPERTY',
                    functionId: spec.subject?.functionId || 'global',
                    reason: `Specification ${spec.id} (${spec.kind}) has not been validated by tests`,
                    evidence: spec.evidence,
                    confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                    priority: 0.8,
                    suggestedObjective: {
                        specificationId: spec.id,
                        targetCondition: spec.condition || spec.expression || 'true',
                    },
                }));
            }
        }

        // 2. Uncovered branches
        for (const branch of uncoveredBranches) {
            gaps.push(new Gap({
                kind: 'UNCOVERED_BRANCH',
                functionId: branch.functionId || 'global',
                location: branch.location || null,
                reason: `Control flow branch ${branch.id || branch.nodeId} is uncovered`,
                evidence: [`Branch condition: ${branch.condition || 'true'}`],
                confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                priority: 0.9,
                suggestedObjective: {
                    branchId: branch.id,
                    targetCondition: branch.condition,
                },
            }));
        }

        // 3. Surviving mutants (Stage 20 integration)
        for (const mutant of survivingMutants) {
            gaps.push(new Gap({
                kind: 'MUTATION_SURVIVOR',
                functionId: mutant.functionId || 'global',
                location: mutant.location || null,
                reason: `Mutant ${mutant.id} survived existing test suite`,
                evidence: [`Operator: ${mutant.operator || 'mutation'}`],
                confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                priority: 0.92,
                suggestedObjective: {
                    mutantId: mutant.id,
                },
            }));
        }

        // 4. Regression gaps (Stage 21 integration)
        for (const change of changes) {
            gaps.push(new Gap({
                kind: 'REGRESSION_GAP',
                functionId: change.functionIds?.[0] || 'global',
                location: change.sourceLocationAfter || change.sourceLocationBefore,
                reason: `Changed semantic entity ${change.kind} in ${change.fileId || ''} lacks targeted verification`,
                evidence: change.evidence || [],
                confidence: SpecificationConfidence.HIGH_CONFIDENCE,
                priority: 0.95,
                suggestedObjective: {
                    changeId: change.id,
                },
            }));
        }

        return gaps;
    }
}
