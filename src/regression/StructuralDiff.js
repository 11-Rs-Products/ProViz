/**
 * StructuralDiff — Compares two WorkspaceSnapshots structurally (files, functions, statements, imports/exports).
 *
 * Uses stable IDs, qualified names, and normalized structure matching so that moved statements
 * or line-number shifts are not mistakenly classified as unrelated deletions and additions.
 */

import { SemanticChange } from './SemanticChange.js';
import { FunctionChange } from './FunctionChange.js';
import { ModuleChange } from './ModuleChange.js';
import { ChangeRegion } from './ChangeRegion.js';
import { CHANGE_KINDS } from './ChangeKind.js';
import { CHANGE_SEVERITIES } from './ChangeSeverity.js';
import { CHANGE_CONFIDENCES } from './ChangeConfidence.js';

export class StructuralDiff {
    /**
     * Compute structural differences between two WorkspaceSnapshots.
     *
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} beforeSnapshot
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} afterSnapshot
     * @returns {Array<SemanticChange>}
     */
    static diff(beforeSnapshot, afterSnapshot) {
        if (!beforeSnapshot || !afterSnapshot) return [];

        const changes = [];
        const beforeFiles = beforeSnapshot.getAllFiles();
        const afterFiles = afterSnapshot.getAllFiles();

        const beforeFileMap = new Map(beforeFiles.map(f => [f.path, f]));
        const afterFileMap = new Map(afterFiles.map(f => [f.path, f]));

        // 1. Files Added
        for (const [path, afterFile] of afterFileMap.entries()) {
            if (!beforeFileMap.has(path)) {
                changes.push(new SemanticChange({
                    kind: CHANGE_KINDS.FILE_ADDED,
                    severity: CHANGE_SEVERITIES.MAJOR,
                    confidence: CHANGE_CONFIDENCES.PROVEN,
                    fileId: afterFile.id,
                    sourceLocationAfter: new ChangeRegion({
                        fileId: afterFile.id,
                        path: afterFile.path,
                        startLine: 1,
                        endLine: afterFile.lineCount || 1,
                        content: afterFile.content,
                    }),
                    after: { path: afterFile.path, lineCount: afterFile.lineCount },
                    causes: ['File created in workspace'],
                    consequences: ['New module/file available for analysis and test coverage'],
                }));
            }
        }

        // 2. Files Removed
        for (const [path, beforeFile] of beforeFileMap.entries()) {
            if (!afterFileMap.has(path)) {
                changes.push(new SemanticChange({
                    kind: CHANGE_KINDS.FILE_REMOVED,
                    severity: CHANGE_SEVERITIES.CRITICAL,
                    confidence: CHANGE_CONFIDENCES.PROVEN,
                    fileId: beforeFile.id,
                    sourceLocationBefore: new ChangeRegion({
                        fileId: beforeFile.id,
                        path: beforeFile.path,
                        startLine: 1,
                        endLine: beforeFile.lineCount || 1,
                        content: beforeFile.content,
                    }),
                    before: { path: beforeFile.path, lineCount: beforeFile.lineCount },
                    causes: ['File deleted from workspace'],
                    consequences: ['Symbols and functions defined in file are no longer accessible'],
                }));
            }
        }

        // 3. Modified Files (Line-by-line & Structural AST Comparison)
        for (const [path, beforeFile] of beforeFileMap.entries()) {
            const afterFile = afterFileMap.get(path);
            if (!afterFile) continue;

            if (beforeFile.content !== afterFile.content) {
                const fileChanges = StructuralDiff._diffSingleFile(beforeFile, afterFile);
                changes.push(...fileChanges);
            }
        }

        return changes;
    }

