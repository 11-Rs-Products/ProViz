/**
 * SymbolicPathGraph — Container of discovered symbolic paths across CFG structures.
 */

import { SymbolicPath } from './SymbolicPath.js';

export class SymbolicPathGraph {
    constructor() {
        this._paths = new Map(); // id -> SymbolicPath
    }

    addPath(path) {
        if (!(path instanceof SymbolicPath)) {
            throw new Error('Expected instance of SymbolicPath');
        }
        this._paths.set(path.id, path);
        return path;
    }

    getPath(id) {
        return this._paths.get(id) || null;
    }

    getPaths() {
        return Array.from(this._paths.values()).sort((a, b) => a.id.localeCompare(b.id));
    }

    getFeasiblePaths() {
        return this.getPaths().filter(p => p.isFeasible);
    }

    getInfeasiblePaths() {
        return this.getPaths().filter(p => !p.isFeasible);
    }

    toJSON() {
        return this.getPaths().map(p => p.toJSON());
    }

    static fromJSON(json) {
        const graph = new SymbolicPathGraph();
        if (Array.isArray(json)) {
            for (const item of json) {
                graph.addPath(SymbolicPath.fromJSON(item));
            }
        }
        return graph;
    }
}
