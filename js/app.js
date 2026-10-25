import {VERSES} from './verses.js';
import {PinchCounter,CircleDetector,S} from './gesture.js';
import {pickVerse as choose,remember,eligible} from './verse-select.js';
const VER='0.10.14',BASE=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}`;
const MODEL='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const $=s=>document.querySelector(s),say=t=>{$('#live').textContent='';setTimeout(()=>$('#live').textContent=t,50)};
const store={get(k,s){try{return(s?sessionStorage:localStorage).getItem(k)}catch{return null}},set(k,v,s){try{(s?sessionStorage:localStorage).setItem(k,v)}catch{}}};
let verse,sess=null,stream=null,landmarker=null,raf=0,running=false;

function pickVerse(){
 const pool=eligible(VERSES);
 let v=pool.find(x=>x.id===store.get('ananta.cur',true));
 if(!v){let recent=[];try{recent=JSON.parse(store.get('ananta.recent')||'[]')}catch{}
  v=choose(pool,recent);store.set('ananta.cur',v.id,true);store.set('ananta.recent',JSON.stringify(remember(recent,v.id)))}
 return v}
const paintVerse=(v,el,ref)=>{$(el).innerHTML=v.lines.map(l=>`<span>${l}</span>`).join('<br>');$(ref).textContent=`Bhagavad Gita · Chapter ${v.chapter}, Verse ${v.verse}`};

function petals(on){const p=$('#petals');p.innerHTML='';if(!on||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 const n=(innerWidth<600||(navigator.hardwareConcurrency||4)<4)?7:13;
 for(let i=0;i<n;i++){const e=document.createElement('i');const r=Math.random;
  e.style.cssText=`--x:${r()*100}%;--s:${10+r()*12}px;--d:${14+r()*12}s;--dl:${-r()*20}s;--o:${.35+r()*.4};--sw:${(r()-.5)*160}px`;p.append(e)}}
function show(id){for(const s of document.querySelectorAll('.screen'))s.hidden=s.id!==id;petals(id==='welcome');scrollTo(0,0)}

$('#begin').onclick=()=>{$('#prep-msg').textContent='';show('prep');$('#enable').focus()};
$('#prep-back').onclick=()=>show('welcome');
$('#enable').onclick=()=>startSession(true);
$('#manual-start').onclick=()=>startSession(false);

function newSession(){return{verse:{...verse},pc:new PinchCounter(),pr:new CircleDetector(),target:0,finished:false}}
async function startSession(useCam){
 sess=newSession();render();show('session');$('#pause').textContent='Pause';
 $('#cam').hidden=!useCam;$('#plus').hidden=useCam;$('#pray').hidden=!useCam;
 if(!useCam){$('#status').textContent='Manual counting. Tap “Count +1” for each repetition.';return}
 const mine=sess;
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw{name:'Unsupported'};
  $('#status').textContent='Starting camera…';
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
 }catch(e){return camFail(e)}
 if(mine!==sess||sess.finished){stopCam();return}
 const v=$('#video');v.srcObject=stream;try{await v.play()}catch{}
 try{$('#status').textContent='Loading hand tracking…';landmarker??=await loadModel()}
 catch(e){console.error(e);$('#status').textContent='Hand tracking couldn’t start (network or browser issue). You can retry later or continue with manual counting.';$('#plus').hidden=false;stopCam();$('#cam').hidden=true;return}
 if(mine!==sess||sess.finished)return;
 running=true;$('#status').textContent='Looking for your hand…';raf=requestAnimationFrame(tick)}
async function loadModel(){
 const {HandLandmarker,FilesetResolver}=await import(`${BASE}/vision_bundle.mjs`);
 const fs=await FilesetResolver.forVisionTasks(`${BASE}/wasm`);
 const mk=delegate=>HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MODEL,delegate},runningMode:'VIDEO',numHands:2});
 try{return await mk('GPU')}catch{return await mk('CPU')}}
function camFail(e){stopCam();const m={NotAllowedError:'Camera permission was denied. Allow camera access in your browser’s site settings, then try again.',NotFoundError:'No camera was found on this device.',NotReadableError:'Your camera is unavailable. Close other apps using it and try again.',Unsupported:'This browser can’t access a camera (HTTPS is required).'}[e.name]||'The camera couldn’t start.';
 show('prep');$('#prep-msg').textContent=m}
function stopCam(){running=false;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;const v=$('#video');v.srcObject=null}

let lastT=0,lastVT=-1;
function tick(){
 if(!running)return;raf=requestAnimationFrame(tick);
 const v=$('#video'),now=performance.now();
 if(now-lastT<33||v.readyState<2||v.currentTime===lastVT)return;
 lastT=now;lastVT=v.currentTime;
 let res;try{res=landmarker.detectForVideo(v,now)}catch(e){console.error(e);return}
 const hands=res.landmarks||[],score=res.handedness?.[0]?.[0]?.score??1;
 const p=sess.pr.update(hands[0]||null,now,score);
 $('#pray').value=p.progress;
 if(p.done)return finish('circle');
 const c=sess.pc;
 const r=c.update(p.progress>0?null:hands[0]||null,now,score);
 if(r==='count')counted();
 const st={[S.WAIT]:hands.length?'Open your fingers slightly to begin…':'Looking for your hand…',[S.READY]:'Ready — touch thumb and index fingertip',[S.CAND]:'Ready',[S.HELD]:'Release to count again',[S.PAUSED]:'Paused'}[c.state];
 const t=p.progress>0?`Hold the Sacred Circle… ${(2*(1-p.progress)).toFixed(1)}s`:st;if($('#status').textContent!==t)$('#status').textContent=t}
function counted(){render();const e=$('#count');e.classList.remove('pulse');void e.offsetWidth;e.classList.add('pulse');
 if(sess.target&&sess.pc.count===sess.target)say(`Target of ${sess.target} reached. You may continue.`)}
function render(){const c=sess.pc.count;$('#count').textContent=c;
 $('#target-line').textContent=sess.target?(c>=sess.target?`Target of ${sess.target} reached 🌸`:`${c} of ${sess.target}`):''}

$('#pause').onclick=()=>{const c=sess.pc;if(c.paused){c.resume();$('#pause').textContent='Pause';say('Resumed')}else{c.pause();$('#pause').textContent='Resume';$('#status').textContent='Paused';say('Paused')}};
$('#undo').onclick=()=>{sess.pc.undo();render()};
$('#plus').onclick=()=>{if(!sess.pc.paused){sess.pc.manual();counted()}};
$('#reset').onclick=()=>{if(confirm('Reset this session’s count to zero?')){sess.pc.reset();render()}};
$('#target').onchange=e=>{const v=e.target.value;$('#custom').hidden=v!=='c';sess.target=v==='c'?0:+v;render();if(v==='c')$('#custom').focus()};
$('#custom').oninput=e=>{const n=Math.floor(+e.target.value);sess.target=n>0?n:0;render()};
$('#finish').onclick=()=>finish('button');
document.addEventListener('visibilitychange',()=>{if(document.hidden&&sess&&!sess.finished&&!sess.pc.paused&&running){sess.pc.pause();$('#pause').textContent='Resume';$('#status').textContent='Paused while the tab was hidden'}});

function finish(reason){
 if(!sess||sess.finished)return;sess.finished=true;
 const n=sess.pc.finish();stopCam();
 const s=sess;
 $('#d-count').textContent=n;$('#d-target').textContent=s.target?`${n} of ${s.target}${n>=s.target?' · target reached':''}`:'';
 paintVerse(s.verse,'#d-verse','#d-ref');
const speakers = {
  Arjuna: 'अर्जुन कहते हैं —',
  Krishna: 'श्रीकृष्ण कहते हैं —',
  Sanjaya: 'संजय कहते हैं —',
  Dhritarashtra: 'धृतराष्ट्र कहते हैं —',
  Duryodhana: 'दुर्योधन कहते हैं —'
};
$('#d-speaker').textContent = speakers[s.verse.speaker] || '';
$('#d-hi').textContent = s.verse.hindi;
 show('done');say(`Session complete. Your count is ${n}.`);$('#d-count').scrollIntoView({block:'center'})}
$('#again').onclick=()=>{sess=null;$('#prep-msg').textContent='';show('prep')};
$('#home').onclick=()=>{sess=null;sessionStorage.removeItem('ananta.cur');verse=pickVerse();paintVerse(verse,'#w-verse','#w-ref');show('welcome')};
$('#share').onclick=async()=>{const n=$('#d-count').textContent,t=`I completed ${n} Naam Jap on ANANTA 🪷 — Bhagavad Gita ${sess?.verse.chapter??''}.${sess?.verse.verse??''}`;
 try{if(navigator.share)await navigator.share({title:'ANANTA',text:t,url:location.href});else{await navigator.clipboard.writeText(`${t} ${location.href}`);say('Copied to clipboard')}}catch{}};

verse=pickVerse();paintVerse(verse,'#w-verse','#w-ref');petals(true);
