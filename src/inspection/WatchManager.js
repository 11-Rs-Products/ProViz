/**
 * WatchManager — Manages persistent watch expressions and batch evaluation.
 *
 * Responsibilities:
 *  - CRUD operations for user watch expressions.
 *  - Batch evaluation of active watch expressions against an EvaluationContext.
 *  - Historical watch tracking across multiple timeline frames.
 *  - Does NOT own RuntimeState (pure query configuration manager).
 */

import { WatchExpression } from './WatchExpression.js';
import { ExpressionEvaluator } from './ExpressionEvaluator.js';
import { EvaluationContext } from './EvaluationContext.js';
import { EvaluationResult } from './EvaluationResult.js';

export class WatchManager {
    /**
     * @param {object} [options]
     * @param {ExpressionEvaluator} [options.evaluator]
     * @param {Array<WatchExpression|object>} [options.watches=[]]
     */
    constructor({ evaluator = null, watches = [] } = {}) {
        this.evaluator = evaluator || new ExpressionEvaluator();
        this._watches = new Map(); // id -> WatchExpression

        for (const w of watches) {
            const watch = w instanceof WatchExpression ? w : WatchExpression.fromJSON(w);
            this._watches.set(watch.id, watch);
        }
    }

    /**
     * Adds a new watch expression.
     * @param {string|import('./Expression.js').Expression|WatchExpression} expression
     * @param {object} [options]
     * @returns {WatchExpression}
     */
    add(expression, options = {}) {
        let watch;
        if (expression instanceof WatchExpression) {
            watch = expression;
        } else {
            watch = new WatchExpression({
                expression,
                language: options.language || 'python',
                enabled: options.enabled !== false,
                metadata: options.metadata || {},
            });
        }

        this._watches.set(watch.id, watch);
        return watch;
    }

    /**
     * Removes a watch expression by ID.
     * @param {string} id
     * @returns {boolean} True if removed
     */
    remove(id) {
        return this._watches.delete(String(id));
    }

    /**
     * Updates an existing watch expression.
     * @param {string} id
     * @param {string|import('./Expression.js').Expression} newExpression
     * @returns {WatchExpression|null}
     */
    update(id, newExpression) {
        const watch = this.get(id);
        if (!watch) return null;
        watch.update(newExpression);
        return watch;
    }

    /**
     * Enables a watch expression.
     * @param {string} id
     * @returns {boolean}
     */
    enable(id) {
        const watch = this.get(id);
        if (!watch) return false;
        watch.enable();
        return true;
    }

    /**
     * Disables a watch expression.
     * @param {string} id
     * @returns {boolean}
     */
    disable(id) {
        const watch = this.get(id);
        if (!watch) return false;
        watch.disable();
        return true;
    }

    /**
     * Toggles enabled state for a watch expression.
     * @param {string} id
     * @returns {boolean|null} New state, or null if not found
     */
    toggle(id) {
        const watch = this.get(id);
        if (!watch) return null;
        return watch.toggle();
    }

    /**
     * Retrieves a watch by ID.
     * @param {string} id
     * @returns {WatchExpression|null}
     */
    get(id) {
        return this._watches.get(String(id)) || null;
    }

    /**
     * Returns an array of all registered watch expressions.
     * @returns {Array<WatchExpression>}
     */
    getAll() {
        return Array.from(this._watches.values());
    }

    /**
     * Clears all watch expressions.
     */
    clear() {
        this._watches.clear();
    }

    /**
     * Evaluates a single watch expression against an EvaluationContext.
     * @param {string} id
     * @param {EvaluationContext|object} context
     * @returns {EvaluationResult|null}
     */
    evaluate(id, context) {
        const watch = this.get(id);
        if (!watch) return null;
        const ctx = context instanceof EvaluationContext ? context : new EvaluationContext(context);
        return this.evaluator.evaluate(watch.expression, ctx);
    }

    /**
     * Evaluates all enabled watch expressions against an EvaluationContext.
     * @param {EvaluationContext|object} context
     * @returns {Map<string, EvaluationResult>} Map of watchId -> EvaluationResult
     */
    evaluateAll(context) {
        const ctx = context instanceof EvaluationContext ? context : new EvaluationContext(context);
        const results = new Map();

        for (const [id, watch] of this._watches.entries()) {
            if (watch.enabled) {
                const res = this.evaluator.evaluate(watch.expression, ctx);
                results.set(id, res);
            }
        }

        return results;
    }

    /**
     * Helper to evaluate all watches and return a plain key-value dictionary.
     * @param {EvaluationContext|object} context
     * @returns {Record<string, EvaluationResult>}
     */
    evaluateAllAsDict(context) {
        const map = this.evaluateAll(context);
        return Object.fromEntries(map.entries());
    }

    /**
     * Evaluates a watch expression across a sequence of historical timeline frames.
     * Uses PlaybackEngine / StateReconstructor checkpoints without re-running code.
     *
     * @param {string} id - Watch ID
     * @param {import('../PlaybackEngine.js').PlaybackEngine} playbackEngine
     * @param {Array<number>} [frameIndices] - Optional subset of frame indices (defaults to all frames)
     * @returns {Array<{ frameIndex: number, result: EvaluationResult }>}
     */
    evaluateHistory(id, playbackEngine, frameIndices = null) {
        const watch = this.get(id);
        if (!watch || !playbackEngine) return [];

        const total = playbackEngine.totalFrames;
        if (total === 0) return [];

        const indices = Array.isArray(frameIndices)
            ? frameIndices.filter(idx => idx >= 0 && idx < total)
            : Array.from({ length: total }, (_, i) => i);

        const history = [];
        for (const idx of indices) {
            const runtimeState = playbackEngine.reconstructor
                ? playbackEngine.reconstructor.reconstruct(idx)
                : playbackEngine.getCurrentRuntimeState();

            const ctx = EvaluationContext.fromRuntimeState(runtimeState, { frameIndex: idx });
            const result = this.evaluator.evaluate(watch.expression, ctx);
            history.push({
                frameIndex: idx,
                result,
            });
        }

        return history;
    }

    toJSON() {
        return {
            watches: this.getAll().map(w => w.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json) throw new Error('Cannot construct WatchManager from null/undefined');
        const watches = (json.watches || []).map(w => WatchExpression.fromJSON(w));
        return new WatchManager({ watches });
    }
}
