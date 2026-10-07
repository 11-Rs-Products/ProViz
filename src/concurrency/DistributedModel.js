/**
 * DistributedModel.js
 * Represents a distributed network topology of nodes, partitions, regions, and channels.
 */

export class DistributedModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {Array<string>} [options.nodes=[]]
   * @param {Array<string>} [options.services=[]]
   * @param {Array<string>} [options.replicas=[]]
   * @param {Array<Array<string>>} [options.partitions=[]]
   * @param {Array<import('./MessageChannel.js').MessageChannel>} [options.channels=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    nodes = [],
    services = [],
    replicas = [],
    partitions = [],
    channels = [],
    metadata = {}
  }) {
    if (!id) throw new Error('DistributedModel requires id');
    this.id = id;
    this.name = name || id;
    this.nodes = Object.freeze([...nodes]);
    this.services = Object.freeze([...services]);
    this.replicas = Object.freeze([...replicas]);
    this.partitions = Object.freeze(partitions.map(p => Object.freeze([...p])));
    this.channels = Object.freeze([...channels]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  isPartitioned(nodeA, nodeB) {
    if (this.partitions.length === 0) return false;
    for (const part of this.partitions) {
      if (part.includes(nodeA) && !part.includes(nodeB)) return true;
      if (part.includes(nodeB) && !part.includes(nodeA)) return true;
    }
    return false;
  }

  withPartition(partition) {
    return new DistributedModel({
      id: this.id,
      name: this.name,
      nodes: this.nodes,
      services: this.services,
      replicas: this.replicas,
      partitions: [...this.partitions, partition],
      channels: this.channels,
      metadata: this.metadata
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      nodes: [...this.nodes],
      services: [...this.services],
      replicas: [...this.replicas],
      partitions: this.partitions.map(p => [...p]),
      channels: this.channels.map(ch => ch.toJSON ? ch.toJSON() : ch),
      metadata: { ...this.metadata }
    };
  }
}
