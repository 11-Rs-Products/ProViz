/**
 * LanguageRepairAdapter — Abstract language adapter for source transformation and repair.
 */

export class LanguageRepairAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    generateNullGuard(varName, indent = '', defaultReturn = 'None') {
        throw new Error('generateNullGuard must be implemented by subclass');
    }

    generateDivisionGuard(denominatorName, indent = '', defaultReturn = '0') {
        throw new Error('generateDivisionGuard must be implemented by subclass');
    }

    generateBoundsGuard(collectionName, indexName, indent = '', defaultReturn = 'None') {
        throw new Error('generateBoundsGuard must be implemented by subclass');
    }

    generateKeyGuard(mapName, keyName, indent = '', defaultReturn = 'None') {
        throw new Error('generateKeyGuard must be implemented by subclass');
    }

    generateTypeGuard(varName, expectedType, indent = '', defaultReturn = 'None') {
        throw new Error('generateTypeGuard must be implemented by subclass');
    }

    generateAttributeGuard(objName, attrName, indent = '', defaultReturn = 'None') {
        throw new Error('generateAttributeGuard must be implemented by subclass');
    }

    generateExceptionHandling(codeBlock, indent = '', exceptionType = 'Exception', fallback = 'pass') {
        throw new Error('generateExceptionHandling must be implemented by subclass');
    }
}
