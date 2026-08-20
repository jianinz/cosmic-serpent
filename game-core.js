const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const TAU=Math.PI*2,DPR=Math.min(2,devicePixelRatio||1);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const $=id=>document.getElementById(id);

function resize(){
  canvas.width=innerWidth*DPR;canvas.height=innerHeight*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener('resize',resize);resize();

const stages=[
  {name:'月球',color:'#b8b8b5',bg1:'#07101c',bg2:'#02050a',nebula:'#6f7480',special:'黄色穿越豆',specialColor:'#ffd84f',next:'火星',goal:70,sunScale:.72,story:'离开灰白色的月面。黄色星际豆将打开第一道虫洞。'},
  {name:'火星',color:'#b94f2f',bg1:'#26100d',bg2:'#080303',nebula:'#7e2f1d',special:'蓝色穿越豆',specialColor:'#4ec9ff',next:'地球',goal:85,sunScale:.82,story:'火星沙尘席卷轨道。蓝色星际豆会把你送回熟悉的蓝色家园。'},
  {name:'地球',color:'#2f7fca',bg1:'#071c34',bg2:'#020710',nebula:'#1a5a86',special:'白色穿越豆',specialColor:'#ffffff',next:'水星',goal:100,sunScale:.78,story:'你再次看见地球，却不能停下。白色星际豆正在近地轨道等待。'},
  {name:'水星',color:'#8f8174',bg1:'#2c1708',bg2:'#090401',nebula:'#9b5b27',special:'紫色穿越豆',specialColor:'#b879ff',next:'海王星',goal:115,sunScale:1.16,story:'靠近太阳的炽热世界让轨道更加危险。找到紫色星际豆。'},
  {name:'海王星',color:'#244fc5',bg1:'#081139',bg2:'#020514',nebula:'#263e91',special:'绿色穿越豆',specialColor:'#65f3a2',next:'冥王星',goal:130,sunScale:.55,story:'极寒的深蓝巨行星附近，敌对宇宙蛇开始变得更加活跃。'},
  {name:'冥王星',color:'#c7b294',bg1:'#171524',bg2:'#020206',nebula:'#554c68',special:'红色穿越豆',specialColor:'#ff607d',next:'木星',goal:145,sunScale:.42,story:'太阳已经遥远得像一颗普通星星。红色星际豆会带你返回巨行星区域。'},
  {name:'木星',color:'#c9915c',bg1:'#22150f',bg2:'#050302',nebula:'#78533d',special:'青色穿越豆',specialColor:'#53f1df',next:'土星',goal:165,sunScale:.67,story:'木星的巨大引力让周围黑洞扰动更强。最后一枚青色星际豆就在前方。'},
  {name:'土星',color:'#d9bc75',bg1:'#241d11',bg2:'#050402',nebula:'#8a744a',special:null,specialColor:'#ffd27a',next:null,goal:185,sunScale:.62,story:'终点。收集足够能量后，穿过土星环即可完成环游太阳系。'}
];

const diffCfg={
  easy:{label:'EASY',speed:118,enemies:2,holes:1,enemySpeed:.78,rocks:9},
  medium:{label:'MEDIUM',speed:145,enemies:4,holes:2,enemySpeed:1.0,rocks:13},
  hard:{label:'HARD',speed:172,enemies:7,holes:4,enemySpeed:1.18,rocks:18}
};

let game={
  running:false,paused:false,dead:false,win:false,difficulty:'easy',stage:0,
  energy:0,totalEnergy:0,beansEaten:0,specialSpawned:false,transitioning:false
};
let snake,camera={x:0,y:0},planet,sun=null,beans=[],specialBean=null,rocks=[],debris=[],holes=[],enemies=[],particles=[],stars=[];
let sunGrowAccumulator=0,sunBurnAccumulator=0;
let last=performance.now(),toastTimer=0,musicOn=false,audio=null,musicTimer=null;
const keys={};
let boostHeld=false;
let touchSteer={active:false,x:0,y:0};
let touchDesiredAngle=null;

// Last-resort visible error reporting: never leave the player with a silent black screen.
window.addEventListener('error',ev=>{
  console.error('Cosmic Serpent runtime error:',ev.error||ev.message);
  const end=$('endOverlay'), title=$('endTitle'), text=$('endText');
  if(end&&title&&text){
    game.running=false;
    title.textContent='游戏运行异常';
    text.innerHTML='浏览器捕获到运行错误：<br><br><b>'+String(ev.message||'未知错误').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))+'</b><br><br>请保留此提示以便继续修复。';
    end.classList.remove('hidden');
  }
});

