/**
 * AdequacyAnalyzer — Analyzes test adequacy and computes specification/oracle/behavioral coverage.
 */

import { AdequacyResult } from './AdequacyResult.js';
import { SpecificationCoverage } from './SpecificationCoverage.js';
import { OracleCoverage } from './OracleCoverage.js';
import { BehavioralCoverage } from './BehavioralCoverage.js';
import { OracleEvaluator } from './OracleEvaluator.js';

export class AdequacyAnalyzer {
    /**
     * @param {SpecificationSet|Array<any>} specifications
     * @param {Array<any>} oracles
     * @param {Array<any>} observations
     * @returns {AdequacyResult}
     */
    analyze(specifications, oracles = [], observations = []) {
        const specList = specifications.specs || (Array.isArray(specifications) ? specifications : []);
        const totalSpecs = specList.length;

        let exercisedSpecs = 0;
        let validatedSpecs = 0;
        let violatedSpecs = 0;
        let untestedSpecs = 0;
        let inconclusiveSpecs = 0;

        for (const spec of specList) {
            if (spec.status === 'VALIDATED') {
                exercisedSpecs++;
                validatedSpecs++;
            } else if (spec.status === 'VIOLATED') {
                exercisedSpecs++;
                violatedSpecs++;
            } else if (spec.status === 'INCONCLUSIVE') {
                inconclusiveSpecs++;
            } else if (spec.status === 'MINED' || spec.status === 'CANDIDATE') {
                exercisedSpecs++;
            } else {
                untestedSpecs++;
            }
        }

        const specCoverage = new SpecificationCoverage({
            total: totalSpecs,
            exercised: exercisedSpecs,
            validated: validatedSpecs,
            violated: violatedSpecs,
            untested: untestedSpecs,
            inconclusive: inconclusiveSpecs,
        });

        // Evaluate oracles
        let passedOracles = 0;
        let failedOracles = 0;
        let inconcOracles = 0;

        for (const oracle of oracles) {
            let hasRun = false;
            for (const obs of observations) {
                const res = OracleEvaluator.evaluate(oracle, obs);
                if (res.status === 'PASS') {
                    passedOracles++;
                    hasRun = true;
                    break;
                } else if (res.status === 'FAIL') {
                    failedOracles++;
                    hasRun = true;
                    break;
                }
            }
            if (!hasRun) inconcOracles++;
        }

        const oracleCoverage = new OracleCoverage({
            total: oracles.length,
            passed: passedOracles,
            failed: failedOracles,
            inconclusive: inconcOracles,
        });

        // Behavioral regions
        const regions = new Set();
        for (const obs of observations) {
            if (obs.exception) regions.add('EXCEPTION');
            else if (obs.inputs?.b === 0) regions.add('BOUNDARY');
            else regions.add('NORMAL');
        }

        const allTargetRegions = ['NORMAL', 'BOUNDARY', 'EXCEPTION'];
        const behavioralCoverage = new BehavioralCoverage({
            totalRegions: allTargetRegions.length,
            coveredRegions: regions.size,
            regions: [...regions],
        });

        const overall = (specCoverage.coverageRatio * 0.4) +
            (oracleCoverage.passRatio * 0.3) +
            (behavioralCoverage.coverageRatio * 0.3);

        return new AdequacyResult({
            specificationCoverage: specCoverage,
            oracleCoverage,
            behavioralCoverage,
            overallScore: Math.round(overall * 100) / 100,
            components: {
                specCoverage: specCoverage.coverageRatio,
                oracleCoverage: oracleCoverage.passRatio,
                behavioralCoverage: behavioralCoverage.coverageRatio,
            },
        });
    }
}
