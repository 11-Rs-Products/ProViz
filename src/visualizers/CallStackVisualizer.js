/**
 * CallStackVisualizer — Renders the Python call stack as DOM cards (not Three.js).
 *
 * Why DOM and not Three.js? Call stack frames are text-heavy and benefit from
 * CSS layout, scrolling, and readable typography.
 *
 * Renders into a provided DOM container element.
 * Shows function name, parameters, local variables per frame.
 */

export class CallStackVisualizer {
    constructor(containerEl) {
        this.container = containerEl;
        this._frames = []; // array of { function, line, locals }
    }

    reset() {
        this._frames = [];
        this._render();
    }

    /**
     * Consume a visualization frame and update the call stack UI.
     * @param {object} frame - VisualizationFrame
     */
    consumeFrame(frame) {
        const newStack = frame.call_stack || [];

        // Deep-copy locals for the current (top) frame
        const currentLocals = frame.variables || {};

        this._frames = newStack.map((sf, idx) => {
            const isTop = idx === newStack.length - 1;
            return {
                function: sf.function,
                line: sf.line,
                locals: isTop ? currentLocals : {},
                isTop,
            };
        });

        // Handle call/return event types
        if (frame.event_type === 'call') {
            this._animateNewFrame();
        } else if (frame.event_type === 'return') {
            this._animatePopFrame();
        }

        this._render();
    }

    _animateNewFrame() {
        // CSS animation triggered via class — render will apply it
        this._pendingAnimation = 'push';
    }

    _animatePopFrame() {
        this._pendingAnimation = 'pop';
    }

    _render() {
        if (!this.container) return;

        if (this._frames.length === 0) {
            this.container.innerHTML = `
                <div class="cs-empty">
                    <span>Call stack empty</span>
                    <span class="cs-hint">Run code to see function calls here</span>
                </div>`;
            return;
        }

        // Render from bottom (oldest) to top (newest)
        const html = this._frames
            .slice()
            .reverse()
            .map((f, idx) => {
                const isTop = idx === 0; // reversed, so idx 0 is top
                const localsHtml = Object.entries(f.locals || {})
                    .slice(0, 6)
                    .map(([k, v]) => `<div class="cs-var"><span class="cs-var-name">${k}</span><span class="cs-var-val">${v.value ?? v}</span></div>`)
                    .join('');

                return `
                    <div class="cs-frame ${isTop ? 'cs-frame--top' : ''}${this._pendingAnimation === 'push' && isTop ? ' cs-frame--new' : ''}">
                        <div class="cs-frame-header">
                            <span class="cs-fn-name">${f.function === '<module>' ? '〈module〉' : f.function + '()'}</span>
                            <span class="cs-line-badge">line ${f.line}</span>
                        </div>
                        ${localsHtml ? `<div class="cs-locals">${localsHtml}</div>` : ''}
                    </div>`;
            })
            .join('');

        this.container.innerHTML = html;
        this._pendingAnimation = null;
    }
}
