'use strict';

const projects = window.PORTFOLIO_PROJECTS;
const field = document.querySelector('#project-field');
const collectionLabel = document.querySelector('.desktop-intro .eyebrow');
collectionLabel.dataset.dune = `Independent works / 01—${String(projects.length).padStart(2, '0')}`;
if (projects.length > 2) document.querySelector('#desktop').classList.add('expanded-collection');
const projectDialog = document.querySelector('#project-dialog');
const guestbookDialog = document.querySelector('#guestbook-dialog');
let activeProject = null;
let openingElement = null;
let zoomAnimation = null;

const tileMark = '<span class="tile-emblem"><i></i><i></i><i></i><i></i></span>';
const artMark = '<span class="art-emblem"><i></i><b></b></span>';
for (const project of projects) {
  const folder = document.createElement('button');
  folder.type = 'button'; folder.className = `project-folder ${project.visual}-folder`;
  folder.dataset.project = project.id;
  folder.setAttribute('aria-label', `Open ${project.name} project folder`);
  // Project data is repository-owned; guestbook content is rendered with textContent below.
  folder.innerHTML = `<span class="folder-object" aria-hidden="true"><span class="folder-back"></span><span class="folder-paper"><span>${project.category}</span><i></i><i></i></span><span class="folder-front"><span class="folder-corner top-left"></span><span class="folder-corner bottom-right"></span><span class="folder-number">${project.number}</span>${project.visual === 'tiles' ? tileMark : artMark}<span class="folder-engraving">${project.visual === 'tiles' ? 'TR' : 'RP'}</span><span class="folder-seam"></span></span><span class="folder-tab">${project.pending ? 'IN PROGRESS' : 'COLLECTION'}</span></span><span class="folder-label">${project.name}<span class="folder-open" aria-hidden="true">↗</span></span><span class="folder-description">${project.kind}</span>`;
  folder.addEventListener('click', () => openProject(project, folder));
  field.append(folder);
}

function projectVisual(project) {
  if (project.visual === 'tiles') return '<div class="canvas-study" aria-hidden="true"><div class="canvas-study-bar"><span>My wall</span><span>+</span></div><div class="study-tile study-note"><small>A thought</small><p>Everything<br>connects.</p><i></i><i></i></div><div class="study-tile study-landscape"><span>Somewhere new</span></div><div class="study-tile study-link"><span>↗</span><small>Saved for later</small><b>Follow your<br>curiosity.</b></div><div class="study-tile study-colors"><i></i><i></i><i></i><i></i></div><div class="study-search">⌕ &nbsp; Find something you saved</div></div>';
  return '<div class="gallery-study" aria-hidden="true"><div class="gallery-heading">Ruthie<br><em>Paintings</em></div><div class="gallery-art art-one"><i></i><b></b></div><div class="gallery-art art-two"><i></i><b></b><span></span></div><span class="gallery-label">A study in color & form</span></div>';
}
function renderProject(project) {
  document.querySelector('#dossier-path').textContent = `Projects / ${project.name}`;
  document.querySelector('#dossier-index').textContent = `${project.number} / ${String(projects.length).padStart(2, '0')}`;
  document.querySelector('#project-content').innerHTML = `<div class="project-spread"><section class="project-information"><span class="eyebrow">${project.category}</span><h2 id="project-title">${project.name}</h2><p class="project-summary">${project.summary}</p><p class="project-description">${project.description}</p><dl class="project-facts">${project.details.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><div class="project-destination">${project.pending ? `<span class="development-status"><i></i> In development</span><span class="future-url">${new URL(project.url).hostname} · coming soon</span>` : `<a class="action-link" href="${project.url}" target="_blank" rel="noopener noreferrer">Visit website <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a><span class="future-url">${new URL(project.url).hostname}</span>`}</div></section><figure class="project-artwork">${projectVisual(project)}<figcaption>${project.caption}</figcaption></figure></div>`;
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  document.querySelector('#next-project').textContent = `${next.name} →`;
}
function animateOpen(dialog, trigger) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !dialog.animate) return;
  zoomAnimation?.cancel();
  const source = trigger?.getBoundingClientRect();
  const target = dialog.getBoundingClientRect();
  const x = source ? source.left + source.width / 2 - (target.left + target.width / 2) : 0;
  const y = source ? source.top + source.height / 2 - (target.top + target.height / 2) : 30;
  zoomAnimation = dialog.animate([{opacity:0, transform:`translate(${x}px, ${y}px) scale(.16)`}, {opacity:1, transform:'translate(0, 0) scale(1)'}], {duration:560, easing:'cubic-bezier(.16,1,.3,1)'});
}
function openProject(project, trigger, updateHash = true) {
  activeProject = project; openingElement = trigger || document.querySelector(`[data-project="${project.id}"]`);
  renderProject(project);
  if (!projectDialog.open) { projectDialog.showModal(); animateOpen(projectDialog, openingElement); }
  document.body.classList.add('is-focused');
  document.querySelector('#close-project').focus({preventScroll:true});
  if (updateHash) history.pushState(null, '', `#${project.id}`);
}
function closeProject(updateHash = true) {
  if (!projectDialog.open) return;
  zoomAnimation?.cancel(); projectDialog.close();
  document.body.classList.remove('is-focused');
  if (updateHash) history.replaceState(null, '', window.location.pathname + window.location.search);
  openingElement?.focus({preventScroll:true});
}
document.querySelector('#close-project').addEventListener('click', () => closeProject());
projectDialog.addEventListener('cancel', event => { event.preventDefault(); closeProject(); });
document.querySelector('#next-project').addEventListener('click', () => {
  const next = projects[(projects.indexOf(activeProject) + 1) % projects.length];
  openProject(next, document.querySelector(`[data-project="${next.id}"]`));
  projectDialog.scrollTop = 0;
});
function syncRoute() {
  const project = projects.find(item => `#${item.id}` === window.location.hash);
  if (project) openProject(project, null, false); else closeProject(false);
}
window.addEventListener('popstate', syncRoute);
window.addEventListener('hashchange', syncRoute);
syncRoute();

