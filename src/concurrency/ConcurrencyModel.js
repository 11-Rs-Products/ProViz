/**
 * ConcurrencyModel.js
 * Immutable representation of the concurrency topology.
 */

export class ConcurrencyModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {Array<import('./ExecutionContext.js').ExecutionContext>} [options.contexts=[]]
   * @param {Array<import('./ConcurrentTask.js').ConcurrentTask>} [options.tasks=[]]
   * @param {Array<import('./ConcurrentResource.js').ConcurrentResource>} [options.resources=[]]
   * @param {Array<import('./SynchronizationPrimitive.js').SynchronizationPrimitive>} [options.primitives=[]]
   * @param {Array<import('./MessageChannel.js').MessageChannel>} [options.channels=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    contexts = [],
    tasks = [],
    resources = [],
    primitives = [],
    channels = [],
    metadata = {}
  }) {
    if (!id) throw new Error('ConcurrencyModel requires id');
    this.id = id;
    this.name = name || id;
    this.contexts = Object.freeze([...contexts]);
    this.tasks = Object.freeze([...tasks]);
    this.resources = Object.freeze([...resources]);
    this.primitives = Object.freeze([...primitives]);
    this.channels = Object.freeze([...channels]);
    this.metadata = Object.freeze({ ...metadata });

    this._contextMap = new Map(this.contexts.map(c => [c.id, c]));
    this._resourceMap = new Map(this.resources.map(r => [r.id, r]));
    this._primitiveMap = new Map(this.primitives.map(p => [p.id, p]));
    this._channelMap = new Map(this.channels.map(ch => [ch.id, ch]));
    this._taskMap = new Map(this.tasks.map(t => [t.id, t]));

    Object.freeze(this);
  }

  getContext(id) {
    return this._contextMap.get(id) || null;
  }

  getResource(id) {
    return this._resourceMap.get(id) || null;
  }

  getPrimitive(id) {
    return this._primitiveMap.get(id) || null;
  }

  getChannel(id) {
    return this._channelMap.get(id) || null;
  }

  getTask(id) {
    return this._taskMap.get(id) || null;
  }

  withContext(context) {
    const existing = this.contexts.filter(c => c.id !== context.id);
    return new ConcurrencyModel({
      id: this.id,
      name: this.name,
      contexts: [...existing, context],
      tasks: this.tasks,
      resources: this.resources,
      primitives: this.primitives,
      channels: this.channels,
      metadata: this.metadata
    });
  }

  withResource(resource) {
    const existing = this.resources.filter(r => r.id !== resource.id);
    return new ConcurrencyModel({
      id: this.id,
      name: this.name,
      contexts: this.contexts,
      tasks: this.tasks,
      resources: [...existing, resource],
      primitives: this.primitives,
      channels: this.channels,
      metadata: this.metadata
    });
  }

  withPrimitive(primitive) {
    const existing = this.primitives.filter(p => p.id !== primitive.id);
    return new ConcurrencyModel({
      id: this.id,
      name: this.name,
      contexts: this.contexts,
      tasks: this.tasks,
      resources: this.resources,
      primitives: [...existing, primitive],
      channels: this.channels,
      metadata: this.metadata
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      contexts: this.contexts.map(c => c.toJSON ? c.toJSON() : c),
      tasks: this.tasks.map(t => t.toJSON ? t.toJSON() : t),
      resources: this.resources.map(r => r.toJSON ? r.toJSON() : r),
      primitives: this.primitives.map(p => p.toJSON ? p.toJSON() : p),
      channels: this.channels.map(ch => ch.toJSON ? ch.toJSON() : ch),
      metadata: { ...this.metadata }
    };
  }
}
