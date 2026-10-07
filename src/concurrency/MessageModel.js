/**
 * MessageModel.js
 * Represents messages in a distributed system with delivery semantics.
 */

export const DeliverySemantics = Object.freeze({
  AT_MOST_ONCE: 'AT_MOST_ONCE',
  AT_LEAST_ONCE: 'AT_LEAST_ONCE',
  EXACTLY_ONCE: 'EXACTLY_ONCE',
  ORDERED: 'ORDERED',
  UNORDERED: 'UNORDERED'
});

export class MessageModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.senderId
   * @param {string} options.receiverId
   * @param {*} [options.payload=null]
   * @param {number} [options.sequenceNumber=0]
   * @param {string} [options.deliverySemantics=DeliverySemantics.AT_LEAST_ONCE]
   * @param {number} [options.sendTimestamp=0]
   * @param {number|null} [options.deliveryTimestamp=null]
   */
  constructor({
    id,
    senderId,
    receiverId,
    payload = null,
    sequenceNumber = 0,
    deliverySemantics = DeliverySemantics.AT_LEAST_ONCE,
    sendTimestamp = 0,
    deliveryTimestamp = null
  }) {
    if (!id || !senderId || !receiverId) {
      throw new Error('MessageModel requires id, senderId, and receiverId');
    }
    this.id = id;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.payload = payload;
    this.sequenceNumber = sequenceNumber;
    this.deliverySemantics = deliverySemantics;
    this.sendTimestamp = sendTimestamp;
    this.deliveryTimestamp = deliveryTimestamp;
    Object.freeze(this);
  }

  isDelivered() {
    return this.deliveryTimestamp !== null;
  }

  withDelivery(timestamp) {
    return new MessageModel({
      id: this.id,
      senderId: this.senderId,
      receiverId: this.receiverId,
      payload: this.payload,
      sequenceNumber: this.sequenceNumber,
      deliverySemantics: this.deliverySemantics,
      sendTimestamp: this.sendTimestamp,
      deliveryTimestamp: timestamp
    });
  }

  toJSON() {
    return {
      id: this.id,
      senderId: this.senderId,
      receiverId: this.receiverId,
      payload: this.payload,
      sequenceNumber: this.sequenceNumber,
      deliverySemantics: this.deliverySemantics,
      sendTimestamp: this.sendTimestamp,
      deliveryTimestamp: this.deliveryTimestamp
    };
  }

  static fromJSON(json) {
    return new MessageModel(json);
  }
}
