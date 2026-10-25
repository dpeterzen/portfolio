const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function emitter(properties = {}) {
  const listeners = new Map();
  return Object.assign(properties, {
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(fn);
    },
    emit(type, detail) { for (const fn of listeners.get(type) || []) fn({type, detail}); }
  });
}

function setup({reduced = false, saved, brokenStorage = false} = {}) {
  let now = 0, nextId = 0;
  const timers = new Map();
  const root = {dataset: {theme: 'dune'}};
  const control = emitter();
  const hint = {};
  const motion = emitter({matches: reduced});
  const document = emitter({hidden: false, documentElement: root,
    querySelector: selector => selector === '#wallpaper-cycle' ? control : hint});
  const window = {matchMedia: () => motion,
    setTimeout(fn, delay) { const id = ++nextId; timers.set(id, {fn, at: now + delay}); return id; },
    clearTimeout(id) { timers.delete(id); }};
  const storage = {value: saved};
  const localStorage = {
    getItem() { if (brokenStorage) throw Error('blocked'); return storage.value; },
    setItem(key, value) { if (brokenStorage) throw Error('blocked'); storage.value = value; }
  };
  function advance(ms) {
    const until = now + ms;
    while (timers.size) {
      const [id, timer] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (timer.at > until) break;
      now = timer.at; timers.delete(id); timer.fn();
    }
    now = until;
  }
  vm.runInNewContext(fs.readFileSync('dist/wallpaper.js', 'utf8'), {document, window, localStorage});
  return {root, control, motion, document, timers, storage, advance};
}

let app = setup();
assert.equal(app.root.dataset.wallpaperScene, 'city');
app.advance(29999); assert.equal(app.root.dataset.wallpaperScene, 'city');
app.advance(1); assert.equal(app.root.dataset.wallpaperScene, 'room');
app.advance(30000); assert.equal(app.root.dataset.wallpaperScene, 'city');
app.advance(30000); assert.equal(app.root.dataset.wallpaperScene, 'room');
app.document.emit('portfolio:theme', {theme: 'keep'});
assert.equal(app.root.dataset.wallpaperScene, 'city');
app.advance(15000);
app.document.emit('portfolio:theme', {theme: 'keep'});
app.advance(15000); assert.equal(app.root.dataset.wallpaperScene, 'room', 'reselecting the current theme should not restart playback');
assert.equal(app.timers.size, 1, 'theme switches must not create overlapping timers');

app.control.checked = false; app.control.emit('change');
app.advance(90000); assert.equal(app.root.dataset.wallpaperScene, 'room', 'pausing keeps the current scene');
assert.equal(app.storage.value, 'off');
app = setup({saved: app.storage.value});
app.advance(60000); assert.equal(app.root.dataset.wallpaperScene, 'city');
assert.equal(app.control.checked, false);
app.control.checked = true; app.control.emit('change');
app.advance(30000); assert.equal(app.root.dataset.wallpaperScene, 'room');

app.document.hidden = true; app.document.emit('visibilitychange');
app.advance(120000); assert.equal(app.root.dataset.wallpaperScene, 'room');
assert.equal(app.timers.size, 0);
app.document.hidden = false; app.document.emit('visibilitychange');
app.advance(29999); assert.equal(app.root.dataset.wallpaperScene, 'room');
app.advance(1); assert.equal(app.root.dataset.wallpaperScene, 'city');

app = setup({reduced: true});
app.advance(90000); assert.equal(app.root.dataset.wallpaperScene, 'city');
assert.equal(app.control.checked, false); assert.equal(app.control.disabled, true);
app.motion.matches = false; app.motion.emit('change');
app.advance(30000); assert.equal(app.root.dataset.wallpaperScene, 'room');
app.motion.matches = true; app.motion.emit('change');
assert.equal(app.root.dataset.wallpaperScene, 'city'); assert.equal(app.timers.size, 0);

app = setup({brokenStorage: true});
app.advance(30000); assert.equal(app.root.dataset.wallpaperScene, 'room');
app.control.checked = false; app.control.emit('change');
assert.equal(app.timers.size, 0);
console.log('PASS: 30-second sequence, theme reset, pause persistence, background tabs, reduced motion, and blocked storage.');
