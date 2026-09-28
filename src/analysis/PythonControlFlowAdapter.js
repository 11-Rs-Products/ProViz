/**
 * PythonControlFlowAdapter — Parses Python control flow structures into canonical CFG nodes, edges, and basic blocks.
 */

import { LanguageControlFlowAdapter } from './LanguageControlFlowAdapter.js';
import { ControlFlowGraph } from './ControlFlowGraph.js';
import { ControlFlowNode, CFG_NODE_TYPES } from './ControlFlowNode.js';
import { ControlFlowEdge, CFG_EDGE_TYPES } from './ControlFlowEdge.js';
import { BasicBlock } from './BasicBlock.js';

export class PythonControlFlowAdapter extends LanguageControlFlowAdapter {
    constructor() {
        super('python');
    }

    /**
     * Builds a canonical ControlFlowGraph from Python source code.
     */
    buildCFG(sourceCode = '', { functionId = '<module>', moduleId = 'main', fileId = 'main.py' } = {}) {
        const cfg = new ControlFlowGraph({ functionId, moduleId, fileId });
        const entryNode = cfg.addNode(ControlFlowNode.createEntryNode(functionId, fileId));
        const exitNode = cfg.addNode(ControlFlowNode.createExitNode(functionId, fileId));

        if (!sourceCode.trim()) {
            cfg.addEdge(new ControlFlowEdge({ fromId: entryNode.id, toId: exitNode.id }));
            return cfg;
        }

        const lines = sourceCode.split(/\r?\n/);
        const parsedLines = [];

        for (let idx = 0; idx < lines.length; idx++) {
            const rawLine = lines[idx];
            const trimmed = rawLine.replace(/#.*$/, '').trim();
            if (trimmed) {
                const indent = rawLine.search(/\S/);
                parsedLines.push({
                    lineNum: idx + 1,
                    text: trimmed,
                    indent: indent >= 0 ? indent : 0,
                    metadata: this._extractStatementMetadata(trimmed, idx + 1, fileId),
                });
            }
        }

        if (parsedLines.length === 0) {
            cfg.addEdge(new ControlFlowEdge({ fromId: entryNode.id, toId: exitNode.id }));
            return cfg;
        }

        // Parse structured control flow
        let currentBB = new BasicBlock({ id: `bb_${functionId}_0`, functionId });
        cfg.addBasicBlock(currentBB);

        let previousNode = entryNode;
        const loopStack = []; // Stack of { headerNode, exitNode }
        const branchMergeStack = []; // Stack of merge nodes for if-statements

        for (let i = 0; i < parsedLines.length; i++) {
            const cur = parsedLines[i];
            const lineText = cur.text;
            const lineNum = cur.lineNum;

            // 1. If statement
            if (lineText.startsWith('if ')) {
                const condExpr = lineText.substring(3).replace(/:$/, '').trim();
                const condNode = cfg.addNode(ControlFlowNode.createConditionNode({
                    functionId,
                    fileId,
                    line: lineNum,
                    condition: condExpr,
                    ordinal: i,
                }));
                condNode.metadata = { ...condNode.metadata, ...cur.metadata };

                cfg.addEdge(new ControlFlowEdge({
                    type: CFG_EDGE_TYPES.NORMAL,
                    fromId: previousNode.id,
                    toId: condNode.id,
                }));

                const mergeNode = cfg.addNode(new ControlFlowNode({
                    id: `cfg_node_${functionId}_MERGE_L${lineNum}`,
                    type: CFG_NODE_TYPES.STATEMENT,
                    label: `merge (if L${lineNum})`,
                    functionId,
                    fileId,
                }));
                branchMergeStack.push({ condNode, mergeNode, indent: cur.indent, branchState: 'THEN' });

                previousNode = condNode;
                continue;
            }

            // 2. Else / Elif
            if (lineText.startsWith('else:') || lineText.startsWith('elif ')) {
                if (branchMergeStack.length > 0) {
                    const topBranch = branchMergeStack[branchMergeStack.length - 1];
                    // Link previous THEN body to merge point
                    cfg.addEdge(new ControlFlowEdge({
                        type: CFG_EDGE_TYPES.NORMAL,
                        fromId: previousNode.id,
                        toId: topBranch.mergeNode.id,
                    }));

                    topBranch.branchState = 'ELSE';
                    previousNode = topBranch.condNode;
                }
                continue;
            }

            // 3. While / For Loop
            if (lineText.startsWith('while ') || lineText.startsWith('for ')) {
                const loopCond = lineText.replace(/^(while|for)\s+/, '').replace(/:$/, '').trim();
                const loopNode = cfg.addNode(ControlFlowNode.createLoopHeaderNode({
                    functionId,
                    fileId,
                    line: lineNum,
                    condition: loopCond,
                    ordinal: i,
                }));
                loopNode.metadata = { ...loopNode.metadata, ...cur.metadata };

                cfg.addEdge(new ControlFlowEdge({
                    type: CFG_EDGE_TYPES.NORMAL,
                    fromId: previousNode.id,
                    toId: loopNode.id,
                }));

                const loopExit = cfg.addNode(new ControlFlowNode({
                    id: `cfg_node_${functionId}_LOOP_EXIT_L${lineNum}`,
                    type: CFG_NODE_TYPES.STATEMENT,
                    label: `exit (loop L${lineNum})`,
                    functionId,
                    fileId,
                }));

                cfg.addEdge(new ControlFlowEdge({
                    type: CFG_EDGE_TYPES.LOOP_EXIT,
                    fromId: loopNode.id,
                    toId: loopExit.id,
                }));

                loopStack.push({ headerNode: loopNode, exitNode: loopExit, indent: cur.indent });
                previousNode = loopNode;
                continue;
            }

            // 4. Break / Continue
            if (lineText === 'break' && loopStack.length > 0) {
                const currentLoop = loopStack[loopStack.length - 1];
                const breakNode = cfg.addNode(new ControlFlowNode({
                    id: `cfg_node_${functionId}_BREAK_L${lineNum}`,
                    type: CFG_NODE_TYPES.STATEMENT,
                    label: 'break',
                    functionId,
                    fileId,
                    sourceLocations: [{ fileId, line: lineNum }],
                }));
                cfg.addEdge(new ControlFlowEdge({ fromId: previousNode.id, toId: breakNode.id }));
                cfg.addEdge(new ControlFlowEdge({
                    type: CFG_EDGE_TYPES.LOOP_EXIT,
                    fromId: breakNode.id,
                    toId: currentLoop.exitNode.id,
                }));
                previousNode = breakNode;
                continue;
            }

            if (lineText === 'continue' && loopStack.length > 0) {
                const currentLoop = loopStack[loopStack.length - 1];
                const contNode = cfg.addNode(new ControlFlowNode({
                    id: `cfg_node_${functionId}_CONTINUE_L${lineNum}`,
                    type: CFG_NODE_TYPES.STATEMENT,
                    label: 'continue',
                    functionId,
                    fileId,
                    sourceLocations: [{ fileId, line: lineNum }],
                }));
                cfg.addEdge(new ControlFlowEdge({ fromId: previousNode.id, toId: contNode.id }));
                cfg.addEdge(new ControlFlowEdge({
                    type: CFG_EDGE_TYPES.LOOP_BACK,
                    fromId: contNode.id,
                    toId: currentLoop.headerNode.id,
                }));
                previousNode = contNode;
                continue;
            }

            // 5. Return Statement
            if (lineText.startsWith('return')) {
                const retNode = cfg.addNode(new ControlFlowNode({
                    id: `cfg_node_${functionId}_RET_L${lineNum}`,
                    type: CFG_NODE_TYPES.RETURN,
                    label: lineText,
                    functionId,
                    fileId,
                    sourceLocations: [{ fileId, line: lineNum }],
                    metadata: cur.metadata,
                }));
                cfg.addEdge(new ControlFlowEdge({ fromId: previousNode.id, toId: retNode.id }));
                cfg.addEdge(new ControlFlowEdge({
                    type: CFG_EDGE_TYPES.RETURN,
                    fromId: retNode.id,
                    toId: exitNode.id,
                }));
                currentBB.addStatement(cur.metadata, retNode.id);
                previousNode = retNode;
                continue;
            }

            // 6. Normal Linear Statement
            const stmtNode = cfg.addNode(ControlFlowNode.createStatementNode({
                functionId,
                fileId,
                line: lineNum,
                label: lineText,
                ordinal: i,
                metadata: cur.metadata,
            }));

            let edgeType = CFG_EDGE_TYPES.NORMAL;
            if (previousNode.type === CFG_NODE_TYPES.CONDITION) {
                const topBranch = branchMergeStack.length > 0 ? branchMergeStack[branchMergeStack.length - 1] : null;
                edgeType = topBranch?.branchState === 'ELSE' ? CFG_EDGE_TYPES.FALSE_BRANCH : CFG_EDGE_TYPES.TRUE_BRANCH;
            } else if (previousNode.type === CFG_NODE_TYPES.LOOP_HEADER) {
                edgeType = CFG_EDGE_TYPES.TRUE_BRANCH;
            }

            cfg.addEdge(new ControlFlowEdge({
                type: edgeType,
                fromId: previousNode.id,
                toId: stmtNode.id,
            }));

            currentBB.addStatement(cur.metadata, stmtNode.id);
            previousNode = stmtNode;

            // Check if loop body finished (indent dropped)
            if (loopStack.length > 0 && i + 1 < parsedLines.length && parsedLines[i + 1].indent <= loopStack[loopStack.length - 1].indent) {
                const finishedLoop = loopStack.pop();
                cfg.addEdge(new ControlFlowEdge({
                    type: CFG_EDGE_TYPES.LOOP_BACK,
                    fromId: stmtNode.id,
                    toId: finishedLoop.headerNode.id,
                }));
                previousNode = finishedLoop.exitNode;
            }

            // Check if if-branch finished
            if (branchMergeStack.length > 0 && i + 1 < parsedLines.length && parsedLines[i + 1].indent <= branchMergeStack[branchMergeStack.length - 1].indent) {
                const nextLine = parsedLines[i + 1].text;
                const isElseNext = nextLine.startsWith('else:') || nextLine.startsWith('elif ');
                if (!isElseNext) {
                    const finishedBranch = branchMergeStack.pop();
                    cfg.addEdge(new ControlFlowEdge({
                        type: CFG_EDGE_TYPES.NORMAL,
                        fromId: stmtNode.id,
                        toId: finishedBranch.mergeNode.id,
                    }));
                    if (finishedBranch.branchState === 'THEN') {
                        // If there was no else branch, connect condition directly to merge with false branch
                        cfg.addEdge(new ControlFlowEdge({
                            type: CFG_EDGE_TYPES.FALSE_BRANCH,
                            fromId: finishedBranch.condNode.id,
                            toId: finishedBranch.mergeNode.id,
                        }));
                    }
                    previousNode = finishedBranch.mergeNode;
                }
            }
        }

        // Flush remaining open loops at EOF
        while (loopStack.length > 0) {
            const finishedLoop = loopStack.pop();
            cfg.addEdge(new ControlFlowEdge({
                type: CFG_EDGE_TYPES.LOOP_BACK,
                fromId: previousNode.id,
                toId: finishedLoop.headerNode.id,
            }));
            previousNode = finishedLoop.exitNode;
        }

        // Flush remaining open branches at EOF
        while (branchMergeStack.length > 0) {
            const finishedBranch = branchMergeStack.pop();
            cfg.addEdge(new ControlFlowEdge({
                type: CFG_EDGE_TYPES.NORMAL,
                fromId: previousNode.id,
                toId: finishedBranch.mergeNode.id,
            }));
            if (finishedBranch.branchState === 'THEN') {
                cfg.addEdge(new ControlFlowEdge({
                    type: CFG_EDGE_TYPES.FALSE_BRANCH,
                    fromId: finishedBranch.condNode.id,
                    toId: finishedBranch.mergeNode.id,
                }));
            }
            previousNode = finishedBranch.mergeNode;
        }

        // Final fallthrough to EXIT node
        if (previousNode !== exitNode && !cfg.getOutgoing(previousNode.id).some(e => e.toId === exitNode.id)) {
            cfg.addEdge(new ControlFlowEdge({
                type: CFG_EDGE_TYPES.NORMAL,
                fromId: previousNode.id,
                toId: exitNode.id,
            }));
        }

        return cfg;
    }

    _extractStatementMetadata(lineText, lineNum, fileId) {
        const assignMatch = lineText.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
        if (assignMatch) {
            return {
                targetVariable: assignMatch[1],
                dependencies: this._extractVariables(assignMatch[2]),
                sourceLocation: { fileId, line: lineNum },
            };
        }
        return {
            dependencies: this._extractVariables(lineText),
            sourceLocation: { fileId, line: lineNum },
        };
    }

    _extractVariables(exprStr) {
        if (!exprStr) return [];
        const noStrings = exprStr.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
        const tokens = noStrings.match(/[a-zA-Z_]\w*/g) || [];
        const keywords = new Set(['True', 'False', 'None', 'and', 'or', 'not', 'if', 'else', 'def', 'return', 'while', 'for', 'in', 'len', 'type', 'print']);
        return Array.from(new Set(tokens.filter(t => !keywords.has(t) && isNaN(Number(t)))));
    }
}
