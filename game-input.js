// iPad / touch controls: drag anywhere to steer, BOOST button stays independent.
(function setupTouchControls(){
  const surface=$('steerSurface'),guide=$('touchGuide'),hint=$('touchHint'),boost=$('touchBoost'),pause=$('touchPause');
  if(!surface||!guide||!boost||!pause)return;

  let steerPointer=null,startX=0,startY=0;
  let boostPointer=null,lastGameplayActive=false;
  const DEAD_ZONE=14;

  function gameplayTouchActive(){
    return !!(game && game.running && !game.paused && !game.transitioning && !game.dead && !game.win);
  }

  function setGuide(x,y,show=true){
    guide.style.left=x+'px';guide.style.top=y+'px';
    guide.style.opacity=show?'1':'0';
  }

  function beginSteer(e){
    if(!gameplayTouchActive() || e.target!==surface)return;
    steerPointer=e.pointerId;
    startX=e.clientX;startY=e.clientY;
    touchSteer.active=false;
    touchDesiredAngle=null;
    surface.setPointerCapture(e.pointerId);
    setGuide(startX,startY,true);
    if(hint)hint.style.opacity='0';
    e.preventDefault();
  }

  function moveSteer(e){
    if(!gameplayTouchActive() || e.pointerId!==steerPointer)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    const d=Math.hypot(dx,dy);
    if(d<DEAD_ZONE)return;
    touchDesiredAngle=Math.atan2(dy,dx);
    touchSteer.active=true;
    const max=54,scale=Math.min(1,max/d);
    setGuide(startX+dx*scale,startY+dy*scale,true);
    e.preventDefault();
  }

  function endSteer(e){
    if(steerPointer===null || (e && e.pointerId!==steerPointer))return;
    steerPointer=null;
    touchSteer.active=false;
    touchDesiredAngle=null;
    setGuide(0,0,false);
    if(e)e.preventDefault();
  }

  surface.addEventListener('pointerdown',beginSteer,{passive:false});
  surface.addEventListener('pointermove',moveSteer,{passive:false});
  surface.addEventListener('pointerup',endSteer,{passive:false});
  surface.addEventListener('pointercancel',endSteer,{passive:false});

  boost.addEventListener('pointerdown',e=>{
    if(!gameplayTouchActive())return;
    boostPointer=e.pointerId;
    boost.setPointerCapture(e.pointerId);
    boostHeld=true;keys['shift']=true;boost.classList.add('active');
    e.preventDefault();e.stopPropagation();
  },{passive:false});

  function stopBoost(e){
    if(boostPointer===null||!e||e.pointerId===boostPointer){
      boostPointer=null;boostHeld=false;keys['shift']=false;boost.classList.remove('active');
    }
    if(e){e.preventDefault();e.stopPropagation()}
  }
  boost.addEventListener('pointerup',stopBoost,{passive:false});
  boost.addEventListener('pointercancel',stopBoost,{passive:false});

  pause.addEventListener('pointerdown',e=>e.stopPropagation());
  pause.addEventListener('click',e=>{
    e.stopPropagation();
    if(game && game.running && !game.transitioning)togglePause();
  });

  // Keep the full-screen steering surface completely inert while a menu/modal is open.
  // This prevents iPad Safari from letting the transparent gameplay layer steal taps
  // from difficulty, start, resume, save, and next-level buttons.
  function syncTouchAvailability(){
    const active=gameplayTouchActive();
    surface.style.pointerEvents=active?'auto':'none';
    boost.style.pointerEvents=active?'auto':'none';
    pause.style.pointerEvents=(game && game.running && !game.transitioning && !game.dead && !game.win)?'auto':'none';

    if(lastGameplayActive && !active){
      endSteer(null);
      stopBoost(null);
    }
    lastGameplayActive=active;
    requestAnimationFrame(syncTouchAvailability);
  }
  requestAnimationFrame(syncTouchAvailability);

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){endSteer(null);stopBoost(null)}
  });

  if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone){
    document.body.classList.add('standalone');
  }
})();

function startMusic(){
  if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();
  audio.resume();musicOn=true;$('musicBtn').textContent='♫ 关闭';
  const master=audio.createGain();master.gain.value=.16;master.connect(audio.destination);
  const delay=audio.createDelay();delay.delayTime.value=.42;
  const fb=audio.createGain();fb.gain.value=.30;delay.connect(fb);fb.connect(delay);delay.connect(master);
  audio._master=master;
  const scale=[0,3,7,10,14,15,19,22];let step=0;
  function note(){
    if(!musicOn)return;
    const roots=[110,98,130.81,123.47,82.41,73.42,92.50,87.31];
    const now=audio.currentTime,root=roots[game.stage]||110,semi=scale[step%scale.length]+(Math.floor(step/8)%2)*12,f=root*Math.pow(2,semi/12);
    const osc=audio.createOscillator(),g=audio.createGain(),fil=audio.createBiquadFilter();
    osc.type=step%3===0?'triangle':'sine';osc.frequency.value=f;fil.type='lowpass';fil.frequency.value=950;
    g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.16,now+.12);g.gain.exponentialRampToValueAtTime(.001,now+1.8);
    osc.connect(fil);fil.connect(g);g.connect(master);g.connect(delay);osc.start(now);osc.stop(now+2);
    if(step%4===0){
      const pad=audio.createOscillator(),pg=audio.createGain(),pf=audio.createBiquadFilter();
      pad.type='sine';pad.frequency.value=f/2;pf.type='lowpass';pf.frequency.value=520;
      pg.gain.setValueAtTime(.001,now);pg.gain.linearRampToValueAtTime(.055,now+.9);pg.gain.exponentialRampToValueAtTime(.001,now+4.2);
      pad.connect(pf);pf.connect(pg);pg.connect(master);pad.start(now);pad.stop(now+4.3);
    }
    step++;musicTimer=setTimeout(note,560);
  }note();
}
function stopMusic(){
  musicOn=false;clearTimeout(musicTimer);$('musicBtn').textContent='♫ 音乐';
  if(audio&&audio._master)audio._master.gain.setTargetAtTime(0,audio.currentTime,.08);
}
$('musicBtn').onclick=()=>musicOn?stopMusic():startMusic();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./service-worker.js').catch(err=>console.warn('SW registration failed',err));
  });
}
