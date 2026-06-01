/* ============================================================
   INDICA Charts — chart-kit.js  (seed of the open-source kit)
   Tiny, dependency-free SVG renderer. Refined defaults:
   light horizontal gridlines only, dim small labels, smooth
   curves, whisper area fills, generous padding. SSR-friendly
   (pure string output) — call .html() to inline, or mount().
   In production, swap the hand-rolled scale/curve math for
   d3-scale / d3-shape submodules; the API stays the same.
   ============================================================ */
(function(global){
  const NS = {};
  const PAD = {l:54,r:24,t:30,b:38};
  const GRID = '#ededed', AXIS = '#a6a6a6';

  function niceMax(v){ // simple nice ceiling
    const p=Math.pow(10,Math.floor(Math.log10(v)));
    const n=v/p; const step=n<=1?1:n<=2?2:n<=5?5:10; return step*p;
  }
  function smooth(pts){
    if(pts.length<2) return pts.length?`M ${pts[0][0]} ${pts[0][1]}`:'';
    let d=`M ${pts[0][0]} ${pts[0][1]}`;
    for(let i=1;i<pts.length;i++){const cx=(pts[i-1][0]+pts[i][0])/2;
      d+=` C ${cx} ${pts[i-1][1]}, ${cx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;}
    return d;
  }
  function fmt(v,o){ return o&&o.fmt?o.fmt(v):(Math.abs(v)>=1000?Math.round(v).toLocaleString():(+v.toFixed(2)).toString()); }

  /* opts: {w,h, x:[labels], series:[{data:[num], color, area:true, label}],
            min, max, ticks, animate:true, drawClass:'draw'} */
  NS.line = function(opts){
    const w=opts.w||920,h=opts.h||440,pad=Object.assign({},PAD,opts.pad||{});
    const xs=opts.x, sers=opts.series;
    const all=[].concat(...sers.map(s=>s.data));
    const min=opts.min!=null?opts.min:Math.min(0,...all);
    const max=opts.max!=null?opts.max:niceMax(Math.max(...all)*1.06);
    const ticks=opts.ticks||5;
    const X=i=>pad.l+(i/(xs.length-1))*(w-pad.l-pad.r);
    const Y=v=>h-pad.b-((v-min)/(max-min))*(h-pad.t-pad.b);
    let g='';
    for(let k=0;k<=ticks;k++){const v=min+(max-min)*k/ticks,y=Y(v);
      g+=`<line x1="${pad.l}" y1="${y}" x2="${w-pad.r}" y2="${y}" stroke="${GRID}"/>`;
      g+=`<text x="${pad.l-10}" y="${y+4}" font-size="10.5" fill="${AXIS}" text-anchor="end" font-family="DM Sans">${fmt(v,opts)}</text>`;}
    xs.forEach((lab,i)=>{ if(opts.everyX?i%opts.everyX===0||i===xs.length-1:true)
      g+=`<text x="${X(i)}" y="${h-pad.b+22}" font-size="10.5" fill="${AXIS}" text-anchor="middle" font-family="DM Sans">${lab}</text>`;});
    sers.forEach((s,si)=>{
      const pts=s.data.map((v,i)=>[X(i),Y(v)]);
      const path=smooth(pts);
      if(s.area){const id='ik'+si+Math.round(X(1));
        g+=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".14"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>`;
        g+=`<path d="${path} L ${X(xs.length-1)} ${Y(min)} L ${X(0)} ${Y(min)} Z" fill="url(#${id})"/>`;}
      const anim=opts.animate?` class="${opts.drawClass||'draw'}" pathLength="1"`:'';
      g+=`<path d="${path}" fill="none" stroke="${s.color}" stroke-width="${s.width||2.4}" stroke-linecap="round" stroke-linejoin="round"${anim}/>`;
      g+=`<circle cx="${X(xs.length-1)}" cy="${Y(s.data[s.data.length-1])}" r="4.2" fill="${s.color}"/>`;
    });
    return g;
  };

  /* opts: {w,h, x:[labels], data:[num], color, max, animate, gbarClass} */
  NS.bars = function(opts){
    const w=opts.w||920,h=opts.h||300,pad=Object.assign({},PAD,opts.pad||{});
    const xs=opts.x,d=opts.data,n=d.length;
    const max=opts.max!=null?opts.max:niceMax(Math.max(...d)*1.06);
    const Y=v=>h-pad.b-((v)/(max))*(h-pad.t-pad.b);
    const bw=((w-pad.l-pad.r)/n)*0.62, step=(w-pad.l-pad.r)/n;
    let g='';
    for(let k=0;k<=4;k++){const v=max*k/4,y=Y(v);
      g+=`<line x1="${pad.l}" y1="${y}" x2="${w-pad.r}" y2="${y}" stroke="${GRID}"/>`;
      g+=`<text x="${pad.l-10}" y="${y+4}" font-size="10.5" fill="${AXIS}" text-anchor="end" font-family="DM Sans">${fmt(v,opts)}</text>`;}
    d.forEach((v,i)=>{const x=pad.l+i*step+(step-bw)/2,y=Y(v);
      const cls=opts.animate?` class="${opts.gbarClass||'gbar'}" style="transition-delay:${i*70}ms"`:'';
      const op=opts.fade?(0.45+0.55*i/(n-1)):1;
      g+=`<rect x="${x}" y="${y}" width="${bw}" height="${h-pad.b-y}" fill="${opts.color}" opacity="${op}"${cls}/>`;
      g+=`<text x="${x+bw/2}" y="${h-pad.b+20}" font-size="10.5" fill="${AXIS}" text-anchor="middle" font-family="DM Sans">${xs[i]}</text>`;});
    return g;
  };

  /* compact sparkline string. opts:{w,h,data,color,area} */
  NS.spark = function(opts){
    const w=opts.w||180,h=opts.h||54,p=4,d=opts.data;
    const mn=Math.min(...d),mx=Math.max(...d);
    const X=i=>p+(i/(d.length-1))*(w-2*p), Y=v=>h-p-((v-mn)/((mx-mn)||1))*(h-2*p);
    const pts=d.map((v,i)=>[X(i),Y(v)]);const path=smooth(pts);
    let g='';
    if(opts.area){const id='sp'+Math.round(X(1)*d.length);
      g+=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${opts.color}" stop-opacity=".16"/><stop offset="1" stop-color="${opts.color}" stop-opacity="0"/></linearGradient></defs>`;
      g+=`<path d="${path} L ${X(d.length-1)} ${h} L ${X(0)} ${h} Z" fill="url(#${id})"/>`;}
    g+=`<path class="${opts.animate?'draw':''}" ${opts.animate?'pathLength="1"':''} d="${path}" fill="none" stroke="${opts.color}" stroke-width="1.6" stroke-linecap="round"/>`;
    g+=`<circle cx="${X(d.length-1)}" cy="${Y(d[d.length-1])}" r="2.6" fill="${opts.color}"/>`;
    return g;
  };

  let _uid=0;

  /* count-up a number element */
  NS.countTo=function(el,to,dec){const t0=performance.now();(function tk(t){let p=Math.min(1,(t-t0)/900);p=1-Math.pow(1-p,3);el.textContent=(to*p).toFixed(dec);if(p<1)requestAnimationFrame(tk);else el.textContent=to.toFixed(dec);})(t0);};

  /* HERO LINE — bold area + glow + annotations + end marker.
     Mounts into the given <svg>, returns a ctx for attachHover().
     o: {x:[labels],data:[nums],color,min,max,ticks,ylab(fn),everyX,
         annotations:[{i,t,s}], endLabel, endSub, w,h,pad} */
  NS.heroLine=function(svg,o){
    const W=o.w||960,H=o.h||520,pad=Object.assign({l:56,r:104,t:48,b:50},o.pad||{});
    const d=o.data,x=o.x,C=o.color||'#3A5BD0',ticks=o.ticks||4,uid=++_uid;
    const min=o.min!=null?o.min:Math.min(0,...d), max=o.max!=null?o.max:niceMax(Math.max(...d)*1.08);
    const X=i=>pad.l+(i/(x.length-1))*(W-pad.l-pad.r);
    const Y=v=>H-pad.b-((v-min)/(max-min))*(H-pad.t-pad.b);
    const zeroY=Math.max(pad.t,Math.min(H-pad.b,Y(0)));
    let g=`<defs><linearGradient id="ik-area-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C}" stop-opacity=".30"/><stop offset=".55" stop-color="${C}" stop-opacity=".07"/><stop offset="1" stop-color="${C}" stop-opacity="0"/></linearGradient><filter id="ik-glow-${uid}" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="${C}" flood-opacity=".22"/></filter></defs>`;
    for(let k=0;k<=ticks;k++){const v=min+(max-min)*k/ticks,y=Y(v),z=Math.abs(v)<1e-6;
      g+=`<line x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}" stroke="${z?'#cfcfcf':'#f1f1f1'}" stroke-width="${z?1.2:1}"/>`;
      g+=`<text class="yaxt" x="${pad.l-12}" y="${y+4}" text-anchor="end">${o.ylab?o.ylab(v):(+v.toFixed(2))}</text>`;}
    x.forEach((lab,i)=>{if(o.everyX?(i%o.everyX===0||i===x.length-1):true)g+=`<text class="xaxt" x="${X(i)}" y="${H-pad.b+24}" text-anchor="middle">${lab}</text>`;});
    const pts=d.map((v,i)=>[X(i),Y(v)]);const line=smooth(pts);
    g+=`<path d="${line} L ${X(x.length-1)} ${zeroY} L ${X(0)} ${zeroY} Z" fill="url(#ik-area-${uid})" class="ik-fade"/>`;
    g+=`<path d="${line}" fill="none" stroke="${C}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#ik-glow-${uid})" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;animation:drw 1.4s cubic-bezier(.4,0,.2,1) forwards"/>`;
    (o.annotations||[]).forEach(a=>{const ax=X(a.i),ay=Y(d[a.i]),ly=Math.max(pad.t+14,ay-46),anc=ax>W-220?'end':'middle';
      g+=`<g class="anno-grp"><line class="anno-line" x1="${ax}" y1="${ay-7}" x2="${ax}" y2="${ly+6}"/><circle class="anno-dot" cx="${ax}" cy="${ay}" r="4.5"/><text class="anno-t" x="${ax}" y="${ly}" text-anchor="${anc}">${a.t}</text><text class="anno-s" x="${ax}" y="${ly+13}" text-anchor="${anc}">${a.s}</text></g>`;});
    if(o.endLabel){const ex=X(x.length-1),ey=Y(d[d.length-1]);
      g+=`<g class="anno-grp"><line x1="${ex}" y1="${ey}" x2="${W-pad.r+12}" y2="${ey}" stroke="${C}" stroke-width="1" stroke-dasharray="2 4" opacity=".4"/><circle cx="${ex}" cy="${ey}" r="6" fill="${C}"/><circle cx="${ex}" cy="${ey}" r="11" fill="none" stroke="${C}" stroke-width="1" opacity=".35"/><text class="end-v" x="${W-pad.r+16}" y="${ey-2}" style="fill:${C}">${o.endLabel}</text>${o.endSub?`<text class="end-s" x="${W-pad.r+16}" y="${ey+13}">${o.endSub}</text>`:''}</g>`;}
    g+=`<g class="ik-hg" opacity="0"><line class="ik-hl" y1="${pad.t}" y2="${H-pad.b}" stroke="#999" stroke-width="1" stroke-dasharray="3 3"/><circle class="ik-hc" r="5.5" fill="#fff" stroke="${C}" stroke-width="2.6"/></g>`;
    g+=`<rect class="ik-cap" x="${pad.l}" y="${pad.t}" width="${W-pad.l-pad.r}" height="${H-pad.t-pad.b}" fill="transparent" style="cursor:crosshair"/>`;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.innerHTML=g;
    return {W,H,pad,X,Y,px:x.map((_,i)=>X(i)),data:d};
  };

  /* crosshair + tooltip. o:{wrap,tip,ctx,fmt,unit,x} */
  NS.attachHover=function(svg,o){
    const ctx=o.ctx,W=ctx.W,H=ctx.H,tip=o.tip,wrap=o.wrap;
    const cap=svg.querySelector('.ik-cap'),hg=svg.querySelector('.ik-hg'),hl=svg.querySelector('.ik-hl'),hc=svg.querySelector('.ik-hc');
    if(!cap)return;
    function mv(e){const r=svg.getBoundingClientRect(),cx=(e.touches?e.touches[0].clientX:e.clientX),vbX=(cx-r.left)/r.width*W;
      let idx=0,best=1e9;ctx.px.forEach((px,i)=>{const dd=Math.abs(px-vbX);if(dd<best){best=dd;idx=i;}});
      const px=ctx.px[idx],py=ctx.Y(ctx.data[idx]);hg.setAttribute('opacity','1');hl.setAttribute('x1',px);hl.setAttribute('x2',px);hc.setAttribute('cx',px);hc.setAttribute('cy',py);
      const cw=wrap.getBoundingClientRect().width,lp=px/W*cw;tip.style.opacity='1';
      tip.innerHTML=`<span class="ty">${o.x[idx]}</span><br><b>${o.fmt(ctx.data[idx])}</b>${o.unit||''}`;
      const tw=tip.getBoundingClientRect().width;tip.style.left=Math.max(0,Math.min(cw-tw,lp-tw/2))+'px';
      tip.style.top=Math.max(0,py/H*wrap.getBoundingClientRect().height-tip.getBoundingClientRect().height-14)+'px';}
    function lv(){hg.setAttribute('opacity','0');tip.style.opacity='0';}
    cap.addEventListener('mousemove',mv);cap.addEventListener('mouseleave',lv);cap.addEventListener('touchmove',mv,{passive:true});cap.addEventListener('touchend',lv);
  };

  /* stacked composition bar + big-number legend. segs:[[name,pct],...] o:{color,ops} */
  NS.stack=function(sel,segs,o){o=o||{};const C=o.color||'var(--c)',ops=o.ops||[1,.66,.42,.24,.16];
    const el=typeof sel==='string'?document.querySelector(sel):sel; if(!el)return;
    el.innerHTML='<div class="stack">'+segs.map((s,i)=>`<div class="seg" data-w="${s[1]}" style="background:${C};opacity:${ops[i%ops.length]}">${s[1]>=20?`<span class="seg-pin">${s[1]}%</span>`:''}</div>`).join('')+'</div>'+
      '<div class="stack-legend">'+segs.map((s,i)=>`<div class="it"><span class="sw" style="background:${C};opacity:${ops[i%ops.length]}"></span><span class="nm">${s[0]}</span><div class="pc">${s[1]}%</div></div>`).join('')+'</div>';
    requestAnimationFrame(()=>el.querySelectorAll('.stack .seg').forEach((s,i)=>setTimeout(()=>s.style.width=s.dataset.w+'%',120+i*100)));
  };

  /* ranked board. rows:[[name,value],...] (given order). o:{color,highlight,max,unit} */
  NS.rank=function(sel,rows,o){o=o||{};const C=o.color||'var(--c)',max=o.max||Math.max(...rows.map(r=>r[1]))*1.02;
    const el=typeof sel==='string'?document.querySelector(sel):sel; if(!el)return;
    el.innerHTML='<div class="rank">'+rows.map((r,i)=>{const on=o.highlight&&r[0]===o.highlight;
      return `<div class="rk ${on?'on':''}"><span class="no">${String(i+1).padStart(2,'0')}</span><span class="nm">${r[0]}</span><div class="track"><div class="fill" data-w="${r[1]/max*100}" style="background:${on?C:'var(--slate)'}"></div></div><span class="v">${r[1]}${o.unit?`<small> ${o.unit}</small>`:''}</span></div>`;}).join('')+'</div>';
    requestAnimationFrame(()=>el.querySelectorAll('.rk .fill').forEach((f,i)=>setTimeout(()=>f.style.width=f.dataset.w+'%',120+i*90)));
  };

  NS.smooth=smooth; NS.niceMax=niceMax;
  // mount helper: NS.mount('#id', NS.line({...}))
  NS.mount=function(sel,inner){const el=typeof sel==='string'?document.querySelector(sel):sel; if(el) el.innerHTML=inner; return el;};
  global.Indica = NS;
})(window);