function makeStars(){
  stars=Array.from({length:420},()=>({x:rnd(-1800,1800),y:rnd(-1200,1200),z:Math.random(),r:rnd(.4,2.1)}));
}
makeStars();

function createSnake(){
  const cfg=diffCfg[game.difficulty];
  snake={x:0,y:260,angle:-Math.PI/2,speed:cfg.speed,baseSpeed:cfg.speed,r:8,spacing:7,maxPoints:52,points:[],invuln:0};
  for(let i=0;i<snake.maxPoints;i++)snake.points.push({x:snake.x,y:snake.y+i*snake.spacing});
}

function initStage(stageIndex, preserveLength=false){
  game.stage=stageIndex;game.energy=0;game.beansEaten=0;game.specialSpawned=false;game.transitioning=false;
  planet={x:0,y:0,r:stageIndex===6?98:stageIndex===7?88:stageIndex===4?78:64,color:stages[stageIndex].color};
  const sc=stages[stageIndex].sunScale||.7;
  const sr=58*sc+18;
  const sunAngle=-0.72+stageIndex*.31;
  const sunDistance=stageIndex===3?560:stageIndex===5?690:620;
  sun={
    x:Math.cos(sunAngle)*sunDistance,
    y:Math.sin(sunAngle)*sunDistance,
    r:sr,
    harvestOuter:sr+155,
    burnOuter:sr+62,
    coreOuter:sr+22
  };
  sunGrowAccumulator=0;sunBurnAccumulator=0;
  beans=[];specialBean=null;rocks=[];debris=[];holes=[];enemies=[];particles=[];
  if(!preserveLength||!snake) createSnake();
  else{
    snake.x=0;snake.y=planet.r+200;snake.angle=-Math.PI/2;
    snake.speed=diffCfg[game.difficulty].speed;snake.baseSpeed=snake.speed;
    snake.points=[];
    for(let i=0;i<snake.maxPoints;i++) snake.points.push({x:snake.x,y:snake.y+i*snake.spacing});
  }
  camera.x=snake.x;camera.y=snake.y;
  spawnBeans(34);
  spawnHazards();
  spawnEnemies();
  updateHud();
}

function spawnBeans(n){
  for(let i=0;i<n;i++){
    const a=Math.random()*TAU,rr=rnd(planet.r+105,Math.min(innerWidth,innerHeight)*.56+280);
    beans.push({x:planet.x+Math.cos(a)*rr,y:planet.y+Math.sin(a)*rr,r:rnd(3.5,5.5),value:Math.round(rnd(4,9)),phase:Math.random()*TAU});
  }
}

function spawnHazards(){
  const cfg=diffCfg[game.difficulty];
  for(let i=0;i<cfg.rocks;i++){
    const a=Math.random()*TAU,rr=rnd(planet.r+150,780);
    rocks.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr,r:rnd(10,23),rot:Math.random()*TAU,spin:rnd(-.5,.5)});
  }
  for(let i=0;i<Math.max(3,Math.floor(cfg.rocks*.45));i++){
    const a=Math.random()*TAU,rr=rnd(planet.r+170,760);
    debris.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr,r:rnd(7,14),rot:Math.random()*TAU,spin:rnd(-1.4,1.4)});
  }
  for(let i=0;i<cfg.holes;i++){
    let x,y,d;
    do{
      const a=Math.random()*TAU,rr=rnd(360,760);x=Math.cos(a)*rr;y=Math.sin(a)*rr;d=Math.hypot(x-snake.x,y-snake.y);
    }while(d<330);
    if(sun && Math.hypot(x-sun.x,y-sun.y)<sun.harvestOuter+100){i--;continue}
    holes.push({x,y,r:rnd(30,44),gravity:rnd(11000,17000),phase:Math.random()*TAU});
  }
}

