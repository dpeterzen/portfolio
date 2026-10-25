'use strict';
const projects = window.PORTFOLIO_PROJECTS;
const icons = document.querySelector('#desktop-icons');
const workspace = document.querySelector('#workspace');
const windowsHost = document.querySelector('#windows');
const taskButtons = document.querySelector('#task-buttons');
const entries = [
  {id:'about',title:'readme.txt',icon:'paper',windowTitle:'readme.txt — Notepad'},
  ...projects.map(project=>({id:project.id,title:project.name,icon:'folder',project,windowTitle:project.name})),
  {id:'guestbook',title:'Guestbook',icon:'notebook',windowTitle:'Guestbook — Visitor log'},
  {id:'display',title:'Display',icon:'display',windowTitle:'Display Properties'}
];
const model = new window.DesktopState(entries.map(entry=>entry.id));
const elements = new Map(); const launchers = new Map(); const tasks = new Map();
const svg = (icon, extra='') => `<svg class="pixel-icon ${extra}" aria-hidden="true"><use href="#i-${icon}"/></svg>`;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let drag = null;

function selectIcon(button) {
  icons.querySelectorAll('.desktop-icon').forEach(icon=>icon.classList.toggle('selected',icon===button));
}
function launchIcon(entry) {
  const button = document.createElement('button'); button.type='button'; button.className=`desktop-icon ${entry.project?.visual || ''}`;
  button.dataset.open=entry.id; button.setAttribute('aria-label',`Open ${entry.title}${entry.project?' project folder':''}`);
  button.innerHTML=`<span class="icon-art">${svg(entry.icon)}${entry.project?`<span class="folder-badge" aria-hidden="true">${entry.project.visual==='tiles'?'▦':'✎'}</span>`:''}</span><span class="icon-label">${entry.title}</span>`;
  let touch = false;
  button.addEventListener('pointerdown',event=>{touch=event.pointerType==='touch';});
  button.addEventListener('click',event=>{ selectIcon(button); if (touch || event.detail===0 || window.innerWidth<640) openWindow(entry.id,true); });
  button.addEventListener('dblclick',()=>openWindow(entry.id,true));
  icons.append(button); launchers.set(entry.id,button);
  const start = document.createElement('button'); start.type='button'; start.className='start-item';
  start.innerHTML=`${svg(entry.icon)}<span>${entry.title}</span>`;
  start.addEventListener('click',()=>{closeStart();openWindow(entry.id,true);});
  document.querySelector('#start-items').append(start);
}

