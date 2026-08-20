function drawBackground(){
  const theme=stages[game.stage]||stages[0];
  const bg=ctx.createLinearGradient(0,0,innerWidth,innerHeight);
  bg.addColorStop(0,theme.bg1||'#07101c');bg.addColorStop(1,theme.bg2||'#02040b');
  ctx.fillStyle=bg;ctx.fillRect(0,0,innerWidth,innerHeight);
  const neb=ctx.createRadialGradient(innerWidth*.42,innerHeight*.37,20,innerWidth*.5,innerHeight*.5,Math.max(innerWidth,innerHeight)*.78);
  neb.addColorStop(0,(theme.nebula||'#445588')+'55');neb.addColorStop(.52,(theme.nebula||'#223355')+'18');neb.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=neb;ctx.fillRect(0,0,innerWidth,innerHeight);
  for(const s of stars){
    const x=((s.x-camera.x*(.05+.15*s.z))%3600+3600)%3600-500;
    const y=((s.y-camera.y*(.05+.15*s.z))%2400+2400)%2400-400;
    ctx.globalAlpha=.25+.7*s.z;ctx.fillStyle=s.z>.65?'#e6efff':'#8299c4';
    ctx.beginPath();ctx.arc(x,y,s.r*(.5+s.z),0,TAU);ctx.fill();
  }ctx.globalAlpha=1;
}

