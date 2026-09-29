/**
 * LanguageRegressionAdapter — Abstract language adapter for change detection and regression analysis.
 */

export class LanguageRegressionAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    detectChanges(beforeCode, afterCode) {
        throw new Error('detectChanges must be implemented by concrete language adapter');
    }

    matchSemanticEntities(beforeEntities, afterEntities) {
        throw new Error('matchSemanticEntities must be implemented by concrete language adapter');
    }

    buildStructuralDiff(beforeSnapshot, afterSnapshot) {
        throw new Error('buildStructuralDiff must be implemented by concrete language adapter');
    }

    buildControlFlowImpact(beforeCode, afterCode) {
        throw new Error('buildControlFlowImpact must be implemented by concrete language adapter');
    }

    buildDataflowImpact(beforeCode, afterCode) {
        throw new Error('buildDataflowImpact must be implemented by concrete language adapter');
    }

    buildTypeImpact(beforeCode, afterCode) {
        throw new Error('buildTypeImpact must be implemented by concrete language adapter');
    }

    buildSymbolicImpact(beforeCode, afterCode) {
        throw new Error('buildSymbolicImpact must be implemented by concrete language adapter');
    }

    extractTestCoverage(traceEvents, cfg = null) {
        throw new Error('extractTestCoverage must be implemented by concrete language adapter');
    }
}
