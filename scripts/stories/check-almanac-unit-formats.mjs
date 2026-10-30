#!/usr/bin/env node
// Regression checks for dropped comparison rows and unit-token false matches.
// Uses the actual poverty-story hours artifact; bundles the production adapter in memory.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
const bundled=await build({entryPoints:['src/data/almanac-visuals.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {buildAlmanacVisual}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const artifact=JSON.parse(await readFile('data/series/poverty-debate.pov26.worker_structural_trap_2024.IN.json','utf8'));
assert.equal(artifact.rows.length,2,'hours artifact must retain both paid and self/unpaid comparisons');
let checked=0;
for(const unit of ['hours / week','years','USD million','Rs lakh','% of workers','percentage points']){
 const plan={indicator:artifact.indicatorId,chart:'dumbbell',labelField:'dimension',aField:'poor',bField:'nonpoor',aLabel:'Below $3/day',bLabel:'At least $3/day',unit,title:'Unit-format regression'};
 const visual=buildAlmanacVisual(plan,()=>artifact);
 assert.ok(visual,'valid two-row comparison must render');assert.equal(visual.rows.length,2);
 for(const width of [320,384,508,660,1040]){
  const svg=visual.draw(width);
  const labels=[...svg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]);
  const numeric=labels.filter(t=>/^[₹$]?[−-]?\d[\d,]*(?:\.\d+)?%?$/.test(t));
  assert.ok(numeric.length>=2,`${unit} at${width}: numeric axis missing`);
  if(unit==='Rs lakh')assert.ok(numeric.every(t=>t.startsWith('₹')),'rupee abbreviation must format as rupees');
  else if(unit==='% of workers')assert.ok(numeric.every(t=>t.endsWith('%')),'percentage unit must retain percent sign');
  else assert.ok(numeric.every(t=>!/[₹$%]/.test(t)),`${unit}: numeric axis misidentified as currency or percent`);
  if(unit==='hours / week')for(const row of artifact.rows){assert.ok(svg.includes(row.label??row.dimension));assert.ok(svg.includes(String(row.poor)));assert.ok(svg.includes(String(row.nonpoor)));}
  checked++;
 }
}
const small={...artifact,rows:[{dimension:'Small percentage',poor:0.65,nonpoor:0.84},{dimension:'Published precision',poor:1.02,nonpoor:2.57}]};
const smallVisual=buildAlmanacVisual({indicator:small.indicatorId,chart:'dumbbell',labelField:'dimension',aField:'poor',bField:'nonpoor',unit:'% of workers',title:'Percentage precision regression'},()=>small);
assert.ok(smallVisual);
for(const width of [320,384,508,660,1040]){
 const svg=smallVisual.draw(width);
 for(const value of ['0.65%','0.84%','1%','2.6%'])assert.ok(svg.includes(value),`${value} rounded away at${width}`);
}
const points=buildAlmanacVisual({indicator:small.indicatorId,chart:'dumbbell',labelField:'dimension',aField:'poor',bField:'nonpoor',unit:'percentage points',domain:[0,3],ticks:[0,1,2,3],title:'Percentage-point zero regression'},()=>small);
for(const width of [320,384,508,660,1040]){const svg=points.draw(width);assert.ok(svg.includes('>0</text>'));assert.ok(!svg.includes('%'),'percentage points must never acquire a percent sign');}
// A mobile drawing must preserve the complete categorical comparison, even above
// twelve rows; alternating-row sampling used to silently discard half the data.
const many={...artifact,rows:Array.from({length:14},(_,i)=>({dimension:`Row ${String(i+1).padStart(2,'0')}`,poor:20+i,nonpoor:40+i}))};
const manyVisual=buildAlmanacVisual({indicator:many.indicatorId,chart:'dumbbell',labelField:'dimension',aField:'poor',bField:'nonpoor',unit:'% of workers',title:'Complete mobile comparison regression'},()=>many);
assert.ok(manyVisual);
for(const width of [320,384,508,660,1040]){
 const svg=manyVisual.draw(width);
 for(const row of many.rows)assert.ok(svg.includes(`>${row.dimension}</text>`),`${row.dimension} missing from ${width}px comparison`);
}
for(const row of many.rows)assert.ok(manyVisual.svgM.includes(`>${row.dimension}</text>`),`${row.dimension} missing from default mobile SVG`);
console.log(JSON.stringify({status:'pass',unitClasses:6,widths:[320,384,508,660,1040],drawingsChecked:checked+16,percentagePrecisionDrawings:5,percentagePointZeroDrawings:5,comparisonRows:2,completeMobileComparisonRows:14,completeComparisonDrawings:6},null,2));
