// Headless Chromium end-to-end: loads index.html, plays the whole game with the bot, captures screenshots, fails on any console error.
import { serve, launch } from './cdp.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs', 'screenshots'); fs.mkdirSync(outDir, { recursive: true });
const fail = []; const check = (c, m) => { if (!c) fail.push(m); console.log((c ? 'ok   ' : 'FAIL ') + m); };
const { srv, port } = await serve(root); const b = await launch({ width: 960, height: 540 });
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  // --- real keyboard path (no ?manual): Enter starts, WASD moves, J/Esc menus, save + reload + Continue
  await b.goto(`http://127.0.0.1:${port}/index.html`);
  for (let i = 0; i < 50 && !(await b.eval('!!window.__bio')); i++) await sleep(100);
  await b.eval('localStorage.clear()');
  check(await b.eval('__bio.core.mode') === 'title', 'title screen shown first');
  await b.key('keyDown', 'Enter', 'Enter'); await b.key('keyUp', 'Enter', 'Enter'); await sleep(300);
  check(await b.eval('__bio.core.mode') === 'play', 'Enter starts a new game');
  const x0 = await b.eval('__bio.core.p.x'); await b.key('keyDown', 'd', 'KeyD'); await sleep(700); await b.key('keyUp', 'd', 'KeyD'); await sleep(100);
  const x1 = await b.eval('__bio.core.p.x'); check(x1 > x0 + 10, `holding D walks the player right (${Math.round(x0)} -> ${Math.round(x1)})`);
  await b.key('keyDown', 'j', 'KeyJ'); await b.key('keyUp', 'j', 'KeyJ'); await sleep(150); check(await b.eval('__bio.core.mode') === 'journal', 'J opens the journal');
  await b.key('keyDown', 'Escape', 'Escape'); await b.key('keyUp', 'Escape', 'Escape'); await sleep(150); check(await b.eval('__bio.core.mode') === 'play', 'Esc closes the journal');
  await b.key('keyDown', 'Escape', 'Escape'); await b.key('keyUp', 'Escape', 'Escape'); await sleep(150); check(await b.eval('__bio.core.mode') === 'pause', 'Esc pauses');
  await b.key('keyDown', 'Escape', 'Escape'); await b.key('keyUp', 'Escape', 'Escape'); await sleep(150);
  await b.key('keyDown', 'm', 'KeyM'); await b.key('keyUp', 'm', 'KeyM'); await sleep(100); check(await b.eval('__bio.audio.muted') === true, 'M toggles mute');
  await b.eval('__bio.core.prog.mi = 2; __bio.core.prog.si = 0; __bio.core.enterStep(); __bio.core.save()');
  check(await b.eval('!!localStorage.getItem("biogame.save.v1")'), 'progress is written to localStorage');
  await b.goto(`http://127.0.0.1:${port}/index.html`);
  for (let i = 0; i < 50 && !(await b.eval('!!window.__bio')); i++) await sleep(100);
  check(await b.eval('!!__bio.core.saveData'), 'a save is found after reload (Continue offered)');
  await b.key('keyDown', 'Enter', 'Enter'); await b.key('keyUp', 'Enter', 'Enter'); await sleep(300);
  check(await b.eval('__bio.core.mode === "play" && __bio.core.prog.mi') === 2, 'Continue restores mission 3');
  await b.eval('localStorage.clear()');
  // --- deterministic run driven by the bot
  await b.goto(`http://127.0.0.1:${port}/index.html?manual=1`);
  for (let i = 0; i < 50 && !(await b.eval('!!window.__bio')); i++) await sleep(100);
  check(await b.eval('!!window.__bio'), 'game booted in headless Chromium');
  const dims = await b.eval('[document.getElementById("game").width, document.getElementById("game").height, document.getElementById("game").clientWidth]');
  check(dims[0] === 480 && dims[1] === 270, `canvas logical resolution 480x270 (css width ${dims[2]})`);
  await sleep(500); await b.shot(path.join(outDir, '01-title.png'));
  // continue-menu path: no save yet
  await b.eval('__bio.core.press("act"); __bio.step(2)');
  await b.eval('__bio.makeBot({})');
  const want = {
    '02-station-start': s => s.mi === 0 && s.si === 0 && s.mode === 'play' && s.time > 0.4,
    '03-dialogue': s => s.mi === 1 && s.mode === 'dialogue' && s.chars > 60,
    '04-meadow-net': s => s.mi === 1 && s.step === 'catch' && s.mode === 'play' && s.zone === 'meadow' && s.time > 0,
    '05-quiz': s => s.quiz === 'ask',
    '06-forest': s => s.mi === 2 && s.step === 'collect' && s.zone === 'forest' && s.mode === 'play',
    '07-deer-photo': s => s.mi === 3 && s.step === 'photo' && s.mode === 'play' && s.zone === 'forest',
    '08-foxhollow': s => s.mi === 4 && s.step === 'trail' && s.zone === 'eastwood' && s.mode === 'play',
    '09-wetland-pond': s => s.mi === 5 && s.step === 'collect' && s.zone === 'wetland' && s.mode === 'play',
    '10-bird-hide': s => s.watch && s.mode === 'watch' && s.wphase === 'fly',
    '11-beach-tidepool': s => s.mi === 8 && s.step === 'collect' && s.zone === 'beach' && s.mode === 'play',
    '12-dusk-river': s => s.mi === 10 && s.step === 'photo' && s.clock > 18.3,
  };
  const done = new Set(); let st = null, ticks = 0, shotsTaken = [];
  const fire = async (name) => { done.add(name); await b.shot(path.join(outDir, name + '.png')); shotsTaken.push(name); };
  while (ticks < 60000) {
    st = await b.eval('__bio.step(8, __bio.bot)'); ticks += 8;
    for (const [name, cond] of Object.entries(want)) if (!done.has(name) && cond(st)) { await fire(name); }
    if (st.mode === 'end') break;
    if (b.errors.length) break;
  }
  check(st.mode === 'end', `bot finished the game in the browser (mode=${st.mode}, mission=${st.mi}, sim time=${Math.round(st.time)}s)`);
  // journal + end screenshots
  await b.eval('__bio.step(30)'); await fire('13-end-screen');
  await b.eval('__bio.core.mode="journal"; __bio.core.jr.tab=0; __bio.core.jr.sel=8; __bio.step(1)'); await fire('14-journal-species');
  await b.eval('__bio.core.jr.tab=1; __bio.core.jr.sel=2; __bio.step(1)'); await fire('15-journal-missions');
  check(shotsTaken.length >= 12, `screenshots captured: ${shotsTaken.length} (${shotsTaken.join(', ')})`);
  check(b.errors.length === 0, `zero console errors/exceptions (${b.errors.length})`);
  if (b.errors.length) console.log(b.errors.slice(0, 10));
  const missing = ['02-station-start', '03-dialogue', '04-meadow-net', '05-quiz', '06-forest', '07-deer-photo', '08-foxhollow', '09-wetland-pond', '10-bird-hide', '11-beach-tidepool', '12-dusk-river'].filter(n => !done.has(n));
  check(missing.length === 0, 'all planned capture points reached' + (missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''));
  // save / continue round trip in the browser
  await b.eval('localStorage.clear()');
} catch (e) { fail.push('browser test crashed: ' + e.stack); console.log(e.stack); }
await b.close(); srv.close();
if (fail.length) { console.log('BROWSER TEST FAILED:\n - ' + fail.join('\n - ')); process.exit(1); }
console.log('BROWSER TEST PASSED');
