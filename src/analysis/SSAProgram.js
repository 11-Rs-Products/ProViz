/**
 * SSAProgram — Program-level container of SSAFunction structures across modules.
 */

import { SSAFunction } from './SSAFunction.js';

export class SSAProgram {
    constructor() {
        this.functions = new Map(); // functionId -> SSAFunction
    }

    addFunction(fn) {
        const ssaFn = fn instanceof SSAFunction ? fn : new SSAFunction(fn);
        this.functions.set(ssaFn.functionId, ssaFn);
        return ssaFn;
    }

    getFunction(functionId) {
        return this.functions.get(functionId) || null;
    }

    getFunctions() {
        return Array.from(this.functions.values());
    }

    toJSON() {
        return {
            functions: Array.from(this.functions.values()).map(fn => fn.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        const prog = new SSAProgram();
        if (Array.isArray(json.functions)) {
            json.functions.forEach(fn => prog.addFunction(SSAFunction.fromJSON(fn)));
        }
        return prog;
    }
}
