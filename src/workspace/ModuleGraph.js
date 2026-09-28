/**
 * ModuleGraph — Represents the directed dependency graph between modules in a Workspace.
 *
 * Guaranteed Properties:
 *  1. Cycle-Safe: Mutual or circular dependencies (A -> B -> C -> A) do not cause infinite loops.
 *  2. Directed: Distinguishes between dependencies (what module A imports) and dependents (who imports module A).
 *  3. Serializable: Full JSON round-trip for historical trace preservation.
 */

import { Module } from './Module.js';

export class ModuleGraph {
    /**
     * @param {object} [params]
     * @param {Array<Module|object>} [params.modules=[]]
     * @param {Array<{ from: string, to: string }>} [params.dependencies=[]]
     */
    constructor({ modules = [], dependencies = [] } = {}) {
        this._modules = new Map(); // moduleId -> Module
        this._adjacency = new Map(); // moduleId -> Set<toModuleId> (outbound: dependencies)
        this._reverseAdj = new Map(); // moduleId -> Set<fromModuleId> (inbound: dependents)

        for (const m of modules) {
            this.addModule(m);
        }

        for (const dep of dependencies) {
            if (dep && dep.from && dep.to) {
                this.addDependency(dep.from, dep.to);
            }
        }
    }

    /**
     * Adds or registers a module in the graph.
     * @param {Module|object} module
     * @returns {Module}
     */
    addModule(module) {
        const mod = module instanceof Module ? module : new Module(module);
        this._modules.set(mod.id, mod);
        if (!this._adjacency.has(mod.id)) {
            this._adjacency.set(mod.id, new Set());
        }
        if (!this._reverseAdj.has(mod.id)) {
            this._reverseAdj.set(mod.id, new Set());
        }

        // Register any declared imports as dependencies
        if (Array.isArray(mod.imports)) {
            for (const imp of mod.imports) {
                this.addDependency(mod.id, imp);
            }
        }

        return mod;
    }

    /**
     * Removes a module and its edges from the graph.
     * @param {string} moduleId
     * @returns {boolean}
     */
    removeModule(moduleId) {
        const modId = String(moduleId);
        if (!this._modules.has(modId)) return false;

        this._modules.delete(modId);

        // Remove outbound edges
        const outEdges = this._adjacency.get(modId);
        if (outEdges) {
            for (const toId of outEdges) {
                const rev = this._reverseAdj.get(toId);
                if (rev) rev.delete(modId);
            }
        }
        this._adjacency.delete(modId);

        // Remove inbound edges
        const inEdges = this._reverseAdj.get(modId);
        if (inEdges) {
            for (const fromId of inEdges) {
                const fwd = this._adjacency.get(fromId);
                if (fwd) fwd.delete(modId);
            }
        }
        this._reverseAdj.delete(modId);

        return true;
    }

    /**
     * Retrieves a module by ID.
     * @param {string} moduleId
     * @returns {Module|null}
     */
    getModule(moduleId) {
        return this._modules.get(String(moduleId)) || null;
    }

    /**
     * Checks if a module exists in the graph.
     * @param {string} moduleId
     * @returns {boolean}
     */
    hasModule(moduleId) {
        return this._modules.has(String(moduleId));
    }

    /**
     * Returns an array of all modules in the graph.
     * @returns {Array<Module>}
     */
    getModules() {
        return Array.from(this._modules.values());
    }

    getAllModules() {
        return this.getModules();
    }

    /**
     * Adds a directed dependency: fromModule imports toModule.
     * @param {string} fromModuleId
     * @param {string} toModuleId
     * @returns {ModuleGraph} Self
     */
    addDependency(fromModuleId, toModuleId) {
        const fromId = String(fromModuleId);
        const toId = String(toModuleId);

        if (!this._adjacency.has(fromId)) {
            this._adjacency.set(fromId, new Set());
        }
        if (!this._reverseAdj.has(toId)) {
            this._reverseAdj.set(toId, new Set());
        }

        this._adjacency.get(fromId).add(toId);
        this._reverseAdj.get(toId).add(fromId);

        // Synchronize module imports property if module object exists
        const mod = this._modules.get(fromId);
        if (mod && !mod.imports.includes(toId)) {
            mod.addImport(toId);
        }

        return this;
    }

    /**
     * Removes a directed dependency between two modules.
     * @param {string} fromModuleId
     * @param {string} toModuleId
     * @returns {boolean}
     */
    removeDependency(fromModuleId, toModuleId) {
        const fromId = String(fromModuleId);
        const toId = String(toModuleId);

        let removed = false;
        const outEdges = this._adjacency.get(fromId);
        if (outEdges && outEdges.has(toId)) {
            outEdges.delete(toId);
            removed = true;
        }

        const inEdges = this._reverseAdj.get(toId);
        if (inEdges && inEdges.has(fromId)) {
            inEdges.delete(fromId);
        }

        const mod = this._modules.get(fromId);
        if (mod) {
            mod.removeImport(toId);
        }

        return removed;
    }

    /**
     * Returns the direct dependencies imported by the specified module.
     * @param {string} moduleId
     * @returns {Array<string>} List of target module IDs
     */
    getDependencies(moduleId) {
        const edges = this._adjacency.get(String(moduleId));
        return edges ? Array.from(edges) : [];
    }

    /**
     * Returns the modules that depend on (import) the specified module.
     * @param {string} moduleId
     * @returns {Array<string>} List of source module IDs
     */
    getDependents(moduleId) {
        const edges = this._reverseAdj.get(String(moduleId));
        return edges ? Array.from(edges) : [];
    }

