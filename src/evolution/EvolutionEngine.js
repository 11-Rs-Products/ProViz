/**
 * EvolutionEngine.js
 * Central Facade Engine for Stage 30: Universal Autonomous Software Evolution,
 * Refactoring & Verified Transformation Engine.
 */

import { TransformationKind } from './TransformationKind.js';
import { Transformation } from './Transformation.js';
import { TransformationGoal, GoalCategory } from './TransformationGoal.js';
import { TransformationConstraint, ConstraintType } from './TransformationConstraint.js';
import { PreservationProperty, PreservationPropertyKind } from './PreservationProperty.js';
import { TransformationEdit, EditOperation } from './TransformationEdit.js';
import { TransformationCandidate } from './TransformationCandidate.js';
import { TransformationPlan } from './TransformationPlan.js';
import { TransformationSynthesizer } from './TransformationSynthesizer.js';
import { RefactoringCatalog } from './RefactoringCatalog.js';
import { RefactoringPlanner } from './RefactoringPlanner.js';
import { TransformationPrecondition } from './TransformationPrecondition.js';
import { TransformationPostcondition } from './TransformationPostcondition.js';
import { TransformationValidator } from './TransformationValidator.js';
import { BehaviorPreservationAnalyzer } from './BehaviorPreservationAnalyzer.js';
import { ContractPreservationAnalyzer } from './ContractPreservationAnalyzer.js';
import { InvariantPreservationAnalyzer } from './InvariantPreservationAnalyzer.js';
import { SemanticPreservationAnalyzer, SemanticShiftStatus } from './SemanticPreservationAnalyzer.js';
import { TransformationImpactAnalyzer } from './TransformationImpactAnalyzer.js';
import { TransformationRiskAnalyzer } from './TransformationRiskAnalyzer.js';
import { TransformationEquivalence, TransformationEquivalenceScope } from './TransformationEquivalence.js';
import { TransformationComparator } from './TransformationComparator.js';
import { TransformationVerifier } from './TransformationVerifier.js';
import { TransformationEvidence, TransformationEvidenceType } from './TransformationEvidence.js';
import { TransformationDecision, DecisionOutcome } from './TransformationDecision.js';
import { TransformationSession, SessionState } from './TransformationSession.js';
import { TransformationWorkspace } from './TransformationWorkspace.js';
import { TransformationCheckpoint } from './TransformationCheckpoint.js';
import { RollbackManager } from './RollbackManager.js';
import { TransformationHistory } from './TransformationHistory.js';
import { AutonomousRefactoringEngine } from './AutonomousRefactoringEngine.js';
import { EvolutionKnowledgeSynchronizer } from './EvolutionKnowledgeSynchronizer.js';
import { TransformationImpactPlanner } from './TransformationImpactPlanner.js';
import { VerifiedChangeSet } from './VerifiedChangeSet.js';

export class EvolutionEngine {
  constructor(options = {}) {
    this.catalog = new RefactoringCatalog();
    this.synthesizer = new TransformationSynthesizer(this.catalog);
    this.planner = new RefactoringPlanner();
    this.validator = new TransformationValidator();
    this.impactAnalyzer = new TransformationImpactAnalyzer(options.impactWeights);
    this.riskAnalyzer = new TransformationRiskAnalyzer();
    this.comparator = new TransformationComparator();
    this.verifier = new TransformationVerifier(this.validator);
    this.rollbackManager = new RollbackManager();
    this.history = new TransformationHistory();
    this.autonomousEngine = new AutonomousRefactoringEngine(options);
    this.impactPlanner = new TransformationImpactPlanner();
    this.synchronizer = new EvolutionKnowledgeSynchronizer();

    this._goals = new Map(); // id -> TransformationGoal
    this._sessions = new Map(); // id -> TransformationSession
  }

  // Goals
  createGoal(options) {
    const goal = new TransformationGoal(options);
    this._goals.set(goal.id, goal);
    return goal;
  }

  getGoal(id) {
    return this._goals.get(id) || null;
  }

  listGoals() {
    return Array.from(this._goals.values());
  }

  // Planning & Synthesis
  planTransformation(goals, candidates, options = {}) {
    return this.planner.createPlan(goals, candidates, options);
  }

  synthesizeTransformations(goal, semanticGraph, knowledgeGraph = null, constraints = []) {
    return this.synthesizer.synthesize(goal, semanticGraph, knowledgeGraph, constraints);
  }

  // Validation & Preservation
  validateTransformation(candidate, originalModel, transformedModel, options = {}) {
    return this.validator.validate(candidate, originalModel, transformedModel, options);
  }

  checkBehaviorPreservation(candidate, originalModel, transformedModel, options = {}) {
    return this.validator.behaviorAnalyzer.evaluate(candidate, originalModel, transformedModel, options);
  }

  checkContractPreservation(candidate, originalModel, transformedModel) {
    return this.validator.contractAnalyzer.evaluate(candidate, originalModel, transformedModel);
  }

  checkInvariantPreservation(candidate, originalModel, transformedModel, invariants = []) {
    return this.validator.invariantAnalyzer.evaluate(candidate, originalModel, transformedModel, invariants);
  }

  checkSemanticPreservation(candidate, beforeGraph, afterGraph) {
    return this.validator.semanticAnalyzer.evaluate(candidate, beforeGraph, afterGraph);
  }

  // Impact & Risk
  getTransformationImpact(candidate, semanticGraph, options = {}) {
    return this.impactAnalyzer.analyze(candidate, semanticGraph, options);
  }

  getTransformationRisk(candidate, impactResult, options = {}) {
    return this.riskAnalyzer.analyzeRisk(candidate, impactResult, options);
  }

  // Verification & Decision
  verifyTransformation(candidate, originalModel, transformedModel, options = {}) {
    return this.verifier.verify(candidate, originalModel, transformedModel, options);
  }

  compareTransformations(candidates, options = {}) {
    return this.comparator.rankCandidates(candidates, options);
  }

  rankTransformationCandidates(candidates, options = {}) {
    return this.comparator.rankCandidates(candidates, options);
  }

  // Workspaces, Checkpoints & Rollback
  createWorkspace(workspaceId, sourceMap = {}, semanticGraph = null) {
    return new TransformationWorkspace({ workspaceId, originalSourceMap: sourceMap, originalSemanticGraph: semanticGraph });
  }

  checkpointTransformation(checkpointId, name, sourceState, semanticGraph, knowledgeGraph = null) {
    return this.rollbackManager.createCheckpoint(checkpointId, name, sourceState, semanticGraph, knowledgeGraph);
  }

  rollbackTransformation(checkpointId, workspace, options = {}) {
    return this.rollbackManager.rollback(checkpointId, workspace, options);
  }

  getTransformationHistory() {
    return this.history.getEntries();
  }

  // Autonomous Evolution
  runAutonomousRefactoring(goal, sourceMap, semanticGraph, knowledgeGraph = null, options = {}) {
    const result = this.autonomousEngine.executeRefactoringLoop(goal, sourceMap, semanticGraph, knowledgeGraph, options);
    this._sessions.set(result.session.sessionId, result.session);
    return result;
  }
}
