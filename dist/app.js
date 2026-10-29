'use strict';
const projects = window.PORTFOLIO_PROJECTS;
const icons = document.querySelector('#desktop-icons');
const workspace = document.querySelector('#workspace');
const windowsHost = document.querySelector('#windows');
const taskButtons = document.querySelector('#task-buttons');
const entries = [
  {id:'about',title:'readme.txt',icon:'paper',windowTitle:'readme.txt — Notepad'},
  ...projects.map(project=>({id:project.id,title:project.name,icon:'folder',project,windowTitle:project.name})),
  {id:'snake',title:'Snake.exe',icon:'snake',game:true,windowTitle:'Snake.exe — Pocket arcade'},
  {id:'asteroids',title:'Asteroids.exe',icon:'asteroids',game:true,windowTitle:'Asteroids.exe — Sector patrol'},
  {id:'guestbook',title:'Guestbook',icon:'notebook',windowTitle:'Guestbook — Visitor log'},
  {id:'display',title:'Display',icon:'display',windowTitle:'Display Properties'},
  {id:'letter',title:'unsent.txt',launcher:false,icon:'paper',windowTitle:'unsent.txt — Notepad'},
  {id:'notes',title:'The Beginner’s Guide.exe',launcher:false,icon:'paper',windowTitle:'The Beginner’s Guide.exe — Notes'},
  {id:'terminal',title:'terminal.exe',startTitle:'Run…',desktop:false,icon:'computer',windowTitle:'terminal.exe — Night shift'}
];
const model = new window.DesktopState(entries.map(entry=>entry.id));
const elements = new Map(); const launchers = new Map(); const tasks = new Map();
const svg = (icon, extra='') => `<svg class="pixel-icon ${extra}" aria-hidden="true"><use href="#i-${icon}"/></svg>`;
const tileRecallMark = `<svg class="phosphor-core" viewBox="0 0 24 24" aria-hidden="true"><path class="brand-mark-piece" style="--piece-delay:0ms" d="M6.4,2.1Q7.0,2.0 7.7,2.0L16.3,2.0Q17.0,2.0 17.6,2.1L17.6,2.1Q18.3,2.2 18.9,2.4L18.9,2.4Q19.5,2.7 20.0,3.1L20.0,3.1Q20.5,3.5 20.9,4.0L20.9,4.0Q21.3,4.5 21.6,5.1L21.6,5.1Q21.8,5.7 21.9,6.4L21.9,6.4Q22.0,7.0 22.0,7.7L22.0,16.3Q22.0,17.0 21.9,17.6L21.9,17.6Q21.8,18.3 21.6,18.9L21.6,18.9Q21.3,19.5 20.9,20.0L20.9,20.0Q20.5,20.5 20.0,20.9L19.8,21.1Q19.5,21.3 19.1,21.5L19.1,21.5Q18.7,21.6 18.5,21.4L2.6,5.5Q2.4,5.3 2.5,4.9L2.5,4.9Q2.7,4.5 2.9,4.2L3.1,4.0Q3.5,3.5 4.0,3.1L4.0,3.1Q4.5,2.7 5.1,2.4L5.1,2.4Q5.7,2.2 6.4,2.1Z"/><path class="brand-mark-piece" style="--piece-delay:90ms" d="M11.7,21.3Q12.4,22.0 11.3,22.0L10.2,22.0Q9.1,22.0 8.4,21.3L2.7,15.6Q2.0,14.9 2.0,13.8L2.0,12.7Q2.0,11.6 2.7,12.3Z"/><path class="brand-mark-piece" style="--piece-delay:180ms" d="M17.2,21.8Q17.4,22.0 17.2,22.0L17.2,22.0Q17.0,22.0 16.8,22.0L15.2,22.0Q14.1,22.0 13.4,21.3L2.7,10.6Q2.0,9.9 2.0,8.8L2.0,7.2Q2.0,7.0 2.0,6.8L2.0,6.8Q2.0,6.6 2.2,6.8Z"/><path class="brand-mark-piece" style="--piece-delay:270ms" d="M7.3,21.9Q7.4,22.0 7.2,22.0L7.2,22.0Q7.0,22.0 6.8,22.0L6.4,21.9Q5.7,21.8 5.1,21.6L5.1,21.6Q4.5,21.3 4.0,20.9L4.0,20.9Q3.5,20.5 3.1,20.0L3.1,20.0Q2.7,19.5 2.4,18.9L2.4,18.9Q2.2,18.3 2.1,17.6L2.0,17.2Q2.0,17.0 2.0,16.8L2.0,16.8Q2.0,16.6 2.1,16.7Z"/></svg>`;
const projectIcon = project => project.id === 'tilerecall' ? `<span class="pixel-icon project-brand-icon phosphor-mark" aria-hidden="true"><span class="phosphor-bloom"></span><span class="phosphor-fringe phosphor-warm"></span><span class="phosphor-fringe phosphor-cool"></span>${tileRecallMark}</span>` : project.icon ? `<img class="pixel-icon project-brand-icon" src="${project.icon}" alt="">` : svg('folder');
const entryIcon = entry => entry.project ? projectIcon(entry.project) : svg(entry.icon);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let drag = null;
let desktopReady = false;
const windowEffects = new Map();
const canAnimateWindows = () => desktopReady && !reduced.matches && document.documentElement.dataset.motion !== 'off' && !document.hidden;
function stopWindowEffect(id) {
  const effect = windowEffects.get(id);
  if (effect) { effect.animation.cancel(); effect.ghost?.remove(); windowEffects.delete(id); }
}
function animateWindowVisibility(id,app,task,show,fromTask,ghost,rect) {
  const target = show ? app : ghost;
  if (!target?.animate) { ghost?.remove(); return; }
  const taskRect = task.getBoundingClientRect();
  const dock = `translate(${taskRect.x + taskRect.width/2 - rect.x - rect.width/2}px, ${taskRect.y + taskRect.height/2 - rect.y - rect.height/2}px) scale(.12)`;
  const frames = show
    ? [{opacity:0,transform:fromTask ? dock : 'translateY(7px) scale(.97)'}, {opacity:1,transform:'scale(1.006)',offset:.76}, {opacity:1,transform:'none'}]
    : [{opacity:1,transform:'none'}, {opacity:0,transform:fromTask ? dock : 'translateY(3px) scale(.98)'}];
  const animation = target.animate(frames,{duration:show ? 250 : 190,easing:show ? 'cubic-bezier(.2,.8,.25,1)' : 'cubic-bezier(.4,0,.8,.4)'});
  const effect = {animation,ghost}; windowEffects.set(id,effect);
  const cleanup = () => { ghost?.remove(); if(windowEffects.get(id) === effect) windowEffects.delete(id); };
  animation.onfinish = cleanup; animation.oncancel = cleanup;
}


