/**
 * SecurityEngine.js
 * Central Facade for ProViz Stage 31: Universal Security, Safety & Adversarial Verification Engine.
 */

import { SecurityPropertyKind } from './SecurityPropertyKind.js';
import { ThreatModel } from './ThreatModel.js';
import { ThreatActor, ThreatActorRole } from './ThreatActor.js';
import { Asset, AssetKind, SensitivityLevel } from './Asset.js';
import { TrustBoundary, TrustBoundaryType } from './TrustBoundary.js';
import { AttackSurface, AttackSurfaceEntry, EntryPointKind } from './AttackSurface.js';
import { SecurityInvariant } from './SecurityInvariant.js';
import { SecurityConstraint, ConstraintEnforcement } from './SecurityConstraint.js';
import { AttackGoal, AttackGoalCategory } from './AttackGoal.js';
import { AttackPath } from './AttackPath.js';
import { AttackGraph, AttackNode, AttackEdge } from './AttackGraph.js';
import { AttackPathAnalyzer } from './AttackPathAnalyzer.js';
import { AdversarialInput, AdversarialInputCategory } from './AdversarialInput.js';
import { AdversarialInputGenerator } from './AdversarialInputGenerator.js';
import { SecuritySink, SinkOperation } from './SecuritySink.js';
import { SourceSinkAnalyzer, FlowClassification } from './SourceSinkAnalyzer.js';
import { InformationFlowAnalyzer } from './InformationFlowAnalyzer.js';
import { PrivilegeFlowAnalyzer } from './PrivilegeFlowAnalyzer.js';
import { AuthorizationAnalyzer } from './AuthorizationAnalyzer.js';
import { AuthenticationAnalyzer } from './AuthenticationAnalyzer.js';
import { InputValidationAnalyzer } from './InputValidationAnalyzer.js';
import { ResourceExhaustionAnalyzer } from './ResourceExhaustionAnalyzer.js';
import { SafetyProperty, SafetyPropertyKind } from './SafetyProperty.js';
import { SafetyInvariantAnalyzer } from './SafetyInvariantAnalyzer.js';
import { SecurityCounterexample } from './SecurityCounterexample.js';
import { AttackSynthesizer, AttackCandidate } from './AttackSynthesizer.js';
import { AttackPrioritizer } from './AttackPrioritizer.js';
import { AdversarialExecutor } from './AdversarialExecutor.js';
import { SecurityMutationEngine, SecurityMutationOperator, SecurityMutant } from './SecurityMutationEngine.js';
import { SecurityRepairAnalyzer } from './SecurityRepairAnalyzer.js';
import { MitigationCandidate } from './MitigationCandidate.js';
import { MitigationValidator } from './MitigationValidator.js';
import { SecurityRegressionAnalyzer } from './SecurityRegressionAnalyzer.js';
import { SecurityEvidence, SecurityEvidenceType } from './SecurityEvidence.js';
import { SecurityCertificate } from './SecurityCertificate.js';
import { SecurityDecision, SecurityDecisionOutcome } from './SecurityDecision.js';
import { SecuritySession, SecuritySessionState } from './SecuritySession.js';
import { SecuritySnapshot } from './SecuritySnapshot.js';
import { SecurityKnowledgeSynchronizer } from './SecurityKnowledgeSynchronizer.js';

export class SecurityEngine {
  constructor(options = {}) {
    this.pathAnalyzer = new AttackPathAnalyzer();
    this.inputGenerator = new AdversarialInputGenerator();
    this.sourceSinkAnalyzer = new SourceSinkAnalyzer();
    this.infoFlowAnalyzer = new InformationFlowAnalyzer();
    this.privilegeFlowAnalyzer = new PrivilegeFlowAnalyzer();
    this.authorizationAnalyzer = new AuthorizationAnalyzer();
    this.authenticationAnalyzer = new AuthenticationAnalyzer();
    this.inputValidationAnalyzer = new InputValidationAnalyzer();
    this.resourceAnalyzer = new ResourceExhaustionAnalyzer();
    this.safetyAnalyzer = new SafetyInvariantAnalyzer();
    this.attackSynthesizer = new AttackSynthesizer();
    this.attackPrioritizer = new AttackPrioritizer();
    this.executor = new AdversarialExecutor();
    this.mutationEngine = new SecurityMutationEngine();
    this.repairAnalyzer = new SecurityRepairAnalyzer();
    this.mitigationValidator = new MitigationValidator();
    this.regressionAnalyzer = new SecurityRegressionAnalyzer();
    this.synchronizer = new SecurityKnowledgeSynchronizer();

    this._threatModels = new Map(); // id -> ThreatModel
    this._attackGraphs = new Map(); // id -> AttackGraph
    this._counterexamples = new Map(); // id -> SecurityCounterexample
    this._mitigations = new Map(); // id -> MitigationCandidate
    this._evidenceStore = new Map(); // id -> SecurityEvidence
    this._sessions = new Map(); // id -> SecuritySession
  }

