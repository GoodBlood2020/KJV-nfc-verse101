import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../cloudflare/preview-worker.js',import.meta.url),'utf8');

function appWithFetch(fakeFetch=async()=>({ok:false,status:503})) {
  let listener;
  vm.runInNewContext(source,{
    addEventListener:(type,fn)=>{ assert.equal(type,'fetch'); listener=fn; },
    URL, Date, Intl, Math, Response, Request, AbortSignal, fetch:fakeFetch
  },{timeout:2000});
  assert.equal(typeof listener,'function');
  return async(path,method='GET')=>{
    let response;
    listener({request:new Request('https://preview.example'+path,{method}),respondWith(value){response=Promise.resolve(value);}});
    return response;
  };
}
test('health distinguishes staging from production and no NAS/R2 dependency',async()=>{
  const r=await appWithFetch()('/health');
  assert.equal(r.status,200);
  const d=await r.json();
  assert.equal(d.status,'preview');
  assert.equal(d.r2,false);
  assert.equal(d.video_migrated,false);
  assert.equal(d.vercel_dependency,'temporary_video_only');
});
test('homepage and static assets are served without Vercel API',async()=>{
  const request=appWithFetch();
  const html=await request('/');
  assert.equal(html.status,200);
  assert.match(await html.text(),/DailyLift by DJ/);
  assert.match(html.headers.get('x-robots-tag'),/noindex/);
  assert.equal((await request('/styles.css')).status,200);
  assert.equal((await request('/app.js')).status,200);
  const video=await request('/media/daily-lift-latest.mp4');
  assert.equal(video.status,307);
  assert.equal(video.headers.get('location'),'https://dailylift-by-dj.vercel.app/media/daily-lift-latest.mp4');
});
test('daily API retains a Chicago date and curated KJV workout',async()=>{
  const r=await appWithFetch()('/api/daily');
  const d=await r.json();
  assert.equal(d.timeZone,'America/Chicago');
  assert.equal(d.verse.translation,'KJV');
  assert(Array.isArray(d.workout.exercises));
  assert(d.workout.exercises.length>0);
});
test('random KJV API falls back locally when third party unavailable',async()=>{
  const r=await appWithFetch(async()=>{throw Error('Offline for test')})('/api/verse');
  assert.equal(r.status,200);
  const d=await r.json();
  assert.equal(d.translation,'KJV');
  assert.equal(d.source,'curated-kjv-fallback');
  assert(d.reference&&d.text);
});
test('only GET and HEAD requests are accepted',async()=>{
  const r=await appWithFetch()('/api/daily','POST');
  assert.equal(r.status,405);
  assert.equal(r.headers.get('allow'),'GET, HEAD');
});

test('video metadata bridge only provides verified manifest fields, never MP4 bytes', async()=>{
  const calls=[];
  const request=appWithFetch(async url=>{
    calls.push(url);
    assert.equal(url,'https://dailylift-by-dj.vercel.app/media/latest.json');
    return Response.json({date:'2026-11-02',slug:'barbell-bench-press',title:'Barbell Bench Press',sha256:'0'.repeat(64)});
  });
  const r=await request('/media/latest.json');
  assert.equal(r.status,200);
  assert.equal((await r.json()).slug,'barbell-bench-press');
  assert.equal(calls.length,1);
  const video=await request('/media/daily-lift-latest.mp4?v='+ 'a'.repeat(64));
  assert.equal(video.status,307);
  assert.equal(video.headers.get('location'),'https://dailylift-by-dj.vercel.app/media/daily-lift-latest.mp4?v='+'a'.repeat(64));
});
test('temporary video metadata bridge fails closed when Vercel cannot be reached', async()=>{
  const request=appWithFetch(async()=>{throw Error('offline')});
  const r=await request('/media/latest.json');
  assert.equal(r.status,503);
});
