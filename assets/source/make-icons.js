#!/usr/bin/env node
// Generates every app icon from one SVG glyph: bold white wallet, emerald card and clasp, on indigo.
// Usage: node assets/source/make-icons.js   (renders with headless Google Chrome over the DevTools protocol; Node 22+)
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '../..');
const out = (p) => path.join(ROOT, p);

// Glyph artwork, viewBox 0 0 680 660.
const GW = 680;
const GH = 660;
const CARD = '<rect x="96" y="22" width="440" height="270" rx="60" transform="rotate(-10 316 157)"/>';
const BODY = '<rect x="0" y="176" width="624" height="484" rx="120"/>';
const CLASP = '<rect x="404" y="328" width="276" height="180" rx="90"/>';
const DOT = '<circle cx="494" cy="418" r="40"/>';

function glyph({ mono = false, shadow = true } = {}) {
  if (mono) {
    // Single color: gaps separate the card and clasp from the body, the dot is a hole.
    return `
  <defs>
    <mask id="mCard"><rect x="-50" y="-50" width="800" height="800" fill="#fff"/>
      <rect x="-30" y="146" width="684" height="544" rx="150" fill="#000"/></mask>
    <mask id="mBody"><rect x="-50" y="-50" width="800" height="800" fill="#fff"/>
      <rect x="374" y="298" width="336" height="240" rx="120" fill="#000"/></mask>
    <mask id="mClasp"><rect x="-50" y="-50" width="800" height="800" fill="#fff"/>
      <g fill="#000">${DOT}</g></mask>
  </defs>
  <g fill="#fff">
    <g mask="url(#mCard)">${CARD}</g>
    <g mask="url(#mBody)">${BODY}</g>
    <g mask="url(#mClasp)">${CLASP}</g>
  </g>`;
  }
  return `
  <defs>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6EE7B7"/><stop offset="1" stop-color="#10B981"/>
    </linearGradient>
    <linearGradient id="clasp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#34D399"/><stop offset="1" stop-color="#059669"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#1E1B4B" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g fill="url(#card)">${CARD}</g>
  <g fill="#FFFFFF"${shadow ? ' filter="url(#sh)"' : ''}>${BODY}</g>
  <g fill="url(#clasp)">${CLASP}</g>
  <g fill="#FFFFFF">${DOT}</g>`;
}

// Glyph placed in a square canvas, centered and scaled so its width is `scale` of the canvas.
function placed(size, scale, opts) {
  const s = (size * scale) / GW;
  const x = (size - GW * s) / 2;
  const y = (size - GH * s) / 2;
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})">${glyph(opts)}</g>`;
}

