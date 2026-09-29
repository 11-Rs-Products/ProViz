/**
 * SpecificationAnalyzer — High-level analyzer orchestrating mining, objective generation, test synthesis, and adequacy measurement.
 */

import { SpecificationMiner } from './SpecificationMiner.js';
import { TestObjectiveGenerator } from './TestObjectiveGenerator.js';
import { TestSynthesizer } from './TestSynthesizer.js';
import { AdequacyAnalyzer } from './AdequacyAnalyzer.js';
import { GapAnalyzer } from './GapAnalyzer.js';
import { OracleBuilder } from './OracleBuilder.js';
import { SpecificationSnapshot } from './SpecificationSnapshot.js';
import { ObservationSet } from './ObservationSet.js';

export class SpecificationAnalyzer {
    constructor(options = {}) {
        this.options = Object.freeze({
            maxSpecifications: options.maxSpecifications || 1000,
            maxObjectives: options.maxObjectives || 1000,
            maxGeneratedTests: options.maxGeneratedTests || 1000,
            ...options,
        });

        this.miner = new SpecificationMiner(this.options);
        this.objGen = new TestObjectiveGenerator(this.options);
        this.synthesizer = new TestSynthesizer(this.options);
        this.adequacyAnalyzer = new AdequacyAnalyzer();
        this.gapAnalyzer = new GapAnalyzer();
    }

    /**
     * Runs full specification analysis and test synthesis on a function and its observations.
     * @param {object} params
     * @param {string} [params.functionId='global']
     * @param {Array<string>} [params.parameters=['a', 'b']]
     * @param {Array<object>|ObservationSet} [params.observations=[]]
     * @param {Array<object>} [params.uncoveredBranches=[]]
     * @param {Array<object>} [params.symbolicPaths=[]]
     * @param {Array<object>} [params.survivingMutants=[]]
     * @param {Array<object>} [params.changes=[]]
     * @returns {SpecificationSnapshot}
     */
    analyze({
        functionId = 'global',
        parameters = ['a', 'b'],
        observations = [],
        uncoveredBranches = [],
        symbolicPaths = [],
        survivingMutants = [],
        changes = [],
    } = {}) {
        const obsSet = observations instanceof ObservationSet ? observations : new ObservationSet(observations);

        // 1. Mine specifications and behavior model
        const { specifications, behaviorModel } = this.miner.mine(functionId, obsSet);

        // 2. Build oracles from specifications
        const oracles = specifications.map(s => OracleBuilder.fromSpecification(s)).filter(Boolean);

        // 3. Find gaps
        const gaps = this.gapAnalyzer.findGaps({
            specifications,
            uncoveredBranches,
            symbolicPaths,
            survivingMutants,
            changes,
            observations: obsSet.observations,
        });

        // 4. Generate test objectives
        const objectives = this.objGen.generateAll({
            functionId,
            parameters,
            specifications: specifications.specs,
            uncoveredBranches,
            symbolicPaths,
            survivingMutants,
            changes,
            gaps,
        });

        // 5. Synthesize test cases
        const generatedTests = this.synthesizer.synthesizeAll(objectives, {
            functionId,
            parameters,
            specifications: specifications.specs,
        });

        // 6. Measure adequacy
        const adequacyResults = this.adequacyAnalyzer.analyze(specifications, oracles, obsSet.observations);

        return new SpecificationSnapshot({
            specifications,
            behaviorModel,
            observations: obsSet,
            oracles,
            objectives,
            generatedTests,
            adequacyResults,
            gaps,
            metadata: {
                functionId,
                parameters,
            },
        });
    }
}
