/**
 * FaultScheduleGenerator.js
 * Generates adversarial temporal fault injection schedules.
 */

import { DistributedFault, FaultType } from './DistributedFault.js';
import { FaultSchedule } from './FaultSchedule.js';

export class FaultScheduleGenerator {
  /**
   * Generates fault schedules for testing distributed resiliency.
   * @param {import('./DistributedModel.js').DistributedModel} distModel
   * @param {Object} [options={}]
   * @param {number} [options.maxSchedules=5]
   * @param {number} [options.timeHorizon=100]
   * @returns {Array<FaultSchedule>}
   */
  generateSchedules(distModel, { maxSchedules = 5, timeHorizon = 100 } = {}) {
    const schedules = [];
    const nodes = distModel.nodes;
    const channels = distModel.channels;

    let scheduleIndex = 1;

    // 1. Single node crash and recovery
    if (nodes.length > 0) {
      const crashNode = nodes[0];
      schedules.push(new FaultSchedule({
        id: `sched-crash-${scheduleIndex++}`,
        name: `Node crash on ${crashNode}`,
        faults: [
          new DistributedFault({
            id: `fault-crash-1`,
            type: FaultType.NODE_CRASH,
            targetNodeId: crashNode,
            triggerTime: 10,
            duration: 30
          }),
          new DistributedFault({
            id: `fault-restart-1`,
            type: FaultType.NODE_RESTART,
            targetNodeId: crashNode,
            triggerTime: 40,
            duration: 0
          })
        ],
        maxDuration: timeHorizon
      }));
    }

    // 2. Message loss on channels
    if (channels.length > 0) {
      const targetChan = channels[0].id;
      schedules.push(new FaultSchedule({
        id: `sched-loss-${scheduleIndex++}`,
        name: `Message loss on ${targetChan}`,
        faults: [
          new DistributedFault({
            id: `fault-loss-1`,
            type: FaultType.MESSAGE_LOSS,
            targetChannelId: targetChan,
            triggerTime: 15,
            duration: 25
          })
        ],
        maxDuration: timeHorizon
      }));
    }

    // 3. Network partition between nodes
    if (nodes.length >= 2) {
      schedules.push(new FaultSchedule({
        id: `sched-partition-${scheduleIndex++}`,
        name: `Network partition between [${nodes[0]}] and [${nodes.slice(1).join(',')}]`,
        faults: [
          new DistributedFault({
            id: `fault-part-1`,
            type: FaultType.NETWORK_PARTITION,
            parameters: { partitionA: [nodes[0]], partitionB: nodes.slice(1) },
            triggerTime: 20,
            duration: 50
          })
        ],
        maxDuration: timeHorizon
      }));
    }

    // 4. Message reordering and delay
    if (channels.length > 0) {
      schedules.push(new FaultSchedule({
        id: `sched-reorder-${scheduleIndex++}`,
        name: `Message reordering on ${channels[0].id}`,
        faults: [
          new DistributedFault({
            id: `fault-reorder-1`,
            type: FaultType.MESSAGE_REORDER,
            targetChannelId: channels[0].id,
            triggerTime: 5,
            duration: 40
          }),
          new DistributedFault({
            id: `fault-delay-1`,
            type: FaultType.NETWORK_DELAY,
            targetChannelId: channels[0].id,
            triggerTime: 10,
            duration: 20,
            parameters: { delayMs: 50 }
          })
        ],
        maxDuration: timeHorizon
      }));
    }

    return schedules.slice(0, maxSchedules);
  }
}