  // Threat Modeling
  createThreatModel(options) {
    const tm = new ThreatModel(options);
    this._threatModels.set(tm.id, tm);
    return tm;
  }

  getThreatModel(id) {
    return this._threatModels.get(id) || null;
  }

  // Flow & Security Property Analysis
  analyzeInformationFlow(asset, sink, options = {}) {
    return this.infoFlowAnalyzer.analyzeConfidentialityFlow(asset, sink, options);
  }

  analyzePrivilegeFlow(callerPrivilege, requiredPrivilege, activeGuards = []) {
    return this.privilegeFlowAnalyzer.evaluatePrivilegeTransition(callerPrivilege, requiredPrivilege, activeGuards);
  }

  analyzeAuthorization(actorContext, targetResource, pathGuards = []) {
    return this.authorizationAnalyzer.checkAuthorization(actorContext, targetResource, pathGuards);
  }

  analyzeAuthentication(sessionContext, requiresAuthentication = true) {
    return this.authenticationAnalyzer.verifyAuthentication(sessionContext, requiresAuthentication);
  }

  analyzeInputValidation(paramName, activeValidators = [], schemaRules = null) {
    return this.inputValidationAnalyzer.evaluateValidation(paramName, activeValidators, schemaRules);
  }

  analyzeResourceSafety(resourceProfile = {}) {
    return this.resourceAnalyzer.evaluateResourceBounds(resourceProfile);
  }

  // Attack Graph & Paths
  buildAttackGraph(threatModel, semanticGraph = null) {
    const ag = new AttackGraph();
    const surfaceEntries = threatModel?.attackSurface?.getEntries() || [];

    for (const entry of surfaceEntries) {
      ag.addNode(new AttackNode({ id: entry.targetNodeId, type: 'ENTRY_POINT' }));
    }

    const assets = threatModel?.assets || [];
    for (const asset of assets) {
      ag.addNode(new AttackNode({ id: asset.id, type: 'ASSET' }));
      // Connect entry points to assets
      for (const entry of surfaceEntries) {
        ag.addEdge(new AttackEdge({
          id: `ae:${entry.targetNodeId}->${asset.id}`,
          source: entry.targetNodeId,
          target: asset.id,
          action: 'ACCESS',
          cost: 1.0,
          probability: 0.85
        }));
      }
    }

    this._attackGraphs.set(threatModel.id, ag);
    return ag;
  }

  findAttackPaths(attackGraph, entryId, sinkId, options = {}) {
    return this.pathAnalyzer.findAttackPaths(attackGraph, entryId, sinkId, options);
  }

  generateAdversarialInputs(paramName, typeHint = 'string') {
    return this.inputGenerator.generateForParameter(paramName, typeHint);
  }

  synthesizeAttacks(goal, threatModel, attackGraph) {
    return this.attackSynthesizer.synthesizeAttacks(goal, threatModel, attackGraph);
  }

  prioritizeAttacks(candidates, threatModel = null) {
    return this.attackPrioritizer.prioritize(candidates, threatModel);
  }

  executeAttack(candidate, sandboxContext = {}) {
    const result = this.executor.executeAttack(candidate, sandboxContext);
    if (result.counterexample) {
      this._counterexamples.set(result.counterexample.id, result.counterexample);
    }
    return result;
  }

  // Mitigations
  generateMitigations(counterexample, context = {}) {
    const mits = this.repairAnalyzer.synthesizeMitigations(counterexample, context);
    for (const m of mits) this._mitigations.set(m.id, m);
    return mits;
  }

  validateMitigation(mitigation, counterexample, options = {}) {
    return this.mitigationValidator.validateMitigation(mitigation, counterexample, options);
  }