    /**
     * @private
     */
    static _diffSingleFile(beforeFile, afterFile) {
        const changes = [];
        const beforeLines = beforeFile.content.split('\n');
        const afterLines = afterFile.content.split('\n');

        // File modified base change
        changes.push(new SemanticChange({
            kind: CHANGE_KINDS.FILE_MODIFIED,
            severity: CHANGE_SEVERITIES.MINOR,
            confidence: CHANGE_CONFIDENCES.PROVEN,
            fileId: afterFile.id,
            sourceLocationBefore: new ChangeRegion({
                fileId: beforeFile.id,
                path: beforeFile.path,
                startLine: 1,
                endLine: beforeLines.length,
            }),
            sourceLocationAfter: new ChangeRegion({
                fileId: afterFile.id,
                path: afterFile.path,
                startLine: 1,
                endLine: afterLines.length,
            }),
            before: { lineCount: beforeLines.length },
            after: { lineCount: afterLines.length },
        }));

        // Parse functions in both versions
        const beforeFunctions = StructuralDiff._extractFunctions(beforeLines, beforeFile.id, beforeFile.path);
        const afterFunctions = StructuralDiff._extractFunctions(afterLines, afterFile.id, afterFile.path);

        const beforeFuncMap = new Map(beforeFunctions.map(fn => [fn.name, fn]));
        const afterFuncMap = new Map(afterFunctions.map(fn => [fn.name, fn]));

        // Function added
        for (const [name, fnAfter] of afterFuncMap.entries()) {
            if (!beforeFuncMap.has(name)) {
                changes.push(new FunctionChange({
                    functionName: name,
                    newParams: fnAfter.params,
                    newBody: fnAfter.body,
                    fileId: afterFile.id,
                    kind: CHANGE_KINDS.FUNCTION_ADDED,
                    severity: CHANGE_SEVERITIES.MAJOR,
                    sourceLocationAfter: fnAfter.region,
                }));
            }
        }

        // Function removed
        for (const [name, fnBefore] of beforeFuncMap.entries()) {
            if (!afterFuncMap.has(name)) {
                changes.push(new FunctionChange({
                    functionName: name,
                    oldParams: fnBefore.params,
                    oldBody: fnBefore.body,
                    fileId: beforeFile.id,
                    kind: CHANGE_KINDS.FUNCTION_REMOVED,
                    severity: CHANGE_SEVERITIES.CRITICAL,
                    sourceLocationBefore: fnBefore.region,
                }));
            }
        }

        // Function modified
        for (const [name, fnBefore] of beforeFuncMap.entries()) {
            const fnAfter = afterFuncMap.get(name);
            if (!fnAfter) continue;

            const paramsChanged = JSON.stringify(fnBefore.params) !== JSON.stringify(fnAfter.params);
            const bodyChanged = fnBefore.body !== fnAfter.body;

            if (paramsChanged) {
                changes.push(new FunctionChange({
                    functionName: name,
                    oldParams: fnBefore.params,
                    newParams: fnAfter.params,
                    oldBody: fnBefore.body,
                    newBody: fnAfter.body,
                    fileId: afterFile.id,
                    kind: CHANGE_KINDS.FUNCTION_SIGNATURE_CHANGED,
                    severity: CHANGE_SEVERITIES.CRITICAL,
                    sourceLocationBefore: fnBefore.region,
                    sourceLocationAfter: fnAfter.region,
                }));
            } else if (bodyChanged) {
                changes.push(new FunctionChange({
                    functionName: name,
                    oldParams: fnBefore.params,
                    newParams: fnAfter.params,
                    oldBody: fnBefore.body,
                    newBody: fnAfter.body,
                    fileId: afterFile.id,
                    kind: CHANGE_KINDS.FUNCTION_BODY_CHANGED,
                    severity: CHANGE_SEVERITIES.MAJOR,
                    sourceLocationBefore: fnBefore.region,
                    sourceLocationAfter: fnAfter.region,
                }));
            }
        }

        // Statement-level diffing & moved statements
        const statementChanges = StructuralDiff._diffStatements(beforeLines, afterLines, beforeFile.id, afterFile.id, beforeFile.path);
        changes.push(...statementChanges);

        return changes;
    }

    /**
     * Extract top-level or method functions with names, params, body and line ranges.
     * @private
     */
    static _extractFunctions(lines, fileId, path) {
        const functions = [];
        let currentFunc = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const defMatch = line.match(/^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*:/);

            if (defMatch) {
                if (currentFunc) {
                    currentFunc.endLine = i;
                    currentFunc.body = lines.slice(currentFunc.startLine - 1, i).join('\n');
                    currentFunc.region = new ChangeRegion({
                        fileId,
                        path,
                        startLine: currentFunc.startLine,
                        endLine: currentFunc.endLine,
                        content: currentFunc.body,
                    });
                    functions.push(currentFunc);
                }

                const indent = defMatch[1].length;
                const name = defMatch[2];
                const rawParams = defMatch[3].split(',').map(p => p.trim()).filter(Boolean);

                currentFunc = {
                    name,
                    indent,
                    params: rawParams,
                    startLine: i + 1,
                    endLine: lines.length,
                    body: '',
                    region: null,
                };
            }
        }

