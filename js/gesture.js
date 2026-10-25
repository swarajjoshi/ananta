// Pure logic: no DOM, no camera. Landmarks are MediaPipe's 21 normalized points.
export const CFG={on:.32,off:.5,confirm:2,release:2,minConf:.5,lostMs:400,minGap:120,circleOn:.32,circleIdxMin:.5,circleExt:1.05,circleExtMin:2,circleFrames:3,circleMs:2000};
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const pinchRatio=l=>d(l[4],l[8])/(d(l[0],l[9])||1e-6); // thumb-index gap / hand size
export const S={WAIT:'WAITING_FOR_HAND',READY:'READY_FOR_PINCH',CAND:'PINCH_CANDIDATE',HELD:'WAITING_FOR_RELEASE',PAUSED:'PAUSED',DONE:'SESSION_FINISHED'};
export class PinchCounter{
 constructor(c={}){this.cfg={...CFG,...c};this.count=0;this.state=S.WAIT;this.paused=false;this.done=false;this.n=0;this.lost=null;this.last=-1e9}
 update(l,t,score=1){
  if(this.done||this.paused)return null;
  const c=this.cfg;
  if(!l||l.length<21||score<c.minConf){ // missing/low confidence never counts
   this.lost??=t; if(t-this.lost>c.lostMs){this.state=S.WAIT;this.n=0}
   return null}
  this.lost=null;
  const r=pinchRatio(l);
  switch(this.state){
   case S.WAIT: if(r>c.off)this.state=S.READY;break; // must see open fingers first: no phantom on recovery
   case S.READY: if(r<c.on){this.state=S.CAND;this.n=1}break;
   case S.CAND:
    if(r<c.on){this.n++;if(this.n>=c.confirm&&t-this.last>=c.minGap){this.count++;this.last=t;this.state=S.HELD;this.n=0;return 'count'}}
    else this.state=S.READY;break;
   case S.HELD: if(r>c.off){if(++this.n>=c.release){this.state=S.READY;this.n=0}}else this.n=0;
  }
  return null}
 pause(){if(this.done)return;this.paused=true;this.state=S.PAUSED}
 resume(){if(this.done)return;this.paused=false;this.state=S.WAIT;this.lost=null;this.n=0}
 undo(){if(!this.done&&this.count>0)this.count--;return this.count}
 manual(){if(this.done)return this.count;return++this.count}
 reset(){if(!this.done){this.count=0;this.state=S.WAIT;this.n=0}}
 finish(){this.done=true;this.state=S.DONE;return this.count}
}
// Sacred Circle: thumb tip touches MIDDLE fingertip, index finger apart, other fingers mostly extended; hold 2 s.
export class CircleDetector{
 constructor(c={}){this.cfg={...CFG,...c};this.frames=0;this.start=null;this.lastT=null;this.fired=false}
 static valid(l,c=CFG){
  if(!l||l.length<21)return false;
  const s=d(l[0],l[9])||1e-6;
  if(d(l[4],l[12])/s>=c.circleOn)return false;    // thumb touches middle fingertip
  if(d(l[4],l[8])/s<=c.circleIdxMin)return false; // index apart => it is NOT a counting pinch
  const ext=(t,p)=>d(l[0],l[t])>d(l[0],l[p])*c.circleExt;
  return[[8,6],[16,14],[20,18]].filter(([t,p])=>ext(t,p)).length>=c.circleExtMin}
 update(l,t,score=1){
  if(this.fired)return{progress:1,done:false};
  if(this.lastT!=null&&t-this.lastT>500){this.frames=0;this.start=null} // gaps never accumulate
  this.lastT=t;
  if(score<this.cfg.minConf||!CircleDetector.valid(l,this.cfg)){this.frames=0;this.start=null;return{progress:0,done:false}}
  if(++this.frames<this.cfg.circleFrames)return{progress:0,done:false}; // must be stable over several frames
  this.start??=t;
  const p=Math.min(1,(t-this.start)/this.cfg.circleMs);
  if(p>=1){this.fired=true;return{progress:1,done:true}}
  return{progress:p,done:false}}
}
