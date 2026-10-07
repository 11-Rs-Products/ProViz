/**
 * AutonomousRefactoringEngine.js
 * High-level closed loop autonomous refactoring and transformation orchestrator:
 * Observe -> Goal -> Synthesize -> Impact/Risk -> Select -> Stage in Workspace ->
 * Verify -> Compare -> Decision -> Commit -> Reverification -> Update Knowledge.
 */

import { TransformationSynthesizer } from './TransformationSynthesizer.js';
import { TransformationImpactAnalyzer } from './TransformationImpactAnalyzer.js';
import { TransformationRiskAnalyzer } from './TransformationRiskAnalyzer.js';
import { TransformationComparator } from './TransformationComparator.js';
import { TransformationVerifier } from './TransformationVerifier.js';
import { TransformationWorkspace } from './TransformationWorkspace.js';
import { RollbackManager } from './RollbackManager.js';
import { TransformationHistory } from './TransformationHistory.js';
import { TransformationSession, SessionState } from './TransformationSession.js';
import { EvolutionKnowledgeSynchronizer } from './EvolutionKnowledgeSynchronizer.js';
import { VerifiedChangeSet } from './VerifiedChangeSet.js';

export class AutonomousRefactoringEngine {
  constructor(options = {}) {
    this.synthesizer = new TransformationSynthesizer();
    this.impactAnalyzer = new TransformationImpactAnalyzer();
    this.riskAnalyzer = new TransformationRiskAnalyzer();
    this.comparator = new TransformationComparator();
    this.verifier = new TransformationVerifier();
    this.rollbackManager = new RollbackManager();
    this.history = new TransformationHistory();
    this.synchronizer = new EvolutionKnowledgeSynchronizer();
  }

  /**
   * Executes the full closed-loop autonomous transformation workflow.
   */
  executeRefactoringLoop(goal, sourceMap, semanticGraph, knowledgeGraph = null, options = {}) {
    const sessionId = `sess:${goal.id}_${Date.now()}`;
    let session = new TransformationSession({ sessionId, goalId: goal.id });

    // 1. Checkpoint initial state
    const initCpId = `cp:init_${sessionId}`;
    this.rollbackManager.createCheckpoint(initCpId, 'Initial Pre-Transformation State', sourceMap, semanticGraph, knowledgeGraph);

    // 2. Synthesize candidates
    session = session.transition(SessionState.SYNTHESIZING);
    const candidates = this.synthesizer.synthesize(goal, semanticGraph, knowledgeGraph, options.constraints || []);
    session = session.transition(SessionState.VALIDATING, { candidateIds: candidates.map(c => c.candidateId) });

    // 3. Evaluate Impact & Risk for all candidates
    const evaluatedCandidates = candidates.map(cand => {
      const impact = this.impactAnalyzer.analyze(cand, semanticGraph, options);
      const risk = this.riskAnalyzer.analyzeRisk(cand, impact, options);
      return { candidate: cand, impact, risk };
    });

    // 4. Rank candidates and pick top candidate
    session = session.transition(SessionState.COMPARING);
    const ranked = this.comparator.rankCandidates(candidates, options);
    const topCandidate = ranked[0]?.candidate || candidates[0];
    session = session.transition(SessionState.VERIFYING, { selectedCandidateId: topCandidate.candidateId });

    // 5. Create isolated workspace and stage transformation
    const workspace = new TransformationWorkspace({
      workspaceId: `ws:${sessionId}`,
      originalSourceMap: sourceMap,
      originalSemanticGraph: semanticGraph
    });
    workspace.applyCandidate(topCandidate);

    // 6. Verify candidate
    const verifResult = this.verifier.verify(topCandidate, semanticGraph, workspace.stagedSemanticGraph, options);
    session = session.transition(
      verifResult.isApproved ? SessionState.APPROVED : SessionState.REJECTED,
      { decisionId: verifResult.decision.decisionId }
    );

    // 7. Commit or Rollback
    let verifiedChangeSet = null;
    let applied = false;
    let rolledBack = false;

    if (verifResult.isApproved) {
      workspace.commit();
      applied = true;
      session = session.transition(SessionState.APPLIED);

      // Create VerifiedChangeSet
      verifiedChangeSet = new VerifiedChangeSet({
        changeSetId: `vcs:${sessionId}`,
        semanticDiff: { candidateId: topCandidate.candidateId, appliedEdits: topCandidate.edits.length },
        impactReport: evaluatedCandidates[0].impact,
        riskReport: evaluatedCandidates[0].risk,
        verificationReport: verifResult,
        evidence: verifResult.evidence,
        preservationClaims: topCandidate.preservationClaims,
        rollbackCheckpoint: initCpId,
        provenance: [`goal:${goal.id}`, `session:${sessionId}`]
      });

      // Synchronize to Knowledge Graph & Semantic Model
      if (knowledgeGraph) {
        this.synchronizer.syncToKnowledgeGraph(topCandidate, verifResult.decision, knowledgeGraph);
      }
      this.synchronizer.syncToSemanticModel(topCandidate, semanticGraph);
      session = session.transition(SessionState.REVERIFIED);
    } else {
      this.rollbackManager.rollback(initCpId, workspace, { reason: verifResult.decision.reasons.join(', ') });
      rolledBack = true;
      session = session.transition(SessionState.ROLLED_BACK);
    }

    // 8. Record in audit history
    this.history.record({
      goal,
      candidate: topCandidate,
      decision: verifResult.decision,
      evidence: verifResult.evidence,
      applied,
      rolledBack,
      metadata: { sessionId }
    });

    return {
      session,
      selectedCandidate: topCandidate,
      allCandidates: candidates,
      verificationResult: verifResult,
      isApproved: verifResult.isApproved,
      workspace,
      verifiedChangeSet,
      checkpointId: initCpId
    };
  }
}
