import {students,makePeriodic,marchingCell} from './core.js';
import {loadSource} from './source-data.js';
import {meanAbsoluteAngle,bankHeight,curledPoint,pairedPalette,visionRgb} from './visual-math.js';

const ink='#244b64',orange='#db7751',teal='#4a9c9a';
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function frame(host,lang,saved={}){
  const d3=window.d3,L=(zh,en)=>lang==='zh'?zh:en,state={phase:3,...saved};
  host.innerHTML='<div class="lab-controls"></div><div class="lab-graphic"></div><div class="lab-readout" role="status" aria-live="polite"></div><div class="lab-detail"></div>';
  const controls=host.querySelector('.lab-controls'),detail=host.querySelector('.lab-detail'),readout=host.querySelector('.lab-readout');
  const svg=d3.select(host.querySelector('.lab-graphic')).append('svg').attr('viewBox','0 0 640 410').attr('role','img');
  const duration=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?0:650;
  let draw=()=>{};
  function select(key,label,options,value){
    if(state[key]===undefined)state[key]=value??options[0][0];
    const wrap=document.createElement('label');wrap.innerHTML=`<span>${label}</span>`;
    const input=document.createElement('select');input.dataset.labControl=key;input.setAttribute('aria-label',label);
    options.forEach(([v,text])=>input.add(new Option(text,v)));input.value=state[key];
    input.onchange=()=>{state[key]=input.value;draw();};wrap.append(input);controls.append(wrap);return input;
  }
  function range(key,label,min,max,value,step=1){
    if(state[key]===undefined)state[key]=value;
    const wrap=document.createElement('label');wrap.innerHTML=`<span>${label} <output>${state[key]}</output></span>`;
    const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=state[key];input.dataset.labControl=key;input.setAttribute('aria-label',label);
    input.oninput=()=>{state[key]=Number(input.value);wrap.querySelector('output').textContent=input.value;draw();};wrap.append(input);controls.append(wrap);return input;
  }
  function button(label,click){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=click;controls.append(b);return b;}
  function label(parent,x,y,value,size=13,color=ink){return parent.append('text').attr('x',x).attr('y',y).attr('font-size',size).attr('fill',color).text(value);}
  function update(selection){return selection.interrupt('lesson').transition('lesson').duration(duration());}
  function setValue(key,value){state[key]=value;const input=controls.querySelector(`[data-lab-control="${key}"]`);if(input){input.value=value;const output=input.parentElement.querySelector('output');if(output)output.textContent=value;}}
  return {d3,L,state,svg,controls,detail,readout,select,range,button,label,update,setValue,
    finish(fn){draw=fn;draw();return {setStep(phase){state.phase=phase;draw();},setComparison(value){state.compare=value;draw();},getState:()=>structuredClone(state),source:()=>draw.toString(),cleanup(){svg.selectAll('*').interrupt('lesson');}};}};
}

function arrayLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,select,range,label,update}=f;
  select('operation',L('数组操作','Array operation'),[['group','group'],['filter','filter'],['map','map'],['rollup','rollup'],['reduce','reduce']]);
  range('threshold',L('保留大于此值','Keep values greater than'),0,11,4);
  const raw=d3.range(1,13).map(value=>({id:value,value}));
  svg.attr('aria-label',L('数据块的筛选、映射与分组','Animated filtering, mapping and grouping of data blocks'));
  return f.finish(function draw(){
    const phase=state.phase,operation=phase===0?'raw':phase===1?'filter':phase===2?'map':state.operation;
    const kept=raw.filter(d=>d.value>state.threshold),shown=operation==='raw'?raw:kept;
    const nodes=svg.selectAll('g.array-token').data(raw,d=>d.id).join(enter=>{const g=enter.append('g').attr('class','array-token');g.append('rect').attr('width',70).attr('height',49).attr('rx',8);g.append('text').attr('x',35).attr('y',31).attr('text-anchor','middle').attr('fill','white').attr('font-size',19);g.append('title');return g;});
    const grouped=['group','rollup'].includes(operation);
    const positions=new Map(shown.map((d,i)=>[d.id,[30+(grouped?Math.floor(i/2):i%6)*95,grouped?85+(d.value%2)*130:85+Math.floor(i/6)*95]]));
    nodes.each(function(d,i){const point=positions.get(d.id)||[30+i%6*95,320];update(d3.select(this)).attr('transform',`translate(${point})`).attr('opacity',positions.has(d.id)?1:.15);});
    update(nodes.select('rect')).attr('fill',d=>grouped?(d.value%2?orange:teal):ink);
    nodes.select('text').text(d=>operation==='map'?d.value*2:d.value);nodes.select('title').text(d=>`key ${d.id}`);
    svg.selectAll('.array-heading').data([operation]).join('text').attr('class','array-heading').attr('x',30).attr('y',35).attr('fill',ink).attr('font-size',18).text(operation==='raw'?L('12 个原始值','12 input values'):grouped?L('按奇偶分组，保留每个值的身份','Group by parity, preserving each value’s identity'):`${operation}(…)`);
    svg.selectAll('.group-caption').data(grouped?[0,1]:[]).join('text').attr('class','group-caption').attr('x',30).attr('y',d=>67+d*130).attr('fill',d=>d?orange:teal).text(d=>`${d?L('奇数','Odd'):L('偶数','Even')} · ${kept.filter(x=>x.value%2===d).length}`);
    const result=operation==='reduce'?d3.sum(kept,d=>d.value):operation==='rollup'?Object.fromEntries(d3.rollup(kept,v=>v.length,d=>d.value%2)):operation==='map'?kept.map(d=>d.value*2):operation==='group'?Object.fromEntries(d3.group(kept,d=>d.value%2)):shown.map(d=>d.value);
    f.readout.textContent=`${operation} → ${JSON.stringify(result)} · ${L('原始数组始终有 12 项','Input still contains 12 items')}`;
    f.detail.innerHTML=operation==='reduce'?`<div class="big-result">Σ ${result}</div>`:'';
  });
}

function joinLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,select,label,update}=f;
  select('scenario',L('新数据','Next data'),[['replace','A B C → B C D'],['reorder','A B C → C A B'],['add','A B C → A B C D E'],['remove','A B C → B']]);
  const scenarios={replace:['B','C','D'],reorder:['C','A','B'],add:['A','B','C','D','E'],remove:['B']},old=['A','B','C'];
  const layers=[svg.append('g'),svg.append('g')];let lastPhase=-1,lastScenario=null;
  layers.forEach((g,row)=>{label(g,25,40+row*190,row?L('按稳定 key 匹配','Match by stable key'):L('按索引匹配','Match by index'),16);g.append('g').attr('class','join-marks');});
  state.applied??=true;
  f.button(L('应用新数据','Apply data'),()=>{state.phase=3;state.applied=true;draw();});
  f.button(L('重置','Reset'),()=>{state.phase=0;state.applied=false;draw();});
  function draw(){
    const phase=state.phase,next=phase===0?old:scenarios[state.scenario],counts=[];
    layers.forEach((layer,row)=>{
      const g=layer.select('.join-marks');
      const reset=lastPhase<0||phase<lastPhase||lastScenario!==state.scenario;
      if(reset)g.selectAll('*').remove();
      // An actual D3 selection is seeded with old data before each comparison.
      if(reset){const seeded=g.selectAll('g').data(old.map(id=>({id}))).join('g').attr('data-dom-id',(d,i)=>`node-${i+1}`).attr('data-before',d=>d.id).attr('transform',(d,i)=>`translate(${75+i*108},${100+row*190})`);
      seeded.append('circle').attr('r',29).attr('fill',ink);seeded.append('text').attr('class','datum-label').attr('text-anchor','middle').attr('dy',7).attr('font-size',23).attr('fill','white').text(d=>d.id);}
      const bound=g.selectAll('g').data(next.map(id=>({id})),row?d=>d.id:undefined);
      counts.push({enter:bound.enter().data().map(d=>d.id),update:bound.data().map(d=>d.id),exit:bound.exit().data().map(d=>d.id)});
      let merged=bound;
      if(phase>=2){const entered=bound.enter().append('g').attr('data-dom-id',d=>`new-${d.id}`).attr('data-before',d=>d.id).attr('transform',`translate(595,${100+row*190})`);
      entered.append('circle').attr('r',29).attr('fill',orange);entered.append('text').attr('class','datum-label').attr('text-anchor','middle').attr('dy',7).attr('font-size',23).attr('fill','white').text(d=>d.id);merged=entered.merge(bound);}
      if(phase>=2)bound.exit().select('circle').attr('fill','#c76c64');
      if(phase>=3)bound.exit().remove();
      merged.select('.datum-label').text(function(d){return phase>=2?d.id:this.parentElement.dataset.before;});
      if(phase>=3)update(merged).attr('transform',(d,i)=>`translate(${75+i*108},${100+row*190})`);
      merged.selectAll('text.dom-label').data(d=>[d]).join('text').attr('class','dom-label').attr('dy',57).attr('text-anchor','middle').attr('fill','#688396').attr('font-size',13).text(function(){return this.parentElement.dataset.domId;});
    });
    lastPhase=phase;lastScenario=state.scenario;
    f.readout.textContent=counts.map((c,i)=>`${i?'key':'index'}: enter ${c.enter.join(',')||'∅'} · update ${c.update.join(',')||'∅'} · exit ${c.exit.join(',')||'∅'}`).join(' | ');
    f.detail.innerHTML=`<p>${L('同一批旧 DOM，上图按位置复用，下图按字母身份复用。重排时尤其注意 node 编号。','The same old DOM nodes are reused by index above and by identity below. Track node numbers while reordering.')}</p>`;
  }
  return f.finish(draw);
}

function treeLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,select,label,update}=f;
  select('field',L('第一层分组','First grouping key'),[['major',L('专业','Major')],['class',L('班级','Class')]]);
  select('orientation',L('树方向','Tree orientation'),[['horizontal',L('横向','Horizontal')],['vertical',L('纵向','Vertical')]]);
  const rows=students;
  return f.finish(function draw(){
    const phase=state.phase,group=d3.group(rows,d=>d[state.field]),json={name:L('记录','Records'),children:Array.from(group,([name,members])=>state.field==='class'?{name,value:members.length,ids:members.map(d=>d.id)}:{name,children:Array.from(d3.group(members,d=>d.class),([name,members])=>({name,value:members.length,ids:members.map(d=>d.id)}))})};
    const root=d3.hierarchy(json);d3.tree().size(state.orientation==='horizontal'?[340,490]:[555,285])(root);
    const nodes=root.descendants().map((node,i)=>({node,id:node.ancestors().map(n=>n.data.name).join('/'),i}));
    const position=d=>{
      if(phase===0)return [50+(d.i%4)*146,60+Math.floor(d.i/4)*55];
      if(phase===1)return [50+(d.node.depth)*180,50+(d.i%6)*55];
      return state.orientation==='horizontal'?[65+d.node.y,32+d.node.x]:[45+d.node.x,50+d.node.y];
    };
    const links=svg.selectAll('path.tree-link').data(phase>=3?root.links():[],d=>d.target.data.name).join('path').attr('class','tree-link').attr('fill','none').attr('stroke','#a8c5d4').attr('stroke-width',1.7);
    update(links).attr('d',d=>{const a=position(nodes.find(n=>n.node===d.source)),b=position(nodes.find(n=>n.node===d.target));return d3.linkHorizontal()({source:a,target:b});});
    const marks=svg.selectAll('g.tree-node').data(nodes,d=>d.id).join(enter=>{const g=enter.append('g').attr('class','tree-node');g.append('rect').attr('x',-28).attr('y',-15).attr('width',82).attr('height',31).attr('rx',7);g.append('text').attr('x',-20).attr('dy',5).attr('font-size',11);g.append('title');return g;});
    update(marks).attr('transform',d=>`translate(${position(d)})`);
    update(marks.select('rect')).attr('fill',d=>d.node.depth===0?ink:d.node.depth===1?teal:'#eaf2f5');
    marks.select('text').attr('fill',d=>d.node.depth<2?'white':ink).text(d=>d.node.data.name);
    marks.select('title').text(d=>d.id);marks.attr('tabindex',0).attr('role','button').attr('aria-label',d=>d.node.data.name).on('click',(event,d)=>{state.selected=d.id;marks.select('rect').attr('stroke',x=>x.id===state.selected?orange:'none').attr('stroke-width',3);f.readout.textContent=d.id;});
    f.readout.textContent=L(`80 条记录 → ${group.size} 组 → ${root.descendants().length} 个树节点`,`80 records → ${group.size} groups → ${root.descendants().length} tree nodes`);
    f.detail.innerHTML=phase===1?`<details open><summary>JSON / children</summary><pre>${esc(JSON.stringify(json,null,2))}</pre></details>`:phase===0?`<div class="source-table"><table><thead><tr><th>ID</th><th>${L('专业','Major')}</th><th>${L('班级','Class')}</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${row.id}</td><td>${row.major}</td><td>${row.class}</td></tr>`).join('')}</tbody></table></div>`:'';
  });
}

function paletteLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,range,select,label,update}=f;
  range('hue',L('主色相 H','Base hue H'),0,359,205);range('saturation',L('主色饱和度 S','Base saturation S'),30,95,78);range('lightness',L('主色明度 L','Base lightness L'),25,70,46);
  select('count',L('颜色数量','Color count'),[['5','5'],['6','6'],['7','7']],'7');
  return f.finish(function draw(){
    const palette=pairedPalette(state.hue,state.saturation,state.lightness,Number(state.count)),color=d=>d3.hsl(d.h,d.s/100,d.l/100).formatHex();
    const shown=state.phase===0?palette.slice(0,1):state.phase===1?palette.filter(d=>d.role==='vivid'):palette;
    const strips=svg.selectAll('g.palette-pair').data(shown,(d,i)=>i).join(enter=>{const g=enter.append('g').attr('class','palette-pair');g.append('rect').attr('width',76).attr('height',80).attr('rx',7);g.append('text').attr('y',105).attr('font-size',10);return g;});
    update(strips).attr('transform',(d,i)=>`translate(${25+i*86},30)`);update(strips.select('rect')).attr('fill',color);strips.select('text').text(color).attr('fill',ink);
    const bars=svg.selectAll('rect.palette-bar').data(state.phase>=3?d3.range(18):[]).join('rect').attr('class','palette-bar').attr('width',24);
    update(bars).attr('x',i=>30+i*32).attr('y',i=>350-(40+i*37%140)).attr('height',i=>40+i*37%140).attr('fill',i=>color(palette[i%palette.length]));
    f.readout.textContent=L('每种主色各有鲜艳与低饱和伙伴；最后一色用于背景。','Each vivid hue has a muted companion; the final color is a background.');
    f.detail.innerHTML=`<div class="palette-values">${shown.map(d=>`<button data-color="${color(d)}" title="${L('复制 HEX','Copy HEX')}"><i style="background:${color(d)}"></i>${color(d)} <small>${d.role==='vivid'?L('鲜艳','vivid'):d.role==='muted'?L('低饱和','muted'):L('背景','background')}</small></button>`).join('')}</div>`;
    f.detail.querySelectorAll('[data-color]').forEach(button=>button.onclick=async()=>{try{await navigator.clipboard.writeText(button.dataset.color);button.title=L('已复制','Copied');}catch{button.title=button.dataset.color;}});
  });
}

function cvdLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,select,label,update}=f;
  select('vision',L('对比视角','Compare vision'),[['deutan',L('绿色觉缺失','Deuteranopia')],['protan',L('红色觉缺失','Protanopia')],['tritan',L('蓝色觉缺失','Tritanopia')],['normal',L('原色','Original')]]);
  const palette=['#0072b2','#e69f00','#009e73','#cc79a7','#56b4e9'];
  const transform=color=>`rgb(${visionRgb(d3.rgb(color).rgb().toString().match(/[\d.]+/g).slice(0,3).map(Number),state.phase===0?'normal':state.vision).join(',')})`;
  svg.attr('viewBox','0 0 640 575');
  return f.finish(function draw(){
    svg.selectAll('*').remove();
    const titles=L(['类别散点：颜色 + 形状','顺序热图：Viridis','红绿柱图：颜色混淆'],['Categorical scatter: color + shape','Sequential heatmap: Viridis','Red–green bars: color confusion']);
    [0,1,2].forEach(row=>{
      label(svg,20,28+row*180,titles[row],14);label(svg,25,52+row*180,L('原始视角','Original'),11,'#6e8798');label(svg,345,52+row*180,L('色觉对比镜','Vision comparison'),11,'#6e8798');
      [false,true].forEach(compare=>{
        const g=svg.append('g').attr('transform',`translate(${compare?340:20},${65+row*180})`),paint=c=>compare?transform(c):c;
        if(row===0){g.selectAll('path').data(d3.range(40)).join('path').attr('transform',i=>`translate(${15+i*43%265},${12+i*31%90})`).attr('d',i=>d3.symbol().type(state.phase>=3?d3.symbols[i%5]:d3.symbolCircle).size(65)()).attr('fill',i=>paint(palette[i%5]));}
        else if(row===1)g.selectAll('rect').data(d3.range(70)).join('rect').attr('x',i=>i%14*20).attr('y',i=>Math.floor(i/14)*21).attr('width',19).attr('height',20).attr('fill',i=>paint(d3.interpolateViridis(i/69)));
        else{g.selectAll('rect').data([53,78,65,89,72,95]).join('rect').attr('x',(d,i)=>i*45+7).attr('y',d=>108-d).attr('width',29).attr('height',d=>d).attr('fill',(d,i)=>paint(state.phase>=3?['#0072b2','#e69f00'][i%2]:['#dc2626','#16a34a'][i%2]));if(state.phase>=3)g.selectAll('text').data([53,78,65,89,72,95]).join('text').attr('x',(d,i)=>i*45+21).attr('y',d=>103-d).attr('text-anchor','middle').attr('font-size',11).text(d=>d);}
        if(row===2&&compare&&state.phase===2)g.append('rect').attr('class','confusion-focus').attr('x',2).attr('y',2).attr('width',86).attr('height',110).attr('fill','none').attr('stroke',orange).attr('stroke-width',2).attr('stroke-dasharray','4 3');
      });
    });
    f.readout.textContent=L('三类图同时对照。最后一步用形状、标签与蓝橙配色补充颜色信息。','Compare three chart types. The last step adds shapes, labels and a blue–orange palette.');
  });
}

const curveNames=['Linear','MonotoneX','Natural','Basis','Cardinal','CatmullRom','Step','StepBefore','StepAfter','Bundle'];
export const curveFunctions=d3=>[d3.curveLinear,d3.curveMonotoneX,d3.curveNatural,d3.curveBasis,d3.curveCardinal,d3.curveCatmullRom.alpha(.5),d3.curveStep,d3.curveStepBefore,d3.curveStepAfter,d3.curveBundle.beta(.85)];
function curveLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,select,label,update}=f;
  select('curve',L('高亮曲线','Highlight curve'),curveNames.map((name,i)=>[String(i),name]),'4');
  select('dataset',L('采样数据','Sample data'),[['peaks',L('峰谷测试','Peak test')],['crime',L('原课程 Crime 数据','Original Crime data')]]);
  select('display',L('显示方式','Display'),[['all',L('十种叠加','Overlay ten')],['pair',L('Cardinal / MonotoneX','Cardinal / MonotoneX')],['single',L('单条曲线','Single curve')]]);
  let crime=null,dead=false;
  loadSource('crime.csv').then(rows=>{if(dead)return;crime=rows;draw();}).catch(error=>f.readout.textContent=error.message);
  const points=[[0,3],[1,3],[2,9],[3,9],[4,2],[5,2],[6,8],[7,8]];
  function draw(){
    const data=state.dataset==='crime'&&crime?[...crime].sort((a,b)=>a.population-b.population).map(d=>[Math.log10(d.population),d.murder]):points;
    const x=d3.scaleLinear().domain(d3.extent(data,d=>d[0])).range([45,610]),y=d3.scaleLinear().domain([0,d3.max(data,d=>d[1])*1.15]).range([335,32]);
    const regions=state.dataset==='peaks'&&state.phase>=2?[[32,y(9)],[y(2),335]]:[];
    svg.selectAll('rect.overshoot-band').data(regions).join('rect').attr('class','overshoot-band').attr('x',45).attr('width',565).attr('y',d=>d[0]).attr('height',d=>d[1]-d[0]).attr('fill','#efba902b').lower();
    svg.selectAll('text.overshoot-label').data(regions.length?[0]:[]).join('text').attr('class','overshoot-label').attr('x',53).attr('y',y(9)-7).attr('fill','#b37b51').attr('font-size',10).text(L('高于采样上限：注意越界','Above sampled maximum: inspect overshoot'));
    svg.selectAll('g.axis-x').data([0]).join('g').attr('class','axis-x').attr('transform','translate(0,335)').call(d3.axisBottom(x).ticks(6));
    svg.selectAll('g.axis-y').data([0]).join('g').attr('class','axis-y').attr('transform','translate(45,0)').call(d3.axisLeft(y).ticks(5));
    const indices=state.phase===0?[]:state.phase===1?[0]:state.phase===2?[1,4]:state.display==='pair'?[1,4]:state.display==='single'?[Number(state.curve)]:d3.range(10);
    const colors=d3.schemeTableau10;
    const paths=svg.selectAll('path.interpolation').data(indices,d=>d).join('path').attr('class','interpolation').attr('fill','none').attr('stroke',i=>colors[i]).attr('data-curve',i=>curveNames[i]);
    // All ten interpolators receive the exact same sorted sample coordinates.
    update(paths).attr('d',i=>d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(curveFunctions(d3)[i])(data)).attr('stroke-width',i=>i===Number(state.curve)?4:1.8).attr('opacity',i=>i===Number(state.curve)||state.display==='pair'?1:.4);
    svg.selectAll('circle.sample').data(data).join('circle').attr('class','sample').attr('cx',d=>x(d[0])).attr('cy',d=>y(d[1])).attr('r',4).attr('fill','white').attr('stroke',ink).attr('stroke-width',1.8).raise();
    f.detail.innerHTML=`<div class="curve-legend">${curveNames.map((name,i)=>`<button data-curve="${i}" aria-pressed="${Number(state.curve)===i}"><i style="background:${colors[i]}"></i>${name}</button>`).join('')}</div>`;
    f.detail.querySelectorAll('[data-curve]').forEach(b=>b.onclick=()=>{f.setValue('curve',b.dataset.curve);draw();});
    f.readout.textContent=L('峰谷测试中的平台段可出现 Cardinal 越界；MonotoneX 保留相邻点的单调性。插值曲线与统计回归是不同的运算。','Flat plateaus expose Cardinal overshoot; MonotoneX preserves monotonicity between samples. Interpolation and statistical regression are different operations.');
  }
  const api=f.finish(draw),cleanup=api.cleanup;api.cleanup=()=>{dead=true;cleanup();};return api;
}

function bankLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,range,label,update}=f;
  const points=[[0,.14],[.15,.30],[.29,.26],[.44,.55],[.59,.46],[.73,.76],[.87,.64],[1,.90]],width=550;
  range('height',L('绘图区高度','Plot height'),80,780,Math.round(bankHeight(points,width)));
  f.button(L('调整到平均 45°','Bank to mean 45°'),()=>{f.setValue('height',Math.round(bankHeight(points,width)));draw();});
  function draw(){
    const height=Number(state.height),angle=meanAbsoluteAngle(points,width,height);
    svg.attr('viewBox',`0 0 640 ${height+90}`);
    const line=d3.line().x(d=>45+d[0]*width).y(d=>height+30-d[1]*height);
    svg.selectAll('g.bank-y').data([0]).join('g').attr('class','bank-y').attr('transform','translate(45,30)').call(d3.axisLeft(d3.scaleLinear([0,1],[height,0])).ticks(5));
    svg.selectAll('g.bank-x').data([0]).join('g').attr('class','bank-x').attr('transform',`translate(45,${height+30})`).call(d3.axisBottom(d3.scaleLinear([0,1],[0,width])).ticks(6));
    const path=svg.selectAll('path.bank-line').data([points]).join('path').attr('class','bank-line').attr('fill','none').attr('stroke',teal).attr('stroke-width',3);
    update(path).attr('d',line);
    svg.selectAll('circle.bank-point').data(points).join('circle').attr('class','bank-point').attr('cx',d=>45+d[0]*width).attr('cy',d=>height+30-d[1]*height).attr('r',4).attr('fill',orange);
    const measure=svg.selectAll('g.angle-measure').data(state.phase>=2?[0]:[]).join('g').attr('class','angle-measure').attr('transform',`translate(45,${height+30-points[0][1]*height})`);measure.selectAll('*').remove();
    const theta=Math.atan2((points[1][1]-points[0][1])*height,(points[1][0]-points[0][0])*width);
    measure.append('path').attr('d',`M0,0H45M30,0A30,30 0 0 0 ${30*Math.cos(theta)},${-30*Math.sin(theta)}`).attr('fill','none').attr('stroke',orange).attr('stroke-width',1.5);label(measure,37,-8,'θ₁',13,orange);
    f.readout.innerHTML=state.phase>=2?`<strong>${angle.toFixed(1)}°</strong><span>${L('平均绝对倾角','Mean absolute angle')} · H/W = ${(height/width).toFixed(3)}</span>`:`${L('数据固定，绘图区','Values fixed; plot size')} ${width} × ${height}`;
    f.detail.innerHTML=state.phase>=2?`<p>θᵢ = atan(|Δyᵢ| · H / (|Δxᵢ| · W))</p><p>${L('本计算器使用未加权的平均绝对倾角。数据值保持不变，只调整绘图区比例。','This calculator uses the unweighted mean absolute angle. Values stay fixed while the plotting aspect ratio changes.')}</p>`:'';
  }
  const api=f.finish(draw),setStep=api.setStep;api.setStep=phase=>{if(phase===0)f.setValue('height',230);if(phase===1)f.setValue('height',100);if(phase===3)f.setValue('height',Math.round(bankHeight(points,width)));setStep(phase);};return api;
}

function spiralLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,range,label,update}=f;
  range('curl',L('折线 → 螺旋','Line → spiral'),0,100,100);range('period',L('每圈天数','Days per turn'),7,28,14);
  const data=makePeriodic(),min=d3.min(data,d=>d.value??d),max=d3.max(data,d=>d.value??d);
  const values=data.slice(0,84).map((d,i)=>({id:i,value:typeof d==='number'?d:d.value}));
  function draw(){
    const amount=state.curl/100,points=values.map((d,i)=>curledPoint(i/(values.length-1),(d.value-min)/(max-min),amount,state.period));
    svg.selectAll('path.spiral-track').data([points]).join('path').attr('class','spiral-track').attr('fill','none').attr('stroke','#b9cbd6').attr('stroke-width',1.4).attr('d',d3.line());
    const circles=svg.selectAll('circle.spiral-observation').data(values,d=>d.id).join('circle').attr('class','spiral-observation').attr('r',4.3).attr('fill',d=>d3.interpolateViridis((d.value-min)/(max-min)));
    circles.attr('cx',(d,i)=>points[i][0]).attr('cy',(d,i)=>points[i][1]);
    circles.on('click',(event,d)=>{state.selected=d.id;f.readout.textContent=`${L('第','Day ')}${d.id+1}${L('天','')} · ${d.value.toFixed(2)}`;});
    f.readout.textContent=L(`卷曲 ${state.curl}% · 每圈 ${state.period} 天 · 84 个点保持同一编号`,`Curl ${state.curl}% · ${state.period} days/turn · 84 points keep the same IDs`);
    f.detail.innerHTML=`<p>${L('拖动滑块时，同一个观测点从直线坐标连续移动到极坐标；改变每圈天数，再观察周期是否对齐。','Each observation moves continuously from Cartesian to polar coordinates. Change days per turn and inspect alignment.')}</p>`;
  }
  const api=f.finish(draw),setStep=api.setStep;api.setStep=phase=>{f.setValue('curl',[0,20,60,100][phase]);setStep(phase);};return api;
}

function contourLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,range,label,update}=f;
  range('iso',L('等值阈值','Contour threshold'),-20,45,12);state.cell??=44;
  selectGrid();let field=null,dead=false;
  function selectGrid(){f.select('grid',L('背景网格','Background grid'),[['off',L('隐藏','Hide')],['on',L('显示采样','Show samples')]]);}
  svg.attr('viewBox','0 0 930 570');
  loadSource('terrain10.csv').then(rows=>{if(dead)return;field=(saved?.field||rows).map(row=>[...row]);draw();}).catch(error=>f.readout.textContent=error.message);
  function draw(){
    if(!field){f.readout.textContent=L('正在读取原课程地形数据…','Loading the original terrain…');return;}
    const n=field[0].length,m=field.length,flat=field.flat(),scale=50,path=d3.geoPath(d3.geoIdentity().scale(scale));
    const thresholds=state.phase<1?[]:state.phase<3?[Number(state.iso)]:d3.range(-20,46,5),contours=d3.contours().size([n,m]).thresholds(thresholds)(flat);
    const color=d3.scaleSequential(d3.interpolateYlGnBu).domain([-20,45]);
    let group=svg.selectAll('g.terrain').data([0]).join('g').attr('class','terrain').attr('transform','translate(20,30)');
    group.selectAll('rect.terrain-background').data([0]).join('rect').attr('class','terrain-background').attr('width',n*scale).attr('height',m*scale).attr('fill','#edf4f6');
    const polygons=group.selectAll('path.contour-region').data(contours,d=>d.value).join('path').attr('class','contour-region').attr('d',path).attr('stroke','#24556b').attr('stroke-width',.7);
    update(polygons).attr('fill',d=>state.phase>=3?color(d.value):'#91bebd').attr('opacity',.88);
    const active=d3.contours().size([n,m]).thresholds([Number(state.iso)])(flat);
    group.selectAll('path.active-isoline').data(state.phase>=1?active:[]).join('path').attr('class','active-isoline').attr('d',path).attr('fill','none').attr('stroke',orange).attr('stroke-width',2.5);
    group.selectAll('circle.field-sample').data(state.grid==='on'||state.phase===0?flat:[]).join('circle').attr('class','field-sample').attr('cx',(d,i)=>(i%n+.5)*scale).attr('cy',(d,i)=>(Math.floor(i/n)+.5)*scale).attr('r',3.3).attr('fill',d=>color(d));
    const cx=state.cell%(n-1),cy=Math.floor(state.cell/(n-1));
    group.selectAll('rect.selected-cell').data([0]).join('rect').attr('class','selected-cell').attr('x',(cx+.5)*scale).attr('y',(cy+.5)*scale).attr('width',scale).attr('height',scale).attr('fill','#fff2').attr('stroke',orange).attr('stroke-width',2.5).style('pointer-events','none');
    group.on('click',event=>{const [x,y]=d3.pointer(event,group.node());state.cell=Math.max(0,Math.min(m-2,Math.floor(y/scale-.5)))*(n-1)+Math.max(0,Math.min(n-2,Math.floor(x/scale-.5)));draw();});
    const corners=[field[cy][cx],field[cy][cx+1],field[cy+1][cx+1],field[cy+1][cx]],cell=marchingCell(corners,Number(state.iso));
    f.readout.textContent=`terrain10.csv · ${n} × ${m} · ${L('单格','Cell')} (${cx}, ${cy}) · case ${cell.code}`;
    f.detail.innerHTML=`<div class="cell-workbench"><div><p>${L('左侧：完整二维场。右侧：选中单格。','Left: full field. Right: the selected cell.')}</p><p>${L('改动四角，会同时重算整个地形的等值区域。','Editing a corner recomputes the field contours.')}</p><div class="cell-corners">${corners.map((v,i)=>`<label>v${i}<input type="number" data-corner="${i}" value="${v.toFixed(2)}" step="1"></label>`).join('')}</div></div><details><summary>${L('全部 16 种状态','All 16 cases')}</summary><div class="cell-cases">${d3.range(16).map(i=>`<button data-case="${i}" aria-pressed="${cell.code===i}">${i}</button>`).join('')}</div></details></div>`;
    const box=svg.selectAll('g.selected-cell-detail').data([0]).join('g').attr('class','selected-cell-detail').attr('transform','translate(570,145)');box.selectAll('*').remove();
    label(box,30,-18,L('选中单格','Selected cell'),20);label(box,30,240,`case ${cell.code} · iso ${state.iso}`,17);
    const pts=[[35,35],[215,35],[215,195],[35,195]],map=p=>[35+p[0]*180,35+p[1]*160];
    box.append('rect').attr('x',35).attr('y',35).attr('width',180).attr('height',160).attr('fill','#eaf1f5').attr('stroke','#b6cbd7');
    pts.forEach(([x,y],i)=>{box.append('circle').attr('cx',x).attr('cy',y).attr('r',13).attr('fill',state.phase>=1?(cell.high[i]?ink:'#b6cbd7'):'#fff');box.append('text').attr('x',x).attr('y',y+4).attr('text-anchor','middle').attr('font-size',10).attr('fill',cell.high[i]?'white':ink).text(state.phase>=1?+cell.high[i]:Math.round(corners[i]));});
    if(state.phase>=2)cell.crossings.forEach(c=>{const [x,y]=map(c.point);box.append('circle').attr('cx',x).attr('cy',y).attr('r',5).attr('fill',orange);});
    if(state.phase>=3)cell.segments.forEach(segment=>box.append('path').attr('d',d3.line()(segment.map(map))).attr('fill','none').attr('stroke',orange).attr('stroke-width',3));
    const setCorners=values=>{[[cy,cx],[cy,cx+1],[cy+1,cx+1],[cy+1,cx]].forEach(([y,x],i)=>field[y][x]=values[i]);draw();};
    f.detail.querySelectorAll('[data-corner]').forEach(input=>input.onchange=()=>{corners[Number(input.dataset.corner)]=Number(input.value);setCorners(corners);});
    f.detail.querySelectorAll('[data-case]').forEach(button=>button.onclick=()=>setCorners([0,1,2,3].map(i=>Number(state.iso)+(Number(button.dataset.case)&(1<<i)?8:-8))));
  }
  const api=f.finish(draw),cleanup=api.cleanup;api.getState=()=>({...structuredClone(state),field});api.cleanup=()=>{dead=true;cleanup();};return api;
}

function crimeLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,select,label,update}=f;
  select('view',L('Crime 1985 视图','Crime 1985 view'),[['ratio',L('性别差比例排序','Ranked gender difference')],['scatter',L('男女人数散点','Male–female scatter')],['parallel',L('三维平行坐标','Three-axis parallel coordinates')],['table',L('宽表 / 长表','Wide / long table')]],'parallel');
  let rows=null,dead=false;loadSource('crime1985.csv').then(value=>{if(dead)return;rows=value;draw();}).catch(error=>f.readout.textContent=error.message);
  function draw(){
    if(!rows){f.readout.textContent=L('正在读取原课程 Crime 1985…','Loading the original Crime 1985…');return;}
    svg.selectAll('*').remove();
    const mode=state.phase===0?'table':state.phase===1?'long':state.phase===2?'scatter':state.view;
    f.detail.innerHTML='';
    if(mode==='table'||mode==='long'){
      svg.attr('viewBox','0 0 640 130');label(svg,25,45,mode==='long'?L('一行 = 类别 × 性别','One row = category × gender'):L('一行 = 一类犯罪记录','One row = one crime category'),18);
      label(svg,25,90,mode==='long'?'flatMap → { category, gender, value }':'{ category, male, female }',15,teal);
      const values=mode==='long'?rows.flatMap(d=>[{name:d.name,gender:L('男','Male'),value:d.male},{name:d.name,gender:L('女','Female'),value:d.female}]):rows;
      f.detail.innerHTML=`<div class="source-table"><table><thead><tr><th>${L('类别','Category')}</th>${mode==='long'?'<th>gender</th><th>value</th>':'<th>male</th><th>female</th>'}</tr></thead><tbody>${values.map(d=>`<tr><th>${esc(d.name)}</th><td>${mode==='long'?d.gender:d.male}</td><td>${mode==='long'?d.value:d.female}</td></tr>`).join('')}</tbody></table></div>`;
    }else if(mode==='ratio'){
      const sorted=[...rows].sort((a,b)=>b.ratio-a.ratio),h=Math.max(380,sorted.length*22+65);svg.attr('viewBox',`0 0 640 ${h}`);
      const x=d3.scaleLinear([-1,1],[180,600]),y=d3.scaleBand(sorted.map(d=>d.id),[30,h-45]).padding(.2);
      svg.append('g').attr('transform',`translate(0,${h-40})`).call(d3.axisBottom(x).ticks(5));
      sorted.forEach(d=>{label(svg,10,y(d.id)+y.bandwidth()*.8,d.name,11);svg.append('line').attr('x1',x(0)).attr('x2',x(d.ratio)).attr('y1',y(d.id)+7).attr('y2',y(d.id)+7).attr('stroke','#bbcdd8');svg.append('circle').attr('cx',x(d.ratio)).attr('cy',y(d.id)+7).attr('r',4).attr('fill',d.ratio>=0?ink:orange).append('title').text(`${d.name}: ${d.ratio.toFixed(3)}`);});
    }else if(mode==='scatter'){
      svg.attr('viewBox','0 0 640 410');const domain=[0,d3.max(rows,d=>Math.max(d.male,d.female))*1.2],x=d3.scaleSymlog(domain,[55,600]),y=d3.scaleSymlog(domain,[345,25]);
      svg.append('g').attr('transform','translate(0,345)').call(d3.axisBottom(x).ticks(5,'~s'));svg.append('g').attr('transform','translate(55,0)').call(d3.axisLeft(y).ticks(5,'~s'));
      svg.append('line').attr('x1',55).attr('x2',600).attr('y1',345).attr('y2',25).attr('stroke','#b6cbd5').attr('stroke-dasharray','4 4');
      rows.forEach(d=>svg.append('circle').attr('cx',x(d.male)).attr('cy',y(d.female)).attr('r',5).attr('fill',d.ratio>=0?ink:orange).attr('opacity',.75).append('title').text(`${d.name}: male ${d.male}, female ${d.female}`));
      label(svg,460,390,L('男性人数 · symlog','Male count · symlog'));label(svg,60,20,L('女性人数','Female count'));
    }else{
      svg.attr('viewBox','0 0 640 410');const keys=['male','female','ratio'],scales=keys.map(key=>d3.scaleLinear(d3.extent(rows,d=>d[key]),[345,35]));
      keys.forEach((key,i)=>{const x=65+i*250;svg.append('g').attr('transform',`translate(${x},0)`).call(d3.axisLeft(scales[i]).ticks(5));label(svg,x-10,385,key,13);});
      const lines=svg.selectAll('path.parallel-line').data(rows).join('path').attr('class','parallel-line').attr('d',d=>d3.line()(keys.map((key,i)=>[65+i*250,scales[i](d[key])]))).attr('fill','none').attr('stroke',d=>d.ratio>=0?ink:orange).attr('opacity',.25).attr('stroke-width',1.5);
      lines.on('mouseenter',function(event,d){lines.attr('opacity',.12);d3.select(this).attr('opacity',1).attr('stroke-width',3).raise();f.readout.textContent=d.name;}).on('mouseleave',()=>lines.attr('opacity',.25).attr('stroke-width',1.5));lines.append('title').text(d=>d.name);
    }
    f.readout.textContent=L(`${rows.length} 类 · 原课程 1985CrimeGender.csv · 差比例 = (男−女)/(男+女)`,`${rows.length} categories · original 1985CrimeGender.csv · difference = (male−female)/(male+female)`);
  }
  const api=f.finish(draw),cleanup=api.cleanup;api.cleanup=()=>{dead=true;cleanup();};return api;
}

function semanticsLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,select,label,update}=f;
  select('meaning',L('字段含义','Attribute meaning'),[['count',L('人数：比率','Count: ratio')],['temperature',L('摄氏温度：区间','Celsius: interval')],['rank',L('名次：序数','Rank: ordinal')],['id',L('编号：类别','ID: categorical')]]);
  return f.finish(function draw(){
    const values=[5,10,15,20],x=d3.scaleLinear([0,20],[0,460]),color=state.meaning==='id'?d3.scaleOrdinal(values,d3.schemeTableau10):d3.scaleSequential(d3.interpolateViridis).domain([0,20]);
    svg.selectAll('g.attribute-axis').data([0]).join('g').attr('class','attribute-axis').attr('transform','translate(110,340)').call(d3.axisBottom(d3.scaleLinear([0,20],[0,460])));
    const rows=svg.selectAll('g.attribute-row').data(values).join(enter=>{const g=enter.append('g').attr('class','attribute-row');g.append('rect').attr('height',34).attr('rx',4);g.append('circle').attr('r',7);g.append('text').attr('x',-65).attr('dy',21).attr('font-size',17);return g;}).attr('transform',(d,i)=>`translate(110,${48+i*66})`);
    update(rows.select('rect')).attr('width',d=>state.phase===0?60:x(d)).attr('fill',d=>state.phase>=2?color(d):ink).attr('opacity',.8);
    update(rows.select('circle')).attr('cx',d=>x(d)).attr('cy',17).attr('fill',orange).attr('opacity',state.phase>=1?1:0);
    rows.select('text').text(d=>state.meaning==='id'?'ID '+d:state.meaning==='temperature'?d+'°C':d);
    f.readout.textContent=L('同一组值同时用位置、长度与颜色表达；字段含义决定哪一种比较成立。','The same values use position, length and color. Attribute meaning determines valid comparisons.');
    f.detail.innerHTML=state.phase>=3?`<p>${state.meaning==='id'?L('编号只区分身份，色相用于区分类别；长度不表示编号之间的数量关系。','IDs distinguish identity; hue distinguishes categories, while lengths do not express a quantitative relationship between IDs.'):state.meaning==='temperature'?L('摄氏温度可以比较差值；20°C 与 10°C 的差为 10°C。','Celsius supports differences: 20°C and 10°C differ by 10°C.'):state.meaning==='rank'?L('名次表达先后，不能由相邻位置推断成绩差。','Ranks express order, not the size of a score difference.'):L('人数有零点，20 人是 10 人的两倍；共用零点的长度可以表达这一比例。','Counts have a zero: 20 is twice 10, represented by lengths with a common zero.')}</p>`:'';
  });
}

function csvLab(host,section,lang,saved){
  const f=frame(host,lang,saved),{d3,L,state,svg,select,label,update}=f;let rows=null,dead=false;
  select('field',L('数值字段','Numeric field'),[['age',L('年龄','Age')]]);
  loadSource('original-students.csv').then(value=>{if(dead)return;rows=value;draw();}).catch(error=>f.readout.textContent=error.message);
  function draw(){
    if(!rows){f.readout.textContent=L('正在读取课程 CSV…','Loading course CSV…');return;}
    const domain=d3.extent(rows,d=>d.age),x=d3.scaleLinear([domain[0]-1,domain[1]+1],[65,585]),groups=Array.from(d3.group(rows,d=>d.class));
    const records=svg.selectAll('g.csv-record').data(rows,d=>d.id).join(enter=>{const g=enter.append('g').attr('class','csv-record');g.append('rect').attr('width',48).attr('height',24).attr('rx',4);g.append('text').attr('x',24).attr('dy',16).attr('font-size',10).attr('text-anchor','middle').attr('fill','white');g.append('title');return g;});
    const stackHeight=310/d3.max(groups,g=>g[1].length);
    const position=d=>state.phase<2?[20+(Number(d.id)-1)%10*61,40+Math.floor((Number(d.id)-1)/10)*42]:state.phase===2?[x(d.age),40+groups.findIndex(([name])=>name===d.class)*35+Number(d.id)%3*7]:[40+groups.findIndex(([name])=>name===d.class)*70,360-(groups.find(([,members])=>members.includes(d))[1].indexOf(d)+1)*stackHeight];
    update(records).attr('transform',d=>`translate(${position(d)})`);
    update(records.select('rect')).attr('width',state.phase===2?10:48).attr('height',state.phase===2?10:state.phase===3?Math.min(24,stackHeight-2):24).attr('fill',d=>state.phase===0?'#8b9faa':d3.schemeTableau10[groups.findIndex(([name])=>name===d.class)%10]);
    records.select('text').text(d=>state.phase===0?'"'+d.age+'"':d.age).attr('dy',state.phase===3?Math.min(16,stackHeight-4):16).attr('opacity',state.phase===2?0:1);records.select('title').text(d=>`${d.id} · ${d.name} · ${d.class} · ${d.age}`);
    svg.selectAll('g.csv-axis').data(state.phase===2?[0]:[]).join('g').attr('class','csv-axis').attr('transform','translate(0,365)').call(d3.axisBottom(x).ticks(5));
    f.readout.textContent=L(`80 条记录 · ${state.phase===0?'字符串列':'age: number / birthday: Date'} · 每个编号保持不变`,`80 records · ${state.phase===0?'string columns':'age: number / birthday: Date'} · IDs remain unchanged`);
  }
  const api=f.finish(draw),cleanup=api.cleanup;api.cleanup=()=>{dead=true;cleanup();};return api;
}

const factories={'1.1':csvLab,'1.3':semanticsLab,'1.4':arrayLab,'1.5':joinLab,'2.1':treeLab,'2.2':treeLab,'2.3':treeLab,'3.7':paletteLab,'3.8':cvdLab,'4.1':crimeLab,'4.3':curveLab,'4.4':bankLab,'4.5':contourLab,'5.4':spiralLab};
export function mountVisualLab(host,section,lang,saved){return factories[section.id]?.(host,section,lang,saved);}
export const hasVisualLab=id=>!!factories[id];
