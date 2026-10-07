/**
 * DependencyKind.js
 * Multi-dimensional dependency classification spanning syntactic, control, data,
 * memory, behavioral, verification, specification, environment, and security dimensions.
 */

export const DependencyKind = Object.freeze({
  SYNTAX: 'SYNTAX',
  CONTROL_FLOW: 'CONTROL_FLOW',
  DATA_FLOW: 'DATA_FLOW',
  TYPE: 'TYPE',
  CALL: 'CALL',
  MEMORY: 'MEMORY',
  RESOURCE: 'RESOURCE',
  BEHAVIOR: 'BEHAVIOR',
  SPECIFICATION: 'SPECIFICATION',
  VERIFICATION: 'VERIFICATION',
  EVIDENCE: 'EVIDENCE',
  ENVIRONMENT: 'ENVIRONMENT',
  BUILD: 'BUILD',
  RUNTIME: 'RUNTIME',
  TEMPORAL: 'TEMPORAL',
  SECURITY: 'SECURITY'
});
