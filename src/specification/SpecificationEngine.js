/**
 * SpecificationEngine — Master runtime engine executing synthesized tests and refining specifications.
 */

import { SpecificationAnalyzer } from './SpecificationAnalyzer.js';
import { SpecificationQueries } from './SpecificationQueries.js';
import { SpecificationSnapshot } from './SpecificationSnapshot.js';
import { OracleEvaluator } from './OracleEvaluator.js';
import { SpecificationRefiner } from './SpecificationRefiner.js';

export class SpecificationEngine {
    constructor(options = {}) {
        this.options = Object.freeze({
            maxExecutionTime: options.maxExecutionTime || 10000,
            ...options,
        });

        this.analyzer = new SpecificationAnalyzer(this.options);
        this._snapshotCache = new Map();
    }

    /**
     * Mines specifications and synthesizes test suite.
     * @param {object} params
     * @returns {SpecificationSnapshot}
     */
    analyze(params = {}) {
        const snapshot = this.analyzer.analyze(params);
        this._snapshotCache.set(snapshot.id, snapshot);
        return snapshot;
    }

    /**
     * Executes synthesized tests against a workspace snapshot or executor function.
     * @param {SpecificationSnapshot} snapshot
     * @param {Function} executor - (inputs) => ({ returnValue, exception })
     * @returns {{ snapshot: SpecificationSnapshot, results: Array<object> }}
     */
    runTests(snapshot, executor) {
        if (!snapshot || !executor) {
            return { snapshot, results: [] };
        }

        const results = [];
        let updatedObs = snapshot.observations;
        let updatedSpecs = snapshot.specifications;

        for (const test of snapshot.generatedTests) {
            let outcome = null;
            try {
                const res = executor(test.inputs);
                outcome = {
                    functionId: test.targetFunction,
                    inputs: test.inputs,
                    returnValue: res?.returnValue,
                    exception: res?.exception || null,
                };
            } catch (err) {
                outcome = {
                    functionId: test.targetFunction,
                    inputs: test.inputs,
                    returnValue: undefined,
                    exception: { type: err.name || 'Error', message: err.message },
                };
            }

            updatedObs = updatedObs.add(outcome);

            // Evaluate oracle
            let oracleResult = null;
            if (test.oracle) {
                oracleResult = OracleEvaluator.evaluate(test.oracle, outcome);
            }

            // If oracle failed, refine / invalidate associated specification
            if (oracleResult?.status === 'FAIL' && test.oracle?.specificationId) {
                const spec = updatedSpecs.get(test.oracle.specificationId);
                if (spec) {
                    const refined = SpecificationRefiner.refineWithObservation(spec, outcome);
                    updatedSpecs = updatedSpecs.add(refined);
                }
            }

            results.push({
                testId: test.id,
                inputs: test.inputs,
                outcome,
                oracleResult,
                passed: oracleResult ? oracleResult.status === 'PASS' : true,
            });
        }

        const newSnapshot = new SpecificationSnapshot({
            specifications: updatedSpecs,
            behaviorModel: snapshot.behaviorModel,
            observations: updatedObs,
            oracles: snapshot.oracles,
            objectives: snapshot.objectives,
            generatedTests: snapshot.generatedTests,
            adequacyResults: snapshot.adequacyResults,
            gaps: snapshot.gaps,
            metadata: snapshot.metadata,
        });

        this._snapshotCache.set(newSnapshot.id, newSnapshot);
        return {
            snapshot: newSnapshot,
            results,
        };
    }

    /**
     * Returns queries for a snapshot.
     * @param {SpecificationSnapshot} snapshot
     * @returns {SpecificationQueries}
     */
    query(snapshot) {
        return new SpecificationQueries(snapshot);
    }
}
