(function () {
  'use strict';
  const games=new Map(); let active=null, manualClock=false, last=0;
  const keyMap={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',' ':'fire'};
  function content(id) {
    const snake=id==='snake';
    return `<div class="arcade arcade-${id}"><div class="arcade-toolbar"><span class="arcade-label">${snake?'POCKET ARCADE / 01':'SECTOR PATROL / 02'}</span><span data-game-score>00000</span><span data-game-best>BEST 00000</span></div><div class="arcade-stage"><div class="arcade-screen"></div><div class="arcade-overlay"><span class="arcade-eyebrow">${snake?'A LITTLE CLASSIC':'DEEP SPACE, SMALL SHIP'}</span><h2>${snake?'SNAKE':'ASTEROIDS'}</h2><p data-game-message>${snake?'Eat. Grow. Mind the walls.':'Clear the field. Keep flying.'}</p><button class="raised arcade-play" type="button" data-game-action="play">Start game</button><p class="arcade-instructions">${snake?'Arrow keys / WASD to turn':'← → / A D rotate · ↑ / W thrust<br>Space to fire'}<br>P pause · R restart · F fullscreen</p></div></div><div class="arcade-footer"><span data-game-status role="status">${snake?'24 × 24 / classic mode':'3 ships / endless waves'}</span><div><button type="button" class="raised" data-game-action="pause" disabled>Pause</button><button type="button" class="raised" data-game-action="restart">Restart</button><button type="button" class="raised" data-game-action="fullscreen" aria-label="Toggle game fullscreen" title="Fullscreen (F)">⛶</button></div></div><div class="arcade-touch" role="group" aria-label="${snake?'Snake':'Asteroids'} touch controls">${snake?'<button type="button" class="raised" data-game-key="left" aria-label="Turn left">←</button><button type="button" class="raised" data-game-key="up" aria-label="Turn up">↑</button><button type="button" class="raised" data-game-key="down" aria-label="Turn down">↓</button><button type="button" class="raised" data-game-key="right" aria-label="Turn right">→</button>':'<button type="button" class="raised" data-game-key="left" aria-label="Rotate left">↶</button><button type="button" class="raised" data-game-key="right" aria-label="Rotate right">↷</button><button type="button" class="raised" data-game-key="up" aria-label="Thrust">↑</button><button type="button" class="raised arcade-fire" data-game-key="fire">FIRE</button>'}</div></div>`;
  }
  function mount(id) {
    const app=document.querySelector(`#window-${id}`),root=app.querySelector('.arcade');
    const engine=id==='snake'?new window.ArcadeGames.Snake():new window.ArcadeGames.Asteroids();
    const canvas=document.createElement('canvas');canvas.width=id==='snake'?480:640;canvas.height=480;
    canvas.setAttribute('aria-label',id==='snake'?'Snake playing field':'Asteroids playing field');
    root.querySelector('.arcade-screen').append(canvas);
    let best=0;try{best=Math.max(0,Number(localStorage.getItem(`portfolio-${id}-best`))||0);}catch{}
    const game={id,app,root,engine,canvas,ctx:canvas.getContext('2d'),keys:{},best,uiState:''};games.set(id,game);
    root.querySelectorAll('[data-game-action]').forEach(button=>button.addEventListener('click',()=>{
      const action=button.dataset.gameAction;
      if(action==='fullscreen') fullscreen(game);
      else if(action==='pause')pause(game);
      else if(action==='restart')start(game,true);
      else start(game);
      draw(game);
    }));
    root.querySelectorAll('[data-game-key]').forEach(button=>{
      button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);input(game,button.dataset.gameKey);});
      const release=()=>{delete game.keys[button.dataset.gameKey];};
      button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
      // Keyboard and assistive-technology activation of the touch controls.
      button.addEventListener('click',event=>{if(event.detail===0){input(game,button.dataset.gameKey);if(id==='asteroids'){engine.update(1/60,game.keys);game.keys={};}draw(game);}});
    });
    draw(game);return game;
  }
  function start(game,restart=false){if(game.engine.mode==='paused'&&!restart)game.engine.mode='running';else game.engine.reset();game.keys={};game.app.focus({preventScroll:true});}
  function pause(game,force=false){if(game.engine.mode==='running'){game.engine.mode='paused';game.keys={};}else if(!force&&game.engine.mode==='paused')start(game);draw(game);}
  function input(game,key){if(game.engine.mode!=='running')return;if(game.id==='snake')game.engine.turn(key);else game.keys[key]=true;}
  function fullscreen(game){if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else game.root.requestFullscreen?.().catch(()=>{});}
  function sync(id){
    const next=id==='snake'||id==='asteroids'?id:null;
    if(active!==next){if(games.has(active))pause(games.get(active),true);active=next;}
    if(next&&!games.has(next))mount(next);
  }
  document.addEventListener('keydown',event=>{
    const game=games.get(active);if(!game||event.ctrlKey||event.metaKey||event.altKey)return;
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(!keyMap[key]&&!['p','r','f','Escape','Enter'].includes(key))return;
    // Let focused buttons retain their native Enter/Space activation.
    if(event.target.closest('button')&&(key==='Enter'||key===' '))return;
    event.preventDefault();
    if(key==='Escape'){pause(game,true);if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});}
    else if(!event.repeat&&key==='p')pause(game);
    else if(!event.repeat&&key==='r')start(game,true);
    else if(!event.repeat&&key==='f')fullscreen(game);
    else if(!event.repeat&&(key==='Enter'||(key===' '&&game.engine.mode!=='running')))start(game);
    else if(keyMap[key])input(game,keyMap[key]);
    draw(game);
  },true);
  document.addEventListener('keyup',event=>{const key=keyMap[event.key.length===1?event.key.toLowerCase():event.key];for(const game of games.values())delete game.keys[key];});
  function suspend(){for(const game of games.values())pause(game,true);}
  window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
  function tick(dt){const game=games.get(active);if(game){game.engine.update(dt,game.keys);draw(game);}}
  function frame(now){if(!manualClock)tick(Math.min((now-last)/1000||0,1/30));last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.advanceTime=ms=>{manualClock=true;const frames=Math.max(1,Math.ceil(ms/(1000/60)));for(let i=0;i<frames;i++)tick(ms/frames/1000);};
  window.render_game_to_text=()=>JSON.stringify(games.get(active)?.engine.snapshot()||{mode:'desktop',activeGame:null});
  function draw(game){
    const {ctx:c,canvas,engine:e}=game;
    c.fillStyle=game.id==='snake'?'#101e17':'#081923';c.fillRect(0,0,canvas.width,canvas.height);
    if(game.id==='snake')drawSnake(game);else drawAsteroids(game);
    if(e.score>game.best){game.best=e.score;try{localStorage.setItem(`portfolio-${game.id}-best`,String(game.best));}catch{}}
    const uiState=`${e.mode}/${e.score}/${game.best}/${e.lives}/${e.wave}`;if(uiState===game.uiState)return;game.uiState=uiState;
    game.root.querySelector('[data-game-score]').textContent=`SCORE ${String(e.score).padStart(5,'0')}`;
    game.root.querySelector('[data-game-best]').textContent=`BEST ${String(game.best).padStart(5,'0')}`;
    const overlay=game.root.querySelector('.arcade-overlay');overlay.hidden=e.mode==='running';
    const title=e.mode==='ready'?(game.id==='snake'?'SNAKE':'ASTEROIDS'):e.mode==='paused'?'PAUSED':e.mode==='won'?'YOU WIN':'GAME OVER';
    overlay.querySelector('h2').textContent=title;
    overlay.querySelector('[data-game-message]').textContent=e.mode==='paused'?'Take your time. Your game is safe.':e.mode==='over'||e.mode==='won'?`Final score: ${e.score}. One more round?`:game.id==='snake'?'Eat. Grow. Mind the walls.':'Clear the field. Keep flying.';
    overlay.querySelector('[data-game-action="play"]').textContent=e.mode==='paused'?'Resume game':e.mode==='ready'?'Start game':'Play again';
    const pauseButton=game.root.querySelector('[data-game-action="pause"]');pauseButton.disabled=!['running','paused'].includes(e.mode);pauseButton.textContent=e.mode==='paused'?'Resume':'Pause';
    game.root.querySelector('[data-game-status]').textContent=game.id==='snake'?`LENGTH ${e.body.length} / 576`:`SHIPS ${e.lives} / WAVE ${String(e.wave).padStart(2,'0')}`;
  }
  function drawSnake({ctx:c,engine:e}){
    c.strokeStyle='#21382a';c.lineWidth=1;
    for(let n=0;n<=24;n++){c.beginPath();c.moveTo(n*20+.5,0);c.lineTo(n*20+.5,480);c.moveTo(0,n*20+.5);c.lineTo(480,n*20+.5);c.stroke();}
    c.fillStyle='#eea77f';c.fillRect(e.food.x*20+5,e.food.y*20+5,10,12);c.fillStyle='#c1df8d';c.fillRect(e.food.x*20+11,e.food.y*20+2,5,3);
    e.body.forEach((p,i)=>{c.fillStyle=i===0?'#dcf2b5':i%2?'#98c77c':'#acd68b';c.fillRect(p.x*20+1,p.y*20+1,18,18);});
    const h=e.body[0],d=e.direction;c.fillStyle='#1a3522';
    for(const side of [-1,1]){const x=h.x*20+9+d.x*5+(d.y?side*4:0),y=h.y*20+9+d.y*5+(d.x?side*4:0);c.fillRect(x,y,3,3);}
    c.strokeStyle='#69915a';c.strokeRect(.5,.5,479,479);
  }
  function drawAsteroids({ctx:c,engine:e,keys}){
    // Mirror edge-crossing objects so wrapped collisions remain visible.
    function wrapped(x,y,r,paint){
      const xs=[x],ys=[y];if(x<r)xs.push(x+640);if(x>640-r)xs.push(x-640);if(y<r)ys.push(y+480);if(y>480-r)ys.push(y-480);
      for(const px of xs)for(const py of ys){c.save();c.translate(px,py);paint();c.restore();}
    }
    for(let i=0;i<75;i++){c.fillStyle=i%4?'#28424e':'#66828c';c.fillRect((i*137+19)%640,(i*83+37)%480,i%4?1:2,1);}
    c.lineWidth=1.5;c.strokeStyle='#c2b89e';
    for(const r of e.rocks)wrapped(r.x,r.y,r.r,()=>{c.rotate(r.angle);c.beginPath();r.shape.forEach((n,i)=>{const a=i/r.shape.length*Math.PI*2;const x=Math.cos(a)*r.r*n,y=Math.sin(a)*r.r*n;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.stroke();});
    c.fillStyle='#faf1bd';for(const b of e.bullets)wrapped(b.x,b.y,2,()=>{c.beginPath();c.arc(0,0,2,0,Math.PI*2);c.fill();});
    for(const p of e.particles){c.globalAlpha=Math.min(1,p.life*2);c.fillStyle='#edb679';c.fillRect(p.x,p.y,2,2);}c.globalAlpha=1;
    if(e.mode==='over')return;
    const s=e.ship;wrapped(s.x,s.y,27,()=>{c.rotate(s.angle);c.strokeStyle='#a5e9e3';c.lineWidth=2;
    c.beginPath();c.moveTo(15,0);c.lineTo(-11,-10);c.lineTo(-6,0);c.lineTo(-11,10);c.closePath();c.stroke();
    if(keys.up&&e.mode==='running'){c.strokeStyle='#efb67a';c.beginPath();c.moveTo(-10,-5);c.lineTo(-21-Math.sin(e.time*45)*5,0);c.lineTo(-10,5);c.stroke();}
    if(s.shield>0){c.strokeStyle='#74aeb67f';c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();c.arc(0,0,23,0,Math.PI*2);c.stroke();}});
  }
  window.PortfolioArcade={content,sync};
})();
