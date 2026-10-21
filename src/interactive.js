import { createExperiment, simulateVision } from './experiments.js';
import { students } from './core.js';
import { lectureBeats } from './lecture-content.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const major=(value,lang)=>lang==='zh'?({Design:'设计',Computing:'计算机',Economics:'经济',Biology:'生物'}[value]||value):value;
const json=value=>JSON.stringify(value,(key,item)=>item instanceof Map?Object.fromEntries(item):item,2);
const chart=(host,title,height=260)=>window.d3.select(host).append('svg').attr('viewBox',`0 0 620 ${height}`).attr('role','img').attr('aria-label',title);
export function mountInteractive(host,section,lang,snapshot){
  const L=(zh,en)=>lang==='zh'?zh:en,d3=window.d3;
  if(!section.lab){
    const beats=lectureBeats(section);
    host.innerHTML=`<div class="demo-shortcuts"><span>${L('快捷操作','Presets')}</span>${beats.map((b,i)=>`<button data-preset="${i}">${b.title[lang]}</button>`).join('')}</div><div class="demo-original"></div>`;
    const experiment=createExperiment(host.querySelector('.demo-original'),section,lang);
    if(snapshot)experiment.restore(snapshot);
    host.querySelectorAll('[data-preset]').forEach(button=>button.onclick=()=>experiment.applyPreset(beats[Number(button.dataset.preset)].preset));
    return experiment;
  }
  let state={converted:false,layer:0,operation:'map',n:4,scenario:'replace',key:'id',applied:false,palette:'tableau',context:'category',vision:'original',property:0,collapsed:[],stop:'yes',...snapshot?.state};
  host.innerHTML='<div class="custom-controls"></div><div class="custom-chart"></div><div class="custom-readout" role="status" aria-live="polite"></div>';
  const controls=host.querySelector('.custom-controls'),pane=host.querySelector('.custom-chart'),readout=host.querySelector('.custom-readout');
  const button=(text,handler,cls='')=>{const el=document.createElement('button');el.textContent=text;el.type='button';el.className=cls;el.onclick=handler;return el;};
  function select(key,title,values){
    const label=document.createElement('label');label.innerHTML=`<span>${title}</span>`;
    const el=document.createElement('select');el.setAttribute('aria-label',title);
    values.forEach(([value,text])=>el.add(new Option(text,value)));el.value=state[key];
    el.onchange=()=>{state[key]=el.value;render();};label.append(el);controls.append(label);return el;
  }
  function range(key,title,min,max){
    const label=document.createElement('label');label.innerHTML=`<span>${title} <output>${state[key]}</output></span>`;
    const el=document.createElement('input');el.type='range';el.min=min;el.max=max;el.value=state[key];el.setAttribute('aria-label',title);
    el.oninput=()=>{state[key]=Number(el.value);label.querySelector('output').textContent=state[key];render(false);};label.append(el);controls.append(label);
  }
  function render(rebuild=true){
    if(rebuild)controls.replaceChildren();pane.replaceChildren();
    if(section.lab==='csv'){
      if(rebuild)select('converted',L('字段处理','Field conversion'),[['false',L('保留原始字符串','Raw strings')],['true',L('转换成绩与时长','Convert score and hours')]]);
      const text=d3.csvFormat(students.slice(0,8)),rows=d3.csvParse(text,state.converted===true||state.converted==='true'?row=>({...row,score:Number(row.score),hours:Number(row.hours)}):undefined);
      pane.innerHTML=`<div class="csv-comparison"><div><h3>CSV</h3><pre>${esc(text)}</pre></div><div><h3>JavaScript</h3><pre>${esc(json(rows[0]))}</pre><dl><dt>typeof id</dt><dd>${typeof rows[0].id}</dd><dt>typeof score</dt><dd>${typeof rows[0].score}</dd><dt>typeof hours</dt><dd>${typeof rows[0].hours}</dd></dl></div></div><div class="data-table"><table><thead><tr><th>ID</th><th>${L('专业','Major')}</th><th>${L('成绩','Score')}</th><th>${L('学习时长','Study hours')}</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${row.id}</td><td>${major(row.major,lang)}</td><td>${row.score}</td><td>${row.hours}</td></tr>`).join('')}</tbody></table></div>`;
      readout.textContent=L('解析同一段 CSV。转换改变类型，不改变记录的身份。','The same CSV is parsed twice. Conversion changes types, not record identity.');
    }else if(section.lab==='dikw'){
      const labels=L(['数据','信息','知识','智慧'],['Data','Information','Knowledge','Wisdom']);
      if(rebuild)labels.forEach((name,i)=>{const b=button(name,()=>{state.layer=i;render();});b.setAttribute('aria-pressed',state.layer===i);controls.append(b);});
      const g=chart(pane,L('DIKW 四层与案例','DIKW layers and examples'),360);
      const details=[
        L(`S001 的成绩是 ${students[0].score}，所属专业为${major(students[0].major,lang)}。`,`S001 has score ${students[0].score} and major ${students[0].major}.`),
        L(`按专业组织 ${students.length} 条记录；全体平均分为 ${d3.mean(students,d=>d.score).toFixed(1)}。`,`Organize ${students.length} records by major; the overall mean score is ${d3.mean(students,d=>d.score).toFixed(1)}.`),
        L('比较各专业的成绩分布和学习时长，寻找不同组别中的共同模式。','Compare score distributions and study hours across majors to identify shared patterns.'),
        L('结合课程目标与班级情况，确定分组方式和教学安排。','Combine course goals and class composition to plan groups and teaching activities.')
      ];
      for(let i=0;i<4;i++){
        const level=3-i,w=130+i*110,top=50+i*72;
        const group=g.append('g').attr('role','button').attr('tabindex',0).attr('aria-label',labels[level]);
        group.append('path').attr('d',`M${310-(w-75)/2},${top}H${310+(w-75)/2}L${310+w/2},${top+62}H${310-w/2}Z`).attr('fill',state.layer===level?'#ed7952':['#1d4261','#2f749a','#7eaeb3','#d7e8e9'][i]);
        group.append('text').attr('x',310).attr('y',top+38).attr('text-anchor','middle').attr('fill',i<2||state.layer===level?'white':'#18354c').attr('font-size',20).text(labels[level]);
        group.on('click',()=>{state.layer=level;render();}).on('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();state.layer=level;render();}});
      }
      readout.innerHTML=`<strong>${labels[state.layer]}</strong><span>${details[state.layer]}</span>`;
    }else if(section.lab==='arrays'){
      const operations={map:a=>a.map(d=>d*2),filter:a=>a.filter(d=>d>3),reduce:a=>a.reduce((sum,d)=>sum+d,0),cross:a=>d3.cross(a,['A','B']),merge:a=>d3.merge([a,[8,9]]),pairs:a=>d3.pairs(a),transpose:()=>d3.transpose([[1,2,3],[4,5,6]]),zip:a=>d3.zip(a,['A','B','C']),group:a=>d3.group(a,d=>d%2),rollup:a=>d3.rollup(a,v=>v.length,d=>d%2)};
      if(rebuild){select('operation',L('变换函数','Transformation'),Object.keys(operations).map(k=>[k,k]));range('n',L('输入长度','Input length'),3,7);}
      const input=state.operation==='transpose'?[[1,2,3],[4,5,6]]:d3.range(1,state.n+1),result=operations[state.operation](input);
      pane.innerHTML=`<div class="array-flow"><section><h3>${L('输入','Input')}</h3><pre>${esc(json(input))}</pre></section><span>→<b>${state.operation}</b>→</span><section><h3>${L('输出','Output')}</h3><pre>${esc(json(result))}</pre></section></div>`;
      readout.textContent=`${L('输出类型','Output type')}: ${result instanceof Map?'Map':Array.isArray(result)?'Array':typeof result} · ${L('原始输入','Original input')}: ${JSON.stringify(input)}`;
    }else if(section.lab==='treeList'){
      if(rebuild)select('stop',L('按钮是否阻止冒泡','Stop bubbling on the button'),[['yes',L('是：stopPropagation()','Yes: stopPropagation()')],['no',L('否：观察父级监听器','No: inspect the parent listener')]]);
      const groups=d3.group(students,d=>d.major,d=>d.class);
      pane.innerHTML=`<div class="tree-list-demo"><ul class="html-tree" aria-label="${L('新生层次列表','Student hierarchy list')}">${Array.from(groups,([name,classes])=>`<li class="${state.collapsed.includes(name)?'collapsed':''}"><button data-major="${name}" aria-expanded="${!state.collapsed.includes(name)}"><span>${state.collapsed.includes(name)?'+':'−'}</span>${major(name,lang)} <b>20</b></button><ul ${state.collapsed.includes(name)?'hidden':''}>${Array.from(classes,([cls,members])=>`<li>${L('班级','Class')} ${cls}<b>${members.length}</b><small>${members.map(r=>r.id).slice(0,4).join(' · ')} …</small></li>`).join('')}</ul></li>`).join('')}</ul><div class="event-log"><h3>${L('事件日志','Event log')}</h3><p id="tree-event-log">${L('点击专业按钮，观察事件传播。','Click a major button to inspect propagation.')}</p></div></div>`;
      const logs=[];
      d3.select(pane).selectAll('[data-major]').on('click',(event)=>{
        const target=event.currentTarget,name=target.dataset.major,collapsed=!state.collapsed.includes(name);
        logs.length=0;logs.push(L('目标：专业按钮','Target: major button'));
        if(state.stop==='yes'){event.stopPropagation();logs.push('stopPropagation()');}
        state.collapsed=collapsed?[...state.collapsed,name]:state.collapsed.filter(key=>key!==name);
        d3.select(target.parentElement).classed('collapsed',collapsed);
        target.setAttribute('aria-expanded',!collapsed);target.querySelector('span').textContent=collapsed?'+':'−';target.nextElementSibling.hidden=collapsed;
        pane.querySelector('#tree-event-log').textContent=logs.join(' → ');
      });
      pane.querySelector('.html-tree').onclick=()=>{logs.push(L('冒泡：父级列表监听器','Bubbling: parent list listener'));pane.querySelector('#tree-event-log').textContent=logs.join(' → ');};
      readout.textContent=L('所有分支合计 80 人。折叠只改变显示，不删除记录。','All branches total 80 students. Collapse changes visibility without deleting records.');
    }else if(section.lab==='schemes'){
      const palettes={tableau:d3.schemeTableau10,okabe:['#e69f00','#56b4e9','#009e73','#f0e442','#0072b2','#d55e00','#cc79a7','#555555'],tol:['#4477aa','#ee6677','#228833','#ccbb44','#66ccee','#aa3377','#bbbbbb'],viridis:null,cividis:null};
      if(rebuild)select('palette',L('配色方案','Palette'),[['tableau','Tableau 10'],['okabe','Okabe–Ito'],['tol','Tol bright'],['viridis','Viridis'],['cividis','Cividis']]);
      const values=d3.range(7),sequential=!palettes[state.palette],color=sequential?d3.scaleSequential(state.palette==='viridis'?d3.interpolateViridis:d3.interpolateCividis).domain([0,6]):d3.scaleOrdinal(values,palettes[state.palette]);
      const g=chart(pane,L('色块与散点中的同一色板','The same palette as swatches and points'),340);
      g.selectAll('rect').data(values).join('rect').attr('x',d=>25+d*84).attr('y',25).attr('width',74).attr('height',80).attr('fill',color);
      g.selectAll('text').data(values).join('text').attr('x',d=>62+d*84).attr('y',130).attr('text-anchor','middle').text(d=>sequential?String(d):String.fromCharCode(65+d));
      g.selectAll('circle').data(d3.range(70)).join('circle').attr('cx',i=>35+(i*53)%550).attr('cy',i=>180+(i*31)%125).attr('r',5).attr('fill',i=>color(i%7));
      readout.textContent=sequential?L('顺序数值：0–6；色块和散点使用同一映射。','Ordered values: 0–6. Swatches and points use the same mapping.'):L('无序类别 A–G；色块和散点使用同一映射。','Unordered categories A–G. Swatches and points use the same mapping.');
    }else if(section.lab==='contrast'){
      if(rebuild){select('context',L('数据含义','Data meaning'),[['category',L('学院类别','College categories')],['temperature',L('气温','Temperature')]]);select('palette',L('右图色板','Right palette'),[['tableau',L('定性','Categorical')],['viridis',L('顺序','Sequential')]]);select('vision',L('观看条件','Viewing condition'),[['original',L('原色','Original')],['gray',L('灰度','Grayscale')],['cvd',L('色觉缺陷模拟','CVD preview')]]);}
      const values=[0,1,2,3,4,5],g=chart(pane,L('同一份数据的配色比较','Palette comparison on the same data'),340),ordinal=d3.scaleOrdinal(values,d3.schemeTableau10),seq=d3.scaleSequential(d3.interpolateViridis).domain([0,5]);
      [seq,state.palette==='tableau'?ordinal:seq].forEach((color,row)=>{
        g.append('text').attr('x',25).attr('y',20+row*170).attr('font-size',14).text(row?L('右图：当前选择','Right: selected'):L('左图：顺序型','Left: sequential'));
        values.forEach((v,i)=>{g.append('rect').attr('x',25+i*98).attr('y',38+row*170).attr('width',84).attr('height',85).attr('fill',simulateVision(color(v),state.vision));g.append('text').attr('x',67+i*98).attr('y',146+row*170).attr('text-anchor','middle').text(state.context==='category'?String.fromCharCode(65+i):`${v*5}°C`);});
      });
      readout.textContent=state.context==='category'?L('类别没有大小顺序。比较两行颜色是否暗示了额外的排名。','Categories are unordered. Compare whether colors imply a ranking.'):L('气温有数量顺序。定性色板不能表达等距的温差。','Temperature is ordered. A categorical palette does not express equal numerical differences.');
    }else if(section.lab==='timeMeta'){
      const properties=L(['有序性','连续性','周期性','独立于空间','结构性'],['Order','Continuity','Periodicity','Spatial independence','Structure']);
      if(rebuild)properties.forEach((name,i)=>{const b=button(name,()=>{state.property=i;render();});b.setAttribute('aria-pressed',state.property===i);controls.append(b);});
      const dates=['2024-02-26','2024-02-27','2024-02-29','2024-03-04'].map(d=>new Date(d+'T00:00:00Z')),g=chart(pane,L('日期、间隔和闰日','Dates, intervals and leap day'),300),x=d3.scaleUtc().domain(d3.extent(dates)).range([45,570]);
      g.append('g').attr('transform','translate(0,150)').call(d3.axisBottom(x).ticks(d3.utcDay.every(1)).tickFormat(d3.utcFormat('%m-%d')));
      g.selectAll('circle').data(dates).join('circle').attr('cx',x).attr('cy',115).attr('r',9).attr('fill',(d,i)=>i===2?'#e16a45':'#2878ad');
      g.append('text').attr('x',x(dates[2])).attr('y',80).attr('text-anchor','middle').text(L('闰日','Leap day'));
      const explanations=[L('日期按真实时间排序。相邻记录的时间差不相等。','Dates follow chronological order. Adjacent observations have unequal time gaps.'),L('时间轴连续，记录却是离散采样；中间没有记录的日子不能补成零。','Time is continuous but samples are discrete. Unobserved dates are not zero.'),L('每隔七天重复星期结构，但这四个观测本身不足以证明周期。','Weekdays repeat every seven days, but these four observations do not establish a data cycle.'),L('同一时间轴可记录不同地点的事件；地点需要单独的字段和编码。','A time axis can contain events from different places; location needs a separate field and encoding.'),L('2024 年有 2 月 29 日。月份、星期和天数的结构影响坐标。','2024 includes February 29. Month, week and day structures affect coordinates.')];
      readout.innerHTML=`<strong>${properties[state.property]}</strong><span>${explanations[state.property]}</span>`;
    }
  }
  if(section.lab==='join')return mountJoin(host,lang,snapshot);
  render();
  return {getState:()=>({state:structuredClone(state)}),applyPreset(value){Object.assign(state,value);render();},source:()=>render.toString(),cleanup(){}};
}

function mountJoin(host,lang,snapshot){
  const d3=window.d3,L=(zh,en)=>lang==='zh'?zh:en;
  let state={scenario:'replace',key:'id',applied:false,...snapshot?.state},serial=0;
  const scenarios={replace:['B','C','D'],reorder:['C','A','B'],add:['A','B','C','D','E'],remove:['B']};
  host.innerHTML=`<div class="custom-controls"><label><span>${L('新数据','New data')}</span><select id="join-scenario"><option value="replace">A,B,C → B,C,D</option><option value="reorder">A,B,C → C,A,B</option><option value="add">A,B,C → A,B,C,D,E</option><option value="remove">A,B,C → B</option></select></label><label><span>${L('匹配依据','Matching rule')}</span><select id="join-key"><option value="id">key: d =&gt; d.id</option><option value="index">${L('按索引（省略 key）','By index (no key)')}</option></select></label><button id="join-apply" class="primary">${L('应用新数据','Apply new data')}</button><button id="join-reset">${L('重置','Reset')}</button></div><div class="join-arrays"></div><div class="custom-chart join-canvas"></div><div class="custom-readout" role="status" aria-live="polite"></div><p class="demo-note">${L('DOM 编号是元素身份。观察数据字母与 DOM 编号是否一起保留。','A DOM ID identifies the element. Track whether the letter and DOM ID remain together.')}</p>`;
  const canvas=chart(host.querySelector('.join-canvas'),L('真实 D3 数据连接与 DOM 身份','Actual D3 joins and DOM identity'),250),layer=canvas.append('g');
  host.querySelector('#join-scenario').value=state.scenario;host.querySelector('#join-key').value=state.key;
  function draw(applied,animate=true){
    state.applied=applied;
    const data=(applied?scenarios[state.scenario]:['A','B','C']).map(id=>({id}));
    const previous=new Map([...layer.selectAll('g.join-node').nodes()].map(node=>[node.dataset.nodeId,node.__data__.id]));
    const joined=layer.selectAll('g.join-node').data(data,state.key==='id'?d=>d.id:undefined);
    const counts={enter:joined.enter().data().map(d=>d.id),update:joined.data().map(d=>d.id),exit:joined.exit().data().map(d=>d.id)};
    const duration=animate&&!matchMedia('(prefers-reduced-motion:reduce)').matches?550:0;
    const marks=joined.join(
      enter=>{const node=enter.append('g').attr('class','join-node').attr('data-node-id',()=>`node-${++serial}`);node.append('circle').attr('r',32).attr('cy',90).attr('fill',applied?'#df754d':'#2878ad');node.append('text').attr('class','datum').attr('y',98).attr('text-anchor','middle').attr('fill','white').attr('font-size',25);node.append('text').attr('class','identity').attr('y',155).attr('text-anchor','middle').attr('font-size',15);node.append('text').attr('class','previous').attr('y',184).attr('text-anchor','middle').attr('font-size',13);return node;},
      update=>{update.select('circle').attr('fill','#2878ad');return update;},
      exit=>exit.remove()
    );
    marks.transition().duration(duration).attr('transform',(d,i)=>`translate(${75+i*110},0)`);
    marks.select('.datum').text(d=>d.id);
    marks.select('.identity').text(function(){return this.parentNode.dataset.nodeId;});
    marks.select('.previous').text(function(d){const old=previous.get(this.parentNode.dataset.nodeId);return applied?(old?`${old} → ${d.id}`:L('新建','created')):'';});
    host.querySelector('.join-arrays').innerHTML=`<span>${L('旧数据','Previous')} <b>A, B, C</b></span><span>→</span><span>${L('新数据','Next')} <b>${scenarios[state.scenario].join(', ')}</b></span>`;
    host.querySelector('.custom-readout').textContent=applied?`enter: ${counts.enter.join(', ')||'∅'} · update: ${counts.update.join(', ')||'∅'} · exit: ${counts.exit.join(', ')||'∅'}`:L('先观察 A、B、C 各自的 DOM 编号，再应用新数据。','Inspect the DOM IDs of A,B,C, then apply the new data.');
  }
  const reset=()=>{layer.selectAll('*').remove();serial=0;draw(false,false);};
  host.querySelector('#join-scenario').onchange=e=>{state.scenario=e.target.value;reset();};
  host.querySelector('#join-key').onchange=e=>{state.key=e.target.value;reset();};
  host.querySelector('#join-apply').onclick=()=>draw(true);
  host.querySelector('#join-reset').onclick=reset;
  const applied=state.applied;draw(false,false);if(applied)draw(true,false);
  return {getState:()=>({state:structuredClone(state)}),source:()=>draw.toString(),cleanup(){canvas.selectAll('*').interrupt();}};
}
