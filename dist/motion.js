// Decorative motion never changes the readable text or its accessible name.
(() => {
  'use strict';
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'portfolio-motion-v1';
  let enabled = true;
  try { enabled = localStorage.getItem(key) !== 'off'; } catch { /* Optional storage. */ }
  const field = document.querySelector('.ambient-particles');
  for (let index = 0; index < 18; index++) {
    const mote = document.createElement('i');
    mote.style.cssText = `--x:${(index * 37 + 9) % 100}%;--y:${(index * 23 + 11) % 100}%;--duration:${18 + index % 7 * 3}s;--delay:-${index * 2.7}s;--drift:${index % 2 ? 36 : -28}px`;
    field.append(mote);
  }
  // Coordinates sit in the open sky of the original artwork. The canvas scales
  // and crops exactly like its wallpaper, keeping stars off the architecture.
  document.querySelectorAll('.sky-stars').forEach(field => {
    const points = [[19.7,5.7],[33.5,7.7],[40.5,5.6],[44.3,12.8],[24.2,17.4],[14,11.5],[36.7,32],[29.4,39],[45.1,2],[61.2,8]];
    points.forEach(([x,y],index) => {
      const star = document.createElement('i');
      star.style.cssText = `left:${x}%;top:${y}%;--twinkle-duration:${7 + index % 4 * 2}s;--twinkle-delay:-${index * 1.7}s`;
      field.append(star);
    });
  });
  let activeFlight = null;
  document.addEventListener('portfolio:coda-unlocked', event => {
    if (root.dataset.motion === 'off' || preference.matches || document.hidden) return;
    const destination = document.querySelector('.desktop-topbar [data-theme-choice="coda"]');
    if (!destination?.animate) return;
    activeFlight?.cancel();
    // Work in the page's CSS px: the flight is drawn inside the zoomed document.
    const zoom = window.PortfolioZoom(), scaled = r => ({x:r.x/zoom,y:r.y/zoom,width:r.width/zoom,height:r.height/zoom});
    const end = scaled(destination.getBoundingClientRect());
    const origin = event.detail.origin ? scaled(event.detail.origin) : end;
    const startX = origin.x + origin.width/2 - end.width/2;
    const startY = origin.y + origin.height/2 - end.height/2;
    const flight = document.createElement('div');
    flight.className = 'theme-switch coda-flight';
    flight.style.width = `${end.width}px`; flight.style.height = `${end.height}px`;
    flight.inert = true; flight.setAttribute('aria-hidden','true');
    const copy = destination.cloneNode(true);
    copy.removeAttribute('data-theme-choice'); copy.tabIndex = -1;
    flight.append(copy); document.body.append(flight);
    const previousVisibility = destination.style.visibility;
    destination.style.visibility = 'hidden';
    const frames = Array.from({length:41}, (_,index) => {
      const t = index / 40;
      const arc = Math.sin(Math.PI * t);
      const orbit = arc * Math.min(65,window.innerWidth / zoom * .12);
      const x = startX + (end.x-startX)*t + Math.sin(t*Math.PI*2)*orbit;
      const y = startY + (end.y-startY)*t - arc*45 + Math.cos(t*Math.PI*2)*orbit*.55;
      const rotation = Math.sin(t*Math.PI*2)*28;
      const scale = .55 + .45*t + arc*.28;
      return {offset:t,opacity:Math.min(1,.25+t*10),transform:`translate3d(${Math.max(4,Math.min(window.innerWidth/zoom-end.width-4,x))}px,${Math.max(4,y)}px,0) rotate(${rotation}deg) scale(${scale})`};
    });
    const animation = flight.animate(frames,{duration:950,easing:'cubic-bezier(.3,0,.2,1)'});
    activeFlight = animation;
    const cancel = () => animation.cancel();
    const cleanup = () => {
      destination.style.visibility = previousVisibility;
      flight.remove(); window.removeEventListener('resize',cancel);
      if (activeFlight === animation) activeFlight = null;
    };
    animation.onfinish = cleanup; animation.oncancel = cleanup;
    window.addEventListener('resize',cancel,{once:true});
  });
  document.addEventListener('portfolio:theme', () => activeFlight?.cancel());
  function sync() {
    root.dataset.motion = enabled && !preference.matches ? 'on' : 'off';
    root.dataset.motionPaused = String(document.hidden);
    const toggle = document.querySelector('#motion-enabled');
    if (toggle) {
      toggle.checked = enabled;
      toggle.disabled = preference.matches;
      document.querySelector('#motion-note').hidden = !preference.matches;
    }
    if (root.dataset.motion === 'off') {
      document.querySelectorAll('.app-window, .lamp-glow, .coda-flight, #desk-lamp').forEach(app => {
        app.getAnimations().forEach(animation => animation.cancel());
      });
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#motion-enabled').addEventListener('change', event => {
      enabled = event.target.checked;
      try { localStorage.setItem(key, enabled ? 'on' : 'off'); } catch { /* Session preference. */ }
      sync();
    });
    sync();
  });
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
})();
