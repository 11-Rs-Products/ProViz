/**
 * ChangeCoverage — Measures semantic test coverage specifically across changed entities and regions.
 */

export class ChangeCoverage {
    /**
     * @param {object} params
     * @param {number} [params.changedLinesTotal=0]
     * @param {number} [params.changedLinesCovered=0]
     * @param {number} [params.changedStatementsTotal=0]
     * @param {number} [params.changedStatementsCovered=0]
     * @param {number} [params.changedFunctionsTotal=0]
     * @param {number} [params.changedFunctionsCovered=0]
     * @param {number} [params.changedBranchesTotal=0]
     * @param {number} [params.changedBranchesCovered=0]
     * @param {number} [params.changedDataflowTotal=0]
     * @param {number} [params.changedDataflowCovered=0]
     * @param {number} [params.changedPropertiesTotal=0]
     * @param {number} [params.changedPropertiesCovered=0]
     */
    constructor({
        changedLinesTotal = 0,
        changedLinesCovered = 0,
        changedStatementsTotal = 0,
        changedStatementsCovered = 0,
        changedFunctionsTotal = 0,
        changedFunctionsCovered = 0,
        changedBranchesTotal = 0,
        changedBranchesCovered = 0,
        changedDataflowTotal = 0,
        changedDataflowCovered = 0,
        changedPropertiesTotal = 0,
        changedPropertiesCovered = 0,
    } = {}) {
        this.changedLinesTotal = Number(changedLinesTotal) || 0;
        this.changedLinesCovered = Number(changedLinesCovered) || 0;
        this.changedStatementsTotal = Number(changedStatementsTotal) || 0;
        this.changedStatementsCovered = Number(changedStatementsCovered) || 0;
        this.changedFunctionsTotal = Number(changedFunctionsTotal) || 0;
        this.changedFunctionsCovered = Number(changedFunctionsCovered) || 0;
        this.changedBranchesTotal = Number(changedBranchesTotal) || 0;
        this.changedBranchesCovered = Number(changedBranchesCovered) || 0;
        this.changedDataflowTotal = Number(changedDataflowTotal) || 0;
        this.changedDataflowCovered = Number(changedDataflowCovered) || 0;
        this.changedPropertiesTotal = Number(changedPropertiesTotal) || 0;
        this.changedPropertiesCovered = Number(changedPropertiesCovered) || 0;
        Object.freeze(this);
    }

    get lineCoverageRatio() {
        return this.changedLinesTotal > 0 ? this.changedLinesCovered / this.changedLinesTotal : 1.0;
    }

    get functionCoverageRatio() {
        return this.changedFunctionsTotal > 0 ? this.changedFunctionsCovered / this.changedFunctionsTotal : 1.0;
    }

    get branchCoverageRatio() {
        return this.changedBranchesTotal > 0 ? this.changedBranchesCovered / this.changedBranchesTotal : 1.0;
    }

    get overallRatio() {
        const parts = [
            this.lineCoverageRatio,
            this.functionCoverageRatio,
            this.branchCoverageRatio,
        ];
        return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 1000) / 1000;
    }

    toJSON() {
        return {
            changedLinesTotal: this.changedLinesTotal,
            changedLinesCovered: this.changedLinesCovered,
            lineCoverageRatio: this.lineCoverageRatio,
            changedStatementsTotal: this.changedStatementsTotal,
            changedStatementsCovered: this.changedStatementsCovered,
            changedFunctionsTotal: this.changedFunctionsTotal,
            changedFunctionsCovered: this.changedFunctionsCovered,
            functionCoverageRatio: this.functionCoverageRatio,
            changedBranchesTotal: this.changedBranchesTotal,
            changedBranchesCovered: this.changedBranchesCovered,
            branchCoverageRatio: this.branchCoverageRatio,
            changedDataflowTotal: this.changedDataflowTotal,
            changedDataflowCovered: this.changedDataflowCovered,
            changedPropertiesTotal: this.changedPropertiesTotal,
            changedPropertiesCovered: this.changedPropertiesCovered,
            overallRatio: this.overallRatio,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ChangeCoverage(json);
    }
}
