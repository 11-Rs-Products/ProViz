/**
 * PythonProbabilisticAdapter — Python-specific probabilistic behavioral and execution analysis.
 */

import { LanguageProbabilisticAdapter } from './LanguageProbabilisticAdapter.js';

export class PythonProbabilisticAdapter extends LanguageProbabilisticAdapter {
    constructor() {
        super('python');
    }

    extractFeatures(sourceCode, executionContext = {}) {
        const functions = [];
        const lines = String(sourceCode || '').split('\n');
        let branchesCount = 0;
        const predicates = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('def ')) {
                const match = line.match(/def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
                if (match) {
                    functions.push({
                        name: match[1],
                        parameters: match[2].split(',').map(p => p.trim()).filter(Boolean),
                        line: i + 1,
                    });
                }
            } else if (line.startsWith('if ') || line.startsWith('elif ')) {
                branchesCount++;
                const predMatch = line.match(/(?:if|elif)\s+(.+):/);
                if (predMatch) predicates.push(predMatch[1].trim());
            }
        }

        return {
            language: 'python',
            complexity: lines.length,
            functions,
            branchesCount,
            predicates,
            hasExceptions: sourceCode.includes('raise ') || sourceCode.includes('except'),
            hasLoops: sourceCode.includes('for ') || sourceCode.includes('while '),
        };
    }

    extractSubjectFeatures(sourceCode, context = {}) {
        return this.extractFeatures(sourceCode, context);
    }

    normalizeOutput(output) {
        if (output === null || output === undefined) return null;
        if (typeof output === 'number' && Number.isNaN(output)) return 'NaN';
        return output;
    }
}
