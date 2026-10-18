const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Emitter {
  constructor() { this.events = new Map(); }
  addEventListener(type, fn) { if (!this.events.has(type)) this.events.set(type, []); this.events.get(type).push(fn); }
  emit(type, extra = {}) { const event = {type, target:this, preventDefault(){this.defaultPrevented=true;}, ...extra}; for (const fn of this.events.get(type) || []) fn(event); return event; }
}
function setup({stored, legacy, unavailable = false, hash = ''} = {}) {
  const viewport = {width:1200, height:800};
  const values = new Map();
  const key = 'portfolio-window-layout-v2';
  if (stored !== undefined) values.set(key, typeof stored === 'string' ? stored : JSON.stringify(stored));
  if (legacy) values.set('portfolio-window-positions-v1', JSON.stringify(legacy));
  let writes=0;
  class Element extends Emitter {
    constructor(tag='div') {
      super(); this.tagName=tag;this.style={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};this.dataset={};this.attrs={};this.children=[];this.hidden=false;
      const classes=new Set();
      this.classList={contains:k=>classes.has(k),add:(...keys)=>keys.forEach(k=>classes.add(k)),remove:(...keys)=>keys.forEach(k=>classes.delete(k)),toggle(k,force){const yes=force===undefined?!classes.has(k):force;if(yes)classes.add(k);else classes.delete(k);return yes;}};
    }
    append(...children){children.forEach(child=>{child.parentElement=this;this.children.push(child);});}
    setAttribute(k,v){this.attrs[k]=v;}
    closest(selector){return selector.split(',').map(s=>s.trim()).includes(this.tagName)?this:this.parentElement?.closest?.(selector)||null;}
    focus(){this.focused=true;}
    scrollIntoView(){this.scrolled=true;}
    setPointerCapture(id){this.captured=id;}
    hasPointerCapture(id){return this.captured===id;}
    releasePointerCapture(id){this.captured=null;this.emit('lostpointercapture',{pointerId:id});}
    getBoundingClientRect(){return {left:0,top:0,width:0,height:0};}
  }
  const document = new Emitter();const window = new Emitter();
  document.body=new Element();document.documentElement={get clientWidth(){return viewport.width;}};
  window.scrollY=0;window.location={hash};Object.defineProperty(window,'innerHeight',{get:()=>viewport.height});
  const status=new Element();const reset=new Element('button');const start=new Element('button');
  const taskbar={getBoundingClientRect:()=>({height:46})};
  function makePanel(id,name,left,width,height){
    const element=new Element('section');element.id=id;const slot=new Element();slot.append(element);
    const handle=new Element();element.append(handle);
    const task=new Element('button');task.dataset.windowTask=id;
    const controls=['minimize','maximize','close'].map(action=>{const button=new Element('button');button.dataset.windowAction=action;handle.append(button);return button;});
    element.querySelector=s=>s==='h2'?{textContent:name}:s==='[data-drag-handle]'?handle:controls.find(b=>s.includes('"'+b.dataset.windowAction+'"'));
    element.querySelectorAll=()=>controls;
    element.getBoundingClientRect=()=>{
      if(element.hidden)return {left:0,top:0,width:0,height:0};
      if(element.classList.contains('is-maximized'))return {left:10,top:10,width:viewport.width-20,height:viewport.height-66};
      const translate=/translate\(([-.\d]+)px, ([-.\d]+)px\)/.exec(element.style.transform||'');
      return {left:left+Number(translate?.[1]||0),top:300-window.scrollY+Number(translate?.[2]||0),width:Math.min(parseFloat(element.style.width)||width,viewport.width-20),height:Math.min(parseFloat(element.style.height)||height,viewport.height-66)};
    };
    handle.getBoundingClientRect=()=>({height:element.hidden?0:31});
    return {element,slot,handle,task,controls,resize:direction=>element.children.find(child=>child.dataset.resizeHandle===direction),control:action=>controls.find(button=>button.dataset.windowAction===action)};
  }
  const work=makePanel('projects','Work',60,700,220);const guestbook=makePanel('guestbook','Guestbook',800,300,180);const panels=[work,guestbook];
  const links=panels.map(p=>{const link=new Element('a');link.dataset.windowOpen=p.element.id;return link;});
  document.createElement=tag=>new Element(tag);
  document.querySelectorAll=s=>s==='[data-movable-window]'?panels.map(p=>p.element):s==='[data-window-open]'?links:[];
  document.querySelector=s=>({'#layout-status':status,'#reset-layout':reset,'#start-button':start,'.taskbar':taskbar}[s]||panels.find(p=>s===`[data-window-task="${p.element.id}"]`)?.task||links.find(link=>s===`[data-window-open="${link.dataset.windowOpen}"]`));
  const localStorage={getItem(k){if(unavailable)throw Error('blocked');return values.get(k)||null;},setItem(k,v){if(unavailable)throw Error('blocked');values.set(k,v);writes++;},removeItem(k){if(unavailable)throw Error('blocked');values.delete(k);}};
  vm.runInNewContext(fs.readFileSync('dist/windows.js','utf8'),{document,window,localStorage,JSON,Number,Math,Object,Set});
  function pointer(panel,handle,type,x,y,extra={}){const event={clientX:x,clientY:y,pointerId:7,button:0,isPrimary:true,...extra};if(type==='pointerdown')panel.element.emit(type,{...event,target:handle});return handle.emit(type,event);}
  function drag(panel,handle,dx,dy,extra={}){pointer(panel,handle,'pointerdown',100,320,extra);pointer(panel,handle,'pointermove',100+dx,320+dy,extra);pointer(panel,handle,'pointerup',100+dx,320+dy,extra);}
  return {work,guestbook,document,window,viewport,status,reset,start,links,pointer,drag,get saved(){return JSON.parse(values.get(key)||'{}');},get writes(){return writes;}};
}
let app=setup();
app.drag(app.work,app.work.handle,100,80);
assert.equal(app.work.element.style.transform,'translate(100px, 80px)');assert.equal(app.saved.projects.x,100);
app.pointer(app.work,app.work.handle,'pointerdown',200,400);app.pointer(app.work,app.work.handle,'pointermove',-10000,-10000);
assert.equal(app.work.element.style.transform,'translate(-50px, -290px)');app.document.emit('keydown',{key:'Escape'});
assert.equal(app.work.element.style.transform,'translate(100px, 80px)');assert.ok(!app.document.body.classList.contains('is-moving-window'));
for(const direction of ['n','s','e','w','ne','nw','se','sw']){
  app=setup();const handle=app.work.resize(direction);assert.ok(handle);
  app.drag(app.work,handle,20,20,{pointerType:'touch'});const rect=app.work.element.getBoundingClientRect();
  assert.equal(rect.width,direction.includes('e')?720:direction.includes('w')?680:700);
  assert.equal(rect.height,direction.includes('s')?240:direction.includes('n')?200:220);
  assert.equal(rect.left,direction.includes('w')?80:60);assert.equal(rect.top,direction.includes('n')?320:300);
}
app=setup();app.drag(app.work,app.work.resize('e'),10000,0);
assert.equal(app.work.element.getBoundingClientRect().left,60,'east resize keeps the west edge fixed');assert.equal(app.saved.projects.width,1130);
app=setup();app.drag(app.work,app.work.resize('w'),10000,0);assert.equal(app.saved.projects.width,320);
app=setup();app.pointer(app.work,app.work.resize('se'),'pointerdown',100,320);app.pointer(app.work,app.work.resize('se'),'pointermove',140,370);app.pointer(app.work,app.work.resize('se'),'pointercancel',140,370);
assert.equal(app.work.element.style.width,'');assert.equal(app.work.element.style.height,'');
app=setup();app.drag(app.work,app.work.resize('se'),40,50);app.drag(app.work,app.work.handle,30,20);const normal=app.work.element.getBoundingClientRect();
app.work.control('maximize').emit('click');assert.ok(app.work.element.classList.contains('is-maximized'));assert.deepEqual(app.work.element.getBoundingClientRect(),{left:10,top:10,width:1180,height:734});
app.drag(app.work,app.work.handle,90,90);assert.ok(app.work.element.classList.contains('is-maximized'),'drag cannot distort a maximized window');
app.work.control('minimize').emit('click');assert.equal(app.work.element.hidden,true);assert.equal(app.work.task.hidden,false);assert.equal(app.saved.projects.resume,'maximized');
app.work.task.emit('click');assert.equal(app.work.element.hidden,false);assert.ok(app.work.element.classList.contains('is-maximized'));
app.work.control('maximize').emit('click');assert.deepEqual(app.work.element.getBoundingClientRect(),normal,'restore preserves size and position');
app.work.control('close').emit('click');assert.equal(app.work.element.hidden,true);assert.equal(app.work.task.hidden,true);assert.equal(app.work.slot.style.height,'220px','closing keeps other windows in place');
app.links[0].emit('click');assert.equal(app.work.element.hidden,false);assert.equal(app.work.task.hidden,false);assert.deepEqual(app.work.element.getBoundingClientRect(),normal);
app.work.control('maximize').emit('click');app.guestbook.task.emit('click');assert.equal(app.guestbook.element.style.zIndex,'3');assert.equal(app.work.element.style.zIndex,'2','taskbar can raise another window over a maximized window');
app.guestbook.task.emit('click');assert.equal(app.guestbook.element.hidden,true,'active task toggles minimize');app.guestbook.task.emit('click');assert.equal(app.guestbook.element.hidden,false);
app.work.control('close').emit('click');app.guestbook.control('close').emit('click');app.reset.emit('click');
for(const panel of [app.work,app.guestbook]){assert.equal(panel.element.hidden,false);assert.equal(panel.task.hidden,false);assert.equal(panel.element.style.transform,'');assert.equal(panel.element.style.width,'');}
assert.deepEqual(app.saved,{});assert.ok(app.start.focused);
app=setup();app.work.handle.emit('dblclick');assert.ok(app.work.element.classList.contains('is-maximized'));app.work.handle.emit('dblclick');assert.ok(!app.work.element.classList.contains('is-maximized'));
app.work.handle.emit('dblclick',{target:app.work.control('maximize')});assert.ok(!app.work.element.classList.contains('is-maximized'),'double-clicking a control does not toggle twice');
app.pointer(app.work,app.work.handle,'pointerdown',100,320,{target:app.work.control('close')});app.pointer(app.work,app.work.handle,'pointermove',200,400);assert.equal(app.work.element.style.transform,'');
app.pointer(app.work,app.work.handle,'pointerdown',100,320,{button:2});app.pointer(app.work,app.work.handle,'pointermove',200,400);assert.equal(app.work.element.style.transform,'');
app.work.handle.emit('keydown',{key:'ArrowRight'});assert.equal(app.saved.projects.x,10);
app.work.resize('se').emit('keydown',{key:'ArrowDown',shiftKey:true});assert.equal(app.saved.projects.height,270);
app.work.resize('se').emit('keydown',{key:'Home'});assert.equal(app.work.element.style.height,'');assert.equal(app.work.element.style.transform,'');
app=setup({legacy:{projects:{x:100,y:80}}});assert.equal(app.work.element.style.transform,'translate(100px, 80px)');app.reset.emit('click');assert.deepEqual(app.saved,{});
app=setup({stored:{projects:{x:30,y:40,width:600,height:280,mode:'minimized',resume:'normal'}}});assert.equal(app.work.element.hidden,true);app.work.task.emit('click');assert.equal(app.work.element.style.width,'600px');assert.equal(app.work.element.style.height,'280px');
app=setup({stored:{projects:{x:0,y:0,width:900,height:600,mode:'closed'}}});app.viewport.width=400;app.viewport.height=350;app.window.emit('resize');app.links[0].emit('click');
let rect=app.work.element.getBoundingClientRect();assert.ok(rect.left>=10&&rect.left+rect.width<=390);assert.ok(rect.top+31<304,'restoring a hidden window keeps its title bar above the taskbar');
app=setup({stored:{projects:{mode:'maximized',width:600,height:250}}});app.viewport.width=600;app.viewport.height=500;app.window.emit('resize');assert.deepEqual(app.work.element.getBoundingClientRect(),{left:10,top:10,width:580,height:434});
app=setup({stored:'{bad'});assert.equal(app.work.element.hidden,false);
app=setup({stored:{projects:{x:'bad',y:null,width:-1,mode:'unknown'}}});assert.equal(app.work.element.hidden,false);assert.equal(app.work.element.style.width,'');
app=setup({unavailable:true});app.drag(app.work,app.work.resize('se'),20,20);app.work.control('minimize').emit('click');app.work.task.emit('click');app.reset.emit('click');assert.equal(app.work.element.hidden,false);
console.log('PASS: eight resize edges, minimum/maximum sizes, drag cancellation, keyboard controls, minimize/restore, maximize/restore, close/reopen, stacking, saved layouts, migration, reset, responsive bounds, and unavailable storage.');
