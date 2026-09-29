/**
 * PythonRepairAdapter — Concrete language adapter synthesizing Python guard transformations.
 */

import { LanguageRepairAdapter } from './LanguageRepairAdapter.js';

export class PythonRepairAdapter extends LanguageRepairAdapter {
    constructor() {
        super('python');
    }

    /**
     * Infer indentation of a line.
     * @param {string} line
     * @returns {string}
     */
    static getIndentation(line = '') {
        const match = line.match(/^([ \t]*)/);
        return match ? match[1] : '';
    }

    generateNullGuard(varName, indent = '    ', defaultReturn = 'None') {
        return `${indent}if ${varName} is None:\n${indent}    return ${defaultReturn}`;
    }

    generateDivisionGuard(denominatorName, indent = '    ', defaultReturn = '0') {
        return `${indent}if ${denominatorName} == 0:\n${indent}    return ${defaultReturn}`;
    }

    generateBoundsGuard(collectionName, indexName, indent = '    ', defaultReturn = 'None') {
        return `${indent}if not (0 <= ${indexName} < len(${collectionName})):\n${indent}    return ${defaultReturn}`;
    }

    generateKeyGuard(mapName, keyName, indent = '    ', defaultReturn = 'None') {
        return `${indent}if ${keyName} not in ${mapName}:\n${indent}    return ${defaultReturn}`;
    }

    generateTypeGuard(varName, expectedType = 'int', indent = '    ', defaultReturn = 'None') {
        return `${indent}if not isinstance(${varName}, ${expectedType}):\n${indent}    return ${defaultReturn}`;
    }

    generateAttributeGuard(objName, attrName, indent = '    ', defaultReturn = 'None') {
        return `${indent}if not hasattr(${objName}, '${attrName}'):\n${indent}    return ${defaultReturn}`;
    }

    generateExceptionHandling(codeBlock, indent = '    ', exceptionType = 'Exception', fallback = 'pass') {
        const indentedBlock = codeBlock
            .split('\n')
            .map(line => `${indent}    ${line.trim()}`)
            .join('\n');
        return `${indent}try:\n${indentedBlock}\n${indent}except ${exceptionType}:\n${indent}    ${fallback}`;
    }
}
