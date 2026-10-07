import { FederatedEnvironment } from './FederatedEnvironment.js';

/**
 * Normalizes environment definitions for consistent cross-engine matching
 */
export class EnvironmentNormalizer {
  static normalize(env) {
    if (!env) return new FederatedEnvironment();
    if (env instanceof FederatedEnvironment) return env;

    const runtime = (env.runtime || 'node').toLowerCase();
    const os = (env.os || 'darwin').toLowerCase();
    const architecture = (env.architecture || env.arch || 'arm64').toLowerCase();
    const locale = (env.locale || 'en_US.UTF-8').trim();
    const timezone = (env.timezone || env.tz || 'UTC').trim();

    return new FederatedEnvironment({
      runtime,
      runtimeVersion: env.runtimeVersion || '20.0.0',
      os,
      architecture,
      compiler: env.compiler || null,
      interpreter: env.interpreter || null,
      dependencies: env.dependencies || {},
      environmentVariables: env.environmentVariables || {},
      locale,
      timezone,
      hardware: env.hardware || { cores: 8, memoryGB: 16 },
      container: env.container || null
    });
  }
}
