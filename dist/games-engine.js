/* Small, independent simulations: the desktop owns focus; the arcade owns time. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const wrap = (n, size) => (n % size + size) % size;
  const directions = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  class Snake {
    constructor(random = Math.random) { this.random = random; this.reset(); this.mode = 'ready'; }
    reset() {
      this.mode='running'; this.score=0; this.elapsed=0; this.size=24;
      this.body=[{x:8,y:12},{x:7,y:12},{x:6,y:12},{x:5,y:12}];
      this.direction={x:1,y:0}; this.queue=[]; this.food={x:15,y:12};
    }
    turn(name) {
      const next=directions[name], last=this.queue.at(-1)||this.direction;
      if(this.mode==='running' && next && this.queue.length<2 && next.x*last.x+next.y*last.y===0) this.queue.push({...next});
    }
    update(dt) {
      if(this.mode!=='running') return;
      this.elapsed+=dt;
      const interval=Math.max(.065,.145-this.score*.0008);
      while(this.elapsed>=interval && this.mode==='running') {
        this.elapsed-=interval;
        this.direction=this.queue.shift()||this.direction;
        const head={x:this.body[0].x+this.direction.x,y:this.body[0].y+this.direction.y};
        const eating=head.x===this.food.x && head.y===this.food.y;
        const solid=eating?this.body:this.body.slice(0,-1);
        if(head.x<0||head.y<0||head.x>=this.size||head.y>=this.size||solid.some(p=>p.x===head.x&&p.y===head.y)) {this.mode='over';break;}
        this.body.unshift(head);
        if(!eating) this.body.pop();
        else {
          this.score+=10;
          const empty=[];
          for(let y=0;y<this.size;y++) for(let x=0;x<this.size;x++) if(!this.body.some(p=>p.x===x&&p.y===y)) empty.push({x,y});
          if(!empty.length) {this.mode='won';break;}
          this.food=empty[Math.floor(this.random()*empty.length)];
        }
      }
    }
    snapshot() {return {game:'snake',mode:this.mode,coordinates:'24 × 24 cells; origin top-left, x right, y down',score:this.score,body:this.body,food:this.food,direction:this.direction,queuedTurns:this.queue};}
  }
  class Asteroids {
    constructor(random = Math.random) {this.random=random;this.width=640;this.height=480;this.reset();this.mode='ready';}
    reset() {
      this.mode='running';this.score=0;this.lives=3;this.wave=1;this.bullets=[];this.particles=[];this.cooldown=0;this.time=0;
      this.respawn();this.spawnWave();
    }
    respawn() {this.ship={x:320,y:240,vx:0,vy:0,angle:-Math.PI/2,shield:2.5};}
    rock(x,y,size) {
      const angle=this.random()*TAU,speed=24+this.random()*24+this.wave*4+(3-size)*15;
      return {x,y,size,r:size*12+4,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle:this.random()*TAU,spin:(this.random()-.5)*1.3,shape:Array.from({length:9},()=>.72+this.random()*.28)};
    }
    spawnWave() {
      this.rocks=Array.from({length:Math.min(10,3+this.wave)},(_,i)=>{
        const angle=i*TAU/(3+this.wave)+this.random()*.4;
        return this.rock(wrap(320+Math.cos(angle)*280,640),wrap(240+Math.sin(angle)*210,480),3);
      });
      this.ship.shield=Math.max(this.ship.shield,1.5);
    }
    distance(a,b) {const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);return Math.hypot(Math.min(dx,640-dx),Math.min(dy,480-dy));}
    burst(x,y,count) {
      for(let i=0;i<count;i++){const a=this.random()*TAU,s=30+this.random()*110;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+this.random()*.4});}
    }
    update(dt,keys={}) {
      if(this.mode!=='running') return;
      this.time+=dt;const s=this.ship;
      s.angle+=((keys.right?1:0)-(keys.left?1:0))*4*dt;
      if(keys.up){s.vx+=Math.cos(s.angle)*190*dt;s.vy+=Math.sin(s.angle)*190*dt;}
      s.vx*=Math.pow(.987,dt*60);s.vy*=Math.pow(.987,dt*60);
      const speed=Math.hypot(s.vx,s.vy);if(speed>260){s.vx*=260/speed;s.vy*=260/speed;}
      s.x=wrap(s.x+s.vx*dt,640);s.y=wrap(s.y+s.vy*dt,480);s.shield=Math.max(0,s.shield-dt);
      this.cooldown-=dt;
      if(keys.fire && this.cooldown<=0){this.cooldown=.16;this.bullets.push({x:wrap(s.x+Math.cos(s.angle)*17,640),y:wrap(s.y+Math.sin(s.angle)*17,480),vx:s.vx+Math.cos(s.angle)*390,vy:s.vy+Math.sin(s.angle)*390,life:1.15});}
      for(const r of this.rocks){r.x=wrap(r.x+r.vx*dt,640);r.y=wrap(r.y+r.vy*dt,480);r.angle+=r.spin*dt;}
      for(const b of this.bullets){b.x=wrap(b.x+b.vx*dt,640);b.y=wrap(b.y+b.vy*dt,480);b.life-=dt;}
      for(const b of this.bullets){
        if(b.life<=0)continue;
        const index=this.rocks.findIndex(r=>this.distance(b,r)<r.r+2);
        if(index<0)continue;
        const [r]=this.rocks.splice(index,1);b.life=0;this.score+=r.size===3?20:r.size===2?50:100;this.burst(r.x,r.y,10);
        if(r.size>1)for(let n=0;n<2;n++)this.rocks.push(this.rock(r.x,r.y,r.size-1));
      }
      this.bullets=this.bullets.filter(b=>b.life>0);
      if(s.shield<=0 && this.rocks.some(r=>this.distance(s,r)<r.r+8)){
        this.burst(s.x,s.y,22);this.lives--;
        if(this.lives<=0)this.mode='over';else this.respawn();
      }
      for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
      this.particles=this.particles.filter(p=>p.life>0);
      if(!this.rocks.length && this.mode==='running'){this.wave++;this.spawnWave();}
    }
    snapshot(){return {game:'asteroids',mode:this.mode,coordinates:'640 × 480; origin top-left, x right, y down; edges wrap; angle radians',score:this.score,lives:this.lives,wave:this.wave,ship:{...this.ship},asteroids:this.rocks.map(({x,y,vx,vy,r,size})=>({x,y,vx,vy,r,size})),bullets:this.bullets,cooldown:this.cooldown};}
  }
  const api={Snake,Asteroids};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ArcadeGames=api;
})(typeof window==='undefined'?globalThis:window);
