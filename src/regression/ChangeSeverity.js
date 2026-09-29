/**
 * ChangeSeverity — Severity classifications for semantic changes.
 */

export const CHANGE_SEVERITIES = Object.freeze({
    INFO: 'INFO',
    MINOR: 'MINOR',
    MAJOR: 'MAJOR',
    CRITICAL: 'CRITICAL',
    BLOCKER: 'BLOCKER',
});

export const SEVERITY_WEIGHTS = Object.freeze({
    [CHANGE_SEVERITIES.INFO]: 0.1,
    [CHANGE_SEVERITIES.MINOR]: 0.3,
    [CHANGE_SEVERITIES.MAJOR]: 0.6,
    [CHANGE_SEVERITIES.CRITICAL]: 0.85,
    [CHANGE_SEVERITIES.BLOCKER]: 1.0,
});
