/**
 * Evaluates whether two execution environments are compatible for cross-verifying results
 */
export class EnvironmentCompatibility {
  static check(envA, envB) {
    if (!envA || !envB) {
      return {
        compatible: false,
        score: 0.0,
        mismatches: ['MISSING_ENVIRONMENT']
      };
    }

    const mismatches = [];
    let score = 1.0;

    if (envA.runtime !== envB.runtime) {
      mismatches.push(`RUNTIME:${envA.runtime}!=${envB.runtime}`);
      score -= 0.5;
    }

    if (envA.os !== envB.os) {
      mismatches.push(`OS:${envA.os}!=${envB.os}`);
      score -= 0.2;
    }

    if (envA.architecture !== envB.architecture) {
      mismatches.push(`ARCH:${envA.architecture}!=${envB.architecture}`);
      score -= 0.2;
    }

    if (envA.fingerprint !== envB.fingerprint) {
      mismatches.push('FINGERPRINT_MISMATCH');
      score -= 0.1;
    }

    return {
      compatible: mismatches.length === 0,
      score: Math.max(0, score),
      mismatches: Object.freeze(mismatches)
    };
  }
}