function selectIcon(button) {
  icons.querySelectorAll('.desktop-icon').forEach(icon=>icon.classList.toggle('selected',icon===button));
}
function launchIcon(entry) {
  // Windows reached only from the scene or the terminal: no desktop icon, no Start entry.
  if (entry.launcher === false) return;
  if (entry.desktop !== false) {
  const button = document.createElement('button'); button.type='button'; button.className=`desktop-icon ${entry.project?.visual || ''}`;
  button.dataset.open=entry.id; button.setAttribute('aria-label',`Open ${entry.title}${entry.project?' project folder':''}`);
  button.innerHTML=`<span class="icon-art">${entryIcon(entry)}${entry.project&&!entry.project.icon?`<span class="folder-badge" aria-hidden="true">${entry.project.visual==='tiles'?'▦':'✎'}</span>`:''}</span><span class="icon-label">${entry.title}</span>`;
  let touch = false;
  button.addEventListener('pointerdown',event=>{touch=event.pointerType==='touch';});
  button.addEventListener('click',event=>{ selectIcon(button); if (touch || event.detail===0 || window.innerWidth<640) openWindow(entry.id,true); });
  button.addEventListener('dblclick',()=>openWindow(entry.id,true));
  icons.append(button); launchers.set(entry.id,button);
  }
  const start = document.createElement('button'); start.type='button'; start.className='start-item'; start.dataset.open=entry.id;
  start.innerHTML=`${entryIcon(entry)}<span>${entry.startTitle || entry.title}</span>`;
  if (entry.desktop === false) launchers.set(entry.id,start);
  start.addEventListener('click',()=>{closeStart();openWindow(entry.id,true);});
  document.querySelector('#start-items').append(start);
}

