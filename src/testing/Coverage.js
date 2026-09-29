/**
 * Coverage — Immutable record of execution coverage across lines, CFG nodes, and branches.
 */

export class Coverage {
    /**
     * @param {object} params
     * @param {Set<number>|Array<number>} [params.lines=[]]
     * @param {Set<string>|Array<string>} [params.nodes=[]]
     * @param {Set<string>|Array<string>} [params.edges=[]]
     * @param {Set<string>|Array<string>} [params.branches=[]]
     * @param {Set<string>|Array<string>} [params.functions=[]]
     * @param {number} [params.totalLines=0]
     * @param {number} [params.totalBranches=0]
     */
    constructor({
        lines = [],
        nodes = [],
        edges = [],
        branches = [],
        functions = [],
        totalLines = 0,
        totalBranches = 0,
    } = {}) {
        this.lines = Object.freeze(Array.from(new Set(lines)).sort((a, b) => a - b));
        this.nodes = Object.freeze(Array.from(new Set(nodes)).sort());
        this.edges = Object.freeze(Array.from(new Set(edges)).sort());
        this.branches = Object.freeze(Array.from(new Set(branches)).sort());
        this.functions = Object.freeze(Array.from(new Set(functions)).sort());
        this.totalLines = Math.max(this.lines.length, Number(totalLines) || 0);
        this.totalBranches = Math.max(this.branches.length, Number(totalBranches) || 0);

        this.linePercent = this.totalLines > 0 ? Number(((this.lines.length / this.totalLines) * 100).toFixed(1)) : 100;
        this.branchPercent = this.totalBranches > 0 ? Number(((this.branches.length / this.totalBranches) * 100).toFixed(1)) : 100;
        Object.freeze(this);
    }

    union(other) {
        if (!other) return this;
        return new Coverage({
            lines: [...this.lines, ...other.lines],
            nodes: [...this.nodes, ...other.nodes],
            edges: [...this.edges, ...other.edges],
            branches: [...this.branches, ...other.branches],
            functions: [...this.functions, ...other.functions],
            totalLines: Math.max(this.totalLines, other.totalLines),
            totalBranches: Math.max(this.totalBranches, other.totalBranches),
        });
    }

    delta(other) {
        const otherLines = new Set(other ? other.lines : []);
        const newLines = this.lines.filter(l => !otherLines.has(l));
        return {
            newLines,
            lineGain: newLines.length,
        };
    }

    toJSON() {
        return {
            lines: this.lines,
            nodes: this.nodes,
            edges: this.edges,
            branches: this.branches,
            functions: this.functions,
            totalLines: this.totalLines,
            totalBranches: this.totalBranches,
            linePercent: this.linePercent,
            branchPercent: this.branchPercent,
        };
    }

    static fromJSON(json) {
        if (!json) return new Coverage();
        return new Coverage(json);
    }
}
