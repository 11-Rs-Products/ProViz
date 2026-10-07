/**
 * InformationFlowAnalyzer.js
 * Detects illegal or non-confidential propagation of sensitive data/secrets to observable outputs.
 */

import { FlowClassification } from './SourceSinkAnalyzer.js';

export class InformationFlowAnalyzer {
  /**
   * Evaluates confidentiality flow from confidential assets to output sinks.
   * @param {Asset} asset
   * @param {SecuritySink} sink
   * @param {Object} [options]
   * @returns {Object}
   */
  analyzeConfidentialityFlow(asset, sink, options = {}) {
    if (!asset || !sink) {
      return { isViolation: false, classification: FlowClassification.UNKNOWN };
    }

    const isSecret = asset.sensitivity === 'CONFIDENTIAL' || asset.sensitivity === 'CRITICAL';
    const isPublicSink = sink.operation === 'NETWORK_SEND' || sink.operation === 'SECRET_OUTPUT' || sink.operation === 'FILE_WRITE';

    if (isSecret && isPublicSink && !options.isEncrypted && !options.isAuthorized) {
      return {
        isViolation: true,
        classification: FlowClassification.VIOLATION,
        assetId: asset.id,
        sinkId: sink.id,
        reason: `Confidential asset '${asset.name}' flows into unencrypted public sink '${sink.id}'`
      };
    }

    return {
      isViolation: false,
      classification: FlowClassification.SAFE,
      assetId: asset.id,
      sinkId: sink.id,
      reason: 'Information flow complies with confidentiality boundaries'
    };
  }
}