    /**
     * Finds the shortest import path from source module to target module (BFS).
     * Cycle-safe.
     *
     * @param {string} fromModuleId
     * @param {string} toModuleId
     * @returns {Array<string>|null} Array of module IDs [from, ..., to] or null if unreachable
     */
    getImportPath(fromModuleId, toModuleId) {
        const start = String(fromModuleId);
        const target = String(toModuleId);

        if (start === target) return [start];

        const queue = [[start]];
        const visited = new Set([start]);

        while (queue.length > 0) {
            const path = queue.shift();
            const curr = path[path.length - 1];

            const neighbors = this.getDependencies(curr);
            for (const next of neighbors) {
                if (next === target) {
                    return [...path, next];
                }
                if (!visited.has(next)) {
                    visited.add(next);
                    queue.push([...path, next]);
                }
            }
        }

        return null;
    }

    /**
     * Returns all modules transitively connected to / reachable from moduleId (Cycle-safe BFS).
     * @param {string} [moduleId] - If omitted, returns all modules with any connections
     * @returns {Array<string>}
     */
    getConnectedModules(moduleId = null) {
        if (moduleId) {
            const start = String(moduleId);
            const visited = new Set([start]);
            const queue = [start];

            while (queue.length > 0) {
                const curr = queue.shift();
                // Check both dependencies and dependents for structural component reachability
                const outgoing = this.getDependencies(curr);
                for (const next of outgoing) {
                    if (!visited.has(next)) {
                        visited.add(next);
                        queue.push(next);
                    }
                }
            }

            return Array.from(visited);
        }

        // Return all registered module IDs
        return Array.from(this._modules.keys());
    }

    /**
     * Checks if the module graph contains any cycles (DFS 3-color graph cycle detection).
     * @returns {boolean}
     */
    hasCycles() {
        const UNVISITED = 0, VISITING = 1, VISITED = 2;
        const state = new Map();

        for (const id of this._modules.keys()) {
            state.set(id, UNVISITED);
        }

        const dfs = (nodeId) => {
            state.set(nodeId, VISITING);
            for (const neighbor of this.getDependencies(nodeId)) {
                if (!state.has(neighbor)) continue;
                const neighborState = state.get(neighbor);
                if (neighborState === VISITING) {
                    return true; // Cycle detected
                }
                if (neighborState === UNVISITED) {
                    if (dfs(neighbor)) return true;
                }
            }
            state.set(nodeId, VISITED);
            return false;
        };

        for (const id of this._modules.keys()) {
            if (state.get(id) === UNVISITED) {
                if (dfs(id)) return true;
            }
        }

        return false;
    }

    /**
     * Finds cycles in the graph and returns sample cycle paths.
     * @returns {Array<Array<string>>}
     */
    findCycles() {
        const cycles = [];
        const visited = new Set();
        const stack = [];
        const inStack = new Set();

        const dfs = (nodeId) => {
            visited.add(nodeId);
            stack.push(nodeId);
            inStack.add(nodeId);

            for (const neighbor of this.getDependencies(nodeId)) {
                if (inStack.has(neighbor)) {
                    const cycleStartIdx = stack.indexOf(neighbor);
                    if (cycleStartIdx >= 0) {
                        cycles.push([...stack.slice(cycleStartIdx), neighbor]);
                    }
                } else if (!visited.has(neighbor)) {
                    dfs(neighbor);
                }
            }

            stack.pop();
            inStack.delete(nodeId);
        };

        for (const id of this._modules.keys()) {
            if (!visited.has(id)) {
                dfs(id);
            }
        }

        return cycles;
    }

    /**
     * Returns a topological sort ordering of modules (Cycle-safe fallback).
     * @returns {Array<string>}
     */
    getTopologicalOrder() {
        const inDegree = new Map();
        for (const id of this._modules.keys()) {
            inDegree.set(id, 0);
        }
        for (const [fromId, targets] of this._adjacency.entries()) {
            for (const toId of targets) {
                if (inDegree.has(toId)) {
                    inDegree.set(toId, inDegree.get(toId) + 1);
                }
            }
        }

        const queue = [];
        for (const [id, deg] of inDegree.entries()) {
            if (deg === 0) queue.push(id);
        }

        const result = [];
        while (queue.length > 0) {
            const curr = queue.shift();
            result.push(curr);

            for (const neighbor of this.getDependencies(curr)) {
                if (inDegree.has(neighbor)) {
                    inDegree.set(neighbor, inDegree.get(neighbor) - 1);
                    if (inDegree.get(neighbor) === 0) {
                        queue.push(neighbor);
                    }
                }
            }
        }

        // If cycle exists, append remaining unvisited nodes
        if (result.length < this._modules.size) {
            for (const id of this._modules.keys()) {
                if (!result.includes(id)) {
                    result.push(id);
                }
            }
        }

        return result;
    }

    clone() {
        const clonedModules = Array.from(this._modules.values()).map(m => m.clone());
        const clonedDeps = [];
        for (const [from, targets] of this._adjacency.entries()) {
            for (const to of targets) {
                clonedDeps.push({ from, to });
            }
        }
        return new ModuleGraph({ modules: clonedModules, dependencies: clonedDeps });
    }

    toJSON() {
        const dependencies = [];
        for (const [from, targets] of this._adjacency.entries()) {
            for (const to of targets) {
                dependencies.push({ from, to });
            }
        }
        return {
            modules: Array.from(this._modules.values()).map(m => m.toJSON()),
            dependencies,
        };
    }

    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct ModuleGraph from null/undefined');
        const modules = (json.modules || []).map(m => Module.fromJSON(m));
        return new ModuleGraph({
            modules,
            dependencies: json.dependencies || [],
        });
    }
}