const enemyColors=['#ff5576','#ff9e4d','#65d8ff','#c56cff','#80f273','#ffd84a','#ff72d2'];
const enemyColorNames=['红','橙','蓝','紫','绿','黄','粉'];
function spawnEnemies(){
  const cfg=diffCfg[game.difficulty];
  for(let e=0;e<cfg.enemies;e++){
    const a=Math.random()*TAU,rr=rnd(300,650),x=Math.cos(a)*rr,y=Math.sin(a)*rr;
    const len=Math.round(rnd(34,72)),spacing=7;
    const enemy={x,y,angle:a+Math.PI/2,targetAngle:a+Math.PI/2,speed:cfg.speed*cfg.enemySpeed*rnd(.72,.98),r:7,spacing,points:[],color:enemyColors[e%enemyColors.length],colorName:enemyColorNames[e%enemyColorNames.length],turnPhase:Math.random()*TAU};
    for(let i=0;i<len;i++) enemy.points.push({x,y:y+i*spacing});
    enemies.push(enemy);
  }
}

function spawnSpecial(){
  if(game.specialSpawned)return;
  game.specialSpawned=true;
  if(stages[game.stage].special){
    const a=Math.random()*TAU,rr=planet.r+180;
    specialBean={x:Math.cos(a)*rr,y:Math.sin(a)*rr,r:9,color:stages[game.stage].specialColor,phase:0};
    showToast(`${stages[game.stage].special} 已出现！`);
  }else{
    specialBean=null;
    showToast('土星环正在发光！');
  }
}

function normalizeSnake(){
  snake.maxPoints=clamp(snake.maxPoints,36,360);
  while(snake.points.length<snake.maxPoints){
    const q=snake.points[snake.points.length-1]||{x:snake.x,y:snake.y};
    snake.points.push({x:q.x,y:q.y});
  }
  if(snake.points.length>snake.maxPoints)snake.points.length=snake.maxPoints;
}

function updateHud(){
  $('stageText').textContent=`${game.stage+1}/${stages.length}`;
  $('planetText').textContent=stages[game.stage].name;
  $('energyText').textContent=Math.floor(game.energy);
  $('lengthText').textContent=snake?snake.maxPoints:0;
  $('diffText').textContent=diffCfg[game.difficulty].label;
  $('enemyText').textContent=enemies.length;
  $('speedText').textContent=snake?(boostHeld&&game.running&&!game.paused?Math.round(snake.speed)+' BOOST':Math.round(snake.speed)):0;
  $('speedText').style.color=(boostHeld&&game.running&&!game.paused)?'#7cf3df':'#ffffff';
  if(sun&&snake){
    const sd=Math.hypot(snake.x-sun.x,snake.y-sun.y);
    const st=$('sunText');
    if(sd<sun.coreOuter){st.textContent='极端灼烧';st.style.color='#ff456f'}
    else if(sd<sun.burnOuter){st.textContent='灼烧';st.style.color='#ff795d'}
    else if(sd<sun.harvestOuter){st.textContent='高速充能';st.style.color='#ffd85b'}
    else{st.textContent='远离';st.style.color='#ffffff'}
  }
  const goal=stages[game.stage].goal;
  const pct=clamp(game.energy/goal*100,0,100);
  document.querySelector('#progress i').style.width=pct+'%';
  if(game.stage===stages.length-1 && game.energy>=goal){
    $('objective').textContent='目标：靠近土星环，完成最终通关。';
  }else if(game.specialSpawned){
    $('objective').textContent=`目标：找到并吃掉 ${stages[game.stage].special}，开启通往${stages[game.stage].next}的虫洞。`;
  }else{
    $('objective').textContent=`目标：收集能量豆 ${Math.floor(game.energy)}/${goal}；达到目标后会出现${stages[game.stage].special||'最终通关信号'}。`;
  }
}

