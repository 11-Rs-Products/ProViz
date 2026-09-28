/**
 * ControlFlowBuilder — Helper for constructing CFGs programmatically.
 */

import { ControlFlowGraph } from './ControlFlowGraph.js';
import { ControlFlowNode, CFG_NODE_TYPES } from './ControlFlowNode.js';
import { ControlFlowEdge, CFG_EDGE_TYPES } from './ControlFlowEdge.js';
import { BasicBlock } from './BasicBlock.js';

export class ControlFlowBuilder {
    constructor({ functionId = '<module>', fileId = 'main.py' } = {}) {
        this.cfg = new ControlFlowGraph({ functionId, fileId });
        this.entry = this.cfg.addNode(ControlFlowNode.createEntryNode(functionId, fileId));
        this.exit = this.cfg.addNode(ControlFlowNode.createExitNode(functionId, fileId));
    }

    addStatement({ line = 0, label = '', targetVariable = null, dependencies = [] }) {
        const node = this.cfg.addNode(ControlFlowNode.createStatementNode({
            functionId: this.cfg.functionId,
            fileId: this.cfg.fileId,
            line,
            label,
            metadata: { targetVariable, dependencies, sourceLocation: { fileId: this.cfg.fileId, line } },
        }));
        return node;
    }

    addCondition({ line = 0, condition = '' }) {
        return this.cfg.addNode(ControlFlowNode.createConditionNode({
            functionId: this.cfg.functionId,
            fileId: this.cfg.fileId,
            line,
            condition,
        }));
    }

    connect(fromNode, toNode, type = CFG_EDGE_TYPES.NORMAL, condition = null) {
        const fromId = typeof fromNode === 'string' ? fromNode : fromNode.id;
        const toId = typeof toNode === 'string' ? toNode : toNode.id;
        return this.cfg.addEdge(new ControlFlowEdge({ fromId, toId, type, condition }));
    }

    build() {
        return this.cfg;
    }
}
