function draw(){
  drawBackground();
  drawSun();
  if(planet)drawPlanet();
  holes.forEach(drawHole);beans.forEach(drawBean);drawSpecial();rocks.forEach(drawRock);debris.forEach(drawDebris);
  enemies.forEach(e=>drawSnakeBody(e.points,e.color,e.r,.9));drawParticles();
  if(snake)drawPlayer();
  const vg=ctx.createRadialGradient(innerWidth/2,innerHeight/2,Math.min(innerWidth,innerHeight)*.25,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.38)');ctx.fillStyle=vg;ctx.fillRect(0,0,innerWidth,innerHeight);
}

function loop(now){
  const dt=Math.min(.033,(now-last)/1000||0);
  last=now;
  try{
    update(dt);
    draw();
  }catch(err){
    console.error('Cosmic Serpent frame error:',err);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function pauseGame(){
  if(!game.running||game.transitioning)return;
  boostHeld=false;keys['shift']=false;
  game.paused=true;$('pauseOverlay').classList.remove('hidden');$('pauseBtn').textContent='▶ 继续';
}
function resumeGame(){
  if(!game.running)return;
  game.paused=false;$('pauseOverlay').classList.add('hidden');$('pauseBtn').textContent='Ⅱ 暂停';last=performance.now();
}
function togglePause(){game.paused?resumeGame():pauseGame()}

function serialize(){
  return{
    version:2,savedAt:new Date().toISOString(),difficulty:game.difficulty,stage:game.stage,
    energy:game.energy,totalEnergy:game.totalEnergy,beansEaten:game.beansEaten,
    specialSpawned:game.specialSpawned,specialBean,
    snake:{x:snake.x,y:snake.y,angle:snake.angle,speed:snake.speed,baseSpeed:snake.baseSpeed,r:snake.r,spacing:snake.spacing,maxPoints:snake.maxPoints,points:snake.points},
    beans,rocks,debris,holes,enemies,planet,sun
  };
}
function saveGame(){
  if(!snake)return;
  localStorage.setItem('cosmicSerpentV2Save',JSON.stringify(serialize()));
  showToast('进度已保存到浏览器');
  refreshSaveInfo();
}
function loadGame(){
  const raw=localStorage.getItem('cosmicSerpentV2Save');if(!raw)return false;
  try{
    const s=JSON.parse(raw);if(s.version!==2)return false;
    game={running:true,paused:false,dead:false,win:false,difficulty:s.difficulty,stage:s.stage,energy:s.energy,totalEnergy:s.totalEnergy,beansEaten:s.beansEaten,specialSpawned:s.specialSpawned,transitioning:false};
    snake=s.snake;beans=s.beans||[];specialBean=s.specialBean||null;rocks=s.rocks||[];debris=s.debris||[];holes=s.holes||[];enemies=s.enemies||[];planet=s.planet;
    sun=s.sun||null;
    if(!sun){
      const sc=stages[game.stage].sunScale||.7,sr=58*sc+18,a=-.72+game.stage*.31,dd=game.stage===3?560:game.stage===5?690:620;
      sun={x:Math.cos(a)*dd,y:Math.sin(a)*dd,r:sr,harvestOuter:sr+155,burnOuter:sr+62,coreOuter:sr+22};
    }
    sunGrowAccumulator=0;sunBurnAccumulator=0;
    particles=[];camera.x=snake.x;camera.y=snake.y;normalizeSnake();updateHud();
    $('startOverlay').classList.add('hidden');$('endOverlay').classList.add('hidden');$('pauseOverlay').classList.add('hidden');
    if(!musicOn)startMusic();
    last=performance.now();showToast('已继续上次游戏');return true;
  }catch(e){console.error(e);return false}
}
function refreshSaveInfo(){
  const raw=localStorage.getItem('cosmicSerpentV2Save');
  if(!raw){$('continueBtn').disabled=true;$('saveInfo').textContent='当前没有保存的游戏。';return}
  try{
    const s=JSON.parse(raw),dt=new Date(s.savedAt);
    $('continueBtn').disabled=false;
    $('saveInfo').textContent=`上次存档：${stages[s.stage]?.name||'未知'} · ${diffCfg[s.difficulty]?.label||''} · ${dt.toLocaleString()}`;
  }catch{$('continueBtn').disabled=true;$('saveInfo').textContent='存档不可读取。'}
}
refreshSaveInfo();

function newGame(){
  game={running:true,paused:false,dead:false,win:false,difficulty:game.difficulty,stage:0,energy:0,totalEnergy:0,beansEaten:0,specialSpawned:false,transitioning:false};
  initStage(0,false);
  $('startOverlay').classList.add('hidden');$('endOverlay').classList.add('hidden');$('pauseOverlay').classList.add('hidden');
  if(!musicOn)startMusic();
  last=performance.now();
}

document.querySelectorAll('.diff').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.diff').forEach(x=>x.classList.remove('selected'));
  btn.classList.add('selected');game.difficulty=btn.dataset.diff;
}));
$('newGameBtn').onclick=newGame;
$('continueBtn').onclick=()=>loadGame();
$('pauseBtn').onclick=()=>togglePause();
$('resumeBtn').onclick=resumeGame;
$('saveBtn').onclick=saveGame;
$('pauseSaveBtn').onclick=saveGame;
$('menuBtn').onclick=()=>{game.running=false;game.paused=false;$('pauseOverlay').classList.add('hidden');$('startOverlay').classList.remove('hidden');refreshSaveInfo()};
$('endMenuBtn').onclick=()=>{$('endOverlay').classList.add('hidden');$('startOverlay').classList.remove('hidden');refreshSaveInfo()};
$('restartBtn').onclick=()=>{game.stage=0;newGame()};
$('nextLevelBtn').onclick=()=>{
  $('levelOverlay').classList.add('hidden');
  const next=game.stage+1;game.transitioning=false;initStage(next,true);game.running=true;last=performance.now();saveGame();
};

addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  keys[k]=true;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight'){
    boostHeld=true;keys['shift']=true;e.preventDefault();
  }
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  if((k==='p'||k==='escape')&&game.running&&!e.repeat)togglePause();
},{passive:false});

addEventListener('keyup',e=>{
  const k=e.key.toLowerCase();
  keys[k]=false;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight'){
    boostHeld=false;keys['shift']=false;e.preventDefault();
  }
},{passive:false});

addEventListener('blur',()=>{
  boostHeld=false;
  for(const k in keys)keys[k]=false;
});