function showToast(text){
  const el=$('toast');el.textContent=text;el.style.opacity=1;toastTimer=1.9;
}

function addParticles(x,y,n,color='#7cf3df',power=1){
  for(let i=0;i<n;i++){
    const a=Math.random()*TAU,sp=rnd(30,130)*power;
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rnd(.5,1.4),max:1.4,r:rnd(1,3),color});
  }
}

function worldToScreen(x,y){return{x:x-camera.x+innerWidth/2,y:y-camera.y+innerHeight/2}}
function visible(o,m=100){const p=worldToScreen(o.x,o.y);return p.x>-m&&p.x<innerWidth+m&&p.y>-m&&p.y<innerHeight+m}

function hurt(amount,reason){
  if(snake.invuln>0)return;
  snake.invuln=1.0;snake.maxPoints-=amount;game.energy=Math.max(0,game.energy-amount*.5);
  normalizeSnake();addParticles(snake.x,snake.y,18,'#ff667f',1);
  showToast(`${reason} · 长度 -${amount}`);
  if(snake.maxPoints<=36) endGame(false,reason);
}

function lethal(reason){
  if(game.dead||game.win)return;
  addParticles(snake.x,snake.y,50,'#ff5c82',1.4);
  endGame(false,reason);
}

function endGame(win,reason){
  game.running=false;game.paused=false;game.dead=!win;game.win=win;
  $('pauseOverlay').classList.add('hidden');$('levelOverlay').classList.add('hidden');
  $('endOverlay').classList.remove('hidden');
  if(win){
    $('endTitle').textContent='环游太阳系完成！';
    $('endText').innerHTML=`这条来自地球的小蛇，终于穿越了月球、火星、地球、水星、海王星、冥王星、木星与土星。<br><br>总能量：<b>${Math.floor(game.totalEnergy+game.energy)}</b>　最终长度：<b>${snake.maxPoints}</b><br><br>它没有回到笼子里，而是继续向太阳系之外的星海出发……`;
    localStorage.removeItem('cosmicSerpentV2Save');
  }else{
    $('endTitle').textContent='星际旅程终止';
    $('endText').innerHTML=`${reason}<br><br>抵达：<b>${stages[game.stage].name}</b>　总能量：<b>${Math.floor(game.totalEnergy+game.energy)}</b>`;
  }
}

function advanceStage(){
  game.totalEnergy+=game.energy;
  if(game.stage>=stages.length-1){endGame(true,'完成旅程');return}
  game.running=false;game.transitioning=true;
  const nxt=stages[game.stage+1];
  $('levelTitle').textContent='虫洞已开启';
  $('levelPlanet').textContent=`下一站：${nxt.name}`;
  $('levelStory').textContent=nxt.story;
  $('levelOverlay').classList.remove('hidden');
}

function updateEnemy(e,dt,idx){
  // Orbital wandering around current planet with mild pursuit when close.
  const dx=snake.x-e.x,dy=snake.y-e.y,d=Math.hypot(dx,dy);
  let desired;
  if(d<260) desired=Math.atan2(dy,dx)+(idx%2?0.45:-0.45);
  else desired=Math.atan2(-e.y,-e.x)+(idx%2?Math.PI/2:-Math.PI/2)+Math.sin(game.totalEnergy*.001+performance.now()*.0004+e.turnPhase)*.45;
  let da=((desired-e.angle+Math.PI*3)%TAU)-Math.PI;
  e.angle+=clamp(da,-1.55*dt,1.55*dt);
  e.x+=Math.cos(e.angle)*e.speed*dt;e.y+=Math.sin(e.angle)*e.speed*dt;
  e.points[0].x=e.x;e.points[0].y=e.y;
  for(let i=1;i<e.points.length;i++){
    const a=e.points[i-1],b=e.points[i],vx=b.x-a.x,vy=b.y-a.y,dd=Math.hypot(vx,vy)||1;
    b.x=a.x+vx/dd*e.spacing;b.y=a.y+vy/dd*e.spacing;
  }
}

