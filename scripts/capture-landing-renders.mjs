/**
 * Regenerates public/landing/world-{light,dark}.webp — real renders of the 3D view used in the
 * landing hero. Runs the same program shown in the hero code pane. Requires `npm run dev` on :5173.
 *   node scripts/capture-landing-renders.mjs
 */
import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)('puppeteer');
const CODE = `def total(values):
    acc = 0
    for v in values:
        acc += v
    return acc

nums = [3, 1, 4, 5]
alias = nums
s = total(nums)
print(s)
`;
const out = new URL('../public/landing', import.meta.url).pathname;
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
for (const theme of ['light', 'dark']) {
  const p = await b.newPage();
  await p.setViewport({ width: 1800, height: 820, deviceScaleFactor: 2 });
  await p.evaluateOnNewDocument(t => { localStorage.setItem('proviz.theme', t); localStorage.setItem('proviz.studio', 'visualizer-3d'); localStorage.setItem('proviz.sidebarWidth', '340'); }, theme);
  await p.goto('http://localhost:5173/app/?preview=user', { waitUntil: 'networkidle0' });
  await p.addStyleTag({ content: '.canvas-hud, .canvas-floating-controls, .shortcut-strip, .canvas-step-chip, .canvas-tooltip, .toast-region { display: none !important; }' });
  await p.waitForFunction(() => window.__proviz?.editor);
  await p.evaluate(code => { const ed = window.__proviz.editor; ed.dispatch({ changes: { from: 0, to: ed.state.doc.length, insert: code } }); }, CODE);
  const typed = await p.evaluate(() => window.__proviz.editor.state.doc.toString());
  console.log(theme, 'editor:', JSON.stringify(typed.slice(0, 140)));
  await p.evaluate(async () => {
    document.getElementById('btn-run').click();
    for (let i = 0; i < 120 && document.getElementById('pb-counter').textContent.startsWith('0'); i++) await new Promise(r => setTimeout(r, 500));
    for (let i = 0; i < 80; i++) document.getElementById('btn-step-over').click();
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log(theme, 'counter', await p.evaluate(() => document.getElementById('pb-counter').textContent), 'vars', await p.evaluate(() => [...document.querySelectorAll('.var-card .var-name')].map(e => e.textContent).join(',')));
  await p.evaluate(() => {
    const w = window.__proviz.world; w.fitView(true);
    const t = w.controls.target, c = w.camera.position;
    c.set(t.x + (c.x - t.x) * 0.94, t.y + (c.y - t.y) * 0.94, t.z + (c.z - t.z) * 0.94); // dolly in
    w.controls.update();
  });
  await new Promise(r => setTimeout(r, 1200));
  const el = await p.$('#canvas-container');
  await el.screenshot({ path: `${out}/world-${theme}.webp`, type: 'webp', quality: 88 });
  await p.close();
}
await b.close();
