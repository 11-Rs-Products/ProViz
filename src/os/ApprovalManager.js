/**
 * ApprovalManager.js
 * Tracks pending ApprovalRequests, processes HumanDecisions, and unblocks autonomous pipelines.
 */

import { ApprovalRequest } from './ApprovalRequest.js';
import { HumanDecision } from './HumanDecision.js';

export class ApprovalManager {
  constructor() {
    /** @type {Map<string, ApprovalRequest>} */
    this._requests = new Map();
    /** @type {Map<string, HumanDecision>} */
    this._decisions = new Map();
  }

  createRequest(requestData) {
    const req = requestData instanceof ApprovalRequest ? requestData : new ApprovalRequest(requestData);
    this._requests.set(req.id, req);
    return req;
  }

  recordDecision(decisionData) {
    const dec = decisionData instanceof HumanDecision ? decisionData : new HumanDecision(decisionData);
    const req = this._requests.get(dec.requestId);
    if (!req) {
      throw new Error(`Approval request ${dec.requestId} not found`);
    }

    this._decisions.set(dec.requestId, dec);
    return dec;
  }

  getPendingRequests() {
    return Array.from(this._requests.values()).filter(r => !this._decisions.has(r.id));
  }

  isApproved(requestId) {
    const dec = this._decisions.get(requestId);
    return dec ? dec.isApproved : false;
  }

  getDecision(requestId) {
    return this._decisions.get(requestId) || null;
  }
}
