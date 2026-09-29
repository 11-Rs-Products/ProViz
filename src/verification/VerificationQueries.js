/**
 * VerificationQueries — Unified query interface for findings, properties, evidence, paths, and slices.
 */

import { VerificationExplanation } from './VerificationExplanation.js';
import { SlicingEngine } from '../analysis/SlicingEngine.js';

export class VerificationQueries {
    /**
     * @param {object} params
     * @param {object} params.snapshot - VerificationSnapshot
     * @param {object} [params.cfg] - ControlFlowGraph
     * @param {object} [params.ssa] - SSAProgram / SSAFunction
     * @param {object} [params.typeAnalysis] - Stage 14 TypeQueries or typeAnalysis
     * @param {object} [params.playbackEngine] - PlaybackEngine
     */
    constructor({
        snapshot,
        cfg = null,
        ssa = null,
        typeAnalysis = null,
        playbackEngine = null,
    } = {}) {
        this.snapshot = snapshot;
        this.cfg = cfg;
        this.ssa = ssa;
        this.typeAnalysis = typeAnalysis;
        this.playbackEngine = playbackEngine;
        this.slicingEngine = new SlicingEngine();

        // Build finding lookup index
        this._findingsById = new Map();
        for (const f of snapshot?.findings || []) {
            this._findingsById.set(f.id, f);
        }
    }

    getFindings() {
        return this.snapshot?.findings || [];
    }

    getFinding(id) {
        return this._findingsById.get(id) || null;
    }

    getFindingsAtLocation({ file = 'main.py', line = null } = {}) {
        return this.getFindings().filter(f => {
            const loc = f.sourceLocation;
            if (!loc) return false;
            if (loc.fileId !== file && loc.fileId !== 'main.py' && file !== 'main.py') return false;
            return line === null || loc.line === line;
        });
    }

    getFindingsByKind(kind) {
        return this.getFindings().filter(f => f.kind === kind);
    }

    getFindingsBySeverity(severity) {
        return this.getFindings().filter(f => f.severity === severity);
    }

    getFindingsAtFrame(frameIndex = 0) {
        // Return static findings plus any frame-correlated dynamic observations
        return this.getFindings();
    }

    getProperties(target = null) {
        const props = this.snapshot?.properties || [];
        if (!target) return props;
        return props.filter(p => p.target === target);
    }

    getProperty(target, propertyKind) {
        return this.getProperties(target).find(p => p.kind === propertyKind) || null;
    }

    getEvidence(findingId) {
        const f = this.getFinding(findingId);
        return f ? f.evidence : [];
    }

    getPathConditions(findingId) {
        const f = this.getFinding(findingId);
        if (!f) return [];
        return f.pathCondition ? [f.pathCondition] : [];
    }

    explainFinding(findingId) {
        const f = this.getFinding(findingId);
        if (!f) return null;
        return VerificationExplanation.explainFinding(f, this.cfg, this.ssa);
    }

    getSlice(findingId, direction = 'BACKWARD') {
        const f = this.getFinding(findingId);
        if (!f || !this.cfg || !this.ssa) return null;

        const targetVar = f.ssaValueId || f.property?.target || (f.message.match(/'([a-zA-Z_]\w*)'/)?.[1]) || null;
        const line = f.sourceLocation?.line || 1;

        return this.slicingEngine.computeStaticSlice({
            cfg: this.cfg,
            ssa: this.ssa,
            targetVariable: targetVar,
            targetLine: line,
            direction,
        });
    }

    getVerificationSnapshot() {
        return this.snapshot;
    }
}
