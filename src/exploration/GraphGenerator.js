/**
 * GraphGenerator — Generates bounded directed/undirected graph models.
 */

import { Generator } from './Generator.js';

export class GraphGenerator extends Generator {
    constructor(params = {}) {
        super({
            ...params,
            name: 'GraphGenerator',
            type: 'graph',
        });
        this.nodeCount = params.nodeCount !== undefined ? Number(params.nodeCount) : 4;
        Object.freeze(this);
    }

    generateValue(context) {
        const nodes = Array.from({ length: this.nodeCount }, (_, i) => `node_${i}`);
        const edges = [];
        for (let i = 0; i < this.nodeCount; i++) {
            for (let j = 0; j < this.nodeCount; j++) {
                if (i !== j && context.random(i * this.nodeCount + j) > 0.6) {
                    edges.push({ from: nodes[i], to: nodes[j] });
                }
            }
        }
        return { nodes, edges };
    }
}
