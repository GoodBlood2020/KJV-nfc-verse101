import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
try {
  const direct=await browser.newPage();
  await direct.setContent('<video id="raw" muted playsinline preload="metadata" src="https://raw.githubusercontent.com/GoodBlood2020/KJV-nfc-verse101/main/media/daily-lift-latest.mp4"></video>');
  try{
    await direct.waitForFunction(()=>document.querySelector('#raw')?.videoWidth>0,null,{timeout:20000});
    const result=await direct.locator('#raw').evaluate(async v=>{v.muted=true;await v.play();return {width:v.videoWidth,height:v.videoHeight,readyState:v.readyState}});
    console.log('GITHUB_DIRECT_PLAYBACK_PASS',JSON.stringify(result));
  }catch(e){console.log('GITHUB_DIRECT_PLAYBACK_FAIL',e.message.slice(0,180));}
  await direct.close();
  const page=await browser.newPage();
  // CI must not inflate real visitor counters.
  await page.route('**/api/pageview',route=>route.fulfill({status:204,body:''}));
  const response=await page.goto('https://daily.dailyliftbydj-nas.workers.dev/',{waitUntil:'domcontentloaded'});
  if (response?.status()!==200) throw Error('Homepage unavailable');
  const liveCode=await page.evaluate(async()=>await (await fetch('/app.js',{cache:'no-store'})).text());
  const slash=String.fromCharCode(92);
  if(!liveCode.includes('/^'+slash+'d{4}-'+slash+'d{2}-'+slash+'d{2}$/'))throw Error('Live Cloudflare still has invalid date matcher');
  console.log('LIVE_DATE_MATCHER_FIXED');
  page.on('pageerror', e=>console.log('BROWSER_SCRIPT_ERROR',e.message.slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')console.log('BROWSER_CONSOLE_ERROR',m.text().slice(0,300));});
  page.on('response',resp=>{if(/\/app\.js|\/media\/latest\.json/.test(resp.url()))console.log('NETWORK_CHECK',resp.status(),resp.url());});
  await page.waitForTimeout(2500);
  console.log('PAGE_DEBUG',await page.evaluate(()=>({url:location.href,heading:document.querySelector('h1')?.textContent,mainText:document.querySelector('main')?.innerText?.slice(0,500),videoCount:document.querySelectorAll('video').length,appType:typeof window.loadVerse})));
  await page.locator('video.exercise-video').waitFor({timeout:20000});
  const video=page.locator('video.exercise-video');
  await page.waitForFunction(()=>document.querySelector('video.exercise-video')?.videoWidth>0,{timeout:25000});
  await video.evaluate(async element=>{element.muted=true;await element.play()});
  await page.waitForFunction(()=>document.querySelector('video.exercise-video')?.currentTime>0.05,{timeout:20000});
  console.log('BROWSER_PLAYBACK_PASS',await video.evaluate(e=>({width:e.videoWidth,height:e.videoHeight,elapsed:e.currentTime})));
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await mobile.route('**/api/pageview',route=>route.fulfill({status:204,body:''}));
  const mobileRes=await mobile.goto('https://daily.dailyliftbydj-nas.workers.dev/',{waitUntil:'domcontentloaded'});
  if(mobileRes?.status()!==200)throw Error('Mobile homepage failed');
  const mobileVideo=mobile.locator('video.exercise-video');
  await mobileVideo.waitFor({timeout:20000});
  await mobile.waitForFunction(()=>document.querySelector('video.exercise-video')?.videoWidth>0,null,{timeout:20000});
  const box=await mobileVideo.boundingBox();
  if(!box || box.width>400)throw Error('Mobile player exceeds phone width');
  await mobileVideo.evaluate(async el=>{el.muted=true;await el.play();});
  await mobile.waitForFunction(()=>document.querySelector('video.exercise-video')?.currentTime>0.05,null,{timeout:20000});
  console.log('MOBILE_BROWSER_PLAYBACK_PASS',JSON.stringify({width:box.width,height:box.height}));
  await mobile.close();
} finally {await browser.close()}
