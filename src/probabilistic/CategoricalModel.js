/**
 * CategoricalModel — Models multi-class discrete outcomes (e.g. return types, behavior clusters, exceptions).
 */

import { ProbabilityDistribution } from './ProbabilityDistribution.js';

export class CategoricalModel extends ProbabilityDistribution {
    constructor({ categories = [], counts = {}, dirichletPrior = 1.0 } = {}) {
        super('categorical');
        this.categories = Object.freeze([...categories]);
        this.counts = Object.freeze({ ...counts });
        this.dirichletPrior = Number(dirichletPrior) || 1.0;

        let totalObs = 0;
        for (const cat of this.categories) {
            totalObs += (this.counts[cat] || 0);
        }
        this.totalObservations = totalObs;

        const k = Math.max(1, this.categories.length);
        const totalPseudo = this.totalObservations + (k * this.dirichletPrior);

        const probs = {};
        for (const cat of this.categories) {
            const c = (this.counts[cat] || 0);
            probs[cat] = (c + this.dirichletPrior) / totalPseudo;
        }
        this.probabilities = Object.freeze(probs);
        Object.freeze(this);
    }

    observe(category) {
        const cat = String(category);
        const newCats = this.categories.includes(cat) ? this.categories : [...this.categories, cat];
        const newCounts = { ...this.counts, [cat]: (this.counts[cat] || 0) + 1 };
        return new CategoricalModel({
            categories: newCats,
            counts: newCounts,
            dirichletPrior: this.dirichletPrior,
        });
    }

    probabilityOf(category) {
        return this.probabilities[String(category)] || 0.0;
    }

    getMode() {
        let bestCat = null;
        let maxCount = -1;
        for (const cat of this.categories) {
            const count = this.counts[cat] || 0;
            if (count > maxCount) {
                maxCount = count;
                bestCat = cat;
            }
        }
        return bestCat;
    }

    toJSON() {
        return {
            type: this.type,
            categories: this.categories,
            counts: this.counts,
            probabilities: this.probabilities,
            totalObservations: this.totalObservations,
            dirichletPrior: this.dirichletPrior,
        };
    }

    static fromJSON(json) {
        if (!json) return new CategoricalModel();
        return new CategoricalModel(json);
    }
}
