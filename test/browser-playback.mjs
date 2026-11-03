import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage();
  const response=await page.goto('https://daily.dailyliftbydj-nas.workers.dev/',{waitUntil:'domcontentloaded'});
  if (response?.status()!==200) throw Error('Homepage unavailable');
  await page.locator('video.exercise-video').waitFor({timeout:20000});
  const video=page.locator('video.exercise-video');
  await page.waitForFunction(()=>document.querySelector('video.exercise-video')?.videoWidth>0,{timeout:25000});
  await video.evaluate(async element=>{element.muted=true;await element.play()});
  await page.waitForFunction(()=>document.querySelector('video.exercise-video')?.currentTime>0.05,{timeout:20000});
  console.log('BROWSER_PLAYBACK_PASS',await video.evaluate(e=>({width:e.videoWidth,height:e.videoHeight,elapsed:e.currentTime})));
} finally {await browser.close()}
