#!/usr/bin/env node
// Actual built-page section bindings, rendered inks and review screenshots.
// Run after npm run build. Screenshots are temporary review aids, not evidence sources.
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, join, extname } from 'node:path';
const root = resolve('.');
const require = createRequire(join(process.env.INDICA_PUPPETEER_DIR || '/tmp/indica-puppeteer', 'noop.js'));
const puppeteer = require('puppeteer-core');
const stories = [
  ['lrs-controls','q.econ.lrs_controls','why-is-rbi-rethinking-india-250k-lrs-remittance-window'],
  ['poverty-debate','q.econ.poverty_debate','what-the-world-bank-2026-poverty-report-actually-shows-about-india'],
];
const types = {'.html':'text/html','.json':'application/json','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server = createServer(async (req,res)=>{
  try {
    let p = join(root,'dist',decodeURIComponent(new URL(req.url,'http://local').pathname));
    if ((await stat(p)).isDirectory()) p=join(p,'index.html');
    const body=await readFile(p);
    res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream'});res.end(body);
  } catch {res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:process.env.INDICA_CHROME||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
let failures=0;
try {
for (const [story,qid,slug] of stories) {
  const explanation=JSON.parse(await readFile(join(root,`data/explanations/en/${qid}.json`),'utf8'));
  const report={questionId:qid,reviewedAt:new Date().toISOString(),widths:[],bindingFailures:[]};
  for (const width of [412,1440]) {
    const page=await browser.newPage();await page.setViewport({width,height:950});
    await page.goto(`http://127.0.0.1:${server.address().port}/articles/${slug}/`,{waitUntil:'networkidle0'});
    await page.evaluate(async()=>{await document.fonts.ready;for(const c of document.querySelectorAll('.viz-card')){c.scrollIntoView();await new Promise(r=>setTimeout(r,100));}});
    const cards=await page.evaluate(()=>[...document.querySelectorAll('.viz-card')].map(c=>{
      let container=c.closest('.ar-figs'), prior=container?.previousElementSibling;
      while(prior&&!prior.matches('.ar-sec'))prior=prior.previousElementSibling;
      const visible=[...c.querySelectorAll('svg')].filter(s=>s.getBoundingClientRect().width>0&&getComputedStyle(s).display!=='none');
      return {id:c.id,title:c.querySelector('h2,h3')?.textContent?.trim(),section:container?.classList.contains('ar-lead')?'LEAD':prior?.querySelector('h3')?.textContent?.trim(),
        inks:[...new Set(visible.flatMap(s=>[...s.querySelectorAll('[stroke],[fill]')].map(e=>e.getAttribute('stroke')||e.getAttribute('fill'))))],
        svgCount:visible.length,show:c.dataset.show};
    }));
    if(!cards.length)throw new Error(`${slug}: no charts rendered`);
    if(cards.length!==explanation.evidence.plannedCharts.length)report.bindingFailures.push({width,expectedChartCount:explanation.evidence.plannedCharts.length,renderedChartCount:cards.length});
    for(const mapping of explanation.sectionVisualMap){
      for(const id of mapping.visualIds||(mapping.visualId?[mapping.visualId]:[])){
        const planned=explanation.evidence.plannedCharts.find(c=>c.chartId===id);
        const card=cards.find(c=>c.title===planned?.title);
        if(!card || (card.section!=='LEAD'&&card.section!==mapping.heading))report.bindingFailures.push({width,heading:mapping.heading,id,actual:card||null});
      }
    }
    const dir=`/tmp/indica-flagship-review/${story}/${width}`;await mkdir(dir,{recursive:true});
    const handles=await page.$$('.viz-card');
    for(let i=0;i<handles.length;i++){await handles[i].scrollIntoView();await new Promise(r=>setTimeout(r,120));await handles[i].screenshot({path:`${dir}/${String(i+1).padStart(2,'0')}.png`});}
    report.widths.push({width,cards,screenshotDirectory:dir});await page.close();
  }
  failures+=report.bindingFailures.length;
  const out=join(root,`data/audits/${story}/rendered-visual-audit.json`);await writeFile(out,JSON.stringify(report,null,2)+'\n');
  console.log(story,report.widths.map(w=>`${w.width}: ${w.cards.length} charts`).join(', '),`${report.bindingFailures.length} binding failures`);
}
} finally {await browser.close();server.close();}
process.exitCode=failures?1:0;
