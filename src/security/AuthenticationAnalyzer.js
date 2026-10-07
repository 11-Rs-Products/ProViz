/**
 * AuthenticationAnalyzer.js
 * Verifies authentication state transitions and session validity.
 */

export class AuthenticationAnalyzer {
  /**
   * Verifies if caller session is valid and authenticated.
   * @param {Object} sessionContext
   * @param {boolean} requiresAuthentication
   * @returns {Object}
   */
  verifyAuthentication(sessionContext, requiresAuthentication = true) {
    if (!requiresAuthentication) {
      return { isAuthenticated: true, isValid: true, reason: 'Endpoint is publicly accessible' };
    }

    if (!sessionContext || !sessionContext.sessionId || sessionContext.isExpired) {
      return {
        isAuthenticated: false,
        isValid: false,
        reason: 'Authentication missing or session is expired'
      };
    }

    if (sessionContext.isForged || sessionContext.signatureInvalid) {
      return {
        isAuthenticated: false,
        isValid: false,
        reason: 'Session token signature invalid or forged'
      };
    }

    return {
      isAuthenticated: true,
      isValid: true,
      userId: sessionContext.userId,
      reason: 'Valid authenticated session'
    };
  }
}
