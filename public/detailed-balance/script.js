const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const nav = $('#site-nav');
const menu = $('.menu-toggle');
const links = $('.nav-links');
window.addEventListener('scroll', () => nav?.classList.toggle('is-scrolled', window.scrollY > 14), { passive: true });
menu?.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  links?.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
});
links?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu?.classList.remove('is-open'); links?.classList.remove('is-open'); menu?.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
$$('.reveal').forEach(el => observer.observe(el));

function setupCanvas(canvas, height = 300) {
  if (!canvas) return null;
  if (canvas.__ctx) { canvas.__resize?.(); return canvas.__ctx; }
  const ctx = canvas.getContext('2d');
  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(20, rect.width || 500);
    const h = Math.max(20, rect.height || height);
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.__size = { w, h };
    canvas.__draw?.();
  };
  canvas.__resize = resize;
  new ResizeObserver(resize).observe(canvas); resize();
  canvas.__ctx = ctx;
  return ctx;
}
const palette = { blue: '#4f96cc', deep: '#173b62', gold: '#efb83e', muted: '#9db6c9', violet: '#7162c8', grid: 'rgba(63,119,168,.14)' };
const line = (ctx, a, b, color, width = 1, dash = []) => { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(a.px ?? a.x, a.py ?? a.y); ctx.lineTo(b.px ?? b.x, b.py ?? b.y); ctx.stroke(); ctx.restore(); };

// The theory and experiment visuals are generated from the real IdeaSearchFitter database.
let graphData = null;
let crossTaskData = null;
let gptWordData = null;
let graphPromise = null;
function loadGraphData(){
  if(graphData)return Promise.resolve(graphData);
  if(graphPromise)return graphPromise;
  // Version the derived data URL as well as the script URL.  Static hosts may
  // otherwise keep an older JSON asset that predates the frame-wise Pearson
  // trace, which must never be rendered as a misleading zero.
  graphPromise=fetch('assets/data/ideasearchfitter-pruned.json?v=20260920-symmetric-pearson-v3',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error(`Graph request: HTTP ${response.status}`);return response.json();})
    .then(data=>{
      if(!data?.frames?.length||!data?.nodes?.length)throw new Error('Missing graph frames or nodes');
      graphData=data;
      // The static landing view opens on the published terminal frame. Any
      // deliberate interaction (playback, dragging, or reset) then uses the
      // ordinary 0→99 presentation timeline.
      drawDag();drawTheoryMatrix();drawMatrix();drawSort();drawAction();drawScatter();drawCrossTask();drawBias();updateActionReadout();updateBias();
      $('#sortStatus').textContent='点击节点查看状态表达式、采样数和势能。';
      return data;
    })
    .catch(error=>{
      graphData=null;graphPromise=null;
      $('#sortStatus').textContent='动画暂未载入，请点击播放重试。';
      console.error('IdeaSearchFitter visualisation failed:',error);
      return null;
    });
  return graphPromise;
}
// Open the static landing view on the published terminal frame only when no
// interaction happened while the graph JSON was loading. A pending play or
// reset must retain control of the timeline.
loadGraphData().then(data=>{
  if(!data||actionState.requestId!==0||actionState.pending||actionState.running)return;
  actionState.iteration=actionState.steps;
  actionState.plotPosition=actionState.steps;
  actionState.rawOverride=null;
  actionState.playbackElapsed=null;
  renderExperiment();
  drawBias();
  updateActionReadout();
});
const crossTaskPromise = fetch('assets/data/qwen-timeline.json').then(r => r.ok ? r.json() : null).then(data => { crossTaskData=data; drawCrossTask(); return data; }).catch(error => { console.error('Cross-task summary visualisation failed:', error); return null; });
const gptWordPromise = fetch('assets/data/gpt5nano-sum100.json').then(r => r.ok ? r.json() : null).then(data => { gptWordData=data; drawCrossTask(); return data; }).catch(error => { console.error('GPT-5 nano word visualisation failed:', error); return null; });

