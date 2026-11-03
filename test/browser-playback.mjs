import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage();
  const response=await page.goto('https://daily.dailyliftbydj-nas.workers.dev/',{waitUntil:'domcontentloaded'});
  if (response?.status()!==200) throw Error('Homepage unavailable');
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
} finally {await browser.close()}