function projectStudy(project) {
  if(project.visual==='tiles') return `<div class="pixel-canvas" aria-label="Conceptual TileRecall canvas"><span class="canvas-bar">my_wall / 4 tiles</span><div class="canvas-note"><b>Ideas.txt</b><p>Save it.<br>Find it.<br>Make something.</p></div><div class="canvas-landscape"></div><div class="canvas-bookmark">↗<br>Saved for later</div><div class="canvas-swatches"><i></i><i></i><i></i></div><div class="canvas-search">[ search your wall_ ]</div></div>`;
  return `<div class="pixel-gallery" aria-label="Illustrative gallery study"><span>Ruthie Paintings</span><div class="pixel-painting p1"><i></i><b></b></div><div class="pixel-painting p2"><i></i><b></b></div><small>art / color / form</small></div>`;
}
function projectContent(project) {
  return `<div class="explorer-toolbar"><button type="button" class="raised small-button" data-window-minimize>← Desktop</button><span class="address"><span>Address</span><span>C:\\Projects\\${project.name}</span></span></div><div class="explorer-body"><nav class="file-list" aria-label="${project.name} files"><span class="tree-root">${svg('folder')} ${project.name}</span><button type="button" class="file-tab selected" data-file="overview" aria-pressed="true">${svg('paper')} readme.txt</button><button type="button" class="file-tab" data-file="preview" aria-pressed="false">${svg('image')} preview.img</button><span class="file-count">2 files</span></nav><div class="file-content inset"><section data-pane="overview"><div class="document-heading">${svg('paper')}<span>readme.txt<small>${project.category}</small></span></div><h2>${project.name}</h2><p class="project-summary">${project.summary}</p><p class="project-description">${project.description}</p><dl>${project.details.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><div class="project-link-row">${project.pending?`<span class="status-tag">IN DEVELOPMENT</span><span class="project-domain">${new URL(project.url).hostname} · coming soon</span>`:`<a class="raised link-button" href="${project.url}" target="_blank" rel="noopener noreferrer">Visit website ↗<span class="sr-only"> (opens in a new tab)</span></a><span class="project-domain">${new URL(project.url).hostname}</span>`}</div></section><section data-pane="preview" hidden>${projectStudy(project)}<p class="preview-caption">${project.caption}</p></section></div></div><div class="window-status"><span>2 objects</span><span>${project.pending?'Work in progress':'Artist website'}</span></div>`;
}
function aboutContent() {
  return `<div class="notepad-toolbar"><span>Plain text document</span><span>UTF-8</span></div><div class="notepad-paper inset"><div class="readme-intro">${svg('computer')}<div><h2>Daniel Peterson</h2><p>Websites & independent projects.</p></div></div><div class="readme-divider">────────────────────────────</div><p>Welcome to my desktop.</p><p>Open a project folder to take a look around.</p><p class="desktop-instructions"><span class="mouse-instruction">Double-click a folder to open it.</span><span class="touch-instruction">Tap a folder to open it.</span><br>Move windows by their title bars.</p><div class="readme-actions"><button type="button" class="raised" id="explore-projects">Open projects</button><button type="button" class="raised" data-launch="display">Change theme</button></div></div><div class="window-status"><span>${projects.length} project folders</span><span>personal computer</span></div>`;
}
function guestbookContent() {
  return `<div class="guestbook-body"><div class="guestbook-heading">${svg('notebook')}<div><h2>Guestbook</h2><p>Notes are stored on this device only.</p></div></div><div id="guestbook-notes" class="guestbook-notes inset"></div><form id="note-form"><label for="note-name">Name</label><input class="inset" id="note-name" name="name" maxlength="32" required autocomplete="nickname" placeholder="Your name"><label for="note-message">Message</label><textarea class="inset" id="note-message" name="message" maxlength="280" rows="3" required placeholder="Write a note"></textarea><div class="form-bottom"><span id="character-count">0 / 280</span><button type="submit" class="raised">Save note</button></div><p id="form-error" role="alert" hidden></p><p id="note-status" role="status"></p></form></div><div class="window-status"><span>Visitor log</span><span>Local storage</span></div>`;
}
function displayContent() {
  return `<div class="display-body"><fieldset><legend>Desktop theme</legend><div class="wallpaper-options"><button type="button" data-theme-choice="dune" aria-pressed="true"><span class="wallpaper-sample sample-dune"></span><strong>Dune</strong><small>Desert city / late hours</small></button><button type="button" data-theme-choice="keep" aria-pressed="false"><span class="wallpaper-sample sample-keep"></span><strong>Keep</strong><small>Castle city / after dark</small></button></div></fieldset><label class="wallpaper-cycle"><input type="checkbox" id="wallpaper-cycle" aria-describedby="wallpaper-cycle-hint" checked>Cycle wallpapers every 30 seconds</label><p class="settings-hint" id="wallpaper-cycle-hint">City first, then indoors.</p><button type="button" class="raised" data-window-close>OK</button></div><div class="window-status"><span>Appearance</span><span>Two places. One desktop.</span></div>`;
}
function makeWindow(entry,index) {
  const app = document.createElement('section'); app.className=`app-window ${entry.project?'project-window':`${entry.id}-window`}`; app.id=`window-${entry.id}`; app.hidden=true;
  app.setAttribute('role','dialog'); app.setAttribute('aria-labelledby',`title-${entry.id}`); app.setAttribute('aria-modal','false'); app.tabIndex=-1;
  const title=`<header class="window-titlebar"><span class="window-title">${svg(entry.icon)}<span id="title-${entry.id}">${entry.windowTitle}</span></span><div class="window-controls"><button type="button" data-control="minimize" aria-label="Minimize ${entry.title}" title="Minimize"><span class="control-min" aria-hidden="true"></span></button><button type="button" data-control="maximize" aria-label="Maximize ${entry.title}" title="Maximize"><span class="control-max" aria-hidden="true"></span></button><button type="button" data-control="close" aria-label="Close ${entry.title}" title="Close"><span class="control-close" aria-hidden="true">×</span></button></div></header>`;
  app.innerHTML=title+`<div class="window-content">${entry.project?projectContent(entry.project):entry.id==='about'?aboutContent():entry.id==='guestbook'?guestbookContent():displayContent()}</div><span class="resize-grip" aria-hidden="true"></span>`;
  const width=entry.project?740:entry.id==='about'?450:entry.id==='guestbook'?440:490;
  const height=entry.project?490:entry.id==='about'?370:entry.id==='guestbook'?540:440;
  const area=workspace.getBoundingClientRect();
  app.style.width=`${Math.min(width,area.width-24)}px`; app.style.height=`${Math.min(height,area.height-28)}px`;
  app.style.left=`${Math.max(8,Math.min(235+index*22,area.width-Math.min(width,area.width-24)-16))}px`;
  app.style.top=`${Math.max(8,Math.min(65+index*19,area.height-Math.min(height,area.height-28)-12))}px`;
  windowsHost.append(app); elements.set(entry.id,app);
  const task=document.createElement('button');task.type='button';task.className='task-button raised';task.hidden=true;task.setAttribute('aria-label',`Restore or minimize ${entry.title}`);task.innerHTML=`${svg(entry.icon)}<span>${entry.title}</span>`;
  task.addEventListener('click',()=>{model.task(entry.id);renderWindows();if(!model.get(entry.id).minimized)app.focus({preventScroll:true});});taskButtons.append(task);tasks.set(entry.id,task);
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
document.querySelector('.start-foot').textContent=`${projects.length} projects · built independently`;

function renderWindows() {
  for(const entry of entries){
    const state=model.get(entry.id);const app=elements.get(entry.id);const task=tasks.get(entry.id);
    app.hidden=!state.open||state.minimized;app.classList.toggle('active',model.active===entry.id);app.classList.toggle('maximized',state.maximized);app.style.zIndex=String(state.z+10);
    task.hidden=!state.open;task.classList.toggle('active',model.active===entry.id);task.setAttribute('aria-pressed',String(model.active===entry.id));
    const max=app.querySelector('[data-control="maximize"]');max.setAttribute('aria-label',`${state.maximized?'Restore':'Maximize'} ${entry.title}`);max.title=state.maximized?'Restore':'Maximize';
  }
  const desktopControl=document.querySelector('#show-desktop');
  const desktopAction=model.hiddenSet.length?'Restore windows':'Show desktop';
  desktopControl.setAttribute('aria-label',desktopAction);desktopControl.title=desktopAction;
}
function openWindow(id,route=false) {
  const wasVisible=model.get(id).open&&!model.get(id).minimized;
  model.open(id);renderWindows();const app=elements.get(id);app.focus({preventScroll:true});
  if(!wasVisible&&!reduced.matches&&app.animate)app.animate([{opacity:0,transform:'scale(.94) translateY(8px)'},{opacity:1,transform:'none'}],{duration:140,easing:'steps(4,end)'});
  if(route&&projects.some(project=>project.id===id)&&location.hash!==`#${id}`)history.pushState(null,'',`#${id}`);
  document.querySelector('#desktop-status').textContent=`${entries.find(entry=>entry.id===id).title} opened`;
}
function controlWindow(id,action) {
  if(action==='maximize')model.maximize(id);else if(action==='minimize')model.minimize(id);else model.close(id);
  renderWindows();
  if(action==='close'&&location.hash===`#${id}`)history.replaceState(null,'',location.pathname+location.search);
  if(action!=='maximize'){if(model.active)elements.get(model.active).focus({preventScroll:true});else launchers.get(id)?.focus({preventScroll:true});}
}
function syncRoute() {
  const project=projects.find(project=>location.hash===`#${project.id}`);
  if(project)openWindow(project.id);
  else {for(const item of projects)if(model.get(item.id).open)model.minimize(item.id);renderWindows();}
}
window.addEventListener('popstate',syncRoute);window.addEventListener('hashchange',syncRoute);
const startButton=document.querySelector('#start-button');const startMenu=document.querySelector('#start-menu');
function closeStart(){startMenu.hidden=true;startButton.setAttribute('aria-expanded','false');}
startButton.addEventListener('click',()=>{startMenu.hidden=!startMenu.hidden;startButton.setAttribute('aria-expanded',String(!startMenu.hidden));});
document.addEventListener('pointerdown',event=>{if(!startMenu.contains(event.target)&&!startButton.contains(event.target))closeStart();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!startMenu.hidden){closeStart();startButton.focus();}else if(model.active)controlWindow(model.active,'close');}});
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
if(projects.some(project=>location.hash===`#${project.id}`))syncRoute();else{openWindow('about');if(window.innerWidth<640){model.minimize('about');renderWindows();}}
