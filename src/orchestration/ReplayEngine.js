import { ExecutionTrace } from './ExecutionTrace.js';

export class ReplayEngine {
  static replay(trace, onEventCallback = null) {
    const events = trace instanceof ExecutionTrace ? trace.getEvents() : (Array.isArray(trace) ? trace : (trace?.events || []));
    const replayedState = {
      taskOrder: [],
      evidenceProduced: [],
      allocations: [],
      cancellations: [],
      retries: []
    };

    for (const evt of events) {
      if (typeof onEventCallback === 'function') {
        onEventCallback(evt);
      }

      switch (evt.type) {
        case 'TASK_DISPATCHED':
        case 'TASK_STARTED':
          replayedState.taskOrder.push(evt.payload?.taskId);
          break;
        case 'EVIDENCE_PRODUCED':
        case 'EVIDENCE_MERGED':
          replayedState.evidenceProduced.push(evt.payload);
          break;
        case 'RESOURCE_ALLOCATED':
          replayedState.allocations.push(evt.payload);
          break;
        case 'TASK_CANCELLED':
          replayedState.cancellations.push(evt.payload?.taskId);
          break;
        case 'TASK_RETRIED':
          replayedState.retries.push(evt.payload?.taskId);
          break;
        default:
          break;
      }
    }

    return replayedState;
  }
}
