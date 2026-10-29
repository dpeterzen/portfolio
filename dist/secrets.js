// Small, browser-local discoveries. Commands are a fixed vocabulary, never code.
(() => {
  'use strict';
  const letters = {
    dune: {number:'01',subject:'To the room beneath the bells',paragraphs:[
      'The city has gone quiet. There is sand in the window track again, and one light still burning on the other side of the dark.',
      'I have been collecting unfinished things. A sentence. A small machine. A place to put everything I thought I had forgotten.',
      'If this reaches you, leave your lamp on. I will know there is somewhere for the next idea to land.'
    ],signature:'— the room above the dunes'},
    keep: {number:'02',subject:'To the room above the dunes',paragraphs:[
      'Your letter arrived between the last bell and the first bird. The little creature by the desk slept through both.',
      'I do not think unfinished things are lost. Sometimes they are only waiting for someone to open the right window.',
      'The lamp is on. Send the sentence. Bring the small machine. There is room here for whatever you make next.'
    ],signature:'— the room beneath the bells'},
    coda: {number:'',subject:'No return address',paragraphs:['No correspondence here. Look for the blue notes.'],signature:'— loose pages'}
  };
  // Ten scenery markers reveal random notes from the curated collection.
  const noteSpots = [
    {scene:'city',x:78.5,y:47.8},
    {scene:'city',x:64.1,y:55.2},
    {scene:'city',x:70.1,y:73.5},
    {scene:'city',x:53.6,y:79.1},
    {scene:'city',x:93.6,y:79.4},
    {scene:'room',x:8.8,y:11.2},
    {scene:'room',x:31.9,y:45.1},
    {scene:'room',x:53.1,y:60.4},
    {scene:'room',x:88.3,y:45},
    {scene:'room',x:95,y:14}
  ];
  const gameNotes = typeof module === 'object' && module.exports ? require('./notes.js') : window.PORTFOLIO_NOTES;
  function notesContent() {
    return `<div class="notepad-toolbar"><span>Messages in the dark</span><span>The Beginner’s Guide</span></div><details class="coda-intro" open><summary>About this world</summary><p><strong>The Beginner’s Guide is one of my favorite games.</strong></p><p>It’s a short narrative game by Davey Wreden, creator of The Stanley Parable. A guided tour through strange, unfinished games becomes a story about creativity, connection, and the limits of understanding someone through their work.</p><p>Inspired by its Notes chapter. <a href="https://www.thebeginnersgui.de/" target="_blank" rel="noopener noreferrer">About the game ↗<span class="sr-only"> (opens in a new tab)</span></a></p></details><div class="found-notes-layout"><nav class="note-navigation" aria-label="Notes navigation"><button type="button" data-note-step="-1" aria-label="Previous note">←</button><label class="sr-only" for="note-select">Jump to note</label><span class="note-select-wrap"><select id="note-select">${gameNotes.map((note,index)=>`<option value="${index}">Note ${String(index+1).padStart(2,'0')}</option>`).join('')}</select><span class="note-select-chevron" aria-hidden="true"></span></span><span class="notes-total">/ ${gameNotes.length}</span><button type="button" data-note-step="1" aria-label="Next note">→</button></nav><article class="found-note-paper inset"><p id="found-note-location" class="found-note-location sr-only">The cavern</p><blockquote id="found-note-text" aria-live="polite"></blockquote><a class="notes-source" href="https://the-beginners-guide.fandom.com/wiki/Notes" target="_blank" rel="noopener noreferrer">The Beginner’s Guide · Notes ↗<span class="sr-only"> (opens in a new tab)</span></a></article></div>`;
  }
  function parseCommand(value) {
    const [name = '', ...args] = value.trim().toLowerCase().split(/\s+/);
    return {name,args};
  }
  function terminalContent() {
    return `<div class="terminal-screen"><div id="terminal-output" class="terminal-output" role="log" aria-label="Terminal output" aria-live="polite" aria-relevant="additions"></div><form id="terminal-form" class="terminal-form"><label for="terminal-input" id="terminal-prompt">dune:~$</label><input id="terminal-input" aria-label="Terminal command" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="120"><button type="submit" class="terminal-enter" aria-label="Run command">↵</button></form><p class="terminal-hint">Type help for commands. ↑ / ↓ for history.</p></div><div class="window-status"><span>local session</span></div>`;
  }
  function letterContent() {
    return `<div class="notepad-toolbar"><span>Unsent correspondence</span><span id="letter-number"></span></div><article class="letter-paper inset"><p class="letter-subject" id="letter-subject"></p><div id="letter-body"></div><p class="letter-signature" id="letter-signature"></p><p class="letter-clue">This file feels different somewhere else.</p></article><div class="window-status"><span id="letter-discovery">one file / two places</span><span>unsent.txt</span></div>`;
  }
  function init({open,close,projectList}) {
    const root = document.documentElement;
    const input = document.querySelector('#terminal-input');
    const output = document.querySelector('#terminal-output');
    const lampButton = document.querySelector('#desk-lamp');
    const history = []; let historyIndex = 0, draft = '';
    let lamp = {dune:true,keep:true,coda:true};
    let lampScene = null, lampHintTimer, lampReveal;
    const found = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem('portfolio-lamps-v1'));
      for (const theme of ['dune','keep','coda']) if (typeof saved?.[theme] === 'boolean') lamp[theme] = saved[theme];
    } catch { /* Storage is optional. */ }
    const currentTheme = () => ['dune','keep','coda'].includes(root.dataset.theme) ? root.dataset.theme : 'dune';
    function print(text,kind = '') {
      const line = document.createElement('p'); line.textContent = text; line.className = kind;
      output.append(line);
      while (output.children.length > 80) output.firstElementChild.remove();
      output.scrollTop = output.scrollHeight;
    }
    function syncLamp() {
      root.dataset.lampDune = lamp.dune ? 'on' : 'off';
      root.dataset.lampKeep = lamp.keep ? 'on' : 'off';
      root.dataset.lampCoda = lamp.coda ? 'on' : 'off';
      const indoors = root.dataset.wallpaperScene === 'room';
      const scene = `${currentTheme()}:${indoors}`;
      const sceneChanged = lampScene !== scene;
      const automatic = lampScene?.split(':')[0] === currentTheme() && root.dataset.wallpaperTransition === 'auto';
      const animateReveal = root.dataset.motion !== 'off' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
      const revealDelay = animateReveal ? (automatic ? 1250 : 260) : 0;
      if (sceneChanged) {
        lampScene = scene; clearTimeout(lampHintTimer);
        // A mouse finds the hint by coming near the circle; touch has no hover, so it still flashes once per scene.
        if (!finePointer.matches) {
          lampButton.dataset.hint = 'visible';
          lampHintTimer = setTimeout(() => { delete lampButton.dataset.hint; },4500 + revealDelay);
        }
      }
      lampButton.hidden = false;
      if (indoors) lampButton.setAttribute('aria-pressed', String(lamp[currentTheme()]));
      else lampButton.removeAttribute('aria-pressed');
      const label = indoors ? `Turn desk lamp ${lamp[currentTheme()] ? 'off' : 'on'}` : 'Enter the room';
      lampButton.setAttribute('aria-label',label); lampButton.title = label;
      const hint = lampButton.querySelector('.lamp-hint');
      hint.textContent = indoors ? 'click lamp' : 'click window · enter';
      hint.style.setProperty('--hint-shift','0px');
      const bounds = document.querySelector('#workspace').getBoundingClientRect();
      const hit = lampButton.getBoundingClientRect();
      lampButton.hidden = hit.right <= bounds.left || hit.left >= bounds.right || hit.bottom <= bounds.top || hit.top >= bounds.bottom;
      if (!lampButton.hidden) {
        const hintBounds = hint.getBoundingClientRect();
        const shift = Math.max(bounds.left + 8 - hintBounds.left, Math.min(0,bounds.right - 8 - hintBounds.right));
        hint.style.setProperty('--hint-shift',`${shift}px`);
      }
      if (sceneChanged) {
        lampReveal?.cancel();
        // The target moves with the incoming artwork; reveal it after that
        // scene becomes legible, rather than flashing over the outgoing one.
        if (animateReveal && !lampButton.hidden) lampReveal = lampButton.animate(
          [{opacity:0},{opacity:1}],
          {duration:automatic ? 500 : 360,delay:revealDelay,fill:'backwards',easing:'cubic-bezier(.2,.7,.2,1)'}
        );
      }
      if (lampButton.hidden && document.activeElement === lampButton) document.querySelector('#start-button').focus({preventScroll:true});
      syncHintReach();
    }
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    // Distance from the circle's edge, in px, at which its hint appears.
    const HINT_REACH = 90;
    let pointer = null, pointerFrame = 0;
    function syncHintReach() {
      pointerFrame = 0;
      if (!pointer || lampButton.hidden) { delete lampButton.dataset.near; return; }
      const r = lampButton.getBoundingClientRect();
      const dx = Math.max(r.left - pointer.x, 0, pointer.x - r.right), dy = Math.max(r.top - pointer.y, 0, pointer.y - r.bottom);
      if (Math.hypot(dx,dy) <= HINT_REACH) lampButton.dataset.near = ''; else delete lampButton.dataset.near;
    }
    document.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      pointer = {x:event.clientX,y:event.clientY};
      pointerFrame ||= requestAnimationFrame(syncHintReach);
    }, {passive:true});
    document.documentElement.addEventListener('mouseleave', () => { pointer = null; syncHintReach(); });
    // The border beam runs once as the desktop settles, then on a slow repeat, so the circle reads as
    // something to click without moving all the time.
    const BEAM_FIRST = 1600, BEAM_EVERY = 24000;
    function runBeam() {
      if (lampButton.hidden || document.hidden || root.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      delete lampButton.dataset.beam; void lampButton.offsetWidth; lampButton.dataset.beam = '';
    }
    lampButton.addEventListener('animationend', event => { if (event.pseudoElement === '::after') delete lampButton.dataset.beam; });
    setTimeout(() => { runBeam(); setInterval(runBeam, BEAM_EVERY); }, BEAM_FIRST);
    function toggleLamp() {
      if (root.dataset.wallpaperScene !== 'room') return false;
      lamp[currentTheme()] = !lamp[currentTheme()];
      try { localStorage.setItem('portfolio-lamps-v1',JSON.stringify(lamp)); } catch { /* Keep this session. */ }
      syncLamp();
      if (root.dataset.motion !== 'off' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const glow = lampButton.querySelector('.lamp-glow');
        glow.getAnimations().forEach(animation => animation.cancel());
        glow.animate([{opacity:.65},{opacity:0}],{duration:700,easing:'ease-out'});
      }
      document.querySelector('#desktop-status').textContent = `Desk lamp ${lamp[currentTheme()] ? 'on' : 'off'}.`;
      return true;
    }
    function updateLetter() {
      const letter = letters[currentTheme()];
      document.querySelector('#letter-number').textContent = letter.number ? `fragment ${letter.number} / 02` : 'loose pages';
      document.querySelector('#letter-subject').textContent = letter.subject;
      const body = document.querySelector('#letter-body'); body.replaceChildren();
      for (const text of letter.paragraphs) { const p = document.createElement('p'); p.textContent = text; body.append(p); }
      document.querySelector('#letter-signature').textContent = letter.signature;
      if (currentTheme() !== 'coda' && !document.querySelector('#window-letter').hidden) found.add(currentTheme());
      document.querySelector('#letter-discovery').textContent = found.size === 2 ? 'the reply was here all along' : 'one file / two places';
    }
    const worldNotes = document.querySelector('#world-notes');
    let selectedNote = 0;
    // Remove progress saved by earlier versions; reading is no longer tracked.
    try {
      localStorage.removeItem('portfolio-found-notes-v1');
      localStorage.removeItem('portfolio-found-notes-v2');
    } catch { /* Storage is optional. */ }
    function selectNote(index) {
      if (!gameNotes[index]) return;
      selectedNote = index;
      document.querySelector('#found-note-text').textContent = gameNotes[index].text;
      document.querySelector('#found-note-location').textContent = `Note ${String(index+1).padStart(2,'0')} / ${gameNotes.length}`;
      document.querySelector('#note-select').value = String(index);
      document.querySelector('.found-note-paper').scrollTop = 0;
    }
    noteSpots.forEach((note,index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'world-note';
      button.dataset.noteSpot = String(index); button.dataset.noteScene = note.scene;
      button.style.cssText = `left:${note.x}%;top:${note.y}%;`;
      button.setAttribute('aria-label',`Read a note at marker ${index+1}`);
      button.title = 'Read this note'; button.innerHTML = '<span class="note-glyph" aria-hidden="true">···</span>';
      button.addEventListener('click', () => {
        const choices = gameNotes.map((_,noteIndex) => noteIndex).filter(noteIndex => noteIndex % noteSpots.length === index);
        selectNote(choices[Math.floor(Math.random() * choices.length)]); open('notes');
      });
      worldNotes.append(button);
    });
    document.querySelector('#note-select').addEventListener('change', event => selectNote(Number(event.target.value)));
    document.querySelectorAll('[data-note-step]').forEach(button => button.addEventListener('click', () => {
      selectNote((selectedNote + Number(button.dataset.noteStep) + gameNotes.length) % gameNotes.length);
    }));
    function syncWorldNotes() {
      const active = currentTheme() === 'coda';
      worldNotes.hidden = !active;
      worldNotes.querySelectorAll('button').forEach(button => {
        const hidden = !active || button.dataset.noteScene !== root.dataset.wallpaperScene;
        if (hidden && document.activeElement === button) document.querySelector('#start-button').focus();
        button.hidden = hidden;
      });
    }
    selectNote(0);
    function syncTheme() {
      document.querySelector('#terminal-prompt').textContent = `${currentTheme()}:~$`;
      updateLetter(); syncLamp(); syncWorldNotes();
    }
    function enterCoda(event) {
      const rect = (event?.currentTarget || input).getBoundingClientRect();
      window.PortfolioTheme.unlockCoda({x:rect.x,y:rect.y,width:rect.width,height:rect.height});
      document.querySelector('#desktop-status').textContent = 'Coda discovered. Click the blue notes.';
    }
    document.querySelector('#coda-launcher').addEventListener('click', event => { enterCoda(event); open('notes'); });
    function run(raw) {
      const {name,args} = parseCommand(raw);
      if (!name) return;
      print(`${currentTheme()}:~$ ${raw}`, 'terminal-command');
      switch (name) {
        case 'help': print('whoami       the person behind this desktop\nprojects     things taking shape\nopen <id>    open a project folder\nletter       a file left behind\ncoda         open The Beginner’s Guide.exe\nnotes        read the messages after discovery\ntheme <name> travel: dune, keep, or coda\nlamp         switch the indoor desk lamp\nclear        a fresh page\nexit         back to the desktop'); break;
        case 'whoami': print('Daniel Peterson\nWebsites & independent projects.'); break;
        case 'projects': print(projectList.map(p => `${p.id} — ${p.name}`).join('\n') + '\nUse open <id> to take a look.'); break;
        case 'open': {
          const project = projectList.find(p => p.id.toLowerCase() === args[0]);
          if (project) open(project.id,true); else print('Try projects to see the available folder IDs.');
          break;
        }
        case 'coda':
        case 'coda.exe': enterCoda(); print('Coda is now in your theme list. Click the blue notes.'); break;
        case 'notes':
          if (root.dataset.codaUnlocked === 'true') open('notes');
          else print('Type coda to unlock the notes.');
          break;
        case 'letter': open('letter'); updateLetter(); break;
        case 'theme':
          if (args.length === 1 && ['dune','keep','coda'].includes(args[0])) {
            if (args[0] === 'coda') enterCoda();
            else document.querySelector(`.desktop-topbar [data-theme-choice="${args[0]}"]`).click();
            print(`Theme: ${args[0]}.`);
          } else print('Usage: theme dune | theme keep | theme coda');
          break;
        case 'lamp': if (toggleLamp()) print(lamp[currentTheme()] ? 'Lamp on.' : 'Lamp off.'); else print('The lamp is indoors. Use the chevrons to step inside.'); break;
        case 'clear': output.replaceChildren(); break;
        case 'exit': close('terminal'); break;
        default: print(`Unknown command: ${name}. Try help.`);
      }
    }
    document.querySelector('#terminal-form').addEventListener('submit', event => {
      event.preventDefault(); const raw = input.value.trim(); input.value = ''; draft = '';
      if (raw) { history.push(raw); if (history.length > 30) history.shift(); }
      historyIndex = history.length; run(raw);
    });
    input.addEventListener('keydown', event => {
      if (!['ArrowUp','ArrowDown'].includes(event.key) || !history.length) return;
      event.preventDefault(); if (historyIndex === history.length) draft = input.value;
      historyIndex = Math.max(0,Math.min(history.length,historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = historyIndex === history.length ? draft : history[historyIndex];
    });
    window.addEventListener('resize',syncLamp);
    lampButton.addEventListener('click', () => {
      if (root.dataset.wallpaperScene === 'room') toggleLamp();
      else {
        document.dispatchEvent(new CustomEvent('portfolio:enter-room'));
        document.querySelector('#desktop-status').textContent = 'Stepped inside.';
      }
    });
    document.addEventListener('portfolio:theme', syncTheme);
    document.addEventListener('portfolio:window-open', event => {
      if (event.detail.id === 'letter') updateLetter();
      if (event.detail.id === 'notes') selectNote(selectedNote);
      if (event.detail.id === 'terminal') input.focus({preventScroll:true});
    });
    new MutationObserver(() => { syncLamp(); syncWorldNotes(); }).observe(root,{attributes:true,attributeFilter:['data-wallpaper-scene']});
    new MutationObserver(updateLetter).observe(document.querySelector('#window-letter'),{attributes:true,attributeFilter:['hidden']});
    print('NIGHT SHIFT','terminal-welcome');
    syncTheme();
  }
  const api = {parseCommand,letters,gameNotes,terminalContent,letterContent,notesContent,init};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.PortfolioSecrets = api;
})();
