import { ExplorationFindingKind } from './ExplorationFindingKind.js';

export class ExplorationFinding {
  constructor({
    id,
    kind = ExplorationFindingKind.DISCOVERED_NEW_BEHAVIOR,
    description = '',
    inputCandidate = null,
    minimizedInput = null,
    metamorphicRelationId = null,
    mutantId = null,
    specId = null,
    objectiveId = null,
    evidence = {},
    metadata = {}
  } = {}) {
    this.id = id || `finding_${Math.random().toString(36).substring(2, 9)}`;
    this.kind = kind;
    this.description = description;
    this.inputCandidate = inputCandidate;
    this.minimizedInput = minimizedInput;
    this.metamorphicRelationId = metamorphicRelationId;
    this.mutantId = mutantId;
    this.specId = specId;
    this.objectiveId = objectiveId;
    this.evidence = evidence;
    this.metadata = metadata;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      description: this.description,
      inputCandidate: this.inputCandidate,
      minimizedInput: this.minimizedInput,
      metamorphicRelationId: this.metamorphicRelationId,
      mutantId: this.mutantId,
      specId: this.specId,
      objectiveId: this.objectiveId,
      evidence: this.evidence,
      metadata: this.metadata,
      timestamp: this.timestamp
    };
  }
}
