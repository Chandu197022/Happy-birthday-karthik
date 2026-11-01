import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const W=471,H=570,GROUND=22;
function App(){
 const canvasRef=useRef(null), gameRef=useRef(null), raf=useRef(0), audioRef=useRef(null), musicRef=useRef(null);
 const [screen,setScreen]=useState('ready'),[score,setScore]=useState(0),[best,setBest]=useState(()=>Number(localStorage.getItem('cc-best')||0)),[sound,setSound]=useState(true),[hero,setHero]=useState(0),[level,setLevel]=useState(1);
 const assets=useRef({bg:new Image(),bird:new Image(),hero:new Image()});
 useEffect(()=>{assets.current.bg.src='/assets/gameplay-reference.png';assets.current.bird.src='/assets/character-source.jpg';assets.current.hero.src='/assets/game-hero.jpg';},[]);
 const init=()=>{gameRef.current={bird:{x:100,y:190,vy:0},pipes:[],frame:0,score:0,over:false,level:1,started:false};setScore(0);setLevel(1);setScreen('ready');};
 useEffect(()=>{init();},[]);
 const ensureAudio=()=>{if(!audioRef.current)audioRef.current=new (window.AudioContext||window.webkitAudioContext)();if(audioRef.current.state==='suspended')audioRef.current.resume();return audioRef.current};
 const tone=(freq,duration,type='sine',gain=.04,delay=0)=>{if(!sound)return;try{const a=ensureAudio(),o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,a.currentTime+delay);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+delay+duration);o.connect(g);g.connect(a.destination);o.start(a.currentTime+delay);o.stop(a.currentTime+delay+duration)}catch{}};
 const startMusic=()=>{if(!sound||musicRef.current)return;try{ensureAudio();let step=0;const melody=[392,494,587,494,440,523,659,523,392,494,587,784,659,587,494,440];const bass=[196,147,165,220];musicRef.current=setInterval(()=>{const g=gameRef.current;if(!g?.started||g?.over)return;const n=step%melody.length;tone(melody[n],.32,'triangle',.018);if(step%4===0)tone(bass[(step/4)%bass.length],.52,'sine',.022);step++},320)}catch{}};
 const stopMusic=()=>{if(musicRef.current){clearInterval(musicRef.current);musicRef.current=null}};
 useEffect(()=>{if(sound&&gameRef.current?.started&&!gameRef.current?.over)startMusic();else if(!sound)stopMusic();return()=>{}},[sound]);
 const lose=()=>{const g=gameRef.current;if(!g||g.over)return;g.over=true;setScreen('over');stopMusic();tone(260,.22,'sawtooth',.07);tone(190,.35,'sawtooth',.06,.18);};
 const flap=()=>{const g=gameRef.current;if(!g)return;if(g.over){init();return}if(!g.started){g.started=true;setScreen('playing');startMusic()}g.bird.vy=-5.3;tone(640,.07,'square',.025)};
 useEffect(()=>{const key=e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();flap()}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[sound]);
 useEffect(()=>{const canvas=canvasRef.current,ctx=canvas.getContext('2d');let last=0;
 const draw=()=>{const g=gameRef.current;if(!g)return;ctx.clearRect(0,0,W,H);
 // sunset sky and scenic town backdrop
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#07558a');sky.addColorStop(.48,'#f08b68');sky.addColorStop(1,'#ffcf88');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // clouds
 for(let i=0;i<7;i++){let x=(i*91+30)%W,y=35+(i%3)*48;ctx.fillStyle='rgba(255,190,150,.32)';ctx.beginPath();ctx.ellipse(x,y,38,10,0,0,Math.PI*2);ctx.ellipse(x+20,y-7,24,13,0,0,Math.PI*2);ctx.fill()}
 // skyline and palms
 ctx.fillStyle='#173c4b';ctx.fillRect(0,355,W,120);for(let i=0;i<8;i++){let x=i*68-15;ctx.fillStyle=i%2?'#244c54':'#1b414e';ctx.fillRect(x,300+(i%3)*25,55,160);ctx.fillStyle='#ffbd75';for(let j=0;j<3;j++)ctx.fillRect(x+9+j*14,320+(i%3)*25,5,12)}
 // lit building on left
 ctx.fillStyle='#9c4e2d';ctx.fillRect(0,125,105,340);ctx.fillStyle='#f8b66b';ctx.fillRect(12,145,80,280);ctx.fillStyle='#753d2c';ctx.fillRect(20,180,18,35);ctx.fillRect(58,180,18,35);ctx.fillRect(20,240,18,35);ctx.fillRect(58,240,18,35);ctx.fillStyle='#ffcf85';ctx.fillRect(0,410,125,10);
 // ground
 ctx.fillStyle='#2a4546';ctx.fillRect(0,H-GROUND,W,GROUND);ctx.fillStyle='#ffbb69';ctx.fillRect(0,H-GROUND,W,3);
 // pipes / ornate golden pillars, one hanging and one rising per pair
 g.pipes.forEach(p=>{drawPole(ctx,p.x,0,42,p.top,true);drawPole(ctx,p.x,p.top+p.gap,42,H-GROUND-(p.top+p.gap),false)});
 // bird crop from supplied composite: crop toward the man in the middle
 const bird=assets.current.bird;if(bird.complete&&bird.naturalWidth){ctx.save();ctx.translate(g.bird.x,g.bird.y);ctx.rotate(Math.max(-.35,Math.min(.6,g.bird.vy*.07)));ctx.beginPath();ctx.ellipse(0,0,25,28,0,0,Math.PI*2);ctx.clip();ctx.drawImage(bird,245,235,500,650,-31,-34,62,68);ctx.restore()}else{ctx.fillStyle='#f9c46c';ctx.beginPath();ctx.arc(g.bird.x,g.bird.y,22,0,Math.PI*2);ctx.fill()}
 if(g.started&&!g.over){g.frame++;g.bird.vy=Math.min(7,g.bird.vy+.27);g.bird.y+=g.bird.vy;if(g.frame%92===1){let top=65+Math.random()*220;g.pipes.push({x:W+10,top,gap:170,passed:false})}g.pipes.forEach(p=>{p.x-=2.5+(g.score*.025);if(!p.passed&&p.x+42<g.bird.x){p.passed=true;g.score++;setScore(g.score);if(g.score>best){setBest(g.score);localStorage.setItem('cc-best',g.score)}let lv=1+Math.floor(g.score/10);if(lv!==g.level){g.level=lv;setLevel(lv);tone(800,.12,'triangle')}}});g.pipes=g.pipes.filter(p=>p.x>-50);
 if(g.bird.y>H-GROUND-24||g.bird.y<10)lose();g.pipes.forEach(p=>{if(circleRect(g.bird.x,g.bird.y,19,p.x,0,42,p.top)||circleRect(g.bird.x,g.bird.y,19,p.x,p.top+p.gap,42,H-GROUND-p.top-p.gap))lose()})}
 // HUD
 ctx.fillStyle='white';ctx.font='bold 16px system-ui';ctx.shadowColor='#14283a';ctx.shadowBlur=4;ctx.fillText('Level '+level,18,30);ctx.font='bold 48px system-ui';ctx.textAlign='center';ctx.fillText(score,W/2,78);ctx.textAlign='left';ctx.shadowBlur=0;
 if(screen==='ready'){ctx.fillStyle='#0c2038aa';ctx.fillRect(30,215,W-60,110);ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 25px system-ui';ctx.fillText('Ready?',W/2,260);ctx.font='16px system-ui';ctx.fillText('Tap or press Space to flap',W/2,292);ctx.textAlign='left'}
 raf.current=requestAnimationFrame(draw)};
 const drawPole=(c,x,y,w,h,top)=>{if(h<=0)return;c.save();c.shadowColor='#ffb34c';c.shadowBlur=8;c.fillStyle='#5b260e';c.fillRect(x,y,w,h);c.shadowBlur=0;const gr=c.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,'#5b230b');gr.addColorStop(.25,'#ffcc5a');gr.addColorStop(.5,'#8b3b0d');gr.addColorStop(.8,'#ffc45c');gr.addColorStop(1,'#4b1c0b');c.fillStyle=gr;c.fillRect(x+5,y,w-10,h);c.fillStyle='#ffdb77';for(let yy=y+8;yy<y+h;yy+=28){c.fillRect(x+10,yy,w-20,3);c.fillRect(x+17,yy+5,8,4)}c.fillStyle='#32160d';c.fillRect(x,y,w,5);c.fillRect(x,y+h-5,w,5);c.restore()};
 const circleRect=(cx,cy,r,x,y,w,h)=>{let px=Math.max(x,Math.min(cx,x+w)),py=Math.max(y,Math.min(cy,y+h));return (cx-px)**2+(cy-py)**2<r*r};
 draw();return()=>cancelAnimationFrame(raf.current)
 },[screen,sound,level,score,best]);
 return <main className="page"><section className="game-shell"><header><span className="brand">CAMPUS <b>CRUSH</b></span><button className="sound" onClick={()=>{setSound(v=>{const next=!v;if(!next)stopMusic();else if(gameRef.current?.started&&!gameRef.current?.over)setTimeout(startMusic,0);return next})}}>♫ {sound?'Sound On':'Sound Off'}</button></header><div className="stage"><canvas ref={canvasRef} width={W} height={H} onPointerDown={flap}/>{screen==='over'&&<div className="overlay"><div className="modal"><h1>Scene cut!</h1><h3>చిన్న బ్రేక్. మరి ఫ్లై!</h3><p>You reached the ground.</p><div className="hero-box"><img src="/assets/game-hero.jpg" alt="Hero"/></div><div className="stats"><div>Score<strong>{score}</strong></div><div>Best<strong>{best}</strong></div></div><button className="play" onClick={()=>{init();requestAnimationFrame(()=>flap())}}>Play again</button><button className="switch" onClick={()=>{setHero(h=>1-h);}}>Switch hero</button></div></div>}</div><footer><span>Tap / Click / Space</span><span>Level {level}</span></footer></section></main>
}
createRoot(document.getElementById('root')).render(<App/>);