function projectStudy(project) {
  if(project.visual==='tiles') return `<div class="pixel-canvas" aria-label="Conceptual TileRecall canvas"><span class="canvas-bar">my_wall / 4 tiles</span><div class="canvas-note"><b>Ideas.txt</b><p>Save it.<br>Find it.<br>Make something.</p></div><div class="canvas-landscape"></div><div class="canvas-bookmark">↗<br>Saved for later</div><div class="canvas-swatches"><i></i><i></i><i></i></div><div class="canvas-search">[ search your wall_ ]</div></div>`;
  return `<div class="pixel-gallery" aria-label="Illustrative gallery study"><span>Ruthie Paintings</span><div class="pixel-painting p1"><i></i><b></b></div><div class="pixel-painting p2"><i></i><b></b></div><small>art / color / form</small></div>`;
}
function projectContent(project) {
  return `<div class="explorer-toolbar"><button type="button" class="raised small-button" data-window-minimize>← Desktop</button><span class="address"><span>Address</span><span>C:\\Projects\\${project.name}</span></span></div><div class="explorer-body"><nav class="file-list" aria-label="${project.name} files"><span class="tree-root">${projectIcon(project)} ${project.name}</span><button type="button" class="file-tab selected" data-file="overview" aria-pressed="true">${svg('paper')} readme.txt</button><button type="button" class="file-tab" data-file="preview" aria-pressed="false">${svg('image')} preview.img</button><span class="file-count">2 files</span></nav><div class="file-content inset"><section data-pane="overview"><div class="document-heading">${svg('paper')}<span>readme.txt<small>${project.category}</small></span></div><h2>${project.name}</h2><p class="project-summary">${project.summary}</p><p class="project-description">${project.description}</p><dl>${project.details.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><div class="project-link-row">${project.pending?`<span class="status-tag">IN DEVELOPMENT</span><span class="project-domain">${new URL(project.url).hostname}</span>`:`<a class="raised link-button" href="${project.url}" target="_blank" rel="noopener noreferrer">Visit website ↗<span class="sr-only"> (opens in a new tab)</span></a><span class="project-domain">${new URL(project.url).hostname}</span>`}</div></section><section data-pane="preview" hidden>${projectStudy(project)}<p class="preview-caption">${project.caption}</p></section></div></div><div class="window-status"><span>2 objects</span><span>${project.pending?'Work in progress':'Artist website'}</span></div>`;
}
function aboutContent() {
  return `<div class="notepad-toolbar"><span>Plain text document</span><span>UTF-8</span></div><div class="notepad-paper inset"><div class="readme-intro">${svg('computer')}<div><h2>Daniel Peterson</h2><p>Websites & independent projects.</p></div></div><div class="readme-divider">────────────────────────────</div><p>Welcome to my desktop.</p><p class="desktop-instructions"><span class="mouse-instruction">Double-click a folder to open it.</span><span class="touch-instruction">Tap a folder to open it.</span><br>Drag title bars to move windows.</p><div class="readme-actions"><button type="button" class="raised" id="explore-projects">Open projects</button><button type="button" class="raised" data-launch="display">Change theme</button></div></div><div class="window-status"><span class="status-greeting"><span class="sr-only">Hello world!</span><span id="status-greeting-text" lang="en" aria-hidden="true">Hello world!</span></span><span>TXT</span></div>`;
}
function guestbookContent() {
  return `<div class="guestbook-body"><div class="guestbook-heading">${svg('notebook')}<div><h2>Guestbook</h2><p>Notes are stored on this device only.</p></div></div><div id="guestbook-notes" class="guestbook-notes inset"></div><form id="note-form"><label for="note-name">Name</label><input class="inset" id="note-name" name="name" maxlength="32" required autocomplete="nickname" placeholder="Your name"><label for="note-message">Message</label><textarea class="inset" id="note-message" name="message" maxlength="280" rows="3" required placeholder="Write a note"></textarea><div class="form-bottom"><span id="character-count">0 / 280</span><button type="submit" class="raised">Save note</button></div><p id="form-error" role="alert" hidden></p><p id="note-status" role="status"></p></form></div><div class="window-status"><span>Visitor log</span><span>Local storage</span></div>`;
}
function displayContent() {
  return `<div class="display-body"><fieldset><legend>Desktop theme</legend><div class="wallpaper-options"><button type="button" data-theme-choice="dune" aria-pressed="true"><span class="wallpaper-sample sample-dune"></span><strong>Dune</strong><small>Desert city / late hours</small></button><button type="button" data-theme-choice="keep" aria-pressed="false"><span class="wallpaper-sample sample-keep"></span><strong>Keep</strong><small>Castle city / after dark</small></button><button type="button" data-theme-choice="coda" aria-pressed="false"><span class="wallpaper-sample sample-notes"></span><strong>Coda</strong><small>Cavern / unfinished thoughts</small></button></div></fieldset><label class="motion-setting"><input type="checkbox" id="motion-enabled" aria-describedby="motion-note" checked> Animations</label><p class="motion-note" id="motion-note" hidden>Reduced motion is on.</p><label class="wallpaper-cycle"><input type="checkbox" id="wallpaper-cycle" checked>Auto-switch scenes</label><button type="button" class="raised" data-window-close>OK</button></div><div class="window-status"><span>Appearance</span></div>`;
}
function makeWindow(entry,index) {
  const app = document.createElement('section'); app.className=`app-window ${entry.project?'project-window':`${entry.id}-window`}`; app.id=`window-${entry.id}`; app.hidden=true;
  app.setAttribute('role','dialog'); app.setAttribute('aria-labelledby',`title-${entry.id}`); app.setAttribute('aria-modal','false'); app.tabIndex=-1;
  const title=`<header class="window-titlebar"><span class="window-title">${entryIcon(entry)}<span id="title-${entry.id}">${entry.windowTitle}</span></span><div class="window-controls"><button type="button" data-control="minimize" aria-label="Minimize ${entry.title}" title="Minimize"><span class="control-min" aria-hidden="true"></span></button><button type="button" data-control="maximize" aria-label="Maximize ${entry.title}" title="Maximize"><span class="control-max" aria-hidden="true"></span></button><button type="button" data-control="close" aria-label="Close ${entry.title}" title="Close"><span class="control-close" aria-hidden="true">×</span></button></div></header>`;
  app.innerHTML=title+`<div class="window-content">${entry.game?window.PortfolioArcade.content(entry.id):entry.project?projectContent(entry.project):entry.id==='about'?aboutContent():entry.id==='guestbook'?guestbookContent():entry.id==='terminal'?window.PortfolioSecrets.terminalContent():entry.id==='letter'?window.PortfolioSecrets.letterContent():entry.id==='notes'?window.PortfolioSecrets.notesContent():displayContent()}</div><span class="resize-grip" aria-hidden="true"></span>`;
  if(entry.game) app.classList.add('game-window');
  const width=entry.game?(entry.id==='snake'?530:650):entry.id==='notes'?570:entry.id==='terminal'?580:entry.id==='letter'?510:entry.project?740:entry.id==='about'?450:entry.id==='guestbook'?440:490;
  const height=entry.game?650:entry.id==='notes'?590:entry.id==='terminal'?410:entry.id==='letter'?480:entry.project?490:entry.id==='about'?400:entry.id==='guestbook'?540:510;
  const area=workspace.getBoundingClientRect();
  app.style.width=`${Math.min(width,area.width-24)}px`; app.style.height=`${Math.min(height,area.height-28)}px`;
  app.style.left=`${Math.max(8,Math.min(235+index*22,area.width-Math.min(width,area.width-24)-16))}px`;
  app.style.top=`${Math.max(8,Math.min(65+index*19,area.height-Math.min(height,area.height-28)-12))}px`;
  windowsHost.append(app); elements.set(entry.id,app);
  const task=document.createElement('button');task.type='button';task.className='task-button raised';task.hidden=true;task.setAttribute('aria-label',`Restore or minimize ${entry.title}`);task.innerHTML=`${entryIcon(entry)}<span>${entry.title}</span>`;
  task.addEventListener('click',()=>{model.task(entry.id);renderWindows();if(!model.get(entry.id).minimized){app.focus({preventScroll:true});app.querySelector('#terminal-input')?.focus({preventScroll:true});}});taskButtons.append(task);tasks.set(entry.id,task);
  app.addEventListener('pointerdown',()=>{model.focus(entry.id);renderWindows();});
  app.addEventListener('focusin',()=>{if(model.active!==entry.id){model.focus(entry.id);renderWindows();}});
  app.querySelectorAll('[data-control]').forEach(button=>button.addEventListener('click',()=>controlWindow(entry.id,button.dataset.control)));
  app.querySelectorAll('[data-window-minimize]').forEach(button=>button.addEventListener('click',()=>controlWindow(entry.id,'minimize')));
  app.querySelectorAll('[data-window-close]').forEach(button=>button.addEventListener('click',()=>controlWindow(entry.id,'close')));
  app.querySelectorAll('[data-file]').forEach(button=>button.addEventListener('click',()=>{
    app.querySelectorAll('[data-file]').forEach(tab=>{const selected=tab===button;tab.classList.toggle('selected',selected);tab.setAttribute('aria-pressed',String(selected));});
    app.querySelectorAll('[data-pane]').forEach(pane=>{pane.hidden=pane.dataset.pane!==button.dataset.file;});
  }));
  const titlebar=app.querySelector('.window-titlebar');
  titlebar.addEventListener('dblclick',event=>{if(!event.target.closest('button'))controlWindow(entry.id,'maximize');});
  titlebar.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button')||model.get(entry.id).maximized||window.innerWidth<640)return;
    const rect=app.getBoundingClientRect();drag={id:entry.id,pointer:event.pointerId,x:event.clientX,y:event.clientY,left:app.offsetLeft,top:app.offsetTop,width:rect.width,height:rect.height};
    titlebar.setPointerCapture(event.pointerId);app.classList.add('dragging');event.preventDefault();
  });
  titlebar.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==entry.id||event.pointerId!==drag.pointer)return;
    app.style.left=`${Math.max(0,Math.min(workspace.clientWidth-drag.width,drag.left+event.clientX-drag.x))}px`;
    app.style.top=`${Math.max(0,Math.min(workspace.clientHeight-drag.height,drag.top+event.clientY-drag.y))}px`;
  });
  function endDrag(){if(drag?.id===entry.id){drag=null;app.classList.remove('dragging');}}
  titlebar.addEventListener('pointerup',endDrag);titlebar.addEventListener('pointercancel',endDrag);titlebar.addEventListener('lostpointercapture',endDrag);
}
for(const [index,entry] of entries.entries()){launchIcon(entry);makeWindow(entry,index);}
const sourceLink=document.createElement('a');sourceLink.className='desktop-icon';sourceLink.href='https://github.com/dpeterzen/portfolio';sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sourceLink.setAttribute('aria-label','Source on GitHub, opens in a new tab');sourceLink.innerHTML=`<span class="icon-art">${svg('source')}<span class="shortcut-arrow" aria-hidden="true">↗</span></span><span class="icon-label">Source</span>`;icons.append(sourceLink);

