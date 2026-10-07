/**
 * Detects drift across environment configurations over time
 */
export class EnvironmentDriftDetector {
  static detectDrift(baselineEnv, currentEnv) {
    if (!baselineEnv || !currentEnv) {
      return {
        hasDrift: true,
        driftTypes: ['MISSING_ENVIRONMENT'],
        details: 'Baseline or current environment is undefined'
      };
    }

    const driftTypes = [];
    const differences = {};

    if (baselineEnv.runtimeVersion !== currentEnv.runtimeVersion) {
      driftTypes.push('RUNTIME_VERSION_DRIFT');
      differences.runtimeVersion = { baseline: baselineEnv.runtimeVersion, current: currentEnv.runtimeVersion };
    }

    if (baselineEnv.os !== currentEnv.os) {
      driftTypes.push('OS_DRIFT');
      differences.os = { baseline: baselineEnv.os, current: currentEnv.os };
    }

    if (baselineEnv.architecture !== currentEnv.architecture) {
      driftTypes.push('ARCHITECTURE_DRIFT');
      differences.architecture = { baseline: baselineEnv.architecture, current: currentEnv.architecture };
    }

    // Dependencies check
    const baseDeps = baselineEnv.dependencies || {};
    const currDeps = currentEnv.dependencies || {};
    const allDepKeys = new Set([...Object.keys(baseDeps), ...Object.keys(currDeps)]);
    for (const key of allDepKeys) {
      if (baseDeps[key] !== currDeps[key]) {
        driftTypes.push('DEPENDENCY_DRIFT');
        differences.dependencies = { ...(differences.dependencies || {}), [key]: { baseline: baseDeps[key], current: currDeps[key] } };
      }
    }

    return {
      hasDrift: driftTypes.length > 0,
      driftTypes: Object.freeze(driftTypes),
      differences: Object.freeze(differences)
    };
  }
}