function drawArrow(ctx, A, B, color, width = 1, head = 7) {
  const ax=A.px ?? A.x, ay=A.py ?? A.y, bx=B.px ?? B.x, by=B.py ?? B.y;
  const angle=Math.atan2(by-ay,bx-ax); const x=bx-Math.cos(angle)*5, y=by-Math.sin(angle)*5;
  ctx.save(); ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x,y);
  ctx.lineTo(x-Math.cos(angle-.55)*head,y-Math.sin(angle-.55)*head);
  ctx.lineTo(x-Math.cos(angle+.55)*head,y-Math.sin(angle+.55)*head); ctx.closePath(); ctx.fill(); ctx.restore();
}
function norm(values, x) { const lo=Math.min(...values), hi=Math.max(...values); return (x-lo)/(hi-lo || 1); }
function graphPositions(data, w, h) {
  const xs=data.nodes.map(n=>n.x), vs=data.nodes.map(n=>n.v); const out={};
  data.nodes.forEach((n,i)=>{ const jitter=((i*17)%9-4)*.004; out[n.id]={px:58+norm(xs,n.x)*(w-92), py:h-40-(norm(vs,n.v)+jitter)*(h-78), id:n.id, node:n}; });
  return out;
}
function drawDag() {
  const canvas=$('#dagCanvas'); if(!canvas || !graphData)return;
  const ctx=setupCanvas(canvas); canvas.__draw=()=>{
    const {w,h}=canvas.__size; ctx.clearRect(0,0,w,h); ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    const td=graphData.theory, marginX=Math.max(32,w*.06), marginY=28;
    const ys=td.nodes.map(n=>n.y),yMin=Math.min(...ys),yMax=Math.max(...ys);
    const pos=Object.fromEntries(td.nodes.map(n=>{
      const yNorm=(n.y-yMin)/(yMax-yMin||1), yScaled=.14+yNorm*.72;
      return [n.id,{px:marginX+n.x*(w-marginX-28),py:marginY+yScaled*(h-2*marginY)}];
    }));
    const nodeRadius=Math.max(13,Math.min(22,w/18));
    const drawEdge=(e,color,width,dash=[])=>{const A=pos[e.source],B=pos[e.target];if(!A||!B)return;line(ctx,A,B,color,width,dash);drawArrow(ctx,A,B,color,width>1?8:6);};
    graphData.theory.edges.forEach(e=>drawEdge(e,'#2f77ad',4));
    graphData.theory.reverse.forEach(e=>drawEdge(e,'#efb83e',1.8,[7,5]));
    td.nodes.forEach(n=>{
      const P=pos[n.id];
      ctx.beginPath();ctx.arc(P.px,P.py,nodeRadius,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#173b62';ctx.stroke();
      ctx.fillStyle='#173b62';ctx.font=`600 ${Math.max(10,Math.min(14,nodeRadius*.78))}px DM Mono, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.id,P.px,P.py);
    });
  };canvas.__draw();
}

function drawTheoryMatrix(){
  const canvas=$('#theoryMatrix'); if(!canvas||!graphData?.theory)return;
  const ctx=setupCanvas(canvas); canvas.__draw=()=>{
    const fitted=Object.fromEntries(graphData.nodes.map(node=>[node.id,node.v]));
    const {w,h}=canvas.__size, ids=[...graphData.theory.order].sort((a,b)=>fitted[a]-fitted[b] || a.localeCompare(b)), n=ids.length;
    const p={l:68,r:18,t:54,b:72}, size=Math.min(w-p.l-p.r,h-p.t-p.b), cell=size/n;
    const vals=Object.fromEntries(ids.map(r=>[r,Object.fromEntries(ids.map(c=>[c,0]))]));
    [...graphData.theory.edges,...graphData.theory.reverse].forEach(e=>{ if(vals[e.target]?.[e.source]!==undefined) vals[e.target][e.source]=e.t; });
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    const valueFont=Math.max(6.5,Math.min(12,cell*.25));
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){
      const v=vals[ids[i]][ids[j]], t=Math.min(1,v/.3);
      ctx.fillStyle=v?mix('#eaf6ff','#2f77ad',t):'#edf2f5';ctx.fillRect(p.l+j*cell,p.t+i*cell,Math.max(1,Math.floor(cell-1)),Math.max(1,Math.floor(cell-1)));
      if(v>0){
        ctx.fillStyle=t>.54?'#fff':'#173b62';ctx.font=`${valueFont}px DM Mono, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v.toFixed(2),p.l+(j+.5)*cell,p.t+(i+.52)*cell);
      }
    }
    ctx.strokeStyle='rgba(23,59,98,.35)';ctx.strokeRect(p.l,p.t,size,size);
    // Self-transitions are not measured in this kernel. Cross the diagonal
    // explicitly instead of letting empty cells look like zero probability.
    ctx.save();ctx.strokeStyle='#d95f59';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(p.l,p.t);ctx.lineTo(p.l+size,p.t+size);ctx.stroke();ctx.restore();

    // State labels make the row/column convention explicit. Rows are targets f,
    // columns are sources g, both in the same fitted-potential order.
    ctx.fillStyle='#173b62';ctx.font=`${Math.max(7,Math.min(12,cell*.24))}px DM Mono, monospace`;ctx.textBaseline='middle';
    ids.forEach((id,i)=>{
      ctx.textAlign='center';ctx.fillText(id,p.l+(i+.5)*cell,p.t-20);
      ctx.textAlign='right';ctx.fillText(id,p.l-10,p.t+(i+.5)*cell);
    });
    ctx.textAlign='center';ctx.font='11px DM Mono, monospace';ctx.fillStyle='#68809a';ctx.fillText('列：源 g',p.l+size/2,Math.min(h-14,p.t+size+31));
    ctx.save();ctx.translate(15,p.t+size/2);ctx.rotate(-Math.PI/2);ctx.fillText('行：目标 f',0,0);ctx.restore();
    ctx.textAlign='left';ctx.font='10px DM Mono, monospace';ctx.fillStyle='#68809a';ctx.fillText('T(f|g)',p.l,p.t-39);

    canvas.dataset.order=ids.join(',');canvas.dataset.sorted='true';
  };canvas.__draw();
}

