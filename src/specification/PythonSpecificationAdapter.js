/**
 * PythonSpecificationAdapter — Python language adapter for specification mining and test synthesis.
 */

import { LanguageSpecificationAdapter } from './LanguageSpecificationAdapter.js';
import { Observation } from './Observation.js';
import { OracleBuilder } from './OracleBuilder.js';

export class PythonSpecificationAdapter extends LanguageSpecificationAdapter {
    /**
     * Extracts concrete Observation instances from Python execution trace steps.
     * @param {Array<object>|object} trace
     * @returns {Array<Observation>}
     */
    extractObservations(trace) {
        if (!trace) return [];
        const events = Array.isArray(trace) ? trace : (trace.events || trace.frames || []);
        const observations = [];

        for (const evt of events) {
            if (evt.type === 'call' || evt.type === 'return' || evt.functionName) {
                observations.push(new Observation({
                    functionId: evt.functionName || 'global',
                    inputs: evt.args || evt.locals || {},
                    returnValue: evt.returnValue,
                    exception: evt.exception ? { type: evt.exception.type || 'Exception', message: evt.exception.message } : null,
                    preState: evt.preLocals || {},
                    postState: evt.postLocals || evt.locals || {},
                    callStack: evt.callStack || [evt.functionName || 'global'],
                    coveredLines: evt.line ? [evt.line] : [],
                }));
            }
        }

        return observations;
    }

    extractBehavior(source) {
        // Extract basic signature parameters and functions from Python source
        const funcMatches = [...source.matchAll(/def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):/g)];
        const functions = funcMatches.map(m => ({
            name: m[1],
            parameters: m[2].split(',').map(p => p.trim()).filter(Boolean),
        }));

        return {
            functions,
            hasExceptions: source.includes('raise') || source.includes('ZeroDivisionError'),
            hasBranches: source.includes('if ') || source.includes('elif ') || source.includes('else:'),
        };
    }

    inferContracts(functionAst, observations) {
        return [];
    }

    inferInvariants(functionAst, observations) {
        return [];
    }

    buildOracle(spec) {
        return OracleBuilder.fromSpecification(spec);
    }

    generateInputDomain(parameters, typeInfo = {}) {
        const domain = {};
        for (const p of parameters) {
            domain[p] = [0, 1, -1, 10, -10, null];
        }
        return domain;
    }
}
