/**
 * MessageChannel.js
 * Tracks sender, receiver, FIFO/non-FIFO queue, delivery, loss, duplication, and delay.
 */

export class MessageChannel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.sourceNodeId
   * @param {string} options.targetNodeId
   * @param {boolean} [options.fifo=true]
   * @param {number} [options.latency=0]
   * @param {number} [options.dropRate=0]
   * @param {Array<import('./MessageModel.js').MessageModel>} [options.messages=[]]
   */
  constructor({
    id,
    sourceNodeId,
    targetNodeId,
    fifo = true,
    latency = 0,
    dropRate = 0,
    messages = []
  }) {
    if (!id || !sourceNodeId || !targetNodeId) {
      throw new Error('MessageChannel requires id, sourceNodeId, and targetNodeId');
    }
    this.id = id;
    this.sourceNodeId = sourceNodeId;
    this.targetNodeId = targetNodeId;
    this.fifo = fifo;
    this.latency = latency;
    this.dropRate = dropRate;
    this.messages = Object.freeze([...messages]);
    Object.freeze(this);
  }

  sendMessage(message) {
    return new MessageChannel({
      id: this.id,
      sourceNodeId: this.sourceNodeId,
      targetNodeId: this.targetNodeId,
      fifo: this.fifo,
      latency: this.latency,
      dropRate: this.dropRate,
      messages: [...this.messages, message]
    });
  }

  deliverNext() {
    if (this.messages.length === 0) return { channel: this, message: null };
    const [msg, ...rest] = this.messages;
    return {
      channel: new MessageChannel({
        id: this.id,
        sourceNodeId: this.sourceNodeId,
        targetNodeId: this.targetNodeId,
        fifo: this.fifo,
        latency: this.latency,
        dropRate: this.dropRate,
        messages: rest
      }),
      message: msg
    };
  }

  toJSON() {
    return {
      id: this.id,
      sourceNodeId: this.sourceNodeId,
      targetNodeId: this.targetNodeId,
      fifo: this.fifo,
      latency: this.latency,
      dropRate: this.dropRate,
      messagesCount: this.messages.length,
      messages: this.messages.map(m => m.toJSON ? m.toJSON() : m)
    };
  }
}
