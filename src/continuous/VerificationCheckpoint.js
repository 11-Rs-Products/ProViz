/**
 * VerificationCheckpoint.js
 * Immutable snapshot of project workspace state captured prior to applying repairs.
 */

export class VerificationCheckpoint {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.revision
   * @param {Map<string, string>|Object} options.files Map of filePath -> content
   * @param {Object} [options.metadata={}]
   * @param {number} [options.createdAt=Date.now()]
   */
  constructor({
    id,
    revision,
    files,
    metadata = {},
    createdAt = Date.now()
  }) {
    if (!id || !revision || !files) {
      throw new Error('VerificationCheckpoint requires id, revision, and files');
    }
    this.id = id;
    this.revision = revision;
    this.files = Object.freeze(
      files instanceof Map ? new Map(files) : new Map(Object.entries(files))
    );
    this.metadata = Object.freeze({ ...metadata });
    this.createdAt = createdAt;
    Object.freeze(this);
  }

  getFile(filePath) {
    return this.files.get(filePath) || null;
  }

  toJSON() {
    return {
      id: this.id,
      revision: this.revision,
      fileCount: this.files.size,
      files: Object.fromEntries(this.files.entries()),
      metadata: { ...this.metadata },
      createdAt: this.createdAt
    };
  }
}
