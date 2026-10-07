/**
 * ConsistencyAnalyzer.js
 * Analyzes distributed execution histories against consistency models.
 */

import { ConsistencyKind } from './ConsistencyModel.js';

export class ConsistencyAnalyzer {
  /**
   * Verifies if a distributed execution history satisfies a declared consistency model.
   * @param {Array<{ nodeId: string, type: 'READ'|'WRITE', key: string, value: any, version: number, timestamp: number }>} history
   * @param {import('./ConsistencyModel.js').ConsistencyModel} consistencyModel
   * @returns {{ satisfies: boolean, violations: Array<Object> }}
   */
  verifyConsistency(history, consistencyModel) {
    const violations = [];
    const kind = consistencyModel.kind;

    if (kind === ConsistencyKind.READ_YOUR_WRITES) {
      // Per node, every read must see at least the version of the latest write by that node
      const lastWriteVersionPerNode = new Map();

      for (const op of history) {
        const nodeKey = `${op.nodeId}:${op.key}`;
        if (op.type === 'WRITE') {
          lastWriteVersionPerNode.set(nodeKey, op.version);
        } else if (op.type === 'READ') {
          const expectedVersion = lastWriteVersionPerNode.get(nodeKey) || 0;
          if (op.version < expectedVersion) {
            violations.push({
              nodeId: op.nodeId,
              key: op.key,
              readVersion: op.version,
              expectedVersion,
              violation: `Read-Your-Writes violation: node ${op.nodeId} read version ${op.version} of key '${op.key}' after writing version ${expectedVersion}.`
            });
          }
        }
      }
    } else if (kind === ConsistencyKind.MONOTONIC_READS) {
      // Per node, successive reads of key must have non-decreasing version
      const lastReadVersionPerNode = new Map();

      for (const op of history) {
        if (op.type === 'READ') {
          const nodeKey = `${op.nodeId}:${op.key}`;
          const lastVersion = lastReadVersionPerNode.get(nodeKey) || 0;
          if (op.version < lastVersion) {
            violations.push({
              nodeId: op.nodeId,
              key: op.key,
              readVersion: op.version,
              previousReadVersion: lastVersion,
              violation: `Monotonic-Reads violation: node ${op.nodeId} read older version ${op.version} of key '${op.key}' after previously reading version ${lastVersion}.`
            });
          } else {
            lastReadVersionPerNode.set(nodeKey, op.version);
          }
        }
      }
    } else if (kind === ConsistencyKind.MONOTONIC_WRITES) {
      // Per node, successive writes of key must have strictly increasing versions/timestamps
      const lastWriteVersionPerNode = new Map();

      for (const op of history) {
        if (op.type === 'WRITE') {
          const nodeKey = `${op.nodeId}:${op.key}`;
          const lastVersion = lastWriteVersionPerNode.get(nodeKey) || 0;
          if (op.version <= lastVersion) {
            violations.push({
              nodeId: op.nodeId,
              key: op.key,
              writeVersion: op.version,
              previousWriteVersion: lastVersion,
              violation: `Monotonic-Writes violation: node ${op.nodeId} wrote version ${op.version} which is <= prior version ${lastVersion}.`
            });
          } else {
            lastWriteVersionPerNode.set(nodeKey, op.version);
          }
        }
      }
    } else if (kind === ConsistencyKind.EVENTUAL) {
      // Check if all nodes converge to same version at end of history
      const finalVersions = new Map();
      for (const op of history) {
        finalVersions.set(`${op.nodeId}:${op.key}`, op.version);
      }
      const keys = new Set(history.map(h => h.key));
      for (const key of keys) {
        const versions = Array.from(finalVersions.entries())
          .filter(([k]) => k.endsWith(`:${key}`))
          .map(([, v]) => v);
        const unique = new Set(versions);
        if (unique.size > 1) {
          violations.push({
            key,
            divergedVersions: Array.from(unique),
            violation: `Eventual consistency violation: Replicas did not converge on key '${key}'. Final versions: [${versions.join(', ')}].`
          });
        }
      }
    }

    return {
      satisfies: violations.length === 0,
      violations
    };
  }
}
