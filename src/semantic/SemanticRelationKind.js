/**
 * SemanticRelationKind.js
 * Rich semantic relationships across code structure, data flow, control flow,
 * memory, architecture, behavioral refinement, and verification.
 */

export const SemanticRelationKind = Object.freeze({
  // Structure & Scope
  DECLARES: 'DECLARES',
  DEFINES: 'DEFINES',
  CONTAINS: 'CONTAINS',
  IMPORTS: 'IMPORTS',
  EXPORTS: 'EXPORTS',

  // Usage & References
  USES: 'USES',
  READS: 'READS',
  WRITES: 'WRITES',
  CALLS: 'CALLS',
  CALLED_BY: 'CALLED_BY',

  // OOP / Typing
  OVERRIDES: 'OVERRIDES',
  IMPLEMENTS: 'IMPLEMENTS',
  EXTENDS: 'EXTENDS',
  INSTANTIATES: 'INSTANTIATES',
  TYPE_OF: 'TYPE_OF',

  // Flow & Control
  FLOWS_TO: 'FLOWS_TO',
  DOMINATES: 'DOMINATES',
  POSTDOMINATES: 'POSTDOMINATES',
  CONTROLS: 'CONTROLS',
  DEPENDS_ON: 'DEPENDS_ON',

  // Memory & Heap
  ALLOCATES: 'ALLOCATES',
  ALIASES: 'ALIASES',
  POINTS_TO: 'POINTS_TO',
  ESCAPES: 'ESCAPES',
  MUTATES: 'MUTATES',

  // Exception Flow
  THROWS: 'THROWS',
  CATCHES: 'CATCHES',
  PROPAGATES: 'PROPAGATES',

  // Boundaries & Serialization
  CROSSES: 'CROSSES',
  SERIALIZES: 'SERIALIZES',
  DESERIALIZES: 'DESERIALIZES',

  // Semantic & Verification Impact
  AFFECTS_BEHAVIOR: 'AFFECTS_BEHAVIOR',
  AFFECTS_SPECIFICATION: 'AFFECTS_SPECIFICATION',
  AFFECTS_PROOF: 'AFFECTS_PROOF',
  AFFECTS_TEST: 'AFFECTS_TEST',

  // Equivalence & Refinement
  REFINES: 'REFINES',
  SPECIALIZES: 'SPECIALIZES',
  EQUIVALENT_TO: 'EQUIVALENT_TO',
  CONFLICTS_WITH: 'CONFLICTS_WITH'
});
