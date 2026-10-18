'use strict';

const icons = {
  tiles: '<div class="tile-logo" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="tile-wordmark" aria-hidden="true">tile<span>recall</span><sup>✧</sup></span>',
  paintings: '<div class="art-gallery" aria-hidden="true"><div class="painting painting-one"><span></span><i></i></div><div class="painting painting-two"><div class="flower f1">✿</div><div class="flower f2">✿</div><div class="flower f3">✿</div><span></span></div><div class="painting painting-three"><span></span><i></i></div></div>'
};

const grid = document.querySelector('#project-grid');
for (const project of window.PORTFOLIO_PROJECTS) {
  const card = document.createElement('a');
  card.className = 'project-card';
  card.href = project.url;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.setAttribute('aria-label', `${project.name} — ${project.pending ? 'in development, website not live yet' : 'open website'} (opens in a new tab)`);
  const preview = document.createElement('div');
  preview.className = `project-preview ${project.visual}`;
  preview.innerHTML = icons[project.visual] || '';
  if (project.pending) {
    const badge = document.createElement('span');
    badge.className = 'project-badge pending';
    badge.textContent = 'In development';
    preview.append(badge);
  }
  const details = document.createElement('div');
  details.className = 'project-details';
  const title = document.createElement('h3'); title.textContent = project.name;
  const desc = document.createElement('p'); desc.className = 'project-description'; desc.textContent = project.description;
  const link = document.createElement('span'); link.className = 'project-link'; link.textContent = new URL(project.url).hostname;
  link.innerHTML += '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
  details.append(title, desc, link);
  card.append(preview, details);
  grid.append(card);
}
const storageKey = 'daniels-world-guestbook-v1';
let notes = [];
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored)) notes = stored.filter(note => typeof note?.name === 'string' && typeof note?.message === 'string').slice(0, 30);
} catch { /* The guestbook remains usable when storage is unavailable. */ }
const notesEl = document.querySelector('#guestbook-notes');
function renderNotes() {
  if (!notes.length) return;
  notesEl.replaceChildren();
  for (const note of notes) {
    const element = document.createElement('article'); element.className = 'guest-note';
    const text = document.createElement('p'); text.textContent = note.message;
    const signature = document.createElement('span'); signature.textContent = `— ${note.name}`;
    element.append(text, signature); notesEl.append(element);
  }
}
renderNotes();
const dialog = document.querySelector('#note-dialog');
document.querySelector('#open-guestbook').addEventListener('click', () => dialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
const message = document.querySelector('#note-message');
message.addEventListener('input', () => { document.querySelector('#character-count').textContent = `${message.value.length} / 280`; });
document.querySelector('#note-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.querySelector('#note-name').value.trim();
  const text = message.value.trim();
  const error = document.querySelector('#form-error');
  if (!name || !text) { error.hidden = false; error.textContent = 'Enter a name and message.'; return; }
  const nextNotes = [{name: name.slice(0, 32), message: text.slice(0, 280)}, ...notes].slice(0, 30);
  try { localStorage.setItem(storageKey, JSON.stringify(nextNotes)); } catch { error.hidden = false; error.textContent = 'Couldn’t save. Check your browser storage.'; return; }
  notes = nextNotes; renderNotes(); dialog.close(); event.target.reset(); error.hidden = true;
  document.querySelector('#character-count').textContent = '0 / 280';
  const toast = document.querySelector('#toast'); toast.textContent = 'Message saved on this device.'; toast.hidden = false;
  window.setTimeout(() => { toast.hidden = true; }, 4200);
});

const startButton = document.querySelector('#start-button');
const startMenu = document.querySelector('#start-menu');
function closeStart() { startMenu.hidden = true; startButton.setAttribute('aria-expanded', 'false'); }
startButton.addEventListener('click', () => { startMenu.hidden = !startMenu.hidden; startButton.setAttribute('aria-expanded', String(!startMenu.hidden)); });
startMenu.querySelectorAll('a, button').forEach(link => link.addEventListener('click', closeStart));
document.addEventListener('click', event => { if (!startMenu.contains(event.target) && !startButton.contains(event.target)) closeStart(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeStart(); });
const motionButton = document.querySelector('#motion-toggle');
motionButton.addEventListener('click', () => {
  const paused = document.body.classList.toggle('motion-paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.title = paused ? 'Resume background motion' : 'Pause background motion';
  document.querySelector('#motion-label').textContent = paused ? 'Motion paused' : 'Motion on';
  document.dispatchEvent(new CustomEvent('portfolio:motion', {detail: {paused}}));
});
function updateClock() {
  const now = new Date(); const clock = document.querySelector('#clock');
  clock.textContent = now.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  clock.dateTime = now.toISOString(); clock.title = now.toLocaleDateString([], {dateStyle: 'full'});
}
updateClock(); window.setInterval(updateClock, 30000);
