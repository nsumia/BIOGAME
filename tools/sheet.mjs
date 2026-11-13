// usage: node tools/sheet.mjs out.png "?f=player&s=4" [w] [h]
import { serve, launch } from './cdp.mjs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [out, q = '', w = 1200, h = 800] = process.argv.slice(2);
const { srv, port } = await serve(root); const b = await launch({ width: +w, height: +h });
await b.goto(`http://127.0.0.1:${port}/art.html${q}`);
for (let i = 0; i < 50 && !(await b.eval('window.ready === true')); i++) await new Promise(r => setTimeout(r, 100));
await b.shot(out); console.log('errors', b.errors); await b.close(); srv.close();
