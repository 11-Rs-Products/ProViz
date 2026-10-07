import { PriorModel } from './PriorModel.js';
import { PosteriorModel } from './PosteriorModel.js';
import { BetaPosterior } from './BetaPosterior.js';
import { DirichletPosterior } from './DirichletPosterior.js';
import { PosteriorExplanation } from './PosteriorExplanation.js';

export class BayesianUpdater {
  static updateBinary(prior = new PriorModel({ type: 'Beta', parameters: { alpha: 1, beta: 1 } }), successes = 0, failures = 0) {
    const a0 = prior.parameters.alpha || 1.0;
    const b0 = prior.parameters.beta || 1.0;

    const beta = new BetaPosterior(a0 + successes, b0 + failures);
    const mean = beta.mean();
    const interval = beta.credibleInterval(0.95);

    const posterior = new PosteriorModel({
      type: 'Beta',
      prior,
      parameters: { alpha: beta.alpha, beta: beta.beta },
      mean,
      credibleInterval: interval,
      observations: { successes, failures }
    });

    const explanation = new PosteriorExplanation({
      priorSummary: `Beta(${a0}, ${b0})`,
      observationsSummary: `${successes} successes, ${failures} failures`,
      posteriorSummary: `Beta(${beta.alpha}, ${beta.beta}) with mean ${mean.toFixed(4)} and 95% CI [${interval.lower.toFixed(4)}, ${interval.upper.toFixed(4)}]`,
      explanation: `Updated Beta conjugate prior with ${successes + failures} observations.`
    });

    return { posterior, beta, explanation };
  }

  static updateCategorical(prior = new PriorModel({ type: 'Dirichlet', parameters: { alphas: {} } }), counts = {}) {
    const dirichlet = new DirichletPosterior(prior.parameters.alphas || {}).update(counts);
    const mean = dirichlet.mean();

    const posterior = new PosteriorModel({
      type: 'Dirichlet',
      prior,
      parameters: { alphas: dirichlet.alphas },
      mean: 0.0,
      observations: counts
    });

    const explanation = new PosteriorExplanation({
      priorSummary: `Dirichlet(${JSON.stringify(prior.parameters.alphas)})`,
      observationsSummary: JSON.stringify(counts),
      posteriorSummary: `Dirichlet(${JSON.stringify(dirichlet.alphas)})`,
      explanation: 'Updated Dirichlet conjugate prior with categorical observations.'
    });

    return { posterior, dirichlet, explanation };
  }
}
