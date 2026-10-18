const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Emitter {
  constructor() { this.handlers = new Map(); }
  addEventListener(type, callback) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type).push(callback);
  }
  emit(type, extra = {}) {
    const event = {type, target: this, preventDefault() { this.defaultPrevented = true; }, ...extra};
    for (const callback of this.handlers.get(type) || []) callback(event);
    return event;
  }
}
function classList() {
  const values = new Set();
  return {add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value)};
}
function setup({stored = {}, unavailable = false} = {}) {
  const document = new Emitter();
  const window = new Emitter();
  let saved = typeof stored === 'string' ? stored : JSON.stringify(stored);
  let writes = 0;
  const viewport = {width: 1200, height: 800};
  const status = {textContent: ''};
  const reset = new Emitter();
  const taskbar = {getBoundingClientRect: () => ({height: 46})};
  function panel(id, name, left, width) {
    const element = Object.assign(new Emitter(), {id, style: {}, classList: classList()});
    element.getBoundingClientRect = () => {
      const matches = /translate\(([-.\d]+)px, ([-.\d]+)px\)/.exec(element.style.transform || '');
      return {left: left + Number(matches?.[1] || 0), top: 300 + Number(matches?.[2] || 0), width, height: 400};
    };
    const handle = Object.assign(new Emitter(), {focus(){}, closest(){return null;}, getBoundingClientRect:()=>({height:31}), captured: null,
      setPointerCapture(id){this.captured=id;},hasPointerCapture(id){return this.captured===id;},releasePointerCapture(id){this.captured=null;this.emit('lostpointercapture',{pointerId:id});}
    });
    element.querySelector = selector => selector === 'h2' ? {textContent: name} : handle;
    return {element, handle};
  }
  const work = panel('projects','Work',60,700);
  const guestbook = panel('guestbook','Guestbook',800,300);
  Object.assign(document,{body:{classList:classList()},documentElement:{get clientWidth(){return viewport.width;}},querySelectorAll:()=>[work.element,guestbook.element],querySelector:selector=>({'#layout-status':status,'#reset-layout':reset,'.taskbar':taskbar}[selector])});
  Object.assign(window,{get innerHeight(){return viewport.height;}});
  // Object.assign copies getters, so model the live viewport explicitly.
  Object.defineProperty(window,'innerHeight',{get:()=>viewport.height});
  const localStorage = {getItem(){if(unavailable)throw Error('blocked');return saved;},setItem(_,value){if(unavailable)throw Error('blocked');saved=value;writes++;},removeItem(){if(unavailable)throw Error('blocked');saved=null;}};
  vm.runInNewContext(fs.readFileSync('dist/windows.js','utf8'),{document,window,localStorage,JSON,Number,Math,Object});
  function pointer(which, type, x, y, extra = {}) {
    const args = {clientX:x,clientY:y,pointerId:7,button:0,isPrimary:true,...extra};
    if(type==='pointerdown')which.element.emit(type,{...args,target:which.handle});
    return which.handle.emit(type,args);
  }
  return {work,guestbook,document,window,viewport,reset,status,pointer,get saved(){return JSON.parse(saved || '{}');},get writes(){return writes;}};
}
let app = setup();
app.pointer(app.work,'pointerdown',100,320);
app.pointer(app.work,'pointermove',200,400);
assert.equal(app.work.element.style.transform,'translate(100px, 80px)');
assert.ok(app.document.body.classList.contains('is-moving-window'));
assert.equal(app.writes,0,'save only at the end of a drag');
app.pointer(app.work,'pointerup',200,400);
assert.deepEqual(app.saved.projects,{x:100,y:80});
assert.ok(!app.document.body.classList.contains('is-moving-window'));
assert.equal(app.work.handle.captured,null);
app.pointer(app.guestbook,'pointerdown',850,320);
assert.equal(app.guestbook.element.style.zIndex,'2');
assert.equal(app.work.element.style.zIndex,'1');
app.pointer(app.guestbook,'pointermove',850,320,{pointerId:8});
assert.equal(app.guestbook.element.style.transform,undefined,'ignore unrelated pointers');
app.pointer(app.guestbook,'pointermove',100000,100000);
assert.equal(app.guestbook.element.style.transform,'translate(90px, 413px)','right edge and title bar remain reachable');
app.document.emit('keydown',{key:'Escape'});
assert.equal(app.guestbook.element.style.transform,'','Escape restores the drag start');
app.pointer(app.work,'pointerdown',200,400);
app.pointer(app.work,'pointermove',-10000,-10000);
assert.equal(app.work.element.style.transform,'translate(-50px, -290px)');
app.pointer(app.work,'pointercancel',-10000,-10000);
assert.equal(app.work.element.style.transform,'translate(100px, 80px)');
app.work.handle.emit('keydown',{key:'ArrowRight'});
assert.deepEqual(app.saved.projects,{x:110,y:80});
app.work.handle.emit('keydown',{key:'ArrowDown',shiftKey:true});
assert.deepEqual(app.saved.projects,{x:110,y:130});
app.work.handle.emit('keydown',{key:'Home'});
assert.equal(app.work.element.style.transform,'');
app.pointer(app.work,'pointerdown',100,320,{button:2});
app.pointer(app.work,'pointermove',300,400);
assert.equal(app.work.element.style.transform,'','right click does not drag');
app.pointer(app.work,'pointerdown',100,320,{target:{closest:()=>({})}});
app.pointer(app.work,'pointermove',300,400);
assert.equal(app.work.element.style.transform,'','interactive title-bar controls do not drag');
app.pointer(app.work,'pointerdown',100,320,{pointerType:'touch'});
app.pointer(app.work,'pointermove',110,330,{pointerType:'touch'});
app.pointer(app.work,'pointerup',110,330,{pointerType:'touch'});
assert.deepEqual(app.saved.projects,{x:10,y:10});
app.work.handle.emit('dblclick');
assert.equal(app.work.element.style.transform,'');
app.work.handle.emit('keydown',{key:'ArrowRight'});
app.reset.emit('click');
assert.equal(app.work.element.style.transform,'');
assert.equal(app.guestbook.element.style.transform,'');
assert.deepEqual(app.saved,{});
assert.equal(app.status.textContent,'Window layout reset.');
app=setup({stored:{projects:{x:150,y:50},guestbook:{x:0,y:0}}});
assert.equal(app.work.element.style.transform,'translate(150px, 50px)');
app.viewport.width=800;
app.viewport.height=500;
app.window.emit('resize');
assert.equal(app.work.element.style.transform,'translate(30px, 50px)','resize clamps moved windows horizontally');
app.viewport.height=300;app.window.emit('resize');
assert.equal(app.work.element.style.transform,'translate(30px, -87px)','resize keeps the moved title bar above the taskbar');
app=setup({stored:'{invalid'});assert.equal(app.work.element.style.transform,undefined);
app=setup({stored:{projects:{x:'bad',y:null}}});assert.equal(app.work.element.style.transform,undefined);
app=setup({unavailable:true});
app.work.handle.emit('keydown',{key:'ArrowRight'});
assert.equal(app.work.element.style.transform,'translate(10px, 0px)');
app.reset.emit('click');assert.equal(app.work.element.style.transform,'');
console.log('PASS: mouse/touch dragging, bounds, keyboard movement, stacking, persistence, cancellation, reset, resize, invalid data, and unavailable storage.');