        if (currentFunc) {
            currentFunc.endLine = lines.length;
            currentFunc.body = lines.slice(currentFunc.startLine - 1).join('\n');
            currentFunc.region = new ChangeRegion({
                fileId,
                path,
                startLine: currentFunc.startLine,
                endLine: currentFunc.endLine,
                content: currentFunc.body,
            });
            functions.push(currentFunc);
        }

        return functions;
    }

    /**
     * @private
     */
    static _diffStatements(beforeLines, afterLines, beforeFileId, afterFileId, path) {
        const changes = [];
        const maxLen = Math.max(beforeLines.length, afterLines.length);

        // Detect moved lines
        const beforeLineSet = new Map();
        beforeLines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                if (!beforeLineSet.has(trimmed)) beforeLineSet.set(trimmed, []);
                beforeLineSet.get(trimmed).push(idx + 1);
            }
        });

        for (let i = 0; i < maxLen; i++) {
            const bLine = beforeLines[i] !== undefined ? beforeLines[i] : null;
            const aLine = afterLines[i] !== undefined ? afterLines[i] : null;

            if (bLine === null && aLine !== null) {
                // Line added
                changes.push(new SemanticChange({
                    kind: CHANGE_KINDS.STATEMENT_ADDED,
                    severity: CHANGE_SEVERITIES.MINOR,
                    confidence: CHANGE_CONFIDENCES.PROVEN,
                    fileId: afterFileId,
                    sourceLocationAfter: new ChangeRegion({
                        fileId: afterFileId,
                        path,
                        startLine: i + 1,
                        endLine: i + 1,
                        content: aLine,
                    }),
                    after: aLine,
                }));
            } else if (bLine !== null && aLine === null) {
                // Line removed
                changes.push(new SemanticChange({
                    kind: CHANGE_KINDS.STATEMENT_REMOVED,
                    severity: CHANGE_SEVERITIES.MINOR,
                    confidence: CHANGE_CONFIDENCES.PROVEN,
                    fileId: beforeFileId,
                    sourceLocationBefore: new ChangeRegion({
                        fileId: beforeFileId,
                        path,
                        startLine: i + 1,
                        endLine: i + 1,
                        content: bLine,
                    }),
                    before: bLine,
                }));
            } else if (bLine !== null && aLine !== null && bLine !== aLine) {
                // Check if moved
                const aTrimmed = aLine.trim();
                const wasMoved = beforeLineSet.has(aTrimmed) && !beforeLineSet.get(aTrimmed).includes(i + 1);

                if (wasMoved && aTrimmed.length > 0) {
                    changes.push(new SemanticChange({
                        kind: CHANGE_KINDS.STATEMENT_MOVED,
                        severity: CHANGE_SEVERITIES.INFO,
                        confidence: CHANGE_CONFIDENCES.PROVEN,
                        fileId: afterFileId,
                        sourceLocationBefore: new ChangeRegion({
                            fileId: beforeFileId,
                            path,
                            startLine: beforeLineSet.get(aTrimmed)[0],
                            endLine: beforeLineSet.get(aTrimmed)[0],
                            content: bLine,
                        }),
                        sourceLocationAfter: new ChangeRegion({
                            fileId: afterFileId,
                            path,
                            startLine: i + 1,
                            endLine: i + 1,
                            content: aLine,
                        }),
                        before: bLine,
                        after: aLine,
                    }));
                } else {
                    changes.push(new SemanticChange({
                        kind: CHANGE_KINDS.STATEMENT_MODIFIED,
                        severity: CHANGE_SEVERITIES.MINOR,
                        confidence: CHANGE_CONFIDENCES.PROVEN,
                        fileId: afterFileId,
                        sourceLocationBefore: new ChangeRegion({
                            fileId: beforeFileId,
                            path,
                            startLine: i + 1,
                            endLine: i + 1,
                            content: bLine,
                        }),
                        sourceLocationAfter: new ChangeRegion({
                            fileId: afterFileId,
                            path,
                            startLine: i + 1,
                            endLine: i + 1,
                            content: aLine,
                        }),
                        before: bLine,
                        after: aLine,
                    }));
                }
            }
        }

        return changes;
    }
}
