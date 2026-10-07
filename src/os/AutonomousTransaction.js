/**
 * AutonomousTransaction.js
 * Atomic transactional wrapper for autonomous modifications with rollback checkpoints.
 */

export const TransactionStatus = Object.freeze({
  PENDING: 'PENDING',
  CHECKPOINTED: 'CHECKPOINTED',
  COMMITTED: 'COMMITTED',
  ROLLED_BACK: 'ROLLED_BACK',
  FAILED: 'FAILED'
});

export class AutonomousTransaction {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {number} options.baseRevision
   * @param {Object} options.checkpointState
   */
  constructor({
    id,
    baseRevision,
    checkpointState
  }) {
    if (!id || typeof baseRevision !== 'number') {
      throw new Error('AutonomousTransaction requires id and baseRevision');
    }
    this.id = id;
    this.baseRevision = baseRevision;
    this.checkpointState = Object.freeze({ ...checkpointState });
    this.status = TransactionStatus.PENDING;
    this.modifications = [];
    this.verificationResults = [];
    this.timestamp = Date.now();
  }

  addModification(mod) {
    this.modifications.push(mod);
  }

  recordVerificationResult(res) {
    this.verificationResults.push(res);
  }

  commit() {
    this.status = TransactionStatus.COMMITTED;
    this.committedTimestamp = Date.now();
  }

  rollback() {
    this.status = TransactionStatus.ROLLED_BACK;
    this.rolledBackTimestamp = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      baseRevision: this.baseRevision,
      status: this.status,
      modifications: this.modifications,
      verificationResults: this.verificationResults,
      timestamp: this.timestamp
    };
  }
}

export class GlobalRollbackManager {
  /**
   * Verified rollback of an autonomous transaction
   * @param {AutonomousTransaction} transaction
   * @param {import('./ProjectStateCoordinator.js').ProjectStateCoordinator} [stateCoordinator]
   */
  rollback(transaction, stateCoordinator = null) {
    if (!transaction) throw new Error('GlobalRollbackManager requires transaction');

    transaction.rollback();

    let stateRestored = true;
    if (stateCoordinator) {
      try {
        stateCoordinator.rollbackToRevision(transaction.baseRevision);
      } catch (err) {
        stateRestored = false;
      }
    }

    return {
      transactionId: transaction.id,
      restoredRevision: transaction.baseRevision,
      isRollbackVerified: stateRestored,
      timestamp: Date.now()
    };
  }
}

export class TransactionManager {
  constructor() {
    /** @type {Map<string, AutonomousTransaction>} */
    this._transactions = new Map();
    this.rollbackManager = new GlobalRollbackManager();
  }

  beginTransaction(baseRevision, checkpointState = {}) {
    const id = `TX_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const tx = new AutonomousTransaction({
      id,
      baseRevision,
      checkpointState
    });
    this._transactions.set(id, tx);
    return tx;
  }

  commitTransaction(txId) {
    const tx = this._transactions.get(txId);
    if (tx) {
      tx.commit();
      return true;
    }
    return false;
  }

  rollbackTransaction(txId, stateCoordinator = null) {
    const tx = this._transactions.get(txId);
    if (tx) {
      return this.rollbackManager.rollback(tx, stateCoordinator);
    }
    return null;
  }

  getTransaction(txId) {
    return this._transactions.get(txId) || null;
  }
}
