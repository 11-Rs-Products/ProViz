/**
 * RefactoringCatalog.js
 * Catalog of canonical safe refactoring templates with predefined preconditions,
 * preservation expectations, and validation strategies.
 */

import { TransformationKind } from './TransformationKind.js';
import { PreservationPropertyKind } from './PreservationProperty.js';

export class RefactoringCatalog {
  constructor() {
    this._entries = new Map();
    this._initStandardCatalog();
  }

  _initStandardCatalog() {
    this.register({
      kind: TransformationKind.RENAME_SYMBOL,
      name: 'Rename Symbol',
      description: 'Renames a variable, function, parameter, or symbol while updating all semantic references.',
      preconditions: ['symbol_exists', 'no_name_collision_in_scope'],
      preservationProperties: [PreservationPropertyKind.OBSERVABLE_OUTPUT, PreservationPropertyKind.CONTRACTS, PreservationPropertyKind.RETURN_VALUES],
      validationStrategy: 'STATIC_AND_REGRESSION',
      rollbackStrategy: 'INVERSE_RENAME'
    });

    this.register({
      kind: TransformationKind.EXTRACT_FUNCTION,
      name: 'Extract Function',
      description: 'Extracts a cohesive block of code into a standalone function with explicit parameters and return.',
      preconditions: ['valid_statement_range', 'single_exit_or_return'],
      preservationProperties: [PreservationPropertyKind.OBSERVABLE_OUTPUT, PreservationPropertyKind.SIDE_EFFECTS, PreservationPropertyKind.CALL_ORDER],
      validationStrategy: 'SYMBOLIC_AND_DYNAMIC',
      rollbackStrategy: 'INLINE'
    });

    this.register({
      kind: TransformationKind.INLINE_FUNCTION,
      name: 'Inline Function',
      description: 'Replaces function call sites with the function body when delegation overhead is unnecessary.',
      preconditions: ['callee_exists', 'no_recursive_cycle', 'no_side_effect_conflict'],
      preservationProperties: [PreservationPropertyKind.OBSERVABLE_OUTPUT, PreservationPropertyKind.RETURN_VALUES],
      validationStrategy: 'BEHAVIORAL_EQUIVALENCE',
      rollbackStrategy: 'EXTRACT'
    });

    this.register({
      kind: TransformationKind.CHANGE_SIGNATURE,
      name: 'Change Signature',
      description: 'Updates parameters, return types, or default arguments across a function and its callers.',
      preconditions: ['target_function_known', 'caller_sites_resolved'],
      preservationProperties: [PreservationPropertyKind.CONTRACTS, PreservationPropertyKind.INVARIANTS],
      validationStrategy: 'FULL_COMPATIBILITY_SUITE',
      rollbackStrategy: 'RESTORE_ORIGINAL_SIGNATURE'
    });

    this.register({
      kind: TransformationKind.RESTRUCTURE_CONDITIONAL,
      name: 'Restructure Conditional',
      description: 'Simplifies, inverts, or decomposes nested branch logic into guard clauses or table lookups.',
      preconditions: ['branch_node_known', 'branch_conditions_pure'],
      preservationProperties: [PreservationPropertyKind.OBSERVABLE_OUTPUT, PreservationPropertyKind.EXCEPTIONS, PreservationPropertyKind.RETURN_VALUES],
      validationStrategy: 'SYMBOLIC_AND_CONCOLIC',
      rollbackStrategy: 'RESTORE_BRANCH'
    });

    this.register({
      kind: TransformationKind.LOOP_REFACTOR,
      name: 'Loop Refactor',
      description: 'Converts between while/for loops, iterators, or functional map/reduce transformations.',
      preconditions: ['loop_bounds_known', 'termination_guaranteed'],
      preservationProperties: [PreservationPropertyKind.OBSERVABLE_OUTPUT, PreservationPropertyKind.SIDE_EFFECTS],
      validationStrategy: 'MUTATION_AND_REGRESSION',
      rollbackStrategy: 'RESTORE_LOOP'
    });

    this.register({
      kind: TransformationKind.MODULE_SPLIT,
      name: 'Split Module',
      description: 'Decomposes a bloated module into multiple cohesive modules while preserving public exports.',
      preconditions: ['module_exists', 'public_exports_known'],
      preservationProperties: [PreservationPropertyKind.API_SIGNATURE, PreservationPropertyKind.OBSERVABLE_OUTPUT],
      validationStrategy: 'ARCHITECTURE_AND_API_CHECK',
      rollbackStrategy: 'MERGE_BACK'
    });
  }

  register(entry) {
    if (!entry || !entry.kind) throw new Error('Catalog entry requires a valid kind');
    this._entries.set(entry.kind, Object.freeze({ ...entry }));
  }

  getEntry(kind) {
    return this._entries.get(kind) || null;
  }

  getAllEntries() {
    return Array.from(this._entries.values());
  }
}
