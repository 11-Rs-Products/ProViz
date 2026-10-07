/**
 * Represents a boundary between two different language runtimes
 */
export class CrossLanguageBoundary {
  constructor({
    callerLanguage = 'JAVASCRIPT',
    calleeLanguage = 'RUST',
    interfaceKind = 'FFI', // FFI, WASM, IPC, RPC, C_ABI
    functionName = 'compute',
    signature = { params: ['NUMBER'], returns: 'NUMBER' },
    ownershipTransfer = false,
    serializationFormat = 'NATIVE_MEMORY'
  } = {}) {
    this.callerLanguage = callerLanguage.toUpperCase();
    this.calleeLanguage = calleeLanguage.toUpperCase();
    this.interfaceKind = interfaceKind;
    this.functionName = functionName;
    this.signature = Object.freeze({
      params: Object.freeze([...(signature.params || [])]),
      returns: signature.returns || 'VOID'
    });
    this.ownershipTransfer = ownershipTransfer;
    this.serializationFormat = serializationFormat;
    Object.freeze(this);
  }

  toJSON() {
    return {
      callerLanguage: this.callerLanguage,
      calleeLanguage: this.calleeLanguage,
      interfaceKind: this.interfaceKind,
      functionName: this.functionName,
      signature: {
        params: [...this.signature.params],
        returns: this.signature.returns
      },
      ownershipTransfer: this.ownershipTransfer,
      serializationFormat: this.serializationFormat
    };
  }

  static fromJSON(json = {}) {
    return new CrossLanguageBoundary(json);
  }
}
