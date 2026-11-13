// quick manual capture: node tools/shots.mjs out.png [steps]   (plays N bot-steps first)
import { serve, launch } from './cdp.mjs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [out, steps = '0'] = process.argv.slice(2);
const { srv, port } = await serve(root); const b = await launch({ width: 960, height: 540 });
await b.goto(`http://127.0.0.1:${port}/index.html`); await new Promise(r => setTimeout(r, 800));
console.log(await b.eval('JSON.stringify(window.__bio && window.__bio.state())'));
await b.shot(out); console.log('errors', b.errors); await b.close(); srv.close();
