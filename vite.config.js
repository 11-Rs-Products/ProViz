import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Static HTML partials: `<!--@name-->` in any page is replaced with partials/name.html.
 * Keeps the shared head, icon sprite and footers in one place while pages stay plain,
 * crawlable HTML with no client-side templating.
 */
function htmlPartials() {
    const load = name => readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8');
    const expand = (html, depth = 0) => (depth > 4 ? html : html.replace(/<!--@([a-z0-9-]+)-->/g, (_, name) => expand(load(name), depth + 1)));
    return {
        name: 'proviz-html-partials',
        transformIndexHtml: { order: 'pre', handler: html => expand(html) },
        handleHotUpdate({ file, server }) {
            if (file.includes(`${root}/partials/`)) server.ws.send({ type: 'full-reload' });
        },
    };
}

export default defineConfig({
    plugins: [htmlPartials()],
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'unsafe-none',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
        },
    },
    build: {
        rollupOptions: {
            input: {
                landing: resolve(root, 'index.html'),
                app: resolve(root, 'app/index.html'),
                privacy: resolve(root, 'privacy/index.html'),
                terms: resolve(root, 'terms/index.html'),
            },
        },
    },
});