function renderWindows() {
  for(const entry of entries){
    const state=model.get(entry.id);const app=elements.get(entry.id);const task=tasks.get(entry.id);
    const show = state.open && !state.minimized;
    const changed = show === app.hidden;
    const fromTask = show ? !task.hidden : state.minimized;
    let ghost = null, rect = null;
    if (changed) {
      stopWindowEffect(entry.id);
      if (canAnimateWindows() && !show && app.animate) {
        rect = app.getBoundingClientRect();
        ghost = app.cloneNode(true); ghost.removeAttribute('id');
        ghost.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        ghost.classList.add('window-ghost'); ghost.inert = true;
        ghost.setAttribute('aria-hidden','true'); ghost.removeAttribute('role');
        windowsHost.append(ghost);
      }
    }
    app.hidden=!show;app.classList.toggle('active',model.active===entry.id);app.classList.toggle('maximized',state.maximized);app.style.zIndex=String(state.z+10);
    task.hidden=!state.open;task.classList.toggle('active',model.active===entry.id);task.setAttribute('aria-pressed',String(model.active===entry.id));
    if (changed && canAnimateWindows()) animateWindowVisibility(entry.id,app,task,show,fromTask,ghost,show ? app.getBoundingClientRect() : rect);
    const max=app.querySelector('[data-control="maximize"]');max.setAttribute('aria-label',`${state.maximized?'Restore':'Maximize'} ${entry.title}`);max.title=state.maximized?'Restore':'Maximize';
  }
  const desktopControl=document.querySelector('#show-desktop');
  const desktopAction=model.hiddenSet.length?'Restore windows':'Show desktop';
  desktopControl.setAttribute('aria-label',desktopAction);desktopControl.title=desktopAction;
  window.PortfolioArcade.sync(model.active);
}
function openWindow(id,route=false) {
  if(id === 'notes' && document.documentElement.dataset.codaUnlocked !== 'true') return;
  model.open(id);renderWindows();const app=elements.get(id);app.focus({preventScroll:true});
  if(route&&entries.some(entry=>entry.id===id&&(entry.project||entry.game))&&location.hash!==`#${id}`)history.pushState(null,'',`#${id}`);
  document.querySelector('#desktop-status').textContent=`${entries.find(entry=>entry.id===id).title} opened`;
  document.dispatchEvent(new CustomEvent('portfolio:window-open',{detail:{id}}));
}
function controlWindow(id,action) {
  if(action==='maximize')model.maximize(id);else if(action==='minimize')model.minimize(id);else model.close(id);
  renderWindows();
  if(action==='close'&&location.hash===`#${id}`)history.replaceState(null,'',location.pathname+location.search);
  if(action!=='maximize'){if(model.active)elements.get(model.active).focus({preventScroll:true});else (launchers.get(id)?.closest('#start-menu')?startButton:launchers.get(id))?.focus({preventScroll:true});}
}
function syncRoute() {
  const project=entries.find(entry=>(entry.project||entry.game)&&location.hash===`#${entry.id}`);
  if(project)openWindow(project.id);
  else {for(const item of entries.filter(entry=>entry.project||entry.game))if(model.get(item.id).open)model.minimize(item.id);renderWindows();}
}
window.addEventListener('popstate',syncRoute);window.addEventListener('hashchange',syncRoute);
const startButton=document.querySelector('#start-button');const startMenu=document.querySelector('#start-menu');
function closeStart(){startMenu.hidden=true;startButton.setAttribute('aria-expanded','false');}
startButton.addEventListener('click',()=>{startMenu.hidden=!startMenu.hidden;startButton.setAttribute('aria-expanded',String(!startMenu.hidden));});
document.addEventListener('pointerdown',event=>{if(!startMenu.contains(event.target)&&!startButton.contains(event.target))closeStart();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.defaultPrevented){if(!startMenu.hidden){closeStart();startButton.focus();}else if(model.active)controlWindow(model.active,'close');}});
document.querySelector('#show-desktop').addEventListener('click',()=>{model.desktop();renderWindows();});
document.querySelectorAll('[data-launch]').forEach(button=>button.addEventListener('click',()=>openWindow(button.dataset.launch)));
document.querySelector('#explore-projects').addEventListener('click',()=>{controlWindow('about','minimize');const first=launchers.get(projects[0]?.id);if(first){selectIcon(first);first.focus({preventScroll:true});}});
workspace.addEventListener('pointerdown',event=>{if(event.target===workspace){selectIcon(null);closeStart();}});
function fitWindows() {
  for(const [id,app] of elements){
    if(model.get(id).maximized||app.hidden)continue;
    app.style.left=`${Math.max(0,Math.min(parseFloat(app.style.left),workspace.clientWidth-app.offsetWidth))}px`;
    app.style.top=`${Math.max(0,Math.min(parseFloat(app.style.top),workspace.clientHeight-app.offsetHeight))}px`;
  }
}
window.addEventListener('resize',fitWindows);
if(typeof ResizeObserver!=='undefined'){
  const resizeObserver=new ResizeObserver(fitWindows);
  for(const app of elements.values())resizeObserver.observe(app);
}

