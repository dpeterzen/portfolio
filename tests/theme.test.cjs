const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Emitter {
  constructor() { this.handlers = new Map(); }
  addEventListener(name, fn) { if (!this.handlers.has(name)) this.handlers.set(name, []); this.handlers.get(name).push(fn); }
  dispatchEvent(event) { for (const fn of this.handlers.get(event.type) || []) fn(event); }
}
class CustomEvent { constructor(type, args = {}) { this.type = type; this.detail = args.detail; } }
function setup({query = '', saved, brokenStorage = false, reduced = false} = {}) {
  const document = new Emitter(); const window = new Emitter(); const media = new Emitter();
  const root = {dataset:{}}; const meta = {};
  const buttons = ['vista','matrix'].map(theme => Object.assign(new Emitter(), {dataset:{themeChoice:theme}, attrs:{},setAttribute(k,v){this.attrs[k]=v;}}));
  let stored = saved, writes = 0, paused = false, drawings = 0, nextFrame = 0;
  const frames = new Map();
  const context = {clearRect(){},setTransform(){},fillText(){drawings++;}};
  const canvas = {getContext:()=>context};
  Object.assign(document, {documentElement:root,hidden:false,body:{classList:{contains:()=>paused}},querySelector:s=>s==='#matrix-rain'?canvas:meta,querySelectorAll:()=>buttons});
  Object.assign(window,{location:{href:`https://portfolio.example/${query}`,search:query},innerWidth:390,innerHeight:844,devicePixelRatio:2,matchMedia:()=>media,requestAnimationFrame(fn){const id=++nextFrame;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},setTimeout,clearTimeout,history:{replaceState(_,__,url){window.location.href=String(url);window.location.search=new URL(url).search;}}});
  media.matches = reduced;
  const localStorage = {getItem(){if(brokenStorage)throw Error('unavailable');return stored;},setItem(_,value){if(brokenStorage)throw Error('unavailable');stored=value;writes++;}};
  const scope=vm.createContext({document,window,localStorage,URL,URLSearchParams,CustomEvent,Math});
  vm.runInContext(fs.readFileSync('dist/theme.js','utf8'),scope);
  vm.runInContext(fs.readFileSync('dist/matrix-rain.js','utf8'),scope);
  document.dispatchEvent({type:'DOMContentLoaded'});
  return {document,window,media,root,meta,canvas,frames,buttons,get writes(){return writes;},get stored(){return stored;},get drawings(){return drawings;},setPaused(value){paused=value;document.dispatchEvent({type:'portfolio:motion'});},step(now){const entry=frames.entries().next().value;if(entry){frames.delete(entry[0]);entry[1](now);}}};
}
let app=setup();
assert.equal(app.root.dataset.theme,'vista');assert.equal(app.frames.size,0);assert.equal(app.writes,0);
app.buttons[1].dispatchEvent({type:'click'});
assert.equal(app.root.dataset.theme,'matrix');assert.equal(app.stored,'matrix');assert.equal(app.buttons[1].attrs['aria-pressed'],'true');assert.equal(app.meta.content,'#020906');assert.equal(app.frames.size,1);assert.ok(app.drawings>0);assert.equal(app.canvas.width,585);
app.step(100);app.step(200);assert.equal(app.frames.size,1);
for(let i=0;i<5;i++)app.document.dispatchEvent({type:'portfolio:theme'});
assert.equal(app.frames.size,1,'theme changes must not create duplicate loops');
app.setPaused(true);assert.equal(app.frames.size,0);app.setPaused(false);assert.equal(app.frames.size,1);
app.document.hidden=true;app.document.dispatchEvent({type:'visibilitychange'});assert.equal(app.frames.size,0);
app.document.hidden=false;app.document.dispatchEvent({type:'visibilitychange'});assert.equal(app.frames.size,1);
app.media.matches=true;app.media.dispatchEvent({type:'change'});assert.equal(app.frames.size,0);
app.media.matches=false;app.media.dispatchEvent({type:'change'});assert.equal(app.frames.size,1);
app.buttons[0].dispatchEvent({type:'click'});assert.equal(app.frames.size,0);assert.equal(app.stored,'vista');
app=setup({saved:'matrix'});assert.equal(app.root.dataset.theme,'matrix');assert.equal(app.frames.size,1);
app=setup({query:'?theme=matrix',saved:'vista',reduced:true});assert.equal(app.root.dataset.theme,'matrix');assert.equal(app.stored,'vista');assert.equal(app.frames.size,0);assert.ok(app.drawings>0);
app.buttons[0].dispatchEvent({type:'click'});assert.equal(app.window.location.search,'?theme=vista');
app=setup({query:'?theme=not-a-theme',saved:'matrix'});assert.equal(app.root.dataset.theme,'matrix');
app=setup({query:'?theme=matrix',brokenStorage:true});app.buttons[0].dispatchEvent({type:'click'});assert.equal(app.root.dataset.theme,'vista');
console.log('PASS: theme persistence, direct theme links, blocked storage, toggle state, rain drawing, pixel ratio cap, reduced motion, pause/resume, hidden tabs, and single animation loop.');