function update(dt){
  if(!game.running||game.paused)return;
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').style.opacity=0}
  snake.invuln=Math.max(0,snake.invuln-dt);

  let ix=0,iy=0;
  if(keys['arrowleft']||keys['a'])ix--;
  if(keys['arrowright']||keys['d'])ix++;
  if(keys['arrowup']||keys['w'])iy--;
  if(keys['arrowdown']||keys['s'])iy++;
  let desired=null;
  if(touchSteer.active && touchDesiredAngle!==null){
    desired=touchDesiredAngle;
  }else if(ix||iy){
    desired=Math.atan2(iy,ix);
  }
  if(desired!==null){
    let da=((desired-snake.angle+Math.PI*3)%TAU)-Math.PI;
    snake.angle+=clamp(da,-3.1*dt,3.1*dt);
  }
  // Boost is independent from steering: holding either Shift key accelerates even on a perfectly straight path.
  const boost=boostHeld&&game.energy>1;
  const targetSpeed=boost?snake.baseSpeed*1.72:snake.baseSpeed;
  snake.speed=lerp(snake.speed,targetSpeed,1-Math.pow(.0008,dt));
  if(boost)game.energy=Math.max(0,game.energy-dt*6.5);

  // Solar risk/reward mechanic.
  if(sun){
    const sdx=sun.x-snake.x,sdy=sun.y-snake.y,sd=Math.hypot(sdx,sdy);
    if(sd<sun.harvestOuter){
      if(sd>=sun.burnOuter){
        // Golden harvesting zone: much faster than ordinary beans.
        const proximity=1-clamp((sd-sun.burnOuter)/(sun.harvestOuter-sun.burnOuter),0,1);
        const gainRate=26+34*proximity;
        game.energy+=gainRate*dt;
        game.totalEnergy+=0;
        sunGrowAccumulator+=(2.4+3.2*proximity)*dt;
        if(sunGrowAccumulator>=1){
          const add=Math.floor(sunGrowAccumulator);
          snake.maxPoints+=add;sunGrowAccumulator-=add;normalizeSnake();
        }
        if(Math.random()<dt*8)addParticles(snake.x+rnd(-8,8),snake.y+rnd(-8,8),1,'#ffd85b',.35);
      }else{
        // Red zone: still saturated with energy, but tissue is destroyed continuously.
        const danger=1-clamp((sd-sun.coreOuter)/(sun.burnOuter-sun.coreOuter),0,1);
        game.energy+=(34+30*danger)*dt;
        const burnRate=sd<sun.coreOuter ? 34 : 10+20*danger;
        sunBurnAccumulator+=burnRate*dt;
        if(sunBurnAccumulator>=1){
          const loss=Math.floor(sunBurnAccumulator);
          snake.maxPoints-=loss;sunBurnAccumulator-=loss;
          normalizeSnake();
          if(Math.random()<.65)addParticles(snake.x+rnd(-9,9),snake.y+rnd(-9,9),2,'#ff664d',.7);
          if(snake.maxPoints<=36)return lethal('你在太阳的高温辐射中被烧蚀殆尽。');
        }
      }
    }else{
      sunGrowAccumulator=Math.max(0,sunGrowAccumulator-dt*.5);
      sunBurnAccumulator=0;
    }
  }

  // Black-hole gravity and event horizon.
  for(const h of holes){
    const dx=h.x-snake.x,dy=h.y-snake.y,d=Math.hypot(dx,dy);
    if(d<390){
      const pull=h.gravity/Math.max(4200,d*d);
      snake.x+=dx/d*pull*dt*55;snake.y+=dy/d*pull*dt*55;
    }
    if(d<h.r*.78)return lethal('你坠入了黑洞事件视界。');
  }

  snake.x+=Math.cos(snake.angle)*snake.speed*dt;
  snake.y+=Math.sin(snake.angle)*snake.speed*dt;

  if(boost){
    const tailX=snake.x-Math.cos(snake.angle)*snake.r*1.8;
    const tailY=snake.y-Math.sin(snake.angle)*snake.r*1.8;
    if(Math.random()<dt*42){
      particles.push({
        x:tailX+rnd(-3,3),y:tailY+rnd(-3,3),
        vx:-Math.cos(snake.angle)*rnd(80,150)+rnd(-20,20),
        vy:-Math.sin(snake.angle)*rnd(80,150)+rnd(-20,20),
        life:rnd(.22,.48),max:.48,r:rnd(1.2,2.8),color:'#7cf3df'
      });
    }
  }

  snake.points[0].x=snake.x;snake.points[0].y=snake.y;
  for(let i=1;i<snake.points.length;i++){
    const a=snake.points[i-1],b=snake.points[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
    b.x=a.x+dx/d*snake.spacing;b.y=a.y+dy/d*snake.spacing;
  }

  // Prevent flying infinitely away from the level: gentle orbital guidance.
  const orbitalD=Math.hypot(snake.x,snake.y);
  if(orbitalD>900){
    const ang=Math.atan2(-snake.y,-snake.x);
    snake.x+=Math.cos(ang)*45*dt;snake.y+=Math.sin(ang)*45*dt;
  }

  for(let i=beans.length-1;i>=0;i--){
    const b=beans[i];
    if(Math.hypot(b.x-snake.x,b.y-snake.y)<snake.r+b.r+7){
      game.energy+=b.value;game.beansEaten++;snake.maxPoints+=Math.max(1,Math.round(b.value*.28));
      addParticles(b.x,b.y,8,'#72efff',.8);beans.splice(i,1);normalizeSnake();
      if(beans.length<14)spawnBeans(18);
    }
  }

  const goal=stages[game.stage].goal;
  if(game.energy>=goal&&!game.specialSpawned)spawnSpecial();

  if(game.stage<stages.length-1 && specialBean){
    specialBean.phase+=dt*2.4;
    if(Math.hypot(specialBean.x-snake.x,specialBean.y-snake.y)<snake.r+specialBean.r+8){
      addParticles(specialBean.x,specialBean.y,45,specialBean.color,1.4);
      specialBean=null;advanceStage();return;
    }
  }

  if(game.stage===stages.length-1 && game.energy>=goal){
    // Finish by crossing Saturn's ring band near the planet.
    const d=Math.hypot(snake.x,snake.y);
    if(d>planet.r*1.25&&d<planet.r*1.85){endGame(true,'完成土星环穿越');return}
  }

  for(const r of rocks){
    r.rot+=r.spin*dt;
    if(Math.hypot(r.x-snake.x,r.y-snake.y)<r.r+snake.r){hurt(9,'陨石撞击');break}
  }
  for(const d of debris){
    d.rot+=d.spin*dt;
    if(Math.hypot(d.x-snake.x,d.y-snake.y)<d.r+snake.r){hurt(6,'火箭垃圾撞击');break}
  }

  enemies.forEach((e,i)=>updateEnemy(e,dt,i));
  for(const e of enemies){
    for(let i=0;i<e.points.length;i+=2){
      const p=e.points[i];
      if(Math.hypot(p.x-snake.x,p.y-snake.y)<snake.r+e.r*.9){
        return lethal(`你撞上了一条${e.colorName||'敌对'}色的宇宙蛇。`);
      }
    }
  }

  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;p.life-=dt;
    if(p.life<=0)particles.splice(i,1);
  }
  camera.x=lerp(camera.x,snake.x,1-Math.pow(.001,dt));
  camera.y=lerp(camera.y,snake.y,1-Math.pow(.001,dt));
  updateHud();
}