function background(size, radius = 0) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7067F5"/><stop offset="1" stop-color="#3B30C4"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.15" r="0.75">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#glow)"/>`;
}

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}\n</svg>\n`;

const fullIcon = (size, { radius = 0, scale = 0.66 } = {}) => svg(size, size, background(size, radius) + placed(size, scale));

// Minimal DevTools-protocol client: one headless Chrome tab, exact viewport, transparent background.
async function openBrowser() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'spendwise-icon-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank']);
  const browserWs = await new Promise((resolve, reject) => {
    let log = '';
    chrome.stderr.on('data', (d) => {
      log += d;
      const m = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) resolve(m[1]);
    });
    chrome.on('exit', () => reject(new Error(`Chrome exited:\n${log}`)));
  });
  const { port } = new URL(browserWs);
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

  let nextId = 0;
  const pending = new Map();
  const waiters = new Map();
  ws.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method && waiters.has(msg.method)) {
      waiters.get(msg.method)();
      waiters.delete(msg.method);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const once = (method) => new Promise((resolve) => waiters.set(method, resolve));

  await send('Page.enable');
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

  return {
    async render(content, size, file, height = size) {
      await send('Emulation.setDeviceMetricsOverride', { width: size, height, deviceScaleFactor: 1, mobile: false });
      const html = `<!doctype html><html><body style="margin:0;background:transparent">${content}</body></html>`;
      const loaded = once('Page.loadEventFired');
      await send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
      await loaded;
      const { data } = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: size, height, scale: 1 },
      });
      fs.writeFileSync(out(file), Buffer.from(data, 'base64'));
      console.log('wrote', file);
    },
    async close() {
      ws.close();
      const exited = new Promise((resolve) => chrome.once('exit', resolve));
      chrome.kill();
      await exited;
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    },
  };
}

const dataUri = (file) => `data:image/png;base64,${fs.readFileSync(out(file)).toString('base64')}`;

// README preview: every platform variant side by side.
function showcase() {
  const bg = dataUri('assets/images/android-icon-background.png');
  const fg = dataUri('assets/images/android-icon-foreground.png');
  const mono = dataUri('assets/images/android-icon-monochrome.png');
  const layer = (src) => `<img src="${src}" style="position:absolute;width:150%;left:-25%;top:-25%">`;
  const tile = (inner, label) =>
    `<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:18px;height:330px">${inner}<div style="font:600 20px -apple-system,Segoe UI,sans-serif;color:#334155">${label}</div></div>`;
  const circle = (inner, extra = '') =>
    `<div style="width:180px;height:180px;border-radius:50%;overflow:hidden;position:relative;${extra}">${inner}</div>`;
  return `<div style="width:1400px;height:420px;background:#F1F5F9;display:flex;align-items:center;justify-content:space-evenly">
    ${tile(`<img src="${dataUri('assets/images/icon.png')}" style="width:180px;border-radius:40px;box-shadow:0 10px 30px rgba(30,27,75,.25)">`, 'iOS')}
    ${tile(circle(layer(bg) + layer(fg), 'box-shadow:0 10px 30px rgba(30,27,75,.25)'), 'Android')}
    ${tile(circle(`<div style="position:absolute;width:150%;height:150%;left:-25%;top:-25%;background:#3730A3;-webkit-mask:url(${mono}) center/contain no-repeat"></div>`, 'background:#E0E7FF'), 'Android themed')}
    ${tile(`<div style="width:170px;height:300px;border-radius:28px;background:#4F46E5;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(30,27,75,.25)"><img src="${dataUri('assets/images/splash-icon.png')}" style="width:96px"></div>`, 'Splash')}
    ${tile(`<div style="display:flex;align-items:center;gap:10px;background:#fff;border-radius:12px;padding:12px 18px;box-shadow:0 4px 14px rgba(30,27,75,.12)"><img src="${dataUri('assets/images/favicon.png')}" style="width:28px"><span style="font:500 18px -apple-system,sans-serif;color:#0F172A">Spendwise</span></div>`, 'Web')}
  </div>`;
}

async function main() {
  const browser = await openBrowser();
  const render = browser.render;
  try {
    // Native app
    await render(fullIcon(1024), 1024, 'assets/images/icon.png');
    await render(svg(1024, 1024, background(1024)), 1024, 'assets/images/android-icon-background.png');
    // Android adaptive icons are masked to a circle as small as 61% of the canvas, so keep the glyph inside it.
    await render(svg(1024, 1024, placed(1024, 0.5)), 1024, 'assets/images/android-icon-foreground.png');
    await render(svg(1024, 1024, placed(1024, 0.5, { mono: true })), 1024, 'assets/images/android-icon-monochrome.png');
    await render(svg(512, 512, placed(512, 0.92)), 512, 'assets/images/splash-icon.png');
    // iOS Icon Composer layer (the indigo background comes from icon.json's fill).
    fs.writeFileSync(out('assets/expo.icon/Assets/wallet.svg'), svg(GW, GH, glyph({ shadow: false })));
    console.log('wrote assets/expo.icon/Assets/wallet.svg');

    // Web
    await render(fullIcon(196, { radius: 44 }), 196, 'assets/images/favicon.png');
    await render(fullIcon(180), 180, 'public/apple-touch-icon.png');
    await render(fullIcon(192), 192, 'public/icon-192.png');
    await render(fullIcon(512), 512, 'public/icon-512.png');
    await render(fullIcon(512, { scale: 0.56 }), 512, 'public/icon-maskable-512.png');

    await render(showcase(), 1400, 'docs/screenshots/app-icon.png', 420);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