// Keep visitor notes from earlier versions; they remain private to this browser.
const storageKey='daniels-world-guestbook-v1';let notes=[];
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))notes=saved.filter(note=>typeof note?.name==='string'&&typeof note?.message==='string').slice(0,30);}catch{}
function renderNotes(){const container=document.querySelector('#guestbook-notes');container.replaceChildren();if(!notes.length){const empty=document.createElement('p');empty.className='empty-note';empty.textContent='No messages yet.';container.append(empty);return;}for(const note of notes){const item=document.createElement('article');const body=document.createElement('p');body.textContent=note.message;const name=document.createElement('span');name.textContent=`— ${note.name}`;item.append(body,name);container.append(item);}}
renderNotes();
const message=document.querySelector('#note-message');
message.addEventListener('input',()=>{document.querySelector('#character-count').textContent=`${message.value.length} / 280`;});
document.querySelector('#note-form').addEventListener('submit',event=>{event.preventDefault();const name=document.querySelector('#note-name').value.trim();const text=message.value.trim();const error=document.querySelector('#form-error');document.querySelector('#note-status').textContent='';if(!name||!text){error.hidden=false;error.textContent='Enter a name and message.';return;}const next=[{name:name.slice(0,32),message:text.slice(0,280)},...notes].slice(0,30);try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{error.hidden=false;error.textContent='Couldn’t save. Browser storage is unavailable.';return;}notes=next;renderNotes();event.target.reset();error.hidden=true;document.querySelector('#character-count').textContent='0 / 280';document.querySelector('#note-status').textContent='Saved on this device.';});
function updateClock(){const now=new Date();const clock=document.querySelector('#clock');clock.textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});clock.dateTime=now.toISOString();clock.title=now.toLocaleDateString([],{dateStyle:'full'});}
updateClock();setInterval(updateClock,30000);
if(entries.some(entry=>(entry.project||entry.game)&&location.hash===`#${entry.id}`))syncRoute();else{openWindow('about');if(window.innerWidth<640){model.minimize('about');renderWindows();}}

window.PortfolioSecrets.init({open:openWindow,close:id=>controlWindow(id,'close'),projectList:projects});

let rebooting = false;
document.querySelector('#restart-desktop').addEventListener('click', () => {
  if (rebooting) return;
  rebooting = true;
  closeStart();
  if (reduced.matches || document.documentElement.dataset.motion === 'off') {
    window.PortfolioTheme.restart();
    return;
  }
  const screen = document.createElement('div');
  screen.className = 'reboot-screen';
  screen.tabIndex = -1;
  screen.setAttribute('role','status');
  screen.setAttribute('aria-live','polite');
  screen.innerHTML = `<div class="reboot-console"><img src="${document.querySelector('link[rel="icon"]').getAttribute('href')}" width="28" height="28" alt=""><span>Rebooting…</span><div class="reboot-meter" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--segment:${i}"></i>`).join('')}</div></div>`;
  // Keep focus and shortcuts off the desktop during the short reboot.
  for (const child of document.body.children) child.inert = true;
  document.body.append(screen);
  screen.focus({preventScroll:true});
  screen.addEventListener('keydown', event => { event.preventDefault(); event.stopPropagation(); });
  window.setTimeout(() => window.PortfolioTheme.restart(),1400);
});

desktopReady = true;
