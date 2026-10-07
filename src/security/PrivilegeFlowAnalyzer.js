/**
 * PrivilegeFlowAnalyzer.js
 * Tracks privilege transitions across calls, components, and trust domains.
 */

export class PrivilegeFlowAnalyzer {
  /**
   * Evaluates if caller possesses sufficient privilege for callee/sink.
   * @param {string} callerPrivilege
   * @param {string} requiredPrivilege
   * @param {Array<string>} activeGuards
   * @returns {Object}
   */
  evaluatePrivilegeTransition(callerPrivilege, requiredPrivilege, activeGuards = []) {
    const privilegeHierarchy = {
      'ANONYMOUS': 0,
      'UNAUTHENTICATED': 0,
      'LOW_PRIVILEGE': 1,
      'USER': 2,
      'AUTHENTICATED': 2,
      'ADMIN': 3,
      'HIGH_PRIVILEGE': 3,
      'SYSTEM': 4
    };

    const callerLevel = privilegeHierarchy[callerPrivilege] !== undefined ? privilegeHierarchy[callerPrivilege] : 0;
    const requiredLevel = privilegeHierarchy[requiredPrivilege] !== undefined ? privilegeHierarchy[requiredPrivilege] : 2;

    const hasPrivilege = callerLevel >= requiredLevel;
    const hasElevationGuard = activeGuards.includes('ELEVATION_GUARD') || activeGuards.includes('SUDO_CHECK');

    if (!hasPrivilege && !hasElevationGuard) {
      return {
        isEscalationViolation: true,
        callerPrivilege,
        requiredPrivilege,
        reasons: [`Caller with privilege '${callerPrivilege}' lacks required '${requiredPrivilege}'`]
      };
    }

    return {
      isEscalationViolation: false,
      callerPrivilege,
      requiredPrivilege,
      reasons: ['Privilege flow satisfies access control policy']
    };
  }
}
