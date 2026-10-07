/**
 * DistributedFaultAnalyzer.js
 * Simulates and analyzes system execution under adversarial fault schedules.
 */

import { FaultType } from './DistributedFault.js';

export class DistributedFaultAnalyzer {
  /**
   * Evaluates if a distributed execution or system simulator survives the given fault schedule.
   * @param {import('./DistributedModel.js').DistributedModel} model
   * @param {import('./FaultSchedule.js').FaultSchedule} schedule
   * @param {Object} [workload={ messages: [], stateCheck: () => true }]
   * @returns {{ survived: boolean, deliveredMessages: Array<Object>, droppedMessages: Array<Object>, violations: Array<string> }}
   */
  simulateFaults(model, schedule, workload = { messages: [], stateCheck: () => true }) {
    const droppedMessages = [];
    const deliveredMessages = [];
    const violations = [];

    const messages = [...(workload.messages || [])];
    const faults = schedule.faults;

    for (const msg of messages) {
      let dropped = false;
      const sendTime = msg.sendTimestamp || 0;

      // Check active faults at send time
      const activeFaults = schedule.getActiveFaultsAt(sendTime);
      for (const f of activeFaults) {
        if (f.type === FaultType.MESSAGE_LOSS) {
          if (!f.targetChannelId || f.targetChannelId === msg.channelId) {
            dropped = true;
            droppedMessages.push({ message: msg, faultId: f.id, reason: 'MESSAGE_LOSS fault dropped message' });
            break;
          }
        } else if (f.type === FaultType.NODE_CRASH) {
          if (f.targetNodeId === msg.senderId || f.targetNodeId === msg.receiverId) {
            dropped = true;
            droppedMessages.push({ message: msg, faultId: f.id, reason: `Node ${f.targetNodeId} is crashed` });
            break;
          }
        } else if (f.type === FaultType.NETWORK_PARTITION) {
          const partA = f.parameters?.partitionA || [];
          const partB = f.parameters?.partitionB || [];
          if ((partA.includes(msg.senderId) && partB.includes(msg.receiverId)) ||
              (partB.includes(msg.senderId) && partA.includes(msg.receiverId))) {
            dropped = true;
            droppedMessages.push({ message: msg, faultId: f.id, reason: 'NETWORK_PARTITION separated sender and receiver' });
            break;
          }
        }
      }

      if (!dropped) {
        deliveredMessages.push(msg);
      }
    }

    if (typeof workload.stateCheck === 'function') {
      const stateOk = workload.stateCheck(deliveredMessages, droppedMessages);
      if (!stateOk) {
        violations.push('Custom state integrity check failed under fault schedule.');
      }
    }

    return {
      survived: violations.length === 0,
      deliveredMessages,
      droppedMessages,
      violations
    };
  }
}
