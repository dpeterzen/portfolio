const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Emitter {
  constructor() { this.handlers = new Map(); }
  addEventListener(name, fn) { if (!this.handlers.has(name)) this.handlers.set(name, []); this.handlers.get(name).push(fn); }
  dispatchEvent(event) { for (const fn of this.handlers.get(event.type) || []) fn(event); }
}
class CustomEvent { constructor(type, args = {}) { this.type = type; this.detail = args.detail; } }
function setup({query = '', saved, unlocked = false, brokenStorage = false} = {}) {
  const document = new Emitter(); const window = new Emitter();
  const root = {dataset:{}}; const meta = {}; const favicon = {};
  const buttons = ['dune','keep','coda'].map(theme => Object.assign(new Emitter(), {dataset:{themeChoice:theme}, attrs:{}, setAttribute(k,v){this.attrs[k]=v;}}));
  const copy = [{dataset:{dune:'Field station',keep:'The archives',coda:'Messages in the dark'},textContent:''}];
  let stored = saved, writes = 0;
  Object.assign(document, {documentElement:root, querySelector:selector=>selector==='link[rel="icon"]'?favicon:meta, querySelectorAll:selector=>selector==='[data-dune]'?copy:selector==='[data-theme-logo]'?[]:buttons});
  Object.assign(window,{location:{href:`https://portfolio.example/${query}`,search:query,replace(url){this.href=String(url);this.search=new URL(url).search;}},history:{replaceState(_,__,url){window.location.href=String(url);window.location.search=new URL(url).search;}}});
  const localStorage = {getItem(key){if(brokenStorage)throw Error('unavailable');return key==='portfolio-coda-unlocked-v1'?String(unlocked):stored;},setItem(key,value){if(brokenStorage)throw Error('unavailable');if(key==='portfolio-coda-unlocked-v1')unlocked=value==='true';else stored=value;writes++;}};
  const scope=vm.createContext({document,window,localStorage,URL,URLSearchParams,CustomEvent});
  vm.runInContext(fs.readFileSync('dist/theme.js','utf8'),scope);
  assert.ok(['dune','keep','coda'].includes(root.dataset.theme),'theme must be set before DOMContentLoaded');
  document.dispatchEvent({type:'DOMContentLoaded'});
  return {document,window,root,meta,favicon,buttons,copy,get writes(){return writes;},get stored(){return stored;}};
}
let app=setup();
assert.equal(app.root.dataset.theme,'dune'); assert.equal(app.writes,0); assert.equal(app.copy[0].textContent,'Field station');
app.buttons[1].dispatchEvent({type:'click'});
assert.equal(app.root.dataset.theme,'keep'); assert.equal(app.stored,'keep'); assert.equal(app.buttons[1].attrs['aria-pressed'],'true'); assert.equal(app.buttons[0].attrs['aria-pressed'],'false'); assert.equal(app.meta.content,'#202c3d'); assert.equal(app.copy[0].textContent,'The archives');
app.buttons[0].dispatchEvent({type:'click'}); assert.equal(app.stored,'dune'); assert.equal(app.copy[0].textContent,'Field station');
app=setup({saved:'keep'}); assert.equal(app.root.dataset.theme,'keep'); assert.equal(app.writes,0);
app=setup({query:'?theme=keep',saved:'dune'}); assert.equal(app.root.dataset.theme,'keep'); assert.equal(app.stored,'dune');
app.buttons[0].dispatchEvent({type:'click'}); assert.equal(app.window.location.search,'?theme=dune');
app=setup({query:'?theme=invalid',saved:'keep'}); assert.equal(app.root.dataset.theme,'keep');
app=setup({saved:'matrix'}); assert.equal(app.root.dataset.theme,'dune');
app=setup({query:'?theme=keep',brokenStorage:true}); app.buttons[0].dispatchEvent({type:'click'}); assert.equal(app.root.dataset.theme,'dune');
app=setup({query:'?theme=coda',saved:'keep'});
assert.equal(app.root.dataset.theme,'keep');
app.buttons[2].dispatchEvent({type:'click'}); assert.equal(app.root.dataset.theme,'keep');
let discoveries=0; app.document.addEventListener('portfolio:coda-unlocked', () => discoveries++);
app.window.PortfolioTheme.unlockCoda();
app.window.PortfolioTheme.unlockCoda();
assert.equal(discoveries,1,'the entrance runs only for the first unlock');
assert.equal(app.root.dataset.codaUnlocked,'true');
assert.equal(app.favicon.href,'assets/favicon-notes.svg');
assert.equal(app.root.dataset.theme,'coda'); assert.equal(app.copy[0].textContent,'Messages in the dark');
assert.equal(app.meta.content,'#152321');
assert.equal(app.buttons[2].attrs['aria-pressed'],'true');
app.buttons[0].dispatchEvent({type:'click'}); assert.equal(app.window.location.search,'?theme=dune');
app=setup({saved:'coda'}); assert.equal(app.root.dataset.theme,'dune');
app=setup({saved:'coda',unlocked:true}); assert.equal(app.root.dataset.theme,'coda');
app=setup({query:'?theme=coda',unlocked:true}); assert.equal(app.root.dataset.theme,'coda');
app=setup({brokenStorage:true}); app.window.PortfolioTheme.unlockCoda(); assert.equal(app.root.dataset.theme,'coda');
app.window.PortfolioTheme.restart(); assert.equal(app.root.dataset.codaUnlocked,'false'); assert.equal(app.window.location.search,'?theme=dune');
app=setup({saved:'coda',unlocked:true}); app.window.PortfolioTheme.restart(); assert.equal(app.stored,'dune'); assert.equal(app.root.dataset.codaUnlocked,'false');
console.log('PASS: pre-paint theme, saved preference, URL override, invalid values, blocked storage, accessible toggle state, and environment copy.');
