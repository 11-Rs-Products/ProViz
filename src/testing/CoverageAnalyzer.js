/**
 * CoverageAnalyzer — Analyzes execution traces and extracts dynamic coverage.
 */

import { Coverage } from './Coverage.js';

export class CoverageAnalyzer {
    /**
     * Compute coverage from execution trace events and optional CFG.
     * @param {Array<object>} traceEvents
     * @param {object} [cfg=null]
     * @returns {Coverage}
     */
    static analyzeTrace(traceEvents = [], cfg = null) {
        const lines = new Set();
        const nodes = new Set();
        const edges = new Set();
        const branches = new Set();
        const functions = new Set();

        let prevNodeId = null;

        for (const ev of traceEvents) {
            if (ev.line !== null && ev.line !== undefined) {
                lines.add(Number(ev.line));
            }
            if (ev.functionName) {
                functions.add(String(ev.functionName));
            }
            if (ev.cfgNodeId) {
                nodes.add(String(ev.cfgNodeId));
                if (prevNodeId) {
                    const edgeId = `${prevNodeId}->${ev.cfgNodeId}`;
                    edges.add(edgeId);
                }
                prevNodeId = String(ev.cfgNodeId);
            }
            if (ev.branch) {
                branches.add(String(ev.branch));
            }
        }

        const totalLines = cfg && cfg.getNodes ? cfg.getNodes().length : lines.size;
        const totalBranches = cfg && cfg.getEdges ? cfg.getEdges().filter(e => e.type === 'TRUE_BRANCH' || e.type === 'FALSE_BRANCH').length : branches.size;

        return new Coverage({
            lines,
            nodes,
            edges,
            branches,
            functions,
            totalLines,
            totalBranches,
        });
    }
}
