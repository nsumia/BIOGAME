// Minimal headless-Chromium driver over the DevTools protocol (no npm deps). Node >= 22 (global WebSocket, fetch).
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
export function serve(root) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}
export async function launch({ width = 960, height = 540, bin = process.env.CHROMIUM || 'chromium' } = {}) {
  const port = 9300 + Math.floor(Math.random() * 500), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'biogame-chrome-'));
  const proc = spawn(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--mute-audio', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 100 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (!targets.find(t => t.type === 'page')) targets = null; } catch { /* retry */ } if (!targets) await new Promise(r => setTimeout(r, 100)); }
  if (!targets) { proc.kill(); throw new Error('chromium did not start'); }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(), errors = [], logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    else if (m.method === 'Runtime.consoleAPICalled') { const t = m.params.args.map(a => a.value ?? a.description).join(' '); logs.push(`${m.params.type}: ${t}`); if (m.params.type === 'error' || m.params.type === 'assert') errors.push('console.' + m.params.type + ': ' + t); }
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('log.error: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  return {
    errors, logs, send,
    async goto(url) { await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, 300)); },
    async eval(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error('eval failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; },
    async shot(file) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); },
    async key(type, key, code) { await send('Input.dispatchKeyEvent', { type, key, code: code || key, windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0 }); },
    async close() { try { ws.close(); } catch { /* ignore */ } proc.kill('SIGKILL'); fs.rmSync(dir, { recursive: true, force: true }); },
  };
}
