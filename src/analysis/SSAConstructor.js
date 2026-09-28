/**
 * SSAConstructor — Constructs SSA form with versioned values, dominance frontier phi-placement, and variable renaming.
 */

import { SSAFunction } from './SSAFunction.js';
import { SSAValue } from './SSAValue.js';
import { SSADefinition } from './SSADefinition.js';
import { SSAPhi } from './SSAPhi.js';
import { DominatorTree } from './DominatorTree.js';

export class SSAConstructor {
    /**
     * Constructs SSA form for a given ControlFlowGraph.
     *
     * @param {import('./ControlFlowGraph.js').ControlFlowGraph} cfg
     * @param {DominatorTree} [domTree=null]
     * @returns {SSAFunction}
     */
    static construct(cfg, domTree = null) {
        const dom = domTree || new DominatorTree(cfg);
        const ssaFn = new SSAFunction({
            functionId: cfg.functionId,
            fileId: cfg.fileId,
            cfg,
        });

        // 1. Collect all variable definitions per node and overall variable set
        const varDefsInNode = new Map(); // varName -> Set<nodeId>
        const allVars = new Set();

        for (const node of cfg.getNodes()) {
            const varName = node.metadata?.targetVariable;
            if (varName) {
                allVars.add(varName);
                if (!varDefsInNode.has(varName)) varDefsInNode.set(varName, new Set());
                varDefsInNode.get(varName).add(node.id);
            }
        }

        // 2. Insert Phi-Nodes at Dominance Frontiers
        const phiNodesPerNode = new Map(); // nodeId -> Map<varName, SSAPhi>

        for (const varName of allVars) {
            const defNodes = Array.from(varDefsInNode.get(varName) || []);
            if (defNodes.length <= 1) continue; // Single definition variables never need phi nodes
            const workList = [...defNodes];
            const hasPhi = new Set();

            while (workList.length > 0) {
                const nId = workList.shift();
                const frontier = dom.getFrontier(nId);

                for (const fId of frontier) {
                    if (!hasPhi.has(fId)) {
                        hasPhi.add(fId);

                        if (!phiNodesPerNode.has(fId)) phiNodesPerNode.set(fId, new Map());

                        const phiVal = ssaFn.addValue(new SSAValue({
                            variableId: varName,
                            version: ssaFn.getValuesForVariable(varName).length + 1,
                            functionId: cfg.functionId,
                            definitionNodeId: fId,
                            isPhi: true,
                        }));

                        const phi = new SSAPhi({
                            variableId: varName,
                            resultValueId: phiVal.id,
                            blockId: fId,
                        });
                        ssaFn.addPhi(phi);
                        phiNodesPerNode.get(fId).set(varName, phi);

                        if (!defNodes.includes(fId)) {
                            workList.push(fId);
                        }
                    }
                }
            }
        }

        // 3. Variable Renaming (Version Stacks)
        const varStacks = new Map();
        const varCounters = new Map();

        for (const varName of allVars) {
            varStacks.set(varName, [0]); // Initial version 0
            varCounters.set(varName, 0);
        }

        // Process nodes in topological / CFG order
        for (const node of cfg.getNodes()) {
            const nodePhis = phiNodesPerNode.get(node.id);
            if (nodePhis) {
                for (const [varName, phi] of nodePhis.entries()) {
                    const nextVer = (varCounters.get(varName) || 0) + 1;
                    varCounters.set(varName, nextVer);
                    varStacks.get(varName).push(nextVer);
                }
            }

            const stmt = node.metadata;
            if (!stmt) continue;

            const uses = stmt.dependencies || [];
            for (const u of uses) {
                if (varStacks.has(u)) {
                    const curVer = varStacks.get(u)[varStacks.get(u).length - 1];
                    const valId = `ssa_${String(cfg.functionId).replace(/[^a-zA-Z0-9_]/g, '_')}_${u}_${curVer}`;
                    ssaFn.recordUse(valId, { cfgNodeId: node.id });
                }
            }

            if (stmt.targetVariable) {
                const varName = stmt.targetVariable;
                const nextVer = (varCounters.get(varName) || 0) + 1;
                varCounters.set(varName, nextVer);
                varStacks.get(varName).push(nextVer);

                const ssaVal = ssaFn.addValue(new SSAValue({
                    variableId: varName,
                    version: nextVer,
                    functionId: cfg.functionId,
                    definitionNodeId: node.id,
                    sourceLocation: stmt.sourceLocation || node.sourceLocations?.[0] || null,
                }));

                ssaFn.addDefinition(new SSADefinition({
                    ssaValueId: ssaVal.id,
                    variableId: varName,
                    version: nextVer,
                    blockId: node.id,
                    cfgNodeId: node.id,
                    sourceLocation: stmt.sourceLocation || node.sourceLocations?.[0] || null,
                    dependencies: uses,
                }));
            }
        }

        return ssaFn;
    }
}
