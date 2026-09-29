/**
 * PythonRegressionAdapter — Python-specific implementation of regression intelligence adapter.
 */

import { LanguageRegressionAdapter } from './LanguageRegressionAdapter.js';
import { StructuralDiff } from './StructuralDiff.js';
import { AnalysisDiff } from './AnalysisDiff.js';
import { ControlFlowAnalyzer } from '../analysis/ControlFlowAnalyzer.js';
import { DataflowAnalyzer } from '../dataflow/DataflowAnalyzer.js';
import { TypeFlowAnalyzer } from '../typeflow/TypeFlowAnalyzer.js';
import { SymbolicAnalyzer } from '../symbolic/SymbolicAnalyzer.js';
import { CoverageAnalyzer } from '../testing/CoverageAnalyzer.js';

export class PythonRegressionAdapter extends LanguageRegressionAdapter {
    constructor() {
        super('python');
    }

    detectChanges(beforeSnapshot, afterSnapshot) {
        return StructuralDiff.diff(beforeSnapshot, afterSnapshot);
    }

    buildStructuralDiff(beforeSnapshot, afterSnapshot) {
        return StructuralDiff.diff(beforeSnapshot, afterSnapshot);
    }

    buildControlFlowImpact(beforeCode, afterCode) {
        const cfgB = ControlFlowAnalyzer.analyze(beforeCode);
        const cfgA = ControlFlowAnalyzer.analyze(afterCode);
        return { cfgB, cfgA };
    }

    buildDataflowImpact(beforeCode, afterCode) {
        const dfB = DataflowAnalyzer.analyze(beforeCode);
        const dfA = DataflowAnalyzer.analyze(afterCode);
        return { dfB, dfA };
    }

    buildTypeImpact(beforeCode, afterCode) {
        const tfB = TypeFlowAnalyzer.analyze(beforeCode);
        const tfA = TypeFlowAnalyzer.analyze(afterCode);
        return { tfB, tfA };
    }

    buildSymbolicImpact(beforeCode, afterCode) {
        const symB = SymbolicAnalyzer.analyze(beforeCode);
        const symA = SymbolicAnalyzer.analyze(afterCode);
        return { symB, symA };
    }

    extractTestCoverage(traceEvents, cfg = null) {
        return CoverageAnalyzer.analyzeTrace(traceEvents, cfg);
    }
}