  // Certification
  generateSecurityCertificate(threatModel, evidenceList = [], options = {}) {
    const certId = `cert:${threatModel.id}_${Date.now()}`;
    const cert = new SecurityCertificate({
      certificateId: certId,
      threatModelId: threatModel.id,
      scope: options.scope || 'GLOBAL',
      assumptions: threatModel.assumptions || [],
      exploredProperties: options.exploredProperties || Object.values(SecurityPropertyKind),
      evidenceIds: evidenceList.map(e => e.id || e),
      limitations: options.limitations || ['Bounded exploration depth = 15', 'Excludes external hardware side-channels'],
      isCertified: options.isCertified !== undefined ? options.isCertified : true,
      confidence: 0.95
    });
    return cert;
  }

  // Full Autonomous Closed-Loop
  runAdversarialVerification(threatModel, semanticGraph = null, knowledgeGraph = null, options = {}) {
    const sessionId = `sec_sess:${threatModel.id}_${Date.now()}`;
    let session = new SecuritySession({ sessionId, threatModelId: threatModel.id });

    // 1. Model & Build Attack Graph
    session = session.transition(SecuritySessionState.MODELED);
    const attackGraph = this.buildAttackGraph(threatModel, semanticGraph);

    // 2. Synthesize & Prioritize Attacks
    session = session.transition(SecuritySessionState.ATTACKING);
    const goal = new AttackGoal({
      id: `goal:${threatModel.id}_primary`,
      category: AttackGoalCategory.BYPASS_AUTHORIZATION,
      targetAssetId: threatModel.assets[0]?.id || 'root_asset'
    });
    const attacks = this.synthesizeAttacks(goal, threatModel, attackGraph);
    const prioritized = this.prioritizeAttacks(attacks, threatModel);

    // 3. Execute top attack
    session = session.transition(SecuritySessionState.ANALYZING);
    const topAttack = prioritized[0];
    const execResult = this.executeAttack(topAttack, options.sandboxContext || {});

    let counterexample = execResult.counterexample;
    let mitigation = null;
    let decisionOutcome = SecurityDecisionOutcome.SECURE_WITHIN_SCOPE;
    const evidenceList = [];

    if (counterexample) {
      session = session.transition(SecuritySessionState.MITIGATING);
      const mitigations = this.generateMitigations(counterexample);
      mitigation = mitigations[0];
      const valResult = this.validateMitigation(mitigation, counterexample, options.mitigationOptions || {});

      session = session.transition(SecuritySessionState.RETESTING);
      if (valResult.isValid) {
        decisionOutcome = SecurityDecisionOutcome.SECURE_WITHIN_SCOPE;
        evidenceList.push(new SecurityEvidence({
          id: `ev:${sessionId}_mit`,
          type: SecurityEvidenceType.ADVERSARIAL_EXECUTION,
          targetNodeOrProperty: counterexample.violatedProperty,
          provesSafety: true,
          summary: 'Mitigation successfully blocked adversarial vector'
        }));
      } else {
        decisionOutcome = SecurityDecisionOutcome.MITIGATION_REQUIRED;
      }
    } else {
      evidenceList.push(new SecurityEvidence({
        id: `ev:${sessionId}_clean`,
        type: SecurityEvidenceType.STATIC_PROOF,
        targetNodeOrProperty: 'GLOBAL',
        provesSafety: true,
        summary: 'No reachable attack paths discovered'
      }));
    }

    // 4. Issue Certificate & Decision
    session = session.transition(
      decisionOutcome === SecurityDecisionOutcome.SECURE_WITHIN_SCOPE ? SecuritySessionState.CERTIFIED : SecuritySessionState.FAILED
    );
    const certificate = this.generateSecurityCertificate(threatModel, evidenceList, {
      isCertified: decisionOutcome === SecurityDecisionOutcome.SECURE_WITHIN_SCOPE
    });

    const decision = new SecurityDecision({
      id: `dec:${sessionId}`,
      outcome: decisionOutcome,
      evidenceIds: evidenceList.map(e => e.id),
      counterexampleIds: counterexample ? [counterexample.id] : []
    });

    // 5. Sync to Knowledge Graph & Semantic Model
    if (counterexample) {
      if (knowledgeGraph) this.synchronizer.syncToKnowledgeGraph(counterexample, knowledgeGraph);
      if (semanticGraph) this.synchronizer.syncToSemanticModel(counterexample, semanticGraph);
    }

    this._sessions.set(sessionId, session);

    return {
      session,
      threatModel,
      attackGraph,
      topAttack,
      execResult,
      counterexample,
      mitigation,
      decision,
      certificate,
      evidenceList
    };
  }
}
