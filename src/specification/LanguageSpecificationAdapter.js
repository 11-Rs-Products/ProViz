/**
 * LanguageSpecificationAdapter — Abstract interface for language-specific specification adapters.
 */

export class LanguageSpecificationAdapter {
    extractObservations(trace) {
        throw new Error('extractObservations must be implemented by subclass');
    }

    extractBehavior(source) {
        throw new Error('extractBehavior must be implemented by subclass');
    }

    inferContracts(functionAst, observations) {
        throw new Error('inferContracts must be implemented by subclass');
    }

    inferInvariants(functionAst, observations) {
        throw new Error('inferInvariants must be implemented by subclass');
    }

    buildOracle(spec) {
        throw new Error('buildOracle must be implemented by subclass');
    }

    generateInputDomain(parameters, typeInfo) {
        throw new Error('generateInputDomain must be implemented by subclass');
    }
}
