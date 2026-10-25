// Pure verse-selection logic (no DOM) so it can be tested.
export const RECENT_MAX=20;
export const eligible=all=>{const v=all.filter(x=>x.status==='verified');return v.length?v:all};
export function pickVerse(pool,recent=[],rng=Math.random){
 if(!pool.length)return null;
 const keep=Math.min(recent.length,RECENT_MAX,pool.length-1); // never exclude everything
 const avoid=new Set(recent.slice(recent.length-keep));
 let c=pool.filter(v=>!avoid.has(v.id));if(!c.length)c=pool;
 return c[Math.min(c.length-1,Math.floor(rng()*c.length))]}
export const remember=(recent,id,max=RECENT_MAX)=>[...recent.filter(x=>x!==id),id].slice(-max);
