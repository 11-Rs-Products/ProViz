/**
 * Asset.js
 * Represents sensitive or safety-critical resources within the system.
 */

export const AssetKind = Object.freeze({
  DATA: 'DATA',
  CREDENTIAL: 'CREDENTIAL',
  TOKEN: 'TOKEN',
  MEMORY: 'MEMORY',
  FILE: 'FILE',
  NETWORK_RESOURCE: 'NETWORK_RESOURCE',
  API: 'API',
  STATE: 'STATE',
  CONFIGURATION: 'CONFIGURATION',
  SERVICE: 'SERVICE',
  CONTROL_RESOURCE: 'CONTROL_RESOURCE'
});

export const SensitivityLevel = Object.freeze({
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
  CONFIDENTIAL: 'CONFIDENTIAL',
  CRITICAL: 'CRITICAL'
});

export class Asset {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.kind - AssetKind
   * @param {string} [options.name='']
   * @param {string} [options.sensitivity=SensitivityLevel.CONFIDENTIAL]
   * @param {string} [options.semanticTarget=''] - Node ID in SemanticProgramGraph
   * @param {Array<string>} [options.requiredProperties=[]]
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    kind = AssetKind.DATA,
    name = '',
    sensitivity = SensitivityLevel.CONFIDENTIAL,
    semanticTarget = '',
    requiredProperties = [],
    attributes = {}
  }) {
    if (!id) throw new Error('Asset requires id');
    this.id = id;
    this.kind = kind;
    this.name = name || id;
    this.sensitivity = sensitivity;
    this.semanticTarget = semanticTarget;
    this.requiredProperties = Object.freeze([...requiredProperties]);
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  isCritical() {
    return this.sensitivity === SensitivityLevel.CRITICAL;
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      name: this.name,
      sensitivity: this.sensitivity,
      semanticTarget: this.semanticTarget,
      requiredProperties: [...this.requiredProperties],
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new Asset(json);
  }
}
