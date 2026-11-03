// End-to-end local browser test of the *candidate* Worker source.
// No Cloudflare deployment, NAS access, Vercel write, or user data.
import fs from 'node:fs';
import http from 'node:http';
import vm from 'node:vm';
import {chromium} from 'playwright';

let handler;
const source=fs.readFileSync(new URL('../cloudflare/preview-worker.js',import.meta.url),'utf8');
vm.runInNewContext(source,{
  addEventListener:(name,fn)=>{if(name==='fetch')handler=fn;},
  URL,Date,Intl,Math,Response,Request,AbortSignal,fetch,TextEncoder,TextDecoder
},{timeout:4000});
if(typeof handler!=='function')throw Error('Missing Worker fetch listener');
const server=http.createServer((req,res)=>{
  const request=new Request('http://127.0.0.1:'+server.address().port+req.url,{method:req.method});
  let answer;
  try{handler({request,respondWith:response=>{answer=Promise.resolve(response)}})}
  catch(e){res.writeHead(500);res.end(String(e));return}
  Promise.resolve(answer).then(async response=>{
    const headers=Object.fromEntries(response.headers);
    res.writeHead(response.status,headers);
    res.end(Buffer.from(await response.arrayBuffer()));
  }).catch(e=>{res.writeHead(500);res.end(String(e));});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
  const response=await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  if(response?.status()!==200)throw Error('Candidate homepage unavailable');
  const video=page.locator('video.exercise-video');
  try { await video.waitFor({timeout:20000}) }
  catch(e) { throw Error('No video element: '+JSON.stringify(errors.slice(-5))+' / '+(await page.locator('main').innerText()).slice(-350)) }
  await page.waitForFunction(()=>document.querySelector('video.exercise-video')?.videoWidth>0,null,{timeout:22000});
  await video.evaluate(async el=>{el.muted=true;await el.play();});
  await page.waitForFunction(()=>document.querySelector('video.exercise-video')?.currentTime>0.05,null,{timeout:20000});
  console.log('LOCAL_WORKER_FIXED_BROWSER_PASS',JSON.stringify(await video.evaluate(e=>({width:e.videoWidth,height:e.videoHeight,elapsed:e.currentTime}))));
} finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
