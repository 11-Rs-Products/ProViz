/**
 * SSAFunction — SSA form representation for a single function or module.
 */

import { SSAValue } from './SSAValue.js';
import { SSADefinition } from './SSADefinition.js';
import { SSAPhi } from './SSAPhi.js';
import { ControlFlowGraph } from './ControlFlowGraph.js';

export class SSAFunction {
    /**
     * @param {object} params
     * @param {string} params.functionId - Function name/ID (e.g. 'calc' or '<module>')
     * @param {string} [params.name]
     * @param {string} [params.fileId='main.py']
     * @param {Array<string>} [params.parameters=[]]
     * @param {ControlFlowGraph|null} [params.cfg=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        functionId = '<module>',
        name = null,
        fileId = 'main.py',
        parameters = [],
        cfg = null,
        metadata = {},
    } = {}) {
        this.functionId = functionId;
        this.name = name || functionId;
        this.fileId = fileId;
        this.parameters = Array.isArray(parameters) ? [...parameters] : [];
        this.cfg = cfg;
        this.metadata = { ...metadata };

        this.values = new Map(); // valueId -> SSAValue
        this.definitions = new Map(); // defId -> SSADefinition
        this.phiNodes = new Map(); // phiId -> SSAPhi
        this.uses = new Map(); // ssaValueId -> Array<{ cfgNodeId, blockId }>
        this.valuesByVariable = new Map(); // varName -> SSAValue[]
    }

    addValue(val) {
        const ssaVal = val instanceof SSAValue ? val : new SSAValue(val);
        this.values.set(ssaVal.id, ssaVal);

        if (!this.valuesByVariable.has(ssaVal.variableId)) {
            this.valuesByVariable.set(ssaVal.variableId, []);
        }
        this.valuesByVariable.get(ssaVal.variableId).push(ssaVal);
        return ssaVal;
    }

    getValue(id) {
        return this.values.get(id) || null;
    }

    getValues() {
        return Array.from(this.values.values());
    }

    getValuesForVariable(variableId) {
        return this.valuesByVariable.get(variableId) || [];
    }

    addDefinition(def) {
        const ssaDef = def instanceof SSADefinition ? def : new SSADefinition(def);
        this.definitions.set(ssaDef.id, ssaDef);
        return ssaDef;
    }

    getDefinition(id) {
        return this.definitions.get(id) || null;
    }

    getDefinitions() {
        return Array.from(this.definitions.values());
    }

    addPhi(phi) {
        const ssaPhi = phi instanceof SSAPhi ? phi : new SSAPhi(phi);
        this.phiNodes.set(ssaPhi.id, ssaPhi);
        return ssaPhi;
    }

    getPhi(id) {
        return this.phiNodes.get(id) || null;
    }

    getPhiNodes() {
        return Array.from(this.phiNodes.values());
    }

    recordUse(ssaValueId, { cfgNodeId = null, blockId = null } = {}) {
        if (!this.uses.has(ssaValueId)) {
            this.uses.set(ssaValueId, []);
        }
        this.uses.get(ssaValueId).push({ cfgNodeId, blockId });
    }

    getUses(ssaValueId) {
        return this.uses.get(ssaValueId) || [];
    }

    toJSON() {
        return {
            functionId: this.functionId,
            name: this.name,
            fileId: this.fileId,
            parameters: this.parameters,
            cfg: this.cfg ? this.cfg.toJSON() : null,
            values: Array.from(this.values.values()).map(v => v.toJSON()),
            definitions: Array.from(this.definitions.values()).map(d => d.toJSON()),
            phiNodes: Array.from(this.phiNodes.values()).map(p => p.toJSON()),
            uses: Array.from(this.uses.entries()).map(([k, v]) => ({ ssaValueId: k, useSites: v })),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        const fn = new SSAFunction({
            functionId: json.functionId,
            name: json.name,
            fileId: json.fileId,
            parameters: json.parameters,
            cfg: json.cfg ? ControlFlowGraph.fromJSON(json.cfg) : null,
            metadata: json.metadata,
        });

        if (Array.isArray(json.values)) {
            json.values.forEach(v => fn.addValue(SSAValue.fromJSON(v)));
        }
        if (Array.isArray(json.definitions)) {
            json.definitions.forEach(d => fn.addDefinition(SSADefinition.fromJSON(d)));
        }
        if (Array.isArray(json.phiNodes)) {
            json.phiNodes.forEach(p => fn.addPhi(SSAPhi.fromJSON(p)));
        }
        if (Array.isArray(json.uses)) {
            json.uses.forEach(u => {
                if (Array.isArray(u.useSites)) {
                    u.useSites.forEach(site => fn.recordUse(u.ssaValueId, site));
                }
            });
        }

        return fn;
    }
}
