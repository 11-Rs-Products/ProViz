/**
 * AnimationClip — Immutable, renderer-independent animation clip for a target property.
 *
 * Represents a single property transition over time with deterministic interpolation and easing.
 * Zero Three.js/DOM dependencies.
 */

export const EASING_FUNCTIONS = Object.freeze({
    linear: (t) => Math.max(0, Math.min(1, t)),
    easeIn: (t) => {
        const c = Math.max(0, Math.min(1, t));
        return c * c;
    },
    easeOut: (t) => {
        const c = Math.max(0, Math.min(1, t));
        return c * (2 - c);
    },
    easeInOut: (t) => {
        const c = Math.max(0, Math.min(1, t));
        return c < 0.5 ? 2 * c * c : -1 + (4 - 2 * c) * c;
    },
});

export const CLIP_CATEGORIES = Object.freeze({
    CREATE: 'create',
    REMOVE: 'remove',
    MOVE: 'move',
    TRANSFORM: 'transform',
    STYLE: 'style',
    VALUE: 'value',
    HIGHLIGHT: 'highlight',
    RELATIONSHIP: 'relationship',
    LIFECYCLE: 'lifecycle',
    STRUCTURAL: 'structural',
});

/**
 * Pure helper for interpolating any two values deterministically.
 *
 * Supports numbers, {x,y,z} vectors, transform/style objects, and discrete values.
 *
 * @param {any} fromVal
 * @param {any} toVal
 * @param {number} t - Normalized progress [0, 1]
 * @returns {any} Interpolated value
 */
export function interpolateValue(fromVal, toVal, t) {
    const clampedT = Math.max(0, Math.min(1, t));

    if (clampedT === 0) return deepCloneValue(fromVal);
    if (clampedT === 1) return deepCloneValue(toVal);

    if (typeof fromVal === 'number' && typeof toVal === 'number') {
        return fromVal + (toVal - fromVal) * clampedT;
    }

    if (isVector(fromVal) && isVector(toVal)) {
        return {
            x: fromVal.x + ((toVal.x ?? 0) - fromVal.x) * clampedT,
            y: fromVal.y + ((toVal.y ?? 0) - fromVal.y) * clampedT,
            z: (fromVal.z ?? 0) + ((toVal.z ?? 0) - (fromVal.z ?? 0)) * clampedT,
        };
    }

    if (isObject(fromVal) && isObject(toVal) && !Array.isArray(fromVal) && !Array.isArray(toVal)) {
        const result = {};
        const allKeys = new Set([...Object.keys(fromVal), ...Object.keys(toVal)]);
        for (const k of allKeys) {
            const vFrom = fromVal[k];
            const vTo = toVal[k];
            if (vFrom !== undefined && vTo !== undefined) {
                result[k] = interpolateValue(vFrom, vTo, clampedT);
            } else if (vTo !== undefined) {
                result[k] = clampedT >= 0.5 ? deepCloneValue(vTo) : undefined;
            } else {
                result[k] = clampedT < 0.5 ? deepCloneValue(vFrom) : undefined;
            }
        }
        return result;
    }

    // Discrete fallback (strings, booleans, arrays, null, undefined, IDs)
    return clampedT < 1 ? deepCloneValue(fromVal) : deepCloneValue(toVal);
}

function isVector(v) {
    return isObject(v) && typeof v.x === 'number' && typeof v.y === 'number';
}

function isObject(v) {
    return v !== null && typeof v === 'object';
}

function deepCloneValue(v) {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(deepCloneValue);
    const copy = {};
    for (const [k, val] of Object.entries(v)) {
        copy[k] = deepCloneValue(val);
    }
    return copy;
}