function closeGuestbook() { guestbookDialog.close(); document.body.classList.remove('is-focused'); }
document.querySelectorAll('[data-open="guestbook"]').forEach(button => button.addEventListener('click', () => {
  guestbookDialog.showModal(); document.body.classList.add('is-focused'); animateOpen(guestbookDialog, button);
}));
document.querySelector('#close-guestbook').addEventListener('click', closeGuestbook);
guestbookDialog.addEventListener('cancel', event => { event.preventDefault(); closeGuestbook(); });
for (const dialog of [projectDialog, guestbookDialog]) dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    if (dialog === projectDialog) closeProject(); else closeGuestbook();
  }
});
document.querySelector('#desktop-button').addEventListener('click', () => { closeProject(); closeGuestbook(); });

// Retain existing visitor notes while replacing the interface.
const storageKey = 'daniels-world-guestbook-v1';
let notes = [];
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) notes = saved.filter(note => typeof note?.name === 'string' && typeof note?.message === 'string').slice(0, 30);
} catch { /* The form can report a storage failure if saving is attempted. */ }
function renderNotes() {
  const container = document.querySelector('#guestbook-notes'); container.replaceChildren();
  if (!notes.length) { const empty = document.createElement('p'); empty.className = 'empty-note'; empty.textContent = 'No notes yet.'; container.append(empty); return; }
  for (const note of notes) {
    const article = document.createElement('article');
    const message = document.createElement('p'); message.textContent = note.message;
    const name = document.createElement('span'); name.textContent = `— ${note.name}`;
    article.append(message, name); container.append(article);
  }
}
renderNotes();
const message = document.querySelector('#note-message');
message.addEventListener('input', () => { document.querySelector('#character-count').textContent = `${message.value.length} / 280`; });
document.querySelector('#note-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.querySelector('#note-name').value.trim();
  const text = message.value.trim();
  const error = document.querySelector('#form-error');
  const status = document.querySelector('#note-status'); status.textContent = '';
  if (!name || !text) { error.hidden = false; error.textContent = 'Enter a name and message.'; return; }
  const nextNotes = [{name:name.slice(0,32), message:text.slice(0,280)}, ...notes].slice(0,30);
  try { localStorage.setItem(storageKey, JSON.stringify(nextNotes)); }
  catch { error.hidden = false; error.textContent = 'Couldn’t save. Browser storage is unavailable.'; return; }
  notes = nextNotes; renderNotes(); event.target.reset(); error.hidden = true;
  document.querySelector('#character-count').textContent = '0 / 280';
  status.textContent = 'Saved on this device.';
});
function updateClock() {
  const now = new Date(); const clock = document.querySelector('#clock');
  clock.textContent = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  clock.dateTime = now.toISOString(); clock.title = now.toLocaleDateString([], {dateStyle:'full'});
}
updateClock(); window.setInterval(updateClock, 30000);