const matrixState={ordered:true};
const actionState={running:false,pending:false,requestId:0,iteration:0,plotPosition:0,rawOverride:null,playbackElapsed:0,playbackDuration:0,steps:99,view:'sort',timer:null,stepMs:120};
function organizeExperimentWorkspace(){
  const stage=$('#experimentStage'),detail=$('.experiment-detail-grid');
  if(!stage||!detail||stage.dataset.organized)return;
  ['sortView','matrixView','scatterView'].forEach(id=>{const view=$('#'+id);if(view)stage.appendChild(view);});
  detail.remove();stage.dataset.organized='true';
}
organizeExperimentWorkspace();
function mix(a,b,t){const ah=parseInt(a.slice(1),16),bh=parseInt(b.slice(1),16);return 'rgb('+[16,8,0].map(shift=>Math.round(((ah>>shift)&255)*(1-t)+((bh>>shift)&255)*t)).join(',')+')';}
function rawRelaxationPosition(displayPos){
  // A single smooth, quantile-matched logistic map gives the visible early
  // relaxation more room while compressing the nearly-flat L-BFGS-B tail.
  // There is no hidden breakpoint or clipped branch: all 240 source callbacks
  // remain reachable.
  const p=Math.max(0,Math.min(actionState.steps,displayPos))/actionState.steps;
  const rawMax=Math.max(1,(graphData?.frames?.length||241)-1);
  if(p<=0)return 0;
  if(p>=1)return rawMax;
  const logit=.2259*Math.log(p)+2.4407*(-Math.log1p(-p))-5.9445;
  return rawMax/(1+Math.exp(-logit));
}
function frameAt(displayPos,rawOverride=null){
  const raw=Number.isFinite(rawOverride)?rawOverride:rawRelaxationPosition(displayPos),i=Math.floor(raw),t=raw-i;
  const a=graphData.frames[Math.min(i,graphData.frames.length-1)], b=graphData.frames[Math.min(i+1,graphData.frames.length-1)];
  return {v:a.v.map((v,j)=>v+(b.v[j]-v)*t),action:a.action+(b.action-a.action)*t,raw};
}
function currentFrame(){
  return frameAt(actionState.plotPosition,actionState.rawOverride);
}
function fullPearsonAtRaw(raw){
  // The canvas is a readable 70-state slice, while this readout uses the
  // complete IdeaSearchFitter reciprocal-pair population. The data builder
  // stores one statistic for every recorded optimizer frame; interpolate it
  // at the same raw-frame position used for the visible potentials.
  const trace=graphData?.meta?.fullPearsonByFrame;
  if(!Array.isArray(trace)||!trace.length){
    const fallback=Number(graphData?.meta?.fullPearson);
    return Number.isFinite(fallback)?fallback:null;
  }
  const bounded=Math.max(0,Math.min(trace.length-1,Number(raw)||0));
  const i=Math.floor(bounded),j=Math.min(i+1,trace.length-1),t=bounded-i;
  const a=Number(trace[i]),b=Number(trace[j]);
  if(Number.isFinite(a)&&Number.isFinite(b))return a+(b-a)*t;
  if(Number.isFinite(a))return a;
  if(Number.isFinite(b))return b;
  return null;
}
function activeCanvas(id,draw){
  const canvas=$(id); if(!canvas||!graphData||!canvas.getClientRects().length)return;
  const ctx=setupCanvas(canvas);canvas.__draw=()=>draw(ctx,canvas.__size,canvas);canvas.__draw();
}
function drawMatrix(){
  activeCanvas('#matrixCanvas',(ctx,{w,h},canvas)=>{
    // Twelve measured states are large enough to read at phone width; the
    // original s01–s02–… order is the unsorted reference and is not a second tab.
    const states=graphData.matrixIDs.slice(0,12),n=states.length,v=currentFrame().v;
    const values=Object.fromEntries(graphData.nodes.map((node,i)=>[node.id,v[i]]));
    const order=[...states].sort((a,b)=>values[a]-values[b]);
    const l=47,t=54,size=Math.min(w-l-20,h-t-46),cell=size/n;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    order.forEach((target,i)=>order.forEach((source,j)=>{
      const row=graphData.matrixIDs.indexOf(target),col=graphData.matrixIDs.indexOf(source),value=graphData.matrix[row][col]||0;
      ctx.fillStyle=value?mix('#eaf6ff','#2f77ad',Math.min(1,value/.3)):'#e8eef3';
      ctx.fillRect(l+j*cell,t+i*cell,cell-1,cell-1);
      if(value&&cell>32){ctx.font='12px monospace';ctx.fillStyle=value>.16?'white':palette.deep;ctx.textAlign='center';ctx.fillText(value.toFixed(2),l+(j+.5)*cell,t+(i+.65)*cell);}
    }));
    // The diagonal is f=g. Self-transitions were not measured, so mark this
    // region explicitly rather than presenting blank cells as zero T.
    ctx.save();ctx.strokeStyle='#d95f59';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(l,t);ctx.lineTo(l+size,t+size);ctx.stroke();ctx.restore();
    ctx.fillStyle=palette.deep;ctx.font='12px monospace';ctx.textAlign='center';
    order.forEach((id,i)=>{ctx.save();ctx.translate(l+(i+.5)*cell,t-9);ctx.rotate(-Math.PI/2);ctx.fillText(id,0,0);ctx.restore();ctx.textAlign='right';ctx.fillText(id,l-8,t+(i+.65)*cell);ctx.textAlign='center';});
    ctx.textAlign='left';ctx.font='13px sans-serif';ctx.fillStyle='#58758e';ctx.fillText('列：源 g · 行：目标 f',l,t+size+30);
    canvas.dataset.order=order.join(',');canvas.dataset.iteration=actionState.iteration.toFixed(2);canvas.dataset.sorted='true';
    canvas.onclick=event=>{const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;if(x<l||y<t||x>=l+size||y>=t+size)return;const target=order[Math.floor((y-t)/cell)],source=order[Math.floor((x-l)/cell)];if(target===source){$('#matrixStatus').textContent='f='+target+' · g='+source+' · 自转移未测量';return;}const value=graphData.matrix[graphData.matrixIDs.indexOf(target)][graphData.matrixIDs.indexOf(source)]||0;$('#matrixStatus').textContent='f='+target+' · g='+source+' · T(f|g)='+value.toFixed(4);};
    $('#matrixStatus').textContent='12 个真实状态 · 色阶 0–0.30 · 点击格子查看转移概率';
  });
}
function drawSort(){
  activeCanvas('#sortCanvas',(ctx,{w,h},canvas)=>{
    const values=currentFrame().v,xs=graphData.nodes.map(n=>n.logMSE);
    const p={l:44,r:20,t:48,b:36},P={};
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    graphData.nodes.forEach((n,i)=>P[n.id]={x:p.l+norm(xs,n.logMSE)*(w-p.l-p.r),y:h-p.b-norm(values,values[i])*(h-p.t-p.b),v:values[i]});
    for(let i=0;i<5;i++)line(ctx,{x:p.l,y:p.t+i*(h-p.t-p.b)/4},{x:w-p.r,y:p.t+i*(h-p.t-p.b)/4},palette.grid);
    graphData.edges.filter(e=>e.t>=.05).forEach(e=>{const a=P[e.source],b=P[e.target],color=a.v>b.v?'#47a66f':'#d95f59';line(ctx,a,b,color,Math.max(.8,e.t*8));drawArrow(ctx,a,b,color,1,5);});
    graphData.nodes.forEach(n=>{const a=P[n.id];ctx.beginPath();ctx.arc(a.x,a.y,4.5,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();ctx.strokeStyle=palette.deep;ctx.lineWidth=1.3;ctx.stroke();});
    ctx.textAlign='left';ctx.fillStyle='#58758e';ctx.font='12px monospace';ctx.fillText('log₁₀(MSE) →',Math.max(44,w-150),h-12);
    canvas.__points=P;canvas.dataset.iteration=actionState.iteration.toFixed(2);
    canvas.onclick=event=>{const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const node=graphData.nodes.find(n=>Math.hypot(P[n.id].x-x,P[n.id].y-y)<10);if(node)$('#sortStatus').textContent=node.id+' · '+node.expression+' · samples '+node.samples+' · V='+P[node.id].v.toFixed(3);};
  });
}
function reciprocalPairs(){
  // build_demo_data.py follows the published plot.py procedure: from all
  // Eligible reciprocal pairs from the fixed 70-state display slice. The
  // generator stores a seeded, uniformly sampled dense panel; only ΔV moves
  // during replay while measured log(T/T) remains fixed.
  return graphData?.scatter||[];
}
function drawScatter(){
  activeCanvas('#scatterCanvas',(ctx,{w,h},canvas)=>{
    const pairs=reciprocalPairs(),p={l:48,r:18,t:52,b:48};
    const frame=currentFrame(),index=Object.fromEntries(graphData.nodes.map((n,i)=>[n.id,i]));
    const points=pairs.map(d=>({...d,x:(frame.v[index[d.source]]-frame.v[index[d.target]])*(d.flip||1)}));
    // Fixed bounds keep the moving ΔV cloud on the same ruler throughout
    // the recorded optimization playback.
    const limit=8;
    const sx=x=>p.l+(x+limit)/(2*limit)*(w-p.l-p.r),sy=y=>h-p.b-(y+limit)/(2*limit)*(h-p.t-p.b);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    line(ctx,{x:p.l,y:sy(0)},{x:w-p.r,y:sy(0)},palette.grid);line(ctx,{x:sx(0),y:p.t},{x:sx(0),y:h-p.b},palette.grid);
    line(ctx,{x:sx(-limit),y:sy(-limit)},{x:sx(limit),y:sy(limit)},palette.deep,1.8,[6,5]);
    [-limit,0,limit].forEach(t=>{ctx.fillStyle='#58758e';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(t,sx(t),h-p.b+18);ctx.textAlign='right';ctx.fillText(t,p.l-8,sy(t)+4);});
    points.forEach(d=>{ctx.beginPath();ctx.arc(sx(d.x),sy(d.y),3.6,0,Math.PI*2);ctx.fillStyle='rgba(47,119,173,.65)';ctx.fill();});
    ctx.textAlign='right';ctx.fillStyle='#58758e';ctx.font='12px sans-serif';ctx.fillText('ΔV = V(f) − V(g)',w-p.r,h-10);
    canvas.dataset.iteration=String(Math.round(frame.raw));canvas.dataset.displayIteration=actionState.iteration.toFixed(2);canvas.dataset.pairs=pairs.length;canvas.dataset.x=JSON.stringify(points.map(d=>d.x));
    canvas.onclick=event=>{
      const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
      let nearest=null,best=Infinity;
      points.forEach((d,i)=>{const px=sx(d.x),py=sy(d.y),distance=Math.hypot(px-x,py-y);if(distance<best){best=distance;nearest={d,i};}});
      if(!nearest||best>14){$('#scatterStatus').textContent='点击点查看状态对、势差与实测正逆概率比。';return;}
      const d=nearest.d;
      $('#scatterStatus').textContent=`${d.source} → ${d.target} · ΔV=${d.x.toFixed(3)} · log[T(g←f)/T(f←g)]=${d.y.toFixed(3)}`;
    };
  });
}
function displayPositionForRaw(rawTarget){
  let lo=0,hi=actionState.steps;
  for(let i=0;i<28;i++){const mid=(lo+hi)/2;if(rawRelaxationPosition(mid)<rawTarget)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
function drawAction(){
  activeCanvas('#actionCanvas',(ctx,{w,h},canvas)=>{
    const frames=Array.from({length:actionState.steps+1},(_,i)=>frameAt(i)),p={l:50,r:20,t:45,b:58},hi=frames[0].action,lo=Math.min(...frames.map(frame=>frame.action));
    const sx=i=>p.l+i/actionState.steps*(w-p.l-p.r),sy=a=>h-p.b-(a-lo)/(hi-lo||1)*(h-p.t-p.b);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);ctx.font='13px monospace';ctx.fillStyle=palette.deep;ctx.textAlign='left';
    [0,.5,1].forEach(t=>{line(ctx,{x:p.l,y:sy(t)},{x:w-p.r,y:sy(t)},palette.grid);ctx.fillText(t.toFixed(1),12,sy(t)+4);});
    for(let i=1;i<frames.length;i++)line(ctx,{x:sx(i-1),y:sy(frames[i-1].action)},{x:sx(i),y:sy(frames[i].action)},'#c7dbe9',2);
    const plotPosition=actionState.plotPosition;
    for(let i=1;i<=Math.floor(plotPosition);i++)line(ctx,{x:sx(i-1),y:sy(frames[i-1].action)},{x:sx(i),y:sy(frames[i].action)},'#2f77ad',3);
    const i=Math.floor(plotPosition),now=currentFrame();
    line(ctx,{x:sx(i),y:sy(frames[i].action)},{x:sx(plotPosition),y:sy(now.action)},'#2f77ad',3);
    ctx.beginPath();ctx.arc(sx(plotPosition),sy(now.action),6,0,Math.PI*2);ctx.fillStyle=palette.gold;ctx.fill();
    const ticks=w<420?[0,2,20,240]:[0,1,2,5,20,240];
    ctx.fillStyle='#58758e';
    ticks.forEach((raw,index)=>{
      const display=displayPositionForRaw(raw),x=sx(display);
      line(ctx,{x,y:h-p.b-2},{x,y:h-p.b+4},'#efb83e',1.4);
      ctx.textAlign=index===0?'left':index===ticks.length-1?'right':'center';ctx.fillText(raw,x,h-p.b+23);
    });
    ctx.fillStyle='#58758e';ctx.font='12px sans-serif';ctx.textAlign='right';ctx.fillText('实际迭代',w-p.r,h-8);
    canvas.dataset.iteration=String(Math.round(currentFrame().raw));canvas.dataset.displayIteration=actionState.iteration.toFixed(2);
  });
}
function updateActionReadout(){
  if(!graphData)return;const frame=currentFrame(),idx=Object.fromEntries(graphData.nodes.map((n,i)=>[n.id,i]));
  const edges=graphData.edges.filter(e=>e.t>=.05);let down=0;
  edges.forEach(e=>{const delta=frame.v[idx[e.source]]-frame.v[idx[e.target]];if(delta>.03)down++;});
  $('#iterationValue').textContent=Math.round(frame.raw)+' / 240';
  $('#iterationRange').value=actionState.iteration;$('#actionValue').textContent=frame.action.toFixed(3);
  const fitStates=Number(graphData.meta?.fitStates||0);
  const fittedCount=fitStates.toLocaleString('en-US');
  $('#metricLabel1').textContent='全图作用量 𝒮';
  $('#metricLabel3').textContent='显示状态 / 拟合总状态';
  if(actionState.view==='sort'){
    const downhillShare=edges.length?down/edges.length:0;
    $('#metricLabel2').textContent='下降边 / 总边数';
    $('#secondaryValue').textContent=(downhillShare*100).toFixed(1)+'%';
    $('#countValue').textContent=`${graphData.nodes.length} / ${fittedCount}`;
  }else if(actionState.view==='matrix'){
    const states=graphData.matrixIDs.slice(0,12),values=Object.fromEntries(graphData.nodes.map((node,i)=>[node.id,frame.v[i]]));
    const order=[...states].sort((a,b)=>values[a]-values[b]);
    let upperSq=0,offDiagonalSq=0;
    order.forEach((target,i)=>order.forEach((source,j)=>{
      if(i===j)return;
      const row=graphData.matrixIDs.indexOf(target),col=graphData.matrixIDs.indexOf(source),value=graphData.matrix[row]?.[col]||0;
      offDiagonalSq+=value*value;if(i<j)upperSq+=value*value;
    }));
    const upperShare=offDiagonalSq?Math.sqrt(upperSq/offDiagonalSq):0;
    $('#metricLabel2').textContent=' Frobenius 范数中上三角部分比例';
    $('#secondaryValue').textContent=(upperShare*100).toFixed(1)+'%';
    $('#countValue').textContent=`${states.length} / ${fittedCount}`;
  }else{
    $('#metricLabel2').textContent='Pearson r';
    const pearson=fullPearsonAtRaw(frame.raw);
    $('#secondaryValue').textContent=Number.isFinite(pearson)?pearson.toFixed(2):'—';
    $('#countValue').textContent=`${graphData.nodes.length} / ${fittedCount}`;
  }
}
function renderExperiment(){drawSort();drawMatrix();drawScatter();drawAction();updateActionReadout();}
function stopAction(){
  actionState.running=false;actionState.pending=false;actionState.requestId++;
  cancelAnimationFrame(actionState.timer);actionState.timer=null;
  $('#sortButton').textContent='播放优化 ↗';$('#sortButton').setAttribute('aria-busy','false');
}
const PLAYBACK_OPENING_MS=200;
function playbackSchedule(){
  const openingEnd=displayPositionForRaw(1);
  return {openingEnd,total:PLAYBACK_OPENING_MS+(actionState.steps-openingEnd)*actionState.stepMs};
}
function playbackStateAtElapsed(elapsed,schedule){
  const bounded=Math.max(0,Math.min(schedule.total,elapsed));
  let plot,raw;
  if(bounded<=PLAYBACK_OPENING_MS){
    const openingFraction=bounded/PLAYBACK_OPENING_MS;
    raw=openingFraction;
    plot=schedule.openingEnd*openingFraction;
  }else{
    plot=schedule.openingEnd+(bounded-PLAYBACK_OPENING_MS)/actionState.stepMs;
    raw=rawRelaxationPosition(Math.min(actionState.steps,plot));
  }
  return {progress:actionState.steps*bounded/schedule.total,plot,raw,elapsed:bounded};
}
async function startAction(){
  if(actionState.running||actionState.pending){stopAction();return;}
  const requestId=++actionState.requestId;
  if(!graphData){
    actionState.pending=true;
    $('#sortButton').textContent='准备动画…';$('#sortButton').setAttribute('aria-busy','true');
    const data=await loadGraphData();
    // Reset, a second click or a slider change cancels this pending intent.
    if(requestId!==actionState.requestId)return;
    actionState.pending=false;$('#sortButton').setAttribute('aria-busy','false');
    if(!data){$('#sortButton').textContent='重试播放 ↻';return;}
  }
  if(actionState.iteration>=actionState.steps){
    actionState.iteration=0;actionState.plotPosition=0;actionState.rawOverride=null;actionState.playbackElapsed=0;
  }
  actionState.running=true;$('#sortButton').textContent='暂停';
  // Traverse only recorded iteration 0→1 in 0.2 s. Keep 1→2 at the normal
  // presentation pace so the main deformation remains visible. Only the playback
  // clock changes: the raw mapping, interpolation and final data stay intact.
  const schedule=playbackSchedule();
  actionState.playbackDuration=schedule.total;
  let elapsed=Number.isFinite(actionState.playbackElapsed)
    ? actionState.playbackElapsed
    : actionState.iteration/actionState.steps*schedule.total;
  const applyPlaybackState=()=>{
    const state=playbackStateAtElapsed(elapsed,schedule);
    actionState.iteration=state.progress;
    actionState.plotPosition=state.plot;
    actionState.rawOverride=state.raw;
    actionState.playbackElapsed=state.elapsed;
  };
  applyPlaybackState();renderExperiment();
  let previous=performance.now();
  const tick=now=>{elapsed+=Math.max(0,Math.min(100,now-previous));previous=now;applyPlaybackState();renderExperiment();if(elapsed<schedule.total&&actionState.running)actionState.timer=requestAnimationFrame(tick);else stopAction();};
  actionState.timer=requestAnimationFrame(tick);
}
$('#sortButton')?.addEventListener('click',startAction);
$('#resetButton')?.addEventListener('click',()=>{stopAction();actionState.iteration=0;actionState.plotPosition=0;actionState.rawOverride=null;actionState.playbackElapsed=0;renderExperiment();});
$('#iterationRange')?.addEventListener('input',event=>{stopAction();actionState.iteration=Number(event.target.value);actionState.plotPosition=actionState.iteration;actionState.rawOverride=null;actionState.playbackElapsed=null;renderExperiment();});
$$('.experiment-tab').forEach(tab=>tab.addEventListener('click',()=>{
  actionState.view=tab.dataset.experiment;
  $$('.experiment-tab').forEach(item=>{item.classList.toggle('is-active',item===tab);item.setAttribute('aria-selected',item===tab?'true':'false');});
  $$('.experiment-view').forEach(view=>{view.hidden=view.id!==actionState.view+'View';view.classList.toggle('is-active',!view.hidden);});
  renderExperiment();
}));
$$('.task-tab').forEach(tab=>tab.addEventListener('click',()=>{
  $$('.task-tab').forEach(item=>{item.classList.toggle('is-active',item===tab);item.setAttribute('aria-selected',item===tab?'true':'false');});
  $$('.task-panel').forEach(panel=>panel.hidden=panel.id!=='task-'+tab.dataset.task);
}));

let selectedRobustTask = 'idea';
// A task with only a handful of reciprocal pairs is useful for an audit, but
// not for the public comparison figure: the cloud would invite a stronger
// visual conclusion than the data can support. Keep the threshold explicit
// so the selector and its provenance stay synchronized.
const MIN_PUBLIC_TASK_PAIRS = 15;
const PUBLIC_TASK_POINTS = 64;
function seededTaskSample(points, target=PUBLIC_TASK_POINTS, seedText='task'){
  if(!Array.isArray(points)||points.length<=target)return points||[];
  let seed=0; for(const ch of seedText) seed=(seed*31+ch.charCodeAt(0))>>>0;
  const a=points.map((point,index)=>({point,index,key:(seed=(1664525*seed+1013904223)>>>0)}));
  a.sort((x,y)=>x.key-y.key);
  return a.slice(0,target).map(item=>item.point);
}
function drawCrossTask(){
  if(!crossTaskData || !graphData)return;
  const select=$('#robustTaskSelect');
  const allDatasets=[{id:'idea',label:'IdeaSearchFitter',model:'Mixed Model',
    problem:'从一个符号拟合问题的表达式出发，生成新的候选表达式。',
    r:.92,pairs:1317,shown:graphData.scatter.length,points:graphData.scatter},
    ...(gptWordData?[gptWordData]:[]),
    ...crossTaskData.tasks];
  const datasets=allDatasets.filter(item=>item.id==='idea' || item.pairs>=MIN_PUBLIC_TASK_PAIRS);
  if(!datasets.some(item=>item.id===selectedRobustTask))selectedRobustTask=datasets[0].id;
  if(!select.options.length){
    datasets.forEach(item=>select.add(new Option(item.label,item.id)));
    select.addEventListener('change',()=>{selectedRobustTask=select.value;drawCrossTask();});
  } else {
    const current=[...select.options].map(option=>option.value);
    if(current.join('|')!==datasets.map(item=>item.id).join('|')){
      select.replaceChildren(...datasets.map(item=>new Option(item.label,item.id)));
    }
  }
  const task=datasets.find(item=>item.id===selectedRobustTask) || datasets[0];
  const canvas=$('#crossTaskCanvas'),ctx=setupCanvas(canvas,360);
  canvas.__draw=()=>{
    const {w,h}=canvas.__size,p={l:48,r:22,t:62,b:48};
    const points=seededTaskSample(task.points,PUBLIC_TASK_POINTS,task.id),limit=Math.ceil(Math.max(1,...points.flatMap(d=>[Math.abs(d.x),Math.abs(d.y)])));
    const sx=x=>p.l+(x+limit)/(2*limit)*(w-p.l-p.r);
    const sy=y=>h-p.b-(y+limit)/(2*limit)*(h-p.t-p.b);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    line(ctx,{x:sx(-limit),y:sy(-limit)},{x:sx(limit),y:sy(limit)},palette.deep,1.8,[6,5]);
    line(ctx,{x:p.l,y:sy(0)},{x:w-p.r,y:sy(0)},palette.grid);
    line(ctx,{x:sx(0),y:p.t},{x:sx(0),y:h-p.b},palette.grid);
    points.forEach(d=>{ctx.beginPath();ctx.arc(sx(d.x),sy(d.y),3,0,Math.PI*2);ctx.fillStyle='rgba(47,119,173,.55)';ctx.fill();});
    [-limit,0,limit].forEach(t=>{
      ctx.fillStyle='#58758e';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(t,sx(t),h-p.b+19);
      ctx.textAlign='right';ctx.fillText(t,p.l-8,sy(t)+4);
    });
    ctx.textAlign='left';ctx.fillStyle=palette.deep;ctx.font='600 14px sans-serif';
    ctx.fillText('log[T(g←f) / T(f←g)]',p.l,24);
    ctx.font='12px sans-serif';ctx.fillStyle='#58758e';ctx.fillText('虚线 y = x · 实测双向转移',p.l,44);
    ctx.textAlign='right';ctx.fillText('ΔV = V(f) − V(g)',w-p.r,h-10);
    canvas.dataset.task=task.id;canvas.dataset.points=points.length;
    canvas.dataset.source=task.id==='idea'
      ?'IdeaSearchFitter published plot sample'
      :task.id==='gpt5nano_sum100'?task.source:'public derived task slice';
  };
  canvas.__draw();
  const list=$('#crossTaskList');list.replaceChildren();
  const heading=document.createElement('h4');heading.textContent=task.label;
  const problem=document.createElement('p');problem.textContent=task.problem;
  const model=document.createElement('p');model.className='task-model';model.textContent=task.model;
  const statistic=document.createElement('strong');statistic.className='task-r';statistic.textContent='r = '+task.r.toFixed(2);
  const count=document.createElement('p');count.textContent=task.pairs.toLocaleString('en-US')+' 个合格双向对 · 展示 '+Math.min(PUBLIC_TASK_POINTS,task.points.length)+' 点';
  list.append(heading,problem,model,statistic,count);
  drawModelTimeline();
}
function drawModelTimeline(){
  const canvas=$('#timelineCanvas'),ctx=setupCanvas(canvas,340);
  canvas.__draw=()=>{
    const {w,h}=canvas.__size,p={l:w<400?39:54,r:w<400?27:42,t:48,b:72};
    const rows=crossTaskData.timeline;
    // Each task contributes a Pearson r between its log forward/reverse
    // ratio and fitted ΔV.  The exported timeline metric is
    // sum(n_t * r_t) / sum(n_t), where n_t is that task's qualified
    // bidirectional-state-pair count; the log values themselves are not
    // used as weights.
    const metric='pair_weighted_mean';
    const label='按双向状态对数量加权的任务 Pearson r';
    const values=rows.map(row=>Number(row[metric]));
    const [yMin,yMax]=[.65,.9];
    const sx=i=>p.l+i/Math.max(1,rows.length-1)*(w-p.l-p.r),sy=v=>h-p.b-(v-yMin)/(yMax-yMin)*(h-p.t-p.b);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    [.65,.7,.75,.8,.85,.9].forEach(v=>{
      line(ctx,{x:p.l,y:sy(v)},{x:w-p.r,y:sy(v)},palette.grid);
      ctx.fillStyle='#58758e';ctx.font='12px monospace';ctx.textAlign='right';ctx.fillText(v.toFixed(2),p.l-7,sy(v)+4);
    });
    for(let i=1;i<rows.length;i++)line(ctx,{x:sx(i-1),y:sy(values[i-1])},{x:sx(i),y:sy(values[i])},palette.blue,2.5);
    rows.forEach((row,i)=>{
      const x=sx(i),y=sy(values[i]);
      ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle=palette.gold;ctx.fill();ctx.strokeStyle=palette.deep;ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=palette.deep;ctx.font='600 12px monospace';ctx.textAlign='center';ctx.fillText(values[i].toFixed(2),x,y-14);
      // Keep the full published model name visible. On a narrow canvas split
      // only at hyphens; no Q3/Q3.7 abbreviations are introduced.
      const chunks=row.model.split('-');
      ctx.fillStyle='#58758e';ctx.font=(w<400?'8':'10')+'px monospace';
      const lines=[]; let current='';
      chunks.forEach((chunk,index)=>{
        const candidate=current?`${current}-${chunk}`:chunk;
        if(current && ctx.measureText(candidate).width>(w<400?74:145)){lines.push(current);current=chunk;}else current=candidate;
        if(index===chunks.length-1&&current)lines.push(current);
      });
      ctx.textAlign=i===0?'left':i===rows.length-1?'right':'center';
      lines.slice(0,3).forEach((text,lineIndex)=>ctx.fillText(text,i===0?p.l:i===rows.length-1?w-p.r:x,h-p.b+23+lineIndex*14));
    });
    ctx.fillStyle=palette.deep;ctx.font='600 14px sans-serif';ctx.textAlign='left';
    ctx.fillText(label,p.l,25);
    canvas.dataset.source='public derived model timeline';
    canvas.dataset.metric=metric;
    canvas.dataset.values=values.map(v=>v.toFixed(6)).join(',');
  };
  canvas.__draw();
}

// Application panel: real-state random walks under a target-domain bias.
// Each temperature uses the same deterministic seed; only the transition weights change.
// The control is a compact numerical parameterisation of the physical range
// β∈[0,∞]. The endpoint is the zero-temperature limit, not an arbitrary cap.
const BIAS_CONTROL_MAX=100;
function betaFromControl(control){
  const u=Math.max(0,Math.min(1,Number(control)/BIAS_CONTROL_MAX));
  return u>=1 ? Infinity : Math.tan(Math.PI*u/2);
}
const biasState={value:0,trajectory:[],running:false,timer:null};
const BIAS_SEED=1731;
let biasAdjacency=null;
function targetScore(node){const d=graphData.nodes;const xs=d.map(n=>n.logMSE),lo=Math.min(...xs),hi=Math.max(...xs);return 1-(node.logMSE-lo)/(hi-lo||1);}
function hitScore(node){if(!graphData||!node)return 0;const vals=graphData.nodes.map(n=>n.v),lo=Math.min(...vals),hi=Math.max(...vals);const potential=1-(node.v-lo)/(hi-lo||1);return Math.max(0,Math.min(1,.55*targetScore(node)+.45*potential));}
function hitColor(score){return mix('#dcecf8','#efb83e',Math.max(0,Math.min(1,score)));}
function getBiasAdjacency(){
  if(biasAdjacency||!graphData)return biasAdjacency;
  const out={};const observed=new Set();
  const add=(source,target,t,kind)=>{(out[source]??=[]).push({source,target,t,kind});};
  graphData.edges.forEach(e=>{add(e.source,e.target,e.t,'observed');observed.add(`${e.source}\u0000${e.target}`);});
  // Assumption B supplies a weak return channel when the public display slice
  // contains only the dominant direction. Its weight is derived from the
  // observed edge; it is a modelled leakage rail, never a new data record.
  graphData.edges.forEach(e=>{if(!observed.has(`${e.target}\u0000${e.source}`))add(e.target,e.source,e.t*.6,'modelled-return');});
  biasAdjacency=out;return out;
}
function sampleTrajectory(h){
  // Keep the original seed and finite walk budget. The walk is allowed to
  // revisit a state at most twice so the path remains readable.
  const outgoing=getBiasAdjacency();let seed=BIAS_SEED;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  let current='s67',path=[current],visits={[current]:1};
  for(let k=0;k<40;k++){
    const choices=(outgoing[current]||[]).filter(e=>(visits[e.target]||0)<3);if(!choices.length)break;
      const weighted=choices.map(e=>{
      const node=graphData.nodes.find(n=>n.id===e.target);
      // β=0 is the unbiased walk. Increasing β continuously favours states
      // with larger target utility; β=∞ is evaluated as the exact zero-
      // temperature limit below, without reversing the preference by hand.
      return targetScore(node);
    });
    let weights;
    if(!Number.isFinite(h)){
      const best=Math.max(...weighted), tolerance=1e-12;
      weights=choices.map((e,i)=>Math.abs(weighted[i]-best)<=tolerance?e.t:0);
    }else{
      const logWeights=choices.map((e,i)=>Math.log(Math.max(e.t,Number.MIN_VALUE))+h*weighted[i]);
      const pivot=Math.max(...logWeights);
      weights=logWeights.map(value=>Math.exp(value-pivot));
    }
    const total=weights.reduce((a,b)=>a+b,0);let r=rand()*total,chosen=choices[choices.length-1];
    for(let i=0;i<choices.length;i++){r-=weights[i];if(r<=0){chosen=choices[i];break;}}
    current=chosen.target;path.push(current);visits[current]=(visits[current]||0)+1;
  }
  return path;
}
// Keep the application view on the original, full-state axes.  The path and
// temperature change, but the coordinate frame stays fixed so the movement is
// comparable across the playback.
function drawBias(){
  const canvas=$('#biasCanvas'); if(!canvas)return;
  const ctx=setupCanvas(canvas,360);
  canvas.__draw=()=>{
    if(!graphData)return;
    const {w,h}=canvas.__size,d=graphData,left=70,right=w-22,top=46,bottom=h-58;
    const xs=d.nodes.map(n=>n.logMSE),values=d.frames.at(-1).v;
    const idx=Object.fromEntries(d.nodes.map((n,i)=>[n.id,i]));
    const minX=Math.min(...xs)-.35,maxX=Math.max(...xs)+.35;
    const minV=Math.min(...values)-2.4,maxV=Math.max(...values)+2.4;
    const sx=x=>left+(x-minX)/(maxX-minX||1)*(right-left);
    const sy=v=>bottom-(v-minV)/(maxV-minV||1)*(bottom-top);
    const P=Object.fromEntries(d.nodes.map(n=>[n.id,{x:sx(n.logMSE),y:sy(values[idx[n.id]])}]));
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    for(let i=0;i<=4;i++){const y=top+i*(bottom-top)/4;line(ctx,{x:left,y},{x:right,y},palette.grid,1,[3,4]);}
    line(ctx,{x:left,y:bottom},{x:right,y:bottom},'#87a2b7');
    line(ctx,{x:left,y:top},{x:left,y:bottom},'#87a2b7');
    textCanvas(ctx,'βV ↑',left,top-17);
    const betaLabel=Number.isFinite(biasState.value)?`β = ${biasState.value.toFixed(2)}`:'β = ∞';
    textCanvas(ctx,betaLabel,right,w<420?top+16:top-17,'right');
    textCanvas(ctx,'log₁₀(MSE) →',right,bottom+38,'right');
    const minPotential=d.nodes.reduce((best,n)=>n.v<best.v?n:best,d.nodes[0]);
    const minMSE=Math.min(...xs),pathNodes=pathNodesForBias(d,biasState.trajectory);
    const pathMSE=pathNodes.length?Math.min(...pathNodes.map(n=>n.logMSE)):minMSE;
    const marker=(x,color,dash)=>line(ctx,{x,y:top+2},{x,y:bottom},color,1.6,dash);
    marker(sx(minPotential.logMSE),'#7162c8',[6,5]);
    marker(sx(minMSE),'#b78c22',[3,5]);
    marker(sx(pathMSE),'#d95f59',[]);
    d.edges.filter(e=>e.t>=d.meta.displayThreshold).forEach(e=>{const a=P[e.source],b=P[e.target];if(a&&b)line(ctx,a,b,'rgba(79,150,204,.15)',Math.max(.7,e.t*3));});
    const vals=d.nodes.map(n=>n.v),vlo=Math.min(...vals),vhi=Math.max(...vals);
    d.nodes.forEach(n=>{const q=P[n.id];if(!q)return;ctx.beginPath();ctx.arc(q.x,q.y,3.8,0,Math.PI*2);const potential=1-(n.v-vlo)/(vhi-vlo||1),weighted=Math.max(0,Math.min(1,potential+.12*biasState.value*targetScore(n))),score=Math.max(0,Math.min(1,.55*targetScore(n)+.45*weighted));ctx.fillStyle=mix('#dcecf8','#efb83e',score);ctx.fill();ctx.strokeStyle='#527d9c';ctx.lineWidth=1;ctx.stroke();});
    const path=biasState.trajectory;
    ctx.save();
    for(let i=1;i<path.length;i++){const a=P[path[i-1]],b=P[path[i]];if(a&&b){const t=(i-1)/Math.max(1,path.length-2);arrowCanvas(ctx,a,b,mix('#4f96cc','#d95f59',t),2.3,5);}}
    ctx.restore();
    canvas.dataset.beta=Number.isFinite(biasState.value)?biasState.value.toFixed(2):'Infinity';
    canvas.dataset.bounds=JSON.stringify([minX,maxX,minV,maxV]);
    canvas.dataset.path=path.join(',');
  };
  canvas.__draw();
}
function pathNodesForBias(data,path){return path.map(id=>data.nodes.find(n=>n.id===id)).filter(Boolean);}
function textCanvas(ctx,s,x,y,align='left'){ctx.fillStyle='#173b62';ctx.font='12px DM Mono, monospace';ctx.textAlign=align;ctx.fillText(s,x,y);}
function arrowCanvas(ctx,a,b,color,width=1,head=7){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<2)return;const ux=dx/len,uy=dy/len,x=b.x-ux*5,y=b.y-uy*5;line(ctx,a,b,color,width);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-ux*head+uy*head*.6,y-uy*head-ux*head*.6);ctx.lineTo(x-ux*head-uy*head*.6,y-uy*head+ux*head*.6);ctx.fill();}
function updateBias(){const input=$('#biasRange');if(!input||!graphData)return;biasState.control=Number(input.value);biasState.value=betaFromControl(biasState.control);biasState.trajectory=sampleTrajectory(biasState.value);$('#biasValue').textContent=Number.isFinite(biasState.value)?biasState.value.toFixed(2):'∞';$('#biasTemperature').textContent=biasState.value===0?'T=∞':Number.isFinite(biasState.value)?`T≈${(1/biasState.value).toFixed(3)}`:'T=0';$('#biasDomain').textContent=biasState.value===0?'无偏置':biasState.value===Infinity?'零温极限':'连续偏置';const pathNodes=pathNodesForBias(graphData,biasState.trajectory),minLogMSE=pathNodes.length?Math.min(...pathNodes.map(n=>n.logMSE)):null;$('#biasHit').textContent=minLogMSE===null?'—':(10**minLogMSE).toPrecision(3);$('#biasCanvas')?.__draw();}
$('#biasRange')?.addEventListener('input',()=>{stopBias();updateBias();});
function stopBias(){biasState.running=false;clearInterval(biasState.timer);const button=$('#biasPlay');if(button)button.textContent='增加偏置 ↗';}
function playBias(){if(!graphData)return;if(biasState.running){stopBias();return;}if(biasState.control>=BIAS_CONTROL_MAX){$('#biasRange').value=0;updateBias();}biasState.running=true;$('#biasPlay').textContent='暂停';biasState.timer=setInterval(()=>{const next=Math.min(BIAS_CONTROL_MAX,biasState.control+1);$('#biasRange').value=next;updateBias();if(next>=BIAS_CONTROL_MAX)stopBias();},90);}
$('#biasPlay')?.addEventListener('click',playBias);
$('#biasReset')?.addEventListener('click',()=>{stopBias();$('#biasRange').value=0;updateBias();});

// Evidence tabs.
$$('.evidence-tab').forEach(tab=>tab.addEventListener('click',()=>{const panel=tab.dataset.panel;$$('.evidence-tab').forEach(item=>{const active=item===tab;item.classList.toggle('is-active',active);item.setAttribute('aria-selected',String(active));});$$('.evidence-panel').forEach(item=>{const active=item.id===`panel-${panel}`;item.hidden=!active;item.classList.toggle('is-active',active);});}));

drawDag(); drawMatrix(); drawSort(); drawScatter(); drawBias(); updateBias();
