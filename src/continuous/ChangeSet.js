/**
 * ChangeSet.js
 * Canonical immutable representation of a project change.
 */

export class ChangeSet {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.revision='']
   * @param {Array<string>} [options.addedFiles=[]]
   * @param {Array<string>} [options.modifiedFiles=[]]
   * @param {Array<string>} [options.deletedFiles=[]]
   * @param {Array<string>} [options.modifiedFunctions=[]]
   * @param {Array<string>} [options.modifiedClasses=[]]
   * @param {Array<string>} [options.modifiedModules=[]]
   * @param {Array<string>} [options.modifiedDependencies=[]]
   * @param {Array<string>} [options.modifiedApis=[]]
   * @param {Array<string>} [options.modifiedConfigs=[]]
   * @param {Array<string>} [options.modifiedTests=[]]
   * @param {string} [options.description='']
   * @param {number} [options.timestamp=Date.now()]
   */
  constructor({
    id,
    revision = '',
    addedFiles = [],
    modifiedFiles = [],
    deletedFiles = [],
    modifiedFunctions = [],
    modifiedClasses = [],
    modifiedModules = [],
    modifiedDependencies = [],
    modifiedApis = [],
    modifiedConfigs = [],
    modifiedTests = [],
    description = '',
    timestamp = Date.now()
  }) {
    if (!id) throw new Error('ChangeSet requires id');
    this.id = id;
    this.revision = revision || id;
    this.addedFiles = Object.freeze([...addedFiles]);
    this.modifiedFiles = Object.freeze([...modifiedFiles]);
    this.deletedFiles = Object.freeze([...deletedFiles]);
    this.modifiedFunctions = Object.freeze([...modifiedFunctions]);
    this.modifiedClasses = Object.freeze([...modifiedClasses]);
    this.modifiedModules = Object.freeze([...modifiedModules]);
    this.modifiedDependencies = Object.freeze([...modifiedDependencies]);
    this.modifiedApis = Object.freeze([...modifiedApis]);
    this.modifiedConfigs = Object.freeze([...modifiedConfigs]);
    this.modifiedTests = Object.freeze([...modifiedTests]);
    this.description = description;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  isEmpty() {
    return this.addedFiles.length === 0 &&
           this.modifiedFiles.length === 0 &&
           this.deletedFiles.length === 0 &&
           this.modifiedFunctions.length === 0 &&
           this.modifiedClasses.length === 0 &&
           this.modifiedApis.length === 0;
  }

  totalChangedEntities() {
    return this.addedFiles.length +
           this.modifiedFiles.length +
           this.deletedFiles.length +
           this.modifiedFunctions.length +
           this.modifiedClasses.length +
           this.modifiedApis.length +
           this.modifiedConfigs.length +
           this.modifiedTests.length;
  }

  toJSON() {
    return {
      id: this.id,
      revision: this.revision,
      addedFiles: [...this.addedFiles],
      modifiedFiles: [...this.modifiedFiles],
      deletedFiles: [...this.deletedFiles],
      modifiedFunctions: [...this.modifiedFunctions],
      modifiedClasses: [...this.modifiedClasses],
      modifiedModules: [...this.modifiedModules],
      modifiedDependencies: [...this.modifiedDependencies],
      modifiedApis: [...this.modifiedApis],
      modifiedConfigs: [...this.modifiedConfigs],
      modifiedTests: [...this.modifiedTests],
      description: this.description,
      timestamp: this.timestamp
    };
  }
}
