// DailyLift Studio published-content bridge. Daily workouts and NAS video remain independent.
(async()=>{try{
 const endpoint='https://dailylift-studio-independent.vercel.app/api/public/daily';
 const response=await fetch(endpoint,{cache:'no-store'});
 if(!response.ok)return;
 const result=await response.json();
 if(!result?.ready||!result.content)return;
 const c=result.content,t=c.theme;
 const hex=x=>typeof x==='string'&&/^#[0-9a-fA-F]{6}$/.test(x);
 if(!t||!['accent','background','card','text'].every(k=>hex(t[k]))||!Number.isInteger(t.radius)||t.radius<8||t.radius>28)return;
 for(const [selector,value,max] of [['.hero h1',c.headline,150],['.hero .sub',c.subtitle,500],['.hero .pill',c.eyebrow,90]]){
   const node=document.querySelector(selector);if(node&&typeof value==='string')node.textContent=value.slice(0,max);
 }
 const style=document.createElement('style');style.textContent=`:root{--bg:${t.background};--card:${t.card};--text:${t.text};--radius:${t.radius}px;--studio-accent:${t.accent}}.hero .pill,.daily-eyebrow,.daily-reference,.daily-progress,.daily-video,.spotlight-verse{color:var(--studio-accent)}.daily-verse{border-left-color:var(--studio-accent)}.daily-tiktok-profile{border-color:var(--studio-accent)}.daily-exercise input{accent-color:var(--studio-accent)}`;
 document.head.append(style);
}catch{/* Site remains usable if Studio is temporarily unavailable. */}})();