/**
 * ConcolicFrame — Combined concrete and symbolic call frame.
 */

export class ConcolicFrame {
    /**
     * @param {object} params
     * @param {string} [params.moduleId='main']
     * @param {string} [params.fileId='main.py']
     * @param {string} [params.functionName='<module>']
     * @param {string} [params.frameId='frame_0']
     * @param {object} [params.concreteLocals={}]
     * @param {object} [params.symbolicLocals={}]
     * @param {object|null} [params.entryLocation=null]
     * @param {object|null} [params.returnLocation=null]
     */
    constructor({
        moduleId = 'main',
        fileId = 'main.py',
        functionName = '<module>',
        frameId = 'frame_0',
        concreteLocals = {},
        symbolicLocals = {},
        entryLocation = null,
        returnLocation = null,
    } = {}) {
        this.moduleId = String(moduleId);
        this.fileId = String(fileId);
        this.functionName = String(functionName);
        this.frameId = String(frameId);
        this.concreteLocals = Object.freeze({ ...concreteLocals });
        this.symbolicLocals = Object.freeze({ ...symbolicLocals });
        this.entryLocation = entryLocation ? Object.freeze({ ...entryLocation }) : null;
        this.returnLocation = returnLocation ? Object.freeze({ ...returnLocation }) : null;
        Object.freeze(this);
    }

    toJSON() {
        return {
            moduleId: this.moduleId,
            fileId: this.fileId,
            functionName: this.functionName,
            frameId: this.frameId,
            concreteLocals: this.concreteLocals,
            symbolicLocals: this.symbolicLocals,
            entryLocation: this.entryLocation,
            returnLocation: this.returnLocation,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ConcolicFrame(json);
    }
}
