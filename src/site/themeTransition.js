/**
 * themeTransition.js — the theme change "wave".
 *
 * The new theme is revealed as a circle that grows from the control that was pressed until it
 * covers the viewport, while a soft ripple ring pulses outward from the same point. Built on the
 * View Transitions API, so the whole page (including the WebGL canvas) changes as one surface.
 * Without the API, or with reduced motion requested, it falls back to a short cross-fade.
 */

// Short, and accelerating through the end: an ease-out/in-out curve spends its last third
// creeping into the far corner, which reads as the wave "sticking" before it finishes.
const DURATION = 560;
const EASE = 'cubic-bezier(0.45, 0.05, 0.75, 0.6)';

function originOf(source) {
    if (source && typeof source.clientX === 'number' && (source.clientX || source.clientY)) {
        return { x: source.clientX, y: source.clientY };
    }
    const el = source?.currentTarget || source?.target || source;
    const rect = el?.getBoundingClientRect?.();
    if (rect && rect.width) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function ripple(x, y) {
    const wave = document.createElement('div');
    wave.className = 'theme-ripple';
    wave.setAttribute('aria-hidden', 'true');
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    wave.innerHTML = '<i></i><i></i>';
    // Attach to <html>, not <body>: the public site scales <body> with `zoom` on large screens,
    // which would multiply these viewport coordinates and push the rings off the toggle.
    document.documentElement.appendChild(wave);
    setTimeout(() => wave.remove(), DURATION + 120);
}

/**
 * Change the theme with the wave.
 * @param {() => void} apply   synchronously switches the theme (data-theme, storage, 3D world…)
 * @param {Event|Element} [source] the click event or element the wave starts from
 */
export function transitionTheme(apply, source) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;

    if (reduce || typeof document.startViewTransition !== 'function') {
        document.body.classList.add('theme-switching');
        apply();
        setTimeout(() => document.body.classList.remove('theme-switching'), 320);
        return;
    }

    const { x, y } = originOf(source);
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    root.classList.add('theme-wave');
    const transition = document.startViewTransition(() => {
        apply();
        ripple(x, y);
    });
    // Percentages, not pixels: the snapshot layer can be rasterised at the device pixel ratio
    // (seen on retina displays), where px coordinates land at x/DPR — i.e. left of the toggle.
    // Percentages resolve against the layer's own box, so the centre is right at any scale.
    const w = window.innerWidth;
    const h = window.innerHeight;
    const px = (x / w) * 100;
    const py = (y / h) * 100;
    const pr = (radius / (Math.hypot(w, h) / Math.SQRT2)) * 100; // circle() % is relative to √(w²+h²)/√2
    transition.ready.then(() => {
        root.animate(
            { clipPath: [`circle(0% at ${px}% ${py}%)`, `circle(${pr}% at ${px}% ${py}%)`] },
            { duration: DURATION, easing: EASE, pseudoElement: '::view-transition-new(root)' },
        );
    }).catch(() => { /* transition skipped: theme is already applied */ });
    transition.finished.finally(() => root.classList.remove('theme-wave'));
}