function drawPlanet(){
  if(!planet)return;
  const p=worldToScreen(planet.x,planet.y),R=planet.r,stage=game.stage;
  ctx.save();ctx.translate(p.x,p.y);

  if(stage===2||stage===4){
    const glow=ctx.createRadialGradient(0,0,R*.84,0,0,R*1.22);
    glow.addColorStop(0,'rgba(0,0,0,0)');
    glow.addColorStop(.72,stage===2?'rgba(86,183,255,.16)':'rgba(61,94,255,.13)');
    glow.addColorStop(1,'rgba(80,140,255,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,R*1.22,0,TAU);ctx.fill();
  }

  const base=ctx.createRadialGradient(-R*.36,-R*.38,R*.05,R*.12,R*.12,R*1.12);
  const palettes=[
    ['#f1f1ed','#a4a49e','#41413f'],
    ['#ef9b6b','#a94128','#451710'],
    ['#8ed7ff','#2478c1','#06284b'],
    ['#d0b8a0','#807166','#352d28'],
    ['#7796ff','#2851dc','#081d75'],
    ['#eadbc2','#b39c83','#594c43'],
    ['#f0c49a','#b87948','#5c3426'],
    ['#f4dca4','#c4a45c','#66522c']
  ];
  const pal=palettes[stage]||palettes[0];
  base.addColorStop(0,pal[0]);base.addColorStop(.50,pal[1]);base.addColorStop(1,pal[2]);
  ctx.shadowColor=planet.color;ctx.shadowBlur=28;ctx.fillStyle=base;
  ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();ctx.shadowBlur=0;

  ctx.save();ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.clip();

  if(stage===0 || stage===3 || stage===5){
    const craterCount=stage===5?16:24;
    for(let i=0;i<craterCount;i++){
      const a=Math.sin(i*71.37+stage*9.1)*43758.5453;
      const b=Math.sin(i*29.83+stage*3.7)*24634.6345;
      const fx=(a-Math.floor(a))*2-1, fy=(b-Math.floor(b))*2-1;
      if(fx*fx+fy*fy>.72)continue;
      const rr=R*(.035+((i*37)%11)/110);
      const x=fx*R*.82,y=fy*R*.82;
      ctx.fillStyle=stage===5?'rgba(105,78,67,.22)':'rgba(36,34,34,.20)';
      ctx.beginPath();ctx.arc(x+rr*.18,y+rr*.12,rr,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=Math.max(1,R*.012);
      ctx.beginPath();ctx.arc(x-rr*.10,y-rr*.10,rr*.78,Math.PI*.8,Math.PI*1.8);ctx.stroke();
    }
    if(stage===5){
      ctx.fillStyle='rgba(232,210,189,.30)';
      ctx.beginPath();ctx.ellipse(-R*.18,-R*.06,R*.38,R*.27,-.25,0,TAU);ctx.fill();
    }
  }else if(stage===1){
    ctx.fillStyle='rgba(82,28,20,.28)';
    ctx.beginPath();ctx.ellipse(-R*.18,R*.12,R*.58,R*.22,-.25,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(R*.35,-R*.18,R*.23,R*.38,.55,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(89,39,27,.32)';ctx.lineWidth=R*.05;
    ctx.beginPath();ctx.arc(-R*.08,R*.10,R*.48,.05,1.08);ctx.stroke();
    ctx.fillStyle='rgba(255,239,219,.78)';
    ctx.beginPath();ctx.ellipse(0,-R*.86,R*.42,R*.13,0,0,TAU);ctx.fill();
  }else if(stage===2){
    ctx.fillStyle='rgba(38,132,75,.88)';
    const lands=[[-.34,-.22,.28,.18,-.3],[.12,-.20,.32,.16,.25],[.28,.18,.22,.29,.1],[-.24,.28,.19,.25,-.25],[.48,-.02,.15,.12,.4]];
    for(const L of lands){ctx.beginPath();ctx.ellipse(L[0]*R,L[1]*R,L[2]*R,L[3]*R,L[4],0,TAU);ctx.fill()}
    ctx.fillStyle='rgba(139,118,61,.35)';
    ctx.beginPath();ctx.ellipse(.10*R,.05*R,.18*R,.13*R,.25,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(245,250,255,.86)';
    ctx.beginPath();ctx.ellipse(0,-R*.89,R*.34,R*.11,0,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(0,R*.90,R*.29,R*.09,0,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.52)';ctx.lineWidth=R*.055;ctx.lineCap='round';
    ctx.beginPath();ctx.arc(-R*.10,-R*.06,R*.58,.25,1.12);ctx.stroke();
    ctx.beginPath();ctx.arc(R*.18,R*.02,R*.48,3.5,4.45);ctx.stroke();
  }else if(stage===4){
    for(let i=-3;i<=3;i++){
      ctx.strokeStyle=i%2?'rgba(100,130,255,.22)':'rgba(14,43,150,.25)';
      ctx.lineWidth=R*.11;
      ctx.beginPath();ctx.moveTo(-R,R*i*.20);ctx.bezierCurveTo(-R*.3,R*(i*.20-.05),R*.35,R*(i*.20+.07),R,R*i*.20);ctx.stroke();
    }
    ctx.fillStyle='rgba(175,199,255,.36)';
    ctx.beginPath();ctx.ellipse(R*.20,R*.14,R*.28,R*.12,-.18,0,TAU);ctx.fill();
  }else if(stage===6){
    const cols=['rgba(255,226,188,.48)','rgba(146,84,50,.32)','rgba(255,244,214,.34)','rgba(128,68,43,.28)'];
    for(let i=-5;i<=5;i++){
      ctx.strokeStyle=cols[(i+8)%cols.length];ctx.lineWidth=R*.105;
      ctx.beginPath();ctx.moveTo(-R,R*i*.17);ctx.bezierCurveTo(-R*.25,R*(i*.17-.04),R*.28,R*(i*.17+.04),R,R*i*.17);ctx.stroke();
    }
    ctx.fillStyle='rgba(171,63,40,.68)';
    ctx.beginPath();ctx.ellipse(R*.38,R*.25,R*.24,R*.13,-.08,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(255,195,155,.35)';ctx.lineWidth=R*.035;
    ctx.beginPath();ctx.ellipse(R*.38,R*.25,R*.29,R*.17,-.08,0,TAU);ctx.stroke();
  }else if(stage===7){
    for(let i=-4;i<=4;i++){
      ctx.strokeStyle=i%2?'rgba(151,117,55,.18)':'rgba(255,237,187,.30)';
      ctx.lineWidth=R*.09;ctx.beginPath();ctx.moveTo(-R,R*i*.18);ctx.lineTo(R,R*i*.18);ctx.stroke();
    }
  }
  ctx.restore();

  if(stage===7){
    ctx.save();ctx.rotate(-.18);
    ctx.strokeStyle='rgba(201,169,103,.28)';ctx.lineWidth=R*.24;
    ctx.beginPath();ctx.ellipse(0,0,R*1.82,R*.49,0,Math.PI,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(246,225,170,.58)';ctx.lineWidth=R*.08;
    ctx.beginPath();ctx.ellipse(0,0,R*1.82,R*.49,0,Math.PI,TAU);ctx.stroke();
    ctx.restore();
  }

  const shade=ctx.createLinearGradient(-R*.3,-R*.3,R*.85,R*.65);
  shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(.58,'rgba(0,0,0,.06)');shade.addColorStop(1,'rgba(0,0,0,.58)');
  ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();

  if(stage===7){
    ctx.save();ctx.rotate(-.18);
    ctx.strokeStyle='rgba(246,225,170,.68)';ctx.lineWidth=R*.09;
    ctx.beginPath();ctx.ellipse(0,0,R*1.82,R*.49,0,0,Math.PI);ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawBean(b){
  if(!visible(b,40))return;const p=worldToScreen(b.x,b.y),pulse=1+Math.sin(performance.now()*.003+b.phase)*.25;
  const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,b.r*5*pulse);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(108,244,255,.95)');g.addColorStop(.48,'rgba(116,113,255,.35)');g.addColorStop(1,'rgba(116,113,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,b.r*5*pulse,0,TAU);ctx.fill();
}

function drawSpecial(){
  if(!specialBean)return;const p=worldToScreen(specialBean.x,specialBean.y),pulse=1+Math.sin(specialBean.phase*3)*.18;
  const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,specialBean.r*6*pulse);
  g.addColorStop(0,'#fff');g.addColorStop(.16,specialBean.color);g.addColorStop(.52,specialBean.color+'88');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,specialBean.r*6*pulse,0,TAU);ctx.fill();
  ctx.strokeStyle='#fff';ctx.globalAlpha=.5;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,specialBean.r*2.1*pulse,0,TAU);ctx.stroke();ctx.globalAlpha=1;
}

function drawSun(){
  if(!sun||!visible(sun,320))return;
  const p=worldToScreen(sun.x,sun.y),T=performance.now()*.001;
  ctx.save();ctx.translate(p.x,p.y);
  ctx.setLineDash([10,10]);ctx.lineWidth=2;ctx.strokeStyle='rgba(255,214,78,.34)';ctx.beginPath();ctx.arc(0,0,sun.harvestOuter,0,TAU);ctx.stroke();
  ctx.setLineDash([6,8]);ctx.strokeStyle='rgba(255,79,61,.48)';ctx.beginPath();ctx.arc(0,0,sun.burnOuter,0,TAU);ctx.stroke();ctx.setLineDash([]);
  const corona=ctx.createRadialGradient(0,0,sun.r*.30,0,0,sun.harvestOuter*.95);
  corona.addColorStop(0,'rgba(255,255,225,1)');corona.addColorStop(.11,'rgba(255,231,117,.98)');corona.addColorStop(.25,'rgba(255,154,48,.68)');corona.addColorStop(.48,'rgba(255,92,35,.22)');corona.addColorStop(1,'rgba(255,96,30,0)');
  ctx.fillStyle=corona;ctx.beginPath();ctx.arc(0,0,sun.harvestOuter*.95,0,TAU);ctx.fill();
  const g=ctx.createRadialGradient(-sun.r*.24,-sun.r*.26,sun.r*.05,0,0,sun.r);
  g.addColorStop(0,'#fffbd6');g.addColorStop(.25,'#ffe268');g.addColorStop(.65,'#ff9d27');g.addColorStop(1,'#df4b12');
  ctx.shadowColor='#ff9c2b';ctx.shadowBlur=42;ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,sun.r,0,TAU);ctx.fill();ctx.shadowBlur=0;
  for(let i=0;i<14;i++){
    const a=i/14*TAU+T*.035,rr=sun.r*(.28+.55*((i*37)%11)/10);
    ctx.fillStyle=i%2?'rgba(255,244,170,.24)':'rgba(164,54,10,.13)';
    ctx.beginPath();ctx.arc(Math.cos(a)*rr*.62,Math.sin(a)*rr*.62,sun.r*(.035+(i%4)*.014),0,TAU);ctx.fill();
  }
  ctx.strokeStyle='rgba(255,177,63,.50)';ctx.lineWidth=3;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,sun.r*(1.13+i*.14),T*.12+i*1.7,T*.12+i*1.7+1.0);ctx.stroke();}
  ctx.restore();
}

function drawRock(r){
  if(!visible(r,50))return;const p=worldToScreen(r.x,r.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(r.rot);
  ctx.fillStyle='#666b79';ctx.strokeStyle='#969eae';ctx.lineWidth=1;
  ctx.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU,rr=r.r*(.75+Math.sin(i*2.3+r.x)*.16);i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}
  ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}

function drawDebris(d){
  if(!visible(d,50))return;const p=worldToScreen(d.x,d.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.rot);
  ctx.fillStyle='#aeb8c9';ctx.fillRect(-d.r,-d.r*.28,d.r*2,d.r*.56);
  ctx.fillStyle='#4f73a0';ctx.fillRect(-d.r*.22,-d.r*.9,d.r*.44,d.r*1.8);
  ctx.fillStyle='#bd5673';ctx.fillRect(d.r*.55,-d.r*.65,d.r*.45,d.r*1.3);ctx.restore();
}

function drawHole(h){
  if(!visible(h,150))return;const p=worldToScreen(h.x,h.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(performance.now()*.00012+h.phase);
  const g=ctx.createRadialGradient(0,0,h.r*.18,0,0,h.r*3);
  g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.3,'rgba(0,0,0,.98)');g.addColorStop(.43,'rgba(149,79,255,.78)');g.addColorStop(.56,'rgba(255,94,183,.28)');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,h.r*3,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,190,255,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,h.r*2.05,h.r*.52,.25,0,TAU);ctx.stroke();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,h.r*.78,0,TAU);ctx.fill();ctx.restore();
}

function drawSnakeBody(points,color,r,alpha=1){
  for(let i=points.length-1;i>=0;i--){
    const q=points[i],p=worldToScreen(q.x,q.y);
    if(p.x<-30||p.x>innerWidth+30||p.y<-30||p.y>innerHeight+30)continue;
    const u=1-i/points.length,rr=r*(.55+.48*u);
    ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=i<18?10:4;
    ctx.beginPath();ctx.arc(p.x,p.y,rr,0,TAU);ctx.fill();
  }ctx.globalAlpha=1;ctx.shadowBlur=0;
}

function drawPlayer(){
  if(!snake)return;
  const hue=190+game.stage*18;
  for(let i=snake.points.length-1;i>=0;i--){
    const q=snake.points[i],p=worldToScreen(q.x,q.y);if(p.x<-30||p.x>innerWidth+30||p.y<-30||p.y>innerHeight+30)continue;
    const u=1-i/snake.points.length,rr=snake.r*(.55+.48*u);
    ctx.fillStyle=`hsla(${hue+u*80},90%,${58+u*10}%,${snake.invuln>0?.55:.95})`;
    ctx.shadowColor=`hsla(${hue+40},90%,65%,.45)`;ctx.shadowBlur=i<22?12:4;
    ctx.beginPath();ctx.arc(p.x,p.y,rr,0,TAU);ctx.fill();
  }ctx.shadowBlur=0;
  const h=worldToScreen(snake.x,snake.y);ctx.save();ctx.translate(h.x,h.y);ctx.rotate(snake.angle);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(4,-3,1.4,0,TAU);ctx.arc(4,3,1.4,0,TAU);ctx.fill();ctx.restore();
}

function drawParticles(){
  for(const p of particles){if(!visible(p,40))continue;const s=worldToScreen(p.x,p.y);ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,p.r,0,TAU);ctx.fill()}
  ctx.globalAlpha=1;
}
