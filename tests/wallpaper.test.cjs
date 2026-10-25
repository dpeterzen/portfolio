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
  const status = {};
  const arrows = [-1, 1].map(step => emitter({dataset: {sceneStep: String(step)}}));
  const motion = emitter({matches: reduced});
  const document = emitter({hidden: false, documentElement: root,
    querySelector: selector => selector === '#wallpaper-cycle' ? control : selector === '#wallpaper-view' ? status : hint,
    querySelectorAll: () => arrows});
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
  return {root, control, motion, document, timers, storage, advance, arrows, status};
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

// A click just before the old deadline must cancel it, including after rapid navigation.
app = setup();
app.advance(29999);
app.arrows[1].emit('click');
assert.equal(app.root.dataset.wallpaperScene, 'room');
assert.equal(app.status.textContent, 'Indoor view');
app.advance(1); assert.equal(app.root.dataset.wallpaperScene, 'room', 'the old deadline must not override a manual choice');
app.advance(29000); assert.equal(app.root.dataset.wallpaperScene, 'room');
app.arrows[0].emit('click');
assert.equal(app.root.dataset.wallpaperScene, 'city');
app.arrows[1].emit('click');
app.advance(29999); assert.equal(app.root.dataset.wallpaperScene, 'room');
assert.equal(app.timers.size, 1, 'rapid clicks leave exactly one deadline');
app.advance(1); assert.equal(app.root.dataset.wallpaperScene, 'city');
assert.equal(app.root.dataset.wallpaperTransition, 'auto');
app.arrows[0].emit('click'); assert.equal(app.root.dataset.wallpaperScene, 'room', 'previous wraps around to the indoor scene');

for (const options of [{saved: 'off'}, {reduced: true}]) {
  app = setup(options);
  app.arrows[1].emit('click');
  assert.equal(app.root.dataset.wallpaperScene, 'room', 'manual navigation works without autoplay');
  app.advance(60000); assert.equal(app.root.dataset.wallpaperScene, 'room');
  assert.equal(app.timers.size, 0, 'manual navigation must not re-enable autoplay');
}
console.log('PASS: timed sequence, manual navigation and deadline reset, rapid clicks, theme reset, pause persistence, background tabs, reduced motion, and blocked storage.');
