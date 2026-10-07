/**
 * APIContract.js
 * Represents the external or internal API contract of a module, class, or function.
 */

export class APIContract {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {Array<Object>} [options.inputTypes=[]] - [{ name, type, required, default }]
   * @param {Object} [options.outputType={ type: 'any' }]
   * @param {Array<string>} [options.errorBehavior=[]] - Expected exceptions or error codes
   * @param {Array<string>} [options.sideEffects=[]]
   * @param {Array<string>} [options.preconditions=[]]
   * @param {Array<string>} [options.postconditions=[]]
   * @param {string} [options.version='1.0.0']
   */
  constructor({
    id,
    name,
    inputTypes = [],
    outputType = { type: 'any' },
    errorBehavior = [],
    sideEffects = [],
    preconditions = [],
    postconditions = [],
    version = '1.0.0'
  }) {
    if (!id || !name) {
      throw new Error('APIContract requires id and name');
    }

    this.id = id;
    this.name = name;
    this.inputTypes = Object.freeze(inputTypes.map(it => Object.freeze({ ...it })));
    this.outputType = Object.freeze({ ...outputType });
    this.errorBehavior = Object.freeze([...errorBehavior]);
    this.sideEffects = Object.freeze([...sideEffects]);
    this.preconditions = Object.freeze([...preconditions]);
    this.postconditions = Object.freeze([...postconditions]);
    this.version = version;

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      inputTypes: this.inputTypes.map(it => ({ ...it })),
      outputType: this.outputType,
      errorBehavior: [...this.errorBehavior],
      sideEffects: [...this.sideEffects],
      preconditions: [...this.preconditions],
      postconditions: [...this.postconditions],
      version: this.version
    };
  }

  static fromJSON(json) {
    return new APIContract(json);
  }
}
