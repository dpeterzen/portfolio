(() => {
  'use strict';
  const key = 'portfolio-window-layout-v2';
  const legacyKey = 'portfolio-window-positions-v1';
  const modes = new Set(['normal', 'maximized', 'minimized', 'closed']);
  const defaultState = () => ({x: 0, y: 0, width: null, height: null, mode: 'normal', resume: 'normal'});
  const panels = [...document.querySelectorAll('[data-movable-window]')].map(element => ({
    element,
    slot: element.parentElement,
    handle: element.querySelector('[data-drag-handle]'),
    name: element.querySelector('h2').textContent.trim(),
    task: document.querySelector(`[data-window-task="${element.id}"]`),
    maximize: element.querySelector('[data-window-action="maximize"]'),
    minWidth: element.id === 'projects' ? 320 : 240,
    minHeight: element.id === 'projects' ? 200 : 180,
    state: defaultState(),
    base: null
  }));
  const status = document.querySelector('#layout-status');
  const taskbar = document.querySelector('.taskbar');
  let active = panels[0]?.element.id;
  let operation = null;
  const visible = panel => panel.state.mode === 'normal' || panel.state.mode === 'maximized';
  const clamp = (value, min, max) => Math.min(Math.max(min, max), Math.max(min, value));
  const bounds = () => ({width: document.documentElement.clientWidth, height: window.innerHeight - taskbar.getBoundingClientRect().height});

  function save() {
    try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(panels.map(panel => [panel.element.id, panel.state])))); } catch { /* Windows work without storage. */ }
  }

  function measure(panel) {
    const element = panel.element;
    const previous = {hidden: element.hidden, maximized: element.classList.contains('is-maximized'), width: element.style.width, height: element.style.height, transform: element.style.transform};
    element.hidden = false;
    element.classList.remove('is-maximized');
    element.style.width = '';
    element.style.height = '';
    element.style.transform = '';
    panel.slot.style.height = '';
    const rect = element.getBoundingClientRect();
    panel.base = {left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height, titleHeight: panel.handle.getBoundingClientRect().height};
    // Keep neighboring windows in place when one is hidden or maximized.
    panel.slot.style.height = `${rect.height}px`;
    element.hidden = previous.hidden;
    element.classList.toggle('is-maximized', previous.maximized);
    element.style.width = previous.width;
    element.style.height = previous.height;
    element.style.transform = previous.transform;
  }

  function geometry(panel) {
    return {
      left: panel.base.left + panel.state.x,
      top: panel.base.top - window.scrollY + panel.state.y,
      width: panel.state.width ?? panel.base.width,
      height: panel.state.height ?? panel.base.height
    };
  }

  function constrain(panel) {
    const view = bounds();
    const maxWidth = Math.max(1, view.width - 20);
    const maxHeight = Math.max(1, view.height - 20);
    if (panel.state.width !== null) panel.state.width = Math.round(clamp(panel.state.width, Math.min(panel.minWidth, maxWidth), maxWidth));
    if (panel.state.height !== null) panel.state.height = Math.round(clamp(panel.state.height, Math.min(panel.minHeight, maxHeight), maxHeight));
    const rect = geometry(panel);
    panel.state.x = Math.round(clamp(rect.left, 10, view.width - rect.width - 10) - panel.base.left);
    panel.state.y = Math.round(clamp(rect.top, 10, view.height - panel.base.titleHeight - 15) - (panel.base.top - window.scrollY));
  }

  function render(panel) {
    const state = panel.state;
    const isMaximized = state.mode === 'maximized';
    panel.element.hidden = !visible(panel);
    panel.element.dataset.windowState = state.mode;
    panel.element.classList.toggle('is-maximized', isMaximized);
    panel.element.style.width = state.width === null ? '' : `${state.width}px`;
    panel.element.style.height = state.height === null ? '' : `${state.height}px`;
    panel.element.style.transform = state.x || state.y ? `translate(${state.x}px, ${state.y}px)` : '';
    panel.element.style.zIndex = active === panel.element.id ? '3' : '2';
    panel.maximize.textContent = isMaximized ? '▣' : '□';
    panel.maximize.setAttribute('aria-label', `${isMaximized ? 'Restore' : 'Maximize'} ${panel.name}`);
    panel.maximize.title = isMaximized ? 'Restore' : 'Maximize';
    panel.task.hidden = state.mode === 'closed';
    panel.task.classList.toggle('is-minimized', state.mode === 'minimized');
    panel.task.setAttribute('aria-pressed', String(visible(panel) && active === panel.element.id));
    panel.task.title = `${state.mode === 'minimized' ? 'Restore' : active === panel.element.id ? 'Minimize' : 'Show'} ${panel.name}`;
  }
  const renderAll = () => panels.forEach(render);
  function activate(panel) { active = panel.element.id; renderAll(); }

  function finish(cancelled) {
    if (!operation) return;
    const current = operation;
    operation = null;
    current.panel.element.classList.remove('is-interacting');
    document.body.classList.remove('is-moving-window', 'is-resizing-window');
    document.body.style.removeProperty('--window-resize-cursor');
    if (cancelled) { current.panel.state = current.state; render(current.panel); }
    else if (current.moved) save();
    if (current.handle.hasPointerCapture(current.pointerId)) current.handle.releasePointerCapture(current.pointerId);
  }

  function reset(panel) {
    panel.state = defaultState();
    render(panel);
  }
  function open(panel, focus = true) {
    finish(true);
    if (!visible(panel)) panel.state.mode = panel.state.resume;
    if (panel.state.mode === 'normal' && (panel.state.x || panel.state.y || panel.state.width !== null || panel.state.height !== null)) constrain(panel);
    activate(panel);
    save();
    if (focus) {
      panel.handle.focus({preventScroll: true});
      panel.handle.scrollIntoView({block: 'nearest'});
    }
  }
  function hide(panel, mode) {
    finish(true);
    if (visible(panel)) panel.state.resume = panel.state.mode;
    panel.state.mode = mode;
    if (active === panel.element.id) active = panels.find(other => visible(other))?.element.id ?? null;
    renderAll();
    save();
    status.textContent = `${panel.name} ${mode}.`;
    if (mode === 'minimized') panel.task.focus({preventScroll: true});
    else {
      const next = panels.find(other => other.element.id === active && visible(other));
      (next?.handle ?? document.querySelector(`[data-window-open="${panel.element.id}"]`))?.focus({preventScroll: true});
    }
  }
  function maximize(panel) {
    finish(true);
    panel.state.mode = panel.state.mode === 'maximized' ? 'normal' : 'maximized';
    panel.state.resume = panel.state.mode;
    if (panel.state.mode === 'normal') constrain(panel);
    activate(panel);
    save();
    status.textContent = `${panel.name} ${panel.state.mode === 'maximized' ? 'maximized' : 'restored'}.`;
  }

  function resize(panel, start, dx, dy, direction) {
    const view = bounds();
    const maxWidth = Math.max(1, view.width - 20);
    const maxHeight = Math.max(1, view.height - 20);
    let {left, top, width, height} = start;
    if (/[ew]/.test(direction)) {
      const available = Math.max(1, Math.min(maxWidth, direction.includes('w') ? start.left + start.width - 10 : view.width - start.left - 10));
      width = Math.round(clamp(width + (direction.includes('w') ? -dx : dx), Math.min(panel.minWidth, available), available));
      if (direction.includes('w')) left = start.left + start.width - width;
      left = clamp(left, 10, view.width - width - 10);
      panel.state.width = width;
    }
    if (/[ns]/.test(direction)) {
      const available = Math.max(1, Math.min(maxHeight, direction.includes('n') ? start.top + start.height - 10 : view.height - start.top - 10));
      height = Math.round(clamp(height + (direction.includes('n') ? -dy : dy), Math.min(panel.minHeight, available), available));
      if (direction.includes('n')) top = start.top + start.height - height;
      top = clamp(top, 10, view.height - height - 10);
      panel.state.height = height;
    }
    panel.state.x = Math.round(left - panel.base.left);
    panel.state.y = Math.round(top - (panel.base.top - window.scrollY));
    constrain(panel);
    render(panel);
  }

  function pointerControl(panel, handle, direction = null) {
    handle.addEventListener('pointerdown', event => {
      if (operation || panel.state.mode !== 'normal' || event.button !== 0 || event.isPrimary === false || event.target.closest('button, a, input, textarea, select')) return;
      event.preventDefault();
      activate(panel);
      handle.focus({preventScroll: true});
      operation = {panel, handle, direction, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, state: {...panel.state}, rect: geometry(panel), moved: false};
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', event => {
      if (!operation || operation.handle !== handle || operation.pointerId !== event.pointerId) return;
      const dx = event.clientX - operation.clientX;
      const dy = event.clientY - operation.clientY;
      if (!operation.moved && Math.hypot(dx, dy) < 3) return;
      operation.moved = true;
      panel.element.classList.add('is-interacting');
      document.body.classList.add(direction ? 'is-resizing-window' : 'is-moving-window');
      if (direction) {
        const cursor = direction.length === 1 ? (/[ew]/.test(direction) ? 'ew-resize' : 'ns-resize') : (direction === 'ne' || direction === 'sw' ? 'nesw-resize' : 'nwse-resize');
        document.body.style.setProperty('--window-resize-cursor', cursor);
        resize(panel, operation.rect, dx, dy, direction);
      } else {
        panel.state.x = operation.state.x + dx;
        panel.state.y = operation.state.y + dy;
        constrain(panel);
        render(panel);
      }
    });
    handle.addEventListener('pointerup', event => { if (operation?.pointerId === event.pointerId) finish(false); });
    handle.addEventListener('pointercancel', event => { if (operation?.pointerId === event.pointerId) finish(true); });
    handle.addEventListener('lostpointercapture', event => { if (operation?.pointerId === event.pointerId) finish(true); });
  }

  let stored;
  try { stored = JSON.parse(localStorage.getItem(key) || localStorage.getItem(legacyKey) || '{}'); } catch { stored = {}; }
  for (const panel of panels) {
    const saved = stored?.[panel.element.id];
    if (saved && typeof saved === 'object') {
      for (const field of ['x', 'y', 'width', 'height']) {
        if (Number.isFinite(saved[field]) && (field === 'x' || field === 'y' || saved[field] > 0)) panel.state[field] = saved[field];
      }
      if (modes.has(saved.mode)) panel.state.mode = saved.mode;
      if (saved.resume === 'maximized') panel.state.resume = 'maximized';
    }
    for (const direction of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
      const handle = document.createElement('div');
      handle.className = 'window-resize-handle';
      handle.dataset.resizeHandle = direction;
      handle.tabIndex = direction === 'se' ? 0 : -1;
      if (direction === 'se') {
        handle.setAttribute('role', 'group');
        handle.setAttribute('aria-label', `Resize ${panel.name} window`);
        handle.setAttribute('aria-describedby', 'window-resize-help');
        handle.addEventListener('keydown', event => {
          if (panel.state.mode !== 'normal' || event.ctrlKey || event.metaKey || event.altKey) return;
          const changes = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
          if (!changes && event.key !== 'Home') return;
          event.preventDefault();
          finish(true);
          activate(panel);
          if (event.key === 'Home') reset(panel);
          else { const step = event.shiftKey ? 50 : 10; resize(panel, geometry(panel), changes[0] * step, changes[1] * step, 'se'); }
          save();
          status.textContent = `${panel.name} ${event.key === 'Home' ? 'reset' : 'resized'}.`;
        });
      } else handle.setAttribute('aria-hidden', 'true');
      panel.element.append(handle);
      pointerControl(panel, handle, direction);
    }
    panel.element.addEventListener('pointerdown', () => { if (visible(panel)) activate(panel); }, {capture: true});
    pointerControl(panel, panel.handle);
    panel.handle.addEventListener('dblclick', event => {
      if (event.target.closest('button')) return;
      maximize(panel);
    });
    panel.handle.addEventListener('keydown', event => {
      if (event.target !== panel.handle || event.ctrlKey || event.metaKey || event.altKey) return;
      const changes = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
      if ((!changes || panel.state.mode !== 'normal') && event.key !== 'Home') return;
      event.preventDefault();
      finish(true);
      activate(panel);
      if (event.key === 'Home') reset(panel);
      else {
        const step = event.shiftKey ? 50 : 10;
        panel.state.x += changes[0] * step;
        panel.state.y += changes[1] * step;
        constrain(panel);
        render(panel);
      }
      save();
      status.textContent = `${panel.name} ${event.key === 'Home' ? 'reset' : 'moved'}.`;
    });
    panel.element.querySelectorAll('[data-window-action]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.windowAction === 'maximize') maximize(panel);
      else hide(panel, button.dataset.windowAction === 'close' ? 'closed' : 'minimized');
    }));
    panel.task.addEventListener('click', () => {
      if (visible(panel) && active === panel.element.id) hide(panel, 'minimized');
      else open(panel);
    });
  }
  panels.forEach(measure);
  panels.forEach(panel => { if (panel.state.x || panel.state.y || panel.state.width !== null || panel.state.height !== null) constrain(panel); });
  if (!panels.some(panel => panel.element.id === active && visible(panel))) active = panels.find(visible)?.element.id ?? null;
  renderAll();

  document.querySelectorAll('[data-window-open]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const panel = panels.find(panel => panel.element.id === link.dataset.windowOpen);
    if (panel) open(panel);
  }));
  document.querySelector('#reset-layout').addEventListener('click', () => {
    finish(true);
    panels.forEach(reset);
    active = panels[0]?.element.id;
    renderAll();
    try { localStorage.removeItem(key); localStorage.removeItem(legacyKey); } catch { /* The visible layout still resets. */ }
    status.textContent = 'Window layout reset.';
    document.querySelector('#start-button')?.focus({preventScroll: true});
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && operation) { event.preventDefault(); finish(true); }
  });
  window.addEventListener('blur', () => finish(true));
  window.addEventListener('resize', () => {
    finish(true);
    panels.forEach(measure);
    panels.forEach(panel => { if (panel.state.x || panel.state.y || panel.state.width !== null || panel.state.height !== null) constrain(panel); });
    renderAll();
    save();
  });
  const linked = panels.find(panel => `#${panel.element.id}` === window.location.hash);
  if (linked) open(linked, false);
})();
