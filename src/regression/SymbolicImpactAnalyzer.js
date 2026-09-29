/**
 * SymbolicImpactAnalyzer — Integrates Stage 16 symbolic reasoning to compare path condition feasible sets.
 */

import { SymbolicAnalyzer } from '../symbolic/SymbolicAnalyzer.js';
import { SymbolicChange } from './SymbolicChange.js';
import { CHANGE_KINDS } from './ChangeKind.js';

export class SymbolicImpactAnalyzer {
    /**
     * Compare symbolic path conditions between baseline and changed code.
     *
     * @param {string} baselineCode
     * @param {string} changedCode
     * @returns {object} { newlyFeasiblePaths, removedPaths, changedConstraints, changes }
     */
    static analyze(baselineCode = '', changedCode = '') {
        const symAnalyzer = new SymbolicAnalyzer();
        const symBase = symAnalyzer.analyzeSource(baselineCode);
        const symChanged = symAnalyzer.analyzeSource(changedCode);

        const pathsBase = symBase?.paths || symBase?.snapshot?.paths || [];
        const pathsChanged = symChanged?.paths || symChanged?.snapshot?.paths || [];

        const newlyFeasiblePaths = [];
        const removedPaths = [];
        const changedConstraints = [];
        const changes = [];

        if (pathsChanged.length > pathsBase.length) {
            newlyFeasiblePaths.push({ count: pathsChanged.length - pathsBase.length });
            changes.push(new SymbolicChange({
                pathId: 'path_delta_new',
                oldConstraints: pathsBase.map(p => p.id || 'p'),
                newConstraints: pathsChanged.map(p => p.id || 'p'),
                kind: CHANGE_KINDS.SYMBOLIC_PATH_ADDED,
            }));
        } else if (pathsChanged.length < pathsBase.length) {
            removedPaths.push({ count: pathsBase.length - pathsChanged.length });
            changes.push(new SymbolicChange({
                pathId: 'path_delta_removed',
                oldConstraints: pathsBase.map(p => p.id || 'p'),
                newConstraints: pathsChanged.map(p => p.id || 'p'),
                kind: CHANGE_KINDS.SYMBOLIC_PATH_REMOVED,
            }));
        }

        return {
            baselinePaths: pathsBase,
            changedPaths: pathsChanged,
            newlyFeasiblePaths,
            removedPaths,
            changedConstraints,
            changes,
        };
    }
}
