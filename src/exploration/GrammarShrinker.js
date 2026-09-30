export class GrammarShrinker {
    /**
     * @param {string} input
     * @param {Grammar|Function} grammarOrPredicate
     * @returns {Array<string>|string}
     */
    static shrink(input, grammarOrPredicate) {
        if (!input || typeof input !== 'string') return input;

        if (typeof grammarOrPredicate === 'function') {
            const failurePredicate = grammarOrPredicate;
            let current = input;
            let changed = true;
            let steps = 0;

            while (changed && current.length > 1 && steps < 100) {
                changed = false;
                // Try removing outermost or inner parentheses
                const simplified = current.replace(/\([^()]*\)/, '1');
                if (simplified !== current && failurePredicate(simplified)) {
                    current = simplified;
                    changed = true;
                    steps++;
                    continue;
                }

                // Try halving or sub-expression replacement
                for (let i = 0; i < current.length; i++) {
                    const candidate = current.slice(0, i) + current.slice(i + 1);
                    if (failurePredicate(candidate)) {
                        current = candidate;
                        changed = true;
                        steps++;
                        break;
                    }
                }
            }

            return current;
        }

        // Grammar production based shrinking candidates
        const candidates = [];
        if (input.includes('(') && input.includes(')')) {
            const stripped = input.replace(/\([^()]*\)/g, '1');
            if (stripped !== input) candidates.push(stripped);
        }

        if (input.length > 2) {
            candidates.push(input.slice(0, Math.floor(input.length / 2)));
            candidates.push(input.slice(Math.floor(input.length / 2)));
        }

        candidates.push('0');
        candidates.push('1');
        return [...new Set(candidates.filter(c => c.length < input.length))];
    }
}
