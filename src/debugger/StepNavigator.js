/**
 * StepNavigator — Pure debugger stepping semantics over a recorded frame timeline.
 *
 * Because ProViz records the full trace up front, "stepping" is navigation through
 * immutable frames. Each function returns the target frame index (or the current index
 * when no move is possible) and never mutates playback state.
 */

function depthOf(frame) {
    return typeof frame?.stack_depth === 'number' ? frame.stack_depth : 0;
}

/** Step Into: the very next recorded frame. */
export function stepIntoIndex(frames, idx) {
    return Math.min(idx + 1, frames.length - 1);
}

/** Step Over: next frame at the same or a shallower call depth (skips callee bodies). */
export function stepOverIndex(frames, idx) {
    if (idx < 0) return frames.length > 0 ? 0 : -1;
    const base = depthOf(frames[idx]);
    for (let i = idx + 1; i < frames.length; i++) {
        if (depthOf(frames[i]) <= base) return i;
    }
    return frames.length - 1;
}

/** Step Out: next frame at a strictly shallower call depth (returns to the caller). */
export function stepOutIndex(frames, idx) {
    if (idx < 0) return frames.length > 0 ? 0 : -1;
    const base = depthOf(frames[idx]);
    for (let i = idx + 1; i < frames.length; i++) {
        if (depthOf(frames[i]) < base) return i;
    }
    return frames.length - 1;
}

/**
 * Continue: next frame whose line is a breakpoint, or whose event is an exception.
 * @param {Array<object>} frames
 * @param {number} idx
 * @param {Set<number>} breakpointLines
 */
export function continueIndex(frames, idx, breakpointLines = new Set()) {
    for (let i = idx + 1; i < frames.length; i++) {
        const f = frames[i];
        if (f.event_type === 'exception') return i;
        if (f.event_type === 'line' && breakpointLines.has(f.current_line)) return i;
    }
    return frames.length - 1;
}

/**
 * Timeline markers for the scrubber: function calls, exceptions, and breakpoint hits.
 * @returns {Array<{index:number, kind:'call'|'exception'|'breakpoint'}>}
 */
export function timelineMarkers(frames, breakpointLines = new Set()) {
    const out = [];
    frames.forEach((f, index) => {
        if (f.event_type === 'exception') out.push({ index, kind: 'exception' });
        else if (f.event_type === 'call' && f.current_function !== '<module>') out.push({ index, kind: 'call' });
        else if (f.event_type === 'line' && breakpointLines.has(f.current_line)) out.push({ index, kind: 'breakpoint' });
    });
    return out;
}

/**
 * Line where a step's variable changes actually happened. `sys.settrace` reports a line
 * *before* executing it, so changes observed at frame N were produced by frame N-1's line
 * (when both belong to the same function invocation).
 */
export function changeOriginLine(frames, idx) {
    const cur = frames[idx];
    if (!cur) return null;
    // Walk back over any callee frames (deeper depth) to this frame's previous line event,
    // so `x = f()` is attributed to the calling line rather than wherever f() returned to.
    const depth = depthOf(cur);
    for (let i = idx - 1; i >= 0; i--) {
        const prev = frames[i];
        const d = depthOf(prev);
        if (d > depth || (d === depth && prev.event_type === 'return')) continue;
        if (d === depth && prev.event_type === 'line' && prev.current_function === cur.current_function) {
            return prev.current_line;
        }
        break;
    }
    return cur.current_line;
}
