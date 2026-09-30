export class MetamorphicTransformation {
  constructor({ id, name = 'Transformation', type = 'CUSTOM', transform = null, options = {} } = {}) {
    this.id = id || `transform_${Math.random().toString(36).substring(2, 9)}`;
    this.name = name;
    this.type = type;
    this._customTransform = transform;
    this.options = options;
  }

  transform(input) {
    if (typeof this._customTransform === 'function') {
      return this._customTransform(input);
    }
    return MetamorphicTransformation.apply(this.type, input, this.options);
  }

  static apply(type, input, options = {}) {
    if (input === null || input === undefined) return input;

    switch (type) {
      case 'PERMUTATION':
      case 'PERMUTATION_INVARIANCE': {
        if (Array.isArray(input)) {
          const copy = [...input];
          return copy.reverse();
        }
        return input;
      }

      case 'REVERSE': {
        if (Array.isArray(input)) return [...input].reverse();
        if (typeof input === 'string') return input.split('').reverse().join('');
        return input;
      }

      case 'SCALING': {
        const factor = options.factor !== undefined ? options.factor : 2;
        if (typeof input === 'number') return input * factor;
        if (Array.isArray(input)) return input.map(x => typeof x === 'number' ? x * factor : x);
        return input;
      }

      case 'TRANSLATION': {
        const delta = options.delta !== undefined ? options.delta : 1;
        if (typeof input === 'number') return input + delta;
        if (Array.isArray(input)) return input.map(x => typeof x === 'number' ? x + delta : x);
        return input;
      }

      case 'DUPLICATION': {
        if (Array.isArray(input)) return [...input, ...input];
        if (typeof input === 'string') return input + input;
        return input;
      }

      case 'IDENTITY':
      default:
        return input;
    }
  }
}
