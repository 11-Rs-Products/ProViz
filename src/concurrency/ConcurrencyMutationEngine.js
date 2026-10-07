/**
 * ConcurrencyMutationEngine.js
 * Generates controlled concurrency mutations to test verifier and test suite sensitivity.
 */

export const MutationType = Object.freeze({
  REMOVE_LOCK: 'REMOVE_LOCK',
  MOVE_LOCK: 'MOVE_LOCK',
  REORDER_OPERATION: 'REORDER_OPERATION',
  REMOVE_AWAIT: 'REMOVE_AWAIT',
  CHANGE_TIMEOUT: 'CHANGE_TIMEOUT',
  ALTER_RETRY_COUNT: 'ALTER_RETRY_COUNT',
  CHANGE_MESSAGE_ORDER: 'CHANGE_MESSAGE_ORDER',
  REMOVE_ATOMICITY: 'REMOVE_ATOMICITY',
  CHANGE_MEMORY_ORDER: 'CHANGE_MEMORY_ORDER'
});

export class ConcurrencyMutationEngine {
  /**
   * Generates mutants from a concurrent program or trace structure.
   * @param {Object} programModel
   * @returns {Array<{ id: string, type: string, description: string, mutatedModel: Object }>}
   */
  generateMutations(programModel) {
    const mutants = [];
    let mutantId = 1;

    // 1. REMOVE_LOCK mutant
    if (programModel.primitives && programModel.primitives.length > 0) {
      const lock = programModel.primitives[0];
      mutants.push({
        id: `mutant-${mutantId++}`,
        type: MutationType.REMOVE_LOCK,
        description: `Removed synchronization primitive '${lock.id || lock.name}'`,
        mutatedModel: {
          ...programModel,
          primitives: programModel.primitives.slice(1)
        }
      });
    }

    // 2. REORDER_OPERATION mutant
    if (programModel.events && programModel.events.length >= 2) {
      const swapped = [...programModel.events];
      const tmp = swapped[0];
      swapped[0] = swapped[1];
      swapped[1] = tmp;

      mutants.push({
        id: `mutant-${mutantId++}`,
        type: MutationType.REORDER_OPERATION,
        description: `Reordered events 0 and 1`,
        mutatedModel: {
          ...programModel,
          events: swapped
        }
      });
    }

    // 3. CHANGE_TIMEOUT mutant
    if (programModel.timeouts && Object.keys(programModel.timeouts).length > 0) {
      const modifiedTimeouts = { ...programModel.timeouts };
      const firstKey = Object.keys(modifiedTimeouts)[0];
      modifiedTimeouts[firstKey] = 0; // zero timeout race

      mutants.push({
        id: `mutant-${mutantId++}`,
        type: MutationType.CHANGE_TIMEOUT,
        description: `Reduced timeout on '${firstKey}' to 0`,
        mutatedModel: {
          ...programModel,
          timeouts: modifiedTimeouts
        }
      });
    }

    // 4. REMOVE_ATOMICITY mutant
    if (programModel.atomicRegions && programModel.atomicRegions.length > 0) {
      mutants.push({
        id: `mutant-${mutantId++}`,
        type: MutationType.REMOVE_ATOMICITY,
        description: `Removed atomic region '${programModel.atomicRegions[0].id}'`,
        mutatedModel: {
          ...programModel,
          atomicRegions: programModel.atomicRegions.slice(1)
        }
      });
    }

    // 5. CHANGE_MESSAGE_ORDER mutant
    if (programModel.messages && programModel.messages.length >= 2) {
      const msgs = [...programModel.messages];
      const tmp = msgs[0];
      msgs[0] = msgs[1];
      msgs[1] = tmp;

      mutants.push({
        id: `mutant-${mutantId++}`,
        type: MutationType.CHANGE_MESSAGE_ORDER,
        description: `Reordered message sequence`,
        mutatedModel: {
          ...programModel,
          messages: msgs
        }
      });
    }

    return mutants;
  }
}
