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
 const extra=c.extras||{};
 if(extra&&typeof extra==='object'){
  const hero=document.querySelector('.hero');
  if(hero){
   hero.querySelectorAll('[data-studio-element]').forEach(n=>n.remove());
   if(['centered','split'].includes(extra.layout)){
     const style=document.createElement('style');
     style.dataset.studioElement='layout';
     style.textContent=extra.layout==='centered'?'.hero{text-align:center}.hero .sub{margin-left:auto;margin-right:auto}':'.hero{border-left:5px solid var(--studio-accent);padding-left:24px}';
     document.head.append(style);
   }
   if(typeof extra.announcement==='string'&&extra.announcement.trim()){
     const notice=document.createElement('p');notice.dataset.studioElement='announcement';notice.textContent='📢 '+extra.announcement.slice(0,180);notice.style.cssText='margin:12px 0;font-weight:700;color:var(--studio-accent)';hero.prepend(notice);
   }
   if(typeof extra.heroImage==='string'&&((/^data:image\/(?:jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(extra.heroImage)&&extra.heroImage.length<160000)||(()=>{try{const u=new URL(extra.heroImage);return u.protocol==='https:'&&!u.search&&!u.hash&&['dailylift-by-dj.vercel.app','dj-personal-training.vercel.app'].includes(u.hostname)&&/\.(?:jpe?g|png|webp)$/i.test(u.pathname)}catch{return false}})())){
     const img=document.createElement('img');img.dataset.studioElement='image';img.alt='DailyLift homepage photo';img.src=extra.heroImage;img.style.cssText='display:block;max-height:340px;max-width:100%;width:auto;object-fit:cover;border-radius:var(--radius);margin:14px 0';hero.append(img);
   }
   if(typeof extra.buttonLabel==='string'&&extra.buttonLabel&&typeof extra.buttonUrl==='string'&&(extra.buttonUrl.startsWith('/')&&!extra.buttonUrl.startsWith('//')||/^https:\/\//.test(extra.buttonUrl))){
     const link=document.createElement('a');link.dataset.studioElement='button';link.textContent=extra.buttonLabel.slice(0,60);link.href=extra.buttonUrl;link.rel='noopener noreferrer';link.style.cssText='display:inline-block;margin:12px 0;padding:10px 16px;border-radius:10px;background:var(--studio-accent);color:var(--bg);font-weight:700';hero.append(link);
   }
   if((typeof extra.sectionTitle==='string'&&extra.sectionTitle)||(typeof extra.sectionText==='string'&&extra.sectionText)){
     const block=document.createElement('section');block.dataset.studioElement='section';block.className='card';block.setAttribute('aria-label','DailyLift introduction');
     if(extra.sectionTitle){const h=document.createElement('h2');h.textContent=extra.sectionTitle.slice(0,120);block.append(h)}
     if(extra.sectionText){const p=document.createElement('p');p.textContent=extra.sectionText.slice(0,500);block.append(p)}
     hero.after(block);
   }
  }
 }
 // Section editor rearranges existing DOM nodes only; verse/workout scripts are untouched.
 const order=extra.sectionOrder;
 const allowed=['intro','workout','verse'];
 if(Array.isArray(order)&&order.length===allowed.length&&new Set(order).size===allowed.length&&allowed.every(x=>order.includes(x))){
  const main=document.querySelector('main.wrap'),footerNote=main?.querySelector('section.small.note');
  const elements={intro:main?.querySelector('[data-studio-element="section"]'),workout:main?.querySelector('.daily-card'),verse:main?.querySelector('section.card:not(.daily-card):not([data-studio-element])')};
  if(main)for(const id of order){const node=elements[id];if(node&&node.parentElement===main)main.insertBefore(node,footerNote||null)}
 }


}catch{/* Site remains usable if Studio is temporarily unavailable. */}})();
/* Anonymous homepage analytics: no cookies, identifiers or health information. */
(()=>{try{const key='dailylift-studio-homeview-v1';if(sessionStorage.getItem(key))return;fetch('https://dailylift-studio-independent.vercel.app/api/public/pageview',{method:'POST',mode:'cors',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({site:'daily',page:'/'})}).then(r=>{if(r.ok)sessionStorage.setItem(key,'1')}).catch(()=>{})}catch{}})();
