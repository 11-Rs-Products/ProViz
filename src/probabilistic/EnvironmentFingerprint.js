import { EnvironmentCondition } from './EnvironmentCondition.js';

export class EnvironmentFingerprint {
  constructor({
    os = 'UNKNOWN',
    runtimeVersion = 'UNKNOWN',
    languageVersion = 'UNKNOWN',
    locale = 'UNKNOWN',
    timezone = 'UNKNOWN',
    architecture = 'UNKNOWN',
    dependencyVersion = 'UNKNOWN',
    configuration = {}
  } = {}) {
    this.os = new EnvironmentCondition({ dimension: 'os', value: os, isAvailable: os !== 'UNKNOWN' });
    this.runtimeVersion = new EnvironmentCondition({ dimension: 'runtimeVersion', value: runtimeVersion, isAvailable: runtimeVersion !== 'UNKNOWN' });
    this.languageVersion = new EnvironmentCondition({ dimension: 'languageVersion', value: languageVersion, isAvailable: languageVersion !== 'UNKNOWN' });
    this.locale = new EnvironmentCondition({ dimension: 'locale', value: locale, isAvailable: locale !== 'UNKNOWN' });
    this.timezone = new EnvironmentCondition({ dimension: 'timezone', value: timezone, isAvailable: timezone !== 'UNKNOWN' });
    this.architecture = new EnvironmentCondition({ dimension: 'architecture', value: architecture, isAvailable: architecture !== 'UNKNOWN' });
    this.dependencyVersion = new EnvironmentCondition({ dimension: 'dependencyVersion', value: dependencyVersion, isAvailable: dependencyVersion !== 'UNKNOWN' });
    this.configuration = Object.freeze({ ...configuration });
    Object.freeze(this);
  }

  isConsistentWith(other) {
    if (!other) return true;
    return (
      this.os.matches(other.os) &&
      this.runtimeVersion.matches(other.runtimeVersion) &&
      this.locale.matches(other.locale) &&
      this.timezone.matches(other.timezone) &&
      this.architecture.matches(other.architecture)
    );
  }

  toJSON() {
    return {
      os: this.os.toJSON(),
      runtimeVersion: this.runtimeVersion.toJSON(),
      languageVersion: this.languageVersion.toJSON(),
      locale: this.locale.toJSON(),
      timezone: this.timezone.toJSON(),
      architecture: this.architecture.toJSON(),
      dependencyVersion: this.dependencyVersion.toJSON(),
      configuration: this.configuration
    };
  }
}