export class AnimationClip {
    /**
     * @param {object} params
     * @param {string} params.id - Unique deterministic clip identifier
     * @param {string} params.targetId - Semantic target SceneNode/Relationship ID
     * @param {string} params.property - Dot-notated property path (e.g. 'transform.position', 'style.opacity')
     * @param {any} params.from - Initial value
     * @param {any} params.to - Final value
     * @param {number} [params.duration=0.5] - Duration in seconds
     * @param {number} [params.delay=0] - Start delay in seconds
     * @param {string} [params.easing='easeInOut'] - Easing function name from EASING_FUNCTIONS
     * @param {string} [params.category=CLIP_CATEGORIES.TRANSFORM] - Semantic category
     * @param {object} [params.metadata={}] - Arbitrary metadata
     */
    constructor({
        id,
        targetId,
        property,
        from,
        to,
        duration = 0.5,
        delay = 0,
        easing = 'easeInOut',
        category = CLIP_CATEGORIES.TRANSFORM,
        metadata = {},
    }) {
        this.id = id || `${targetId}_${property}_${category}`;
        this.targetId = targetId;
        this.property = property;
        this.from = deepCloneValue(from);
        this.to = deepCloneValue(to);
        this.duration = Math.max(0, duration);
        this.delay = Math.max(0, delay);
        this.easing = EASING_FUNCTIONS[easing] ? easing : 'linear';
        this.category = category;
        this.metadata = { ...metadata };
    }

    /**
     * Total end time of this clip (delay + duration).
     * @returns {number}
     */
    get endTime() {
        return this.delay + this.duration;
    }

    /**
     * Evaluates the interpolated value at a given local progress (0 to 1).
     *
     * @param {number} progress - Progress in [0, 1]
     * @returns {any} Interpolated property value
     */
    evaluate(progress) {
        const clampedProgress = Math.max(0, Math.min(1, progress));
        const easeFn = EASING_FUNCTIONS[this.easing] || EASING_FUNCTIONS.linear;
        const easedT = easeFn(clampedProgress);
        return interpolateValue(this.from, this.to, easedT);
    }

    /**
     * Evaluates value at a global track/plan time (in seconds).
     *
     * @param {number} time - Global time in seconds
     * @returns {any} Evaluated value
     */
    evaluateAtTime(time) {
        if (this.duration === 0) {
            return time >= this.delay ? deepCloneValue(this.to) : deepCloneValue(this.from);
        }
        if (time <= this.delay) {
            return deepCloneValue(this.from);
        }
        if (time >= this.endTime) {
            return deepCloneValue(this.to);
        }
        const localProgress = (time - this.delay) / this.duration;
        return this.evaluate(localProgress);
    }

    /**
     * Create a reversed version of this clip (swaps from and to).
     *
     * @param {object} [options={}]
     * @returns {AnimationClip}
     */
    reverse(options = {}) {
        let reversedEasing = this.easing;
        if (this.easing === 'easeIn') reversedEasing = 'easeOut';
        else if (this.easing === 'easeOut') reversedEasing = 'easeIn';

        return new AnimationClip({
            id: options.id || `${this.id}_reverse`,
            targetId: this.targetId,
            property: this.property,
            from: deepCloneValue(this.to),
            to: deepCloneValue(this.from),
            duration: this.duration,
            delay: this.delay,
            easing: reversedEasing,
            category: this.category === CLIP_CATEGORIES.CREATE ? CLIP_CATEGORIES.REMOVE :
                      this.category === CLIP_CATEGORIES.REMOVE ? CLIP_CATEGORIES.CREATE : this.category,
            metadata: { ...this.metadata, isReversed: true },
        });
    }

    clone() {
        return new AnimationClip({
            id: this.id,
            targetId: this.targetId,
            property: this.property,
            from: deepCloneValue(this.from),
            to: deepCloneValue(this.to),
            duration: this.duration,
            delay: this.delay,
            easing: this.easing,
            category: this.category,
            metadata: { ...this.metadata },
        });
    }

    equals(other) {
        if (!other || !(other instanceof AnimationClip)) return false;
        return (
            this.id === other.id &&
            this.targetId === other.targetId &&
            this.property === other.property &&
            JSON.stringify(this.from) === JSON.stringify(other.from) &&
            JSON.stringify(this.to) === JSON.stringify(other.to) &&
            this.duration === other.duration &&
            this.delay === other.delay &&
            this.easing === other.easing &&
            this.category === other.category &&
            JSON.stringify(this.metadata) === JSON.stringify(other.metadata)
        );
    }

    toJSON() {
        return {
            id: this.id,
            targetId: this.targetId,
            property: this.property,
            from: this.from,
            to: this.to,
            duration: this.duration,
            delay: this.delay,
            easing: this.easing,
            category: this.category,
            metadata: this.metadata,
        };
    }
}
