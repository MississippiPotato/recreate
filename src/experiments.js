import * as calc from './core.js';
import { t } from './content.js';
const colors = ['#284f63','#cb4935','#718d7c','#bb963f','#816d8b','#428e98','#b46e80','#757d71'];
const label = (zh,en,lang) => lang === 'zh' ? zh : en;
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const majorName = (name,lang) => lang === 'zh' ? ({Design:'设计',Computing:'计算机',Economics:'经济',Biology:'生物'}[name] || name) : name;
const sourceMap = {records:'makeStudents', transform:'transformRecords', semantics:'draw',join:'matchKeys',pipeline:'groupRecords',groups:'groupRecords',tree:'groupRecords',treeList:'groupRecords',reshape:'toLong',scale:'draw',curve:'drawCurve',aspect:'drawCurve',contour:'marchingCell',time:'calendarPosition',period:'spiralPoint',story:'drawStory',palette:'paletteScale',vision:'simulateVision',colorModel:'drawColorModel',gamut:'drawGamut',harmony:'drawHarmony',generator:'drawHarmony'};
function svg(host, title, height = 340) {
  return window.d3.select(host).append('svg').attr('viewBox',`0 0 600 ${height}`).attr('role','group').attr('aria-label',title);
}
function text(g,x,y,value,size=12,fill='#68706e',anchor='start') {
  return g.append('text').attr('x',x).attr('y',y).attr('font-size',size).attr('fill',fill).attr('text-anchor',anchor).text(value);
}
function interactive(selection, name, click, readonly=false) {
  if (readonly) return;
  selection.attr('tabindex',0).attr('role','button').attr('aria-label',name).on('click',click).on('keydown',(event,d)=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();click(event,d);}
  });
}
function chartAxes(g,x,y,width=520,height=230) {
  const d3=window.d3;
  g.append('g').attr('transform',`translate(50,${height+30})`).call(d3.axisBottom(x).ticks(6).tickSizeOuter(0));
  g.append('g').attr('transform','translate(50,30)').call(d3.axisLeft(y).ticks(5).tickSize(-width)).selectAll('.tick line').attr('stroke','#e2dfd6');
  g.selectAll('.domain').attr('stroke','#c9c8be');
  g.selectAll('.tick text').attr('fill','#6a716e').attr('font-size',11);
}
export function paletteScale(type, values) {
  const d3=window.d3;
  if(type==='categorical') return d3.scaleOrdinal().domain(values.map((_,i)=>i)).range(colors);
  if(type==='diverging') return d3.scaleDiverging(d3.interpolateRdBu).domain([-30,0,30]);
  return d3.scaleSequential(d3.interpolateYlGnBu).domain([-5,35]);
}
export function simulateVision(color, mode) {
  const c=window.d3.rgb(color);
  if(mode==='gray') {const v=.2126*c.r+.7152*c.g+.0722*c.b;return `rgb(${v},${v},${v})`;}
  // Approximate deuteranopia preview in linear RGB (Machado et al., 2009).
  if(mode==='cvd') {
    const lin=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
    const srgb=v=>255*(v<=.0031308?12.92*v:1.055*Math.max(0,v)**(1/2.4)-.055);
    const rgb=[c.r,c.g,c.b].map(v=>lin(v/255));
    const m=[[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]];
    return `rgb(${m.map(row=>Math.max(0,Math.min(255,srgb(row.reduce((s,v,i)=>s+v*rgb[i],0))))).join(',')})`;
  }
  return color;
}
function defaults(section) {
  return {operation:'all',threshold:75,selected:'S001',field:'major',semantic:'id',next:'B,C,D',joined:false,
    stage:0,orientation:'horizontal',collapsed:[],node:'Design',context:section.kind==='palette'?'category':'temperature',palette:'sequential',vision:'original',labels:true,
    hue:205,lightness:55,saturation:55,count:5,harmony:'analogous',layout:'wide',cellKey:'A:income',scale:'linear',curve:'linear',height:230,
    iso:50,cell:14,corners:null,show:0,showFit:false,view:section.id==='5.3'?'calendar':'line',day:181,period:14,revealed:false,character:0,event:0};
}
export function createExperiment(host,section,lang,onChange=()=>{}) {
  let state=defaults(section), baseline=null, stage=0;
  let focusedControl=null;
  const L=(zh,en)=>label(zh,en,lang);
  const update=(key,value)=>{
    state[key]=value;
    if(key==='selected'&&section.kind==='pipeline')state.node=calc.students.find(row=>row.id===value)?.major||state.node;
    render();onChange();
  };
  const button=(caption,fn,className='')=>{const b=document.createElement('button');b.type='button';b.className=className;b.textContent=caption;b.addEventListener('click',fn);return b;};
  function select(parent,key,caption,options) {
    const lab=document.createElement('label');lab.className='control';lab.innerHTML=`<span>${caption}</span>`;
    const el=document.createElement('select');el.dataset.control=key;el.setAttribute('aria-label',caption);
    options.forEach(([v,name])=>el.add(new Option(name,v)));
    el.value=state[key];el.onchange=()=>update(key,el.value);lab.append(el);parent.append(lab);
  }
  function range(parent,key,caption,min,max,step=1) {
    const lab=document.createElement('label');lab.className='control range-control';lab.innerHTML=`<span>${caption} <output>${state[key]}</output></span>`;
    const el=document.createElement('input');el.type='range';el.min=min;el.max=max;el.step=step;el.value=state[key];el.dataset.control=key;el.setAttribute('aria-label',caption);
    el.oninput=()=>{lab.querySelector('output').textContent=el.value;};el.onchange=()=>update(key,Number(el.value));lab.append(el);parent.append(lab);
  }
  function controls(parent) {
    const k=section.kind;
    if(['records','transform'].includes(k)) {
      select(parent,'operation',L('处理方式','Operation'),[['all',L('原始记录','Original')],['sort',L('成绩降序','Sort by score')],['filter',L('成绩过滤','Filter by score')]]);
      if(state.operation==='filter')range(parent,'threshold',L('最低成绩','Minimum score'),48,98);
    }
    if(k==='semantics')select(parent,'semantic',L('数字的含义','Number meaning'),[['id',L('编号','ID')],['rank',L('等级','Rank')],['temperature',L('摄氏温度','Celsius')],['count',L('人数','Count')]]);
    if(k==='join') {select(parent,'next',L('下一批数据','Next data'),[['B,C,D','B, C, D'],['C,A,B','C, A, B'],['A,B,C,D,E','A, B, C, D, E'],['B','B']]);parent.append(button(state.joined?L('重新预测','Predict again'):L('应用新数据','Apply new data'),()=>update('joined',!state.joined),'primary small'));}
    if(k==='pipeline')select(parent,'stage',L('流程阶段','Pipeline stage'),[['0',L('原始记录','Records')],['1',L('分组统计','Grouping')],['2',L('层次结构','Hierarchy')],['3',L('图形视图','View')]]);
    if(k==='groups')select(parent,'field',L('分组字段','Group by'),[['major',L('专业','Major')],['class',L('班级','Class')]]);
    if(k==='tree')select(parent,'orientation',L('布局方向','Orientation'),[['horizontal',L('横向','Horizontal')],['vertical',L('纵向','Vertical')]]);
    if(['palette','vision'].includes(k)) {
      select(parent,'context',L('数据情境','Data context'),[['category',L('学院类别','Categories')],['temperature',L('每日温度','Temperature')],['deviation',L('相对基准偏差','Deviation')]]);
      select(parent,'palette',L('色板类型','Palette'),[['categorical',L('定性','Categorical')],['sequential',L('顺序','Sequential')],['diverging',L('发散','Diverging')]]);
      if(k==='vision') {
        select(parent,'vision',L('观看条件','Viewing condition'),[['original',L('原色','Original')],['gray',L('灰度','Grayscale')],['cvd',L('绿色觉缺陷近似','Deuteranopia preview')]]);
        parent.append(button(state.labels?L('隐藏数值标签','Hide value labels'):L('显示数值标签','Show value labels'),()=>update('labels',!state.labels)));
      }
    }
    if(k==='colorModel') {range(parent,'hue',L('色相 H','Hue H'),0,360);range(parent,'saturation',L('饱和度 S','Saturation S'),0,100);range(parent,'lightness',L('亮度 L','Lightness L'),5,95);}
    if(k==='gamut')range(parent,'lightness',L('Lab 明度 L','Lab lightness L'),5,95);
    if(['harmony','generator'].includes(k)) {
      range(parent,'hue',L('基准色相','Base hue'),0,360);
      if(k==='harmony')select(parent,'harmony',L('色相关系','Hue relationship'),[['monochromatic',L('单色','Monochromatic')],['analogous',L('类似色','Analogous')],['complementary',L('互补色','Complementary')],['triadic',L('三角色','Triadic')],['split',L('分裂互补','Split complementary')]]);
      else {range(parent,'saturation',L('饱和度','Saturation'),15,95);range(parent,'count',L('颜色数量','Color count'),3,10);}
    }
    if(k==='reshape')select(parent,'layout',L('表格形式','Table form'),[['wide',L('宽表','Wide')],['long',L('长表','Long')]]);
    if(k==='scale')select(parent,'scale',L('坐标尺度','Scale'),[['linear',L('线性','Linear')],['log',L('对数','Logarithmic')]]);
    if(k==='curve')select(parent,'curve',L('连接方法','Interpolation'),[['linear','Linear'],['step','Step'],['stepBefore','Step before'],['stepAfter','Step after'],['basis','Basis'],['cardinal','Cardinal'],['catmull','Catmull–Rom'],['natural','Natural'],['monotone','Monotone X'],['bump','Bump X']]);
    if(k==='curve')parent.append(button(state.showFit?L('移除拟合直线','Remove fitted line'):L('叠加最小二乘直线','Overlay least-squares fit'),()=>update('showFit',!state.showFit)));
    if(k==='aspect')range(parent,'height',L('图形高度','Chart height'),110,300,10);
    if(k==='contour') {
      range(parent,'iso',L('等值线阈值','Contour threshold'),10,90);
      select(parent,'show',L('展开过程','Construction stage'),[['0',L('① 数值','1 · Values')],['1',L('② 高低分类','2 · Classification')],['2',L('③ 边上插值','3 · Interpolation')],['3',L('④ 连接线段','4 · Segments')]]);
      const details=document.createElement('details');details.className='case-controls';details.innerHTML=`<summary>${L('检查全部 16 种状态','Inspect all 16 cases')}</summary><div class="case-buttons"></div>`;
      for(let code=0;code<16;code++)details.lastElementChild.append(button(String(code),()=>{state.corners=[0,1,2,3].map(i=>code&(1<<i)?70:30);state.iso=50;state.show=3;render();}));
      parent.append(details);
      const cornerDetails=document.createElement('details');cornerDetails.className='case-controls';
      cornerDetails.innerHTML=`<summary>${L('自定义四角数值','Edit the four corners')}</summary><div class="corner-inputs"></div>`;
      const field=calc.makeField(),cy=Math.floor(state.cell/6),cx=state.cell%6;
      const values=state.corners||[field[cy][cx],field[cy][cx+1],field[cy+1][cx+1],field[cy+1][cx]];
      values.forEach((value,i)=>{
        const lab=document.createElement('label');lab.innerHTML=`<span>v${i}</span>`;
        const input=document.createElement('input');input.type='number';input.min=0;input.max=100;input.value=value;
        input.setAttribute('aria-label',L(`角点 v${i}`,`Corner v${i}`));
        lab.append(input);cornerDetails.lastElementChild.append(lab);
      });
      cornerDetails.append(button(L('应用四角数值','Apply corner values'),()=>{
        const inputs=[...cornerDetails.querySelectorAll('input')];
        if(inputs.some(input=>input.value===''||!input.reportValidity()))return;
        state.corners=inputs.map(input=>Number(input.value));render();
      }));parent.append(cornerDetails);
    }
    if(k==='time') {select(parent,'view',L('时间视图','Time view'),[['line',L('折线','Line')],['calendar',L('日历','Calendar')],['spiral',L('年度螺旋','Annual spiral')]]);range(parent,'day',L('年内日序（0 起）','Day index (from 0)'),0,365);}
    if(k==='period') {range(parent,'period',L('每圈天数','Days per turn'),7,28);parent.append(button(state.revealed?L('收起构造参数','Hide generator'):L('揭示构造参数','Reveal generator'),()=>update('revealed',!state.revealed)));}
    if(k==='story') {select(parent,'character',L('选择角色','Character'),[['0',L('林','Lin')],['1',L('周','Zhou')],['2',L('陈','Chen')]]);range(parent,'event',L('事件序号','Event'),0,4);}
  }
  function render() {
    focusedControl=host.contains(document.activeElement)?document.activeElement.dataset.control:null;
    const focusedMark=host.contains(document.activeElement)?document.activeElement.getAttribute('aria-label'):null;
    const openDetails=[...host.querySelectorAll('details[open]')].map(el=>el.querySelector('summary')?.textContent);
    host.replaceChildren();host.classList.toggle('has-comparison',!!baseline);
    const toolbar=document.createElement('div');toolbar.className='experiment-controls';controls(toolbar);host.append(toolbar);
    const scrollHint=document.createElement('p');scrollHint.className='chart-scroll-hint';scrollHint.textContent=L('图形可左右拖动查看 ↔','Scroll the chart sideways to explore ↔');host.append(scrollHint);
    if(baseline&&baseline.context!==state.context) {
      const note=document.createElement('p');note.className='chart-status comparison-note';
      note.textContent=L('A 与 B 的数据情境不同，差异不能只归因于色板。重新保留 A，可在相同数据下比较。','A and B use different data contexts, so differences cannot be attributed to palette alone. Save A again to compare within one context.');
      host.append(note);
    }
    const charts=document.createElement('div');charts.className=baseline?'chart-pair':'chart-single';host.append(charts);
    const renderOne=(params,readonly,heading)=>{
      const pane=document.createElement('div');pane.className='chart-pane';
      if(heading){const h=document.createElement('div');h.className='comparison-label';h.textContent=heading;pane.append(h);}
      charts.append(pane);draw(pane,params,readonly);
    };
    if(baseline)renderOne(baseline,true,L('A · 保留的状态','A · Saved state'));
    renderOne(state,false,baseline?L('B · 当前状态','B · Current state'):null);
    const footer=document.createElement('div');footer.className='experiment-actions';
    footer.append(button(L('↺ 重置实验','↺ Reset'),()=>{state=defaults(section);baseline=null;render();}));
    if(['palette','vision','scale','curve','aspect','time','period'].includes(section.kind)) {
      footer.append(button(baseline?L('更新 A 快照','Update A snapshot'):L('保留当前为 A','Save current as A'),()=>{baseline=structuredClone(state);render();}));
      if(baseline)footer.append(button(L('关闭对照','Close comparison'),()=>{baseline=null;render();}));
    }
    host.append(footer);
    host.querySelectorAll('details').forEach(el=>{if(openDetails.includes(el.querySelector('summary')?.textContent))el.open=true;});
    if(focusedControl)host.querySelector(`[data-control="${focusedControl}"]`)?.focus({preventScroll:true});
    else if(focusedMark)[...host.querySelectorAll('[role="button"]')].find(el=>el.getAttribute('aria-label')===focusedMark)?.focus({preventScroll:true});
  }
  function status(parent,html){const p=document.createElement('p');p.className='chart-status';p.setAttribute('aria-live','polite');p.innerHTML=html;parent.append(p);}
  function rowsTable(parent,rows,params,readonly=false) {
    const wrap=document.createElement('div');wrap.className='data-table';
    wrap.innerHTML=`<table><caption>${L('点击编号，追踪同一记录','Select an ID to follow a record')}</caption><thead><tr><th>ID</th><th>${L('专业','Major')}</th><th>${L('班级','Class')}</th><th>${L('成绩','Score')}</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.id===params.selected?'selected-row':''}"><td><button data-id="${r.id}" ${readonly?'disabled':''}>${r.id}</button></td><td>${majorName(r.major,lang)}</td><td>${r.class}</td><td>${r.score}</td></tr>`).join('')}</tbody></table>`;
    wrap.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>update('selected',b.dataset.id));
    const details=document.createElement('details');details.className='record-details';
    const summary=document.createElement('summary');summary.textContent=L('查看表格，追踪记录','Open the table and trace records');
    details.append(summary,wrap);parent.append(details);
  }
  function draw(parent,p,readonly) {
    const d3=window.d3,k=section.kind;
    if(['records','transform'].includes(k)) {
      const rows=calc.transformRecords(calc.students,p.operation,p.threshold);
      const g=svg(parent,L('学生成绩点图，点的颜色区分专业','Student scores, colored by major'),250);
      const x=d3.scaleLinear([40,100],[60,560]);
      g.append('g').attr('transform','translate(0,215)').call(d3.axisBottom(x));
      ['Design','Computing','Economics','Biology'].forEach((m,i)=>{
        text(g,50,50+i*45,majorName(m,lang),11,'#68706e','end');
        g.append('line').attr('x1',60).attr('x2',560).attr('y1',45+i*45).attr('y2',45+i*45).attr('stroke','#e2e8f1');
      });
      rows.forEach(r=>{const m=['Design','Computing','Economics','Biology'].indexOf(r.major);const node=g.append('circle').attr('cx',x(r.score)).attr('cy',45+m*45+(Number(r.id.slice(1))%3-1)*8).attr('r',r.id===p.selected?7:4.5).attr('fill',colors[m]).attr('opacity',r.id===p.selected?1:.65).attr('stroke',r.id===p.selected?'#262e32':'none').attr('stroke-width',2);interactive(node,`${r.id}, ${r.score}`,()=>update('selected',r.id),readonly);});
      text(g,560,243,L('成绩 / 100','Score / 100'),11,'#68706e','end');
      const selected=calc.students.find(r=>r.id===p.selected);
      status(parent,`${L('保留','Retained')} <strong>${rows.length} / 80</strong> · ${selected.id} = ${selected.score}${rows.some(r=>r.id===selected.id)?'':L(' · 不满足过滤条件，原始记录仍保留',' · Excluded by the filter; retained in source')}`);
      const visible=rows.slice(0,8);if(rows.includes(selected)&&!visible.includes(selected))visible.push(selected);
      rowsTable(parent,visible,p,readonly);
      status(parent,L('80 条记录 · 表格显示前 8 行及选中行','80 records · table shows the first 8 and the selected row'));
    } else if(k==='semantics') {
      const g=svg(parent,L('同一组数字，不同的语义','Same numbers, different semantics'),260);
      [5,10,15,20].forEach((v,i)=>{
        const fill=p.semantic==='id'?colors[i]:d3.interpolateYlGnBu((i+1)/5);
        g.append('rect').attr('x',48+i*140).attr('y',50).attr('width',110).attr('height',100).attr('rx',4).attr('fill',fill);
        text(g,103+i*140,110,v,30,'#fff','middle');
      });
      const meanings={id:L('只区分身份，不表达大小','Identity without magnitude'),rank:L('有顺序，但间隔未必相等','Order does not guarantee equal intervals'),temperature:L('摄氏温度：差值可比，比例需谨慎','Celsius: meaningful differences, not this ratio interpretation'),count:L('人数：有意义的零点，可以比较倍数','Counts: meaningful zero and ratios')};
      text(g,300,203,meanings[p.semantic],15,'#376578','middle');
      status(parent,meanings[p.semantic]);
    } else if(k==='join') {
      const before=['A','B','C'],after=p.next.split(','),join=calc.matchKeys(before,after);
      const g=svg(parent,L('按字母 key 匹配数据','Matching records by letter keys'),300);
      text(g,35,32,L('旧数据','Previous'),13);text(g,35,180,p.joined?L('新数据','Next'):L('预测新数据','Predict the next data'),13);
      const x=(i,n)=>100+i*400/Math.max(n-1,1);
      if(p.joined)before.forEach((id,i)=>{const j=after.indexOf(id);if(j>=0)g.append('line').attr('x1',x(i,3)).attr('y1',90).attr('x2',x(j,after.length)).attr('y2',205).attr('stroke','#376578').attr('stroke-width',2).attr('opacity',.5);});
      before.forEach((id,i)=>{g.append('circle').attr('cx',x(i,3)).attr('cy',75).attr('r',25).attr('fill',p.joined&&join.exit.includes(id)?'#ae5138':'#376578');text(g,x(i,3),82,id,22,'#fff','middle');if(p.joined&&join.exit.includes(id))text(g,x(i,3),122,'exit',13,'#a74732','middle');});
      after.forEach((id,i)=>{g.append('circle').attr('cx',x(i,after.length)).attr('cy',220).attr('r',25).attr('fill',!p.joined?'#dbd8ce':join.enter.includes(id)?'#738368':'#376578');text(g,x(i,after.length),227,p.joined?id:'?',22,'#fff','middle');if(p.joined)text(g,x(i,after.length),270,join.enter.includes(id)?'enter':'update',12,'#68706e','middle');});
      status(parent,p.joined?`enter: <strong>${join.enter.join(', ')||'∅'}</strong> · update: <strong>${join.update.join(', ')||'∅'}</strong> · exit: <strong>${join.exit.join(', ')||'∅'}</strong>`:L('先预测：哪些 key 会保留、进入、退出？然后应用新数据。','Predict which keys update, enter or exit, then apply the new data.'));
    } else if(k==='pipeline') {
      const stages=[L('记录','Records'),L('分组','Groups'),L('层次','Hierarchy'),L('视图','View')];
      const strip=document.createElement('div');strip.className='pipeline-strip';stages.forEach((s,i)=>{const b=button(`${i+1} · ${s}`,()=>update('stage',i),Number(p.stage)===i?'active':'');if(readonly)b.disabled=true;strip.append(b);});parent.append(strip);
      if(Number(p.stage)===0) {rowsTable(parent,calc.students.slice(0,8),p,readonly);status(parent,L('输入：80 条记录。选中编号的身份在后续阶段保持不变。','Input: 80 records. Selected IDs retain their identity through later stages.'));}
      else if(Number(p.stage)===1)drawGroups(parent,p,readonly);
      else if(Number(p.stage)===2){
        const table=document.createElement('div');table.className='pipeline-hierarchy';
        table.innerHTML=`<h3>${L('新生','Students')} <b>80</b></h3><div>${calc.groupRecords(calc.students).map(group=>`<section><h4>${majorName(group.key,lang)} <b>${group.count}</b></h4>${calc.groupRecords(group.members,'class').map(c=>`<p>${L('班级','Class')} ${c.key}<b>${c.count}</b></p>`).join('')}</section>`).join('')}</div>`;
        parent.append(table);status(parent,L('分组结果被组织成两层关系，尚未计算节点的屏幕坐标。','Grouping results form two levels of relationships; node screen coordinates have not yet been computed.'));
      }else drawTree(parent,p,readonly,false);
    } else if(k==='groups')drawGroups(parent,p,readonly);
    else if(['tree','treeList'].includes(k))drawTree(parent,p,readonly,k==='treeList');
    else if(['palette','vision'].includes(k)) {
      const values=p.context==='category'?[20,20,20,20,20,20]:p.context==='deviation'?[-25,-12,-4,5,15,27]:[-3,5,12,19,26,33];
      const scale=paletteScale(p.palette,values),g=svg(parent,L('配色与数据语义比较','Palette and data semantics'),290);
      values.forEach((v,i)=>{
        // Deliberate ordinal-to-continuous misuse: the darkening comes from
        // category order, not a quantitative difference between the colleges.
        const colorValue=p.palette==='categorical'?i:p.context==='category'?(p.palette==='diverging'?-30+i*60/(values.length-1):-5+i*40/(values.length-1)):v;
        const color=simulateVision(scale(colorValue),p.vision);
        const group=g.append('g').attr('transform',`translate(${35+i*94},40)`);
        group.append('rect').attr('width',80).attr('height',145).attr('rx',3).attr('fill',color);
        text(group,40,174,p.context==='category'?String.fromCharCode(65+i):`D${i+1}`,13,'#68706e','middle');
        if(p.labels) {group.append('rect').attr('x',12).attr('y',50).attr('width',56).attr('height',36).attr('fill','#fff').attr('opacity',.88).attr('rx',2);text(group,40,74,p.context==='category'?String.fromCharCode(65+i):`${v}${p.context==='temperature'?'°C':''}`,18,'#25313a','middle');}
      });
      if(p.palette!=='categorical')for(let i=0;i<100;i++)g.append('rect').attr('x',130+i*3.4).attr('y',245).attr('width',3.5).attr('height',9).attr('fill',simulateVision(scale(p.palette==='diverging'?-30+i*.6:-5+i*.4),p.vision));
      if(p.palette!=='categorical'){
        const suffix=p.context==='temperature'?'°C':'';
        text(g,130,275,p.context==='category'?'A':(p.palette==='diverging'?'−30':'−5')+suffix,11);
        text(g,470,275,p.context==='category'?'F':(p.palette==='diverging'?'+30':'35')+suffix,11,'#68706e','end');
        if(p.palette==='diverging'&&p.context!=='category')text(g,300,275,'0'+suffix,11,'#68706e','middle');
      }
      const expected={category:'categorical',temperature:'sequential',deviation:'diverging'}[p.context];
      status(parent,p.palette===expected?L('当前色板与本例语义相符。继续检查图例、数值与观看条件。','The palette fits this example’s semantics. Still inspect its legend, values and viewing conditions.'):L('观察：这套颜色可能暗示了不合适的顺序或中心。请结合数据语义解释。','Observe: this palette may imply an unsuitable order or center. Explain using the data semantics.'));
      if(p.vision==='cvd')status(parent,L('绿色觉缺陷近似预览 · 线性 RGB 矩阵 · 不是个体诊断或无障碍认证','Approximate deuteranopia preview · linear RGB matrix · not an individual diagnosis or accessibility certification'));
    } else if(k==='colorModel')drawColorModel(parent,p,lang);
    else if(k==='gamut')drawGamut(parent,p,lang);
    else if(['harmony','generator'].includes(k))drawHarmony(parent,p,lang,k);
    else if(k==='reshape') {
      const input=[{id:'A',income:18,cost:12},{id:'B',income:25,cost:15},{id:'C',income:32,cost:20}];
      const rows=p.layout==='wide'?input:calc.toLong(input,['income','cost']);
      const keys=Object.keys(rows[0]);
      const div=document.createElement('div');div.className='data-table reshape';
      div.innerHTML=`<table><caption>${L('单位：万元','Units: 10,000')}</caption><thead><tr>${keys.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${keys.map(key=>{const cell=key==='value'?`${r.id}:${r.field}`:`${r.id}:${key}`;return `<td class="${cell===p.cellKey?'selected-row':''}">${typeof r[key]==='number'?`<button data-cell="${cell}">${r[key]}</button>`:r[key]}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
      if(!readonly)div.querySelectorAll('[data-cell]').forEach(el=>el.onclick=()=>update('cellKey',el.dataset.cell));parent.append(div);
      status(parent,`${L('当前形式','Form')}: ${p.layout} · ${rows.length} ${L('行','rows')} · ${L('追踪','Following')}: <strong>${p.cellKey}</strong>`);
    } else if(k==='scale') {
      const g=svg(parent,L('线性与对数尺度','Linear and logarithmic scales'),300);
      const values=[1,10,100,1000],x=(p.scale==='log'?d3.scaleLog():d3.scaleLinear()).domain(p.scale==='log'?[1,1000]:[0,1000]).range([60,550]);
      g.append('g').attr('transform','translate(0,220)').call(d3.axisBottom(x).ticks(5,p.scale==='log'?'~g':undefined));
      values.forEach((v,i)=>{g.append('line').attr('x1',60).attr('x2',x(v)).attr('y1',45+i*42).attr('y2',45+i*42).attr('stroke',colors[i]).attr('stroke-width',3);g.append('circle').attr('cx',x(v)).attr('cy',45+i*42).attr('r',7).attr('fill',colors[i]);text(g,40,50+i*42,v,12,'#68706e','end');});
      text(g,300,273,p.scale==='log'?L('等距 = 相同比值 · 仅正数','Equal distance = equal ratio · positive values only'):L('等距 = 相同差值','Equal distance = equal difference'),13,'#376578','middle');
      status(parent,L('固定数据：1、10、100、1000。坐标变换不改写数据。','Fixed values: 1, 10, 100, 1000. A scale does not rewrite data.'));
    } else if(['curve','aspect'].includes(k))drawCurve(parent,p,lang);
    else if(k==='contour')drawContour(parent,p,readonly);
    else if(k==='time')drawTime(parent,p,readonly);
    else if(k==='period') {
      const data=calc.makePeriodic(),g=svg(parent,L('可调周期的螺旋图','Adjustable-period spiral'),420);
      const color=d3.scaleSequential(d3.interpolateYlGnBu).domain([3,17]);
      const step=150/(168/p.period);
      const pts=data.map(r=>calc.spiralPoint(r.day,p.period,[300,205],step));
      g.append('path').attr('d',d3.line()(pts)).attr('fill','none').attr('stroke','#d3d1c8');
      data.forEach((r,i)=>g.append('circle').attr('cx',pts[i][0]).attr('cy',pts[i][1]).attr('r',4).attr('fill',color(r.value)));
      text(g,300,413,L(`一圈 ${p.period} 天 · 共 168 天`,`One turn = ${p.period} days · 168 days`),12,'#68706e','middle');
      status(parent,p.revealed?L('生成规则：14 天周期 + 幅度 6 + 基线 10 + 固定噪声；seed 42。显示周期不会改变原始数据。','Generator: 14-day period + amplitude 6 + baseline 10 + fixed noise; seed 42. Display period does not alter the data.'):L('先比较各圈的对齐情况，再揭示构造参数。','Compare alignment between turns, then reveal the generator.'));
    } else if(k==='story')drawStory(parent,p,lang,(key,value)=>!readonly&&update(key,value));
  }
  function drawGroups(parent,p,readonly) {
    const d3=window.d3,groups=calc.groupRecords(calc.students,p.field),g=svg(parent,L('分组人数与成员','Group sizes and members'),300);
    const x=d3.scaleBand().domain(groups.map(r=>r.key)).range([50,570]).padding(.3),y=d3.scaleLinear().domain([0,25]).range([220,20]);
    groups.forEach((r,i)=>{const bar=g.append('rect').attr('x',x(r.key)).attr('y',y(r.count)).attr('width',x.bandwidth()).attr('height',220-y(r.count)).attr('fill',p.node===r.key?'#a74732':colors[0]).attr('rx',2);interactive(bar,`${majorName(r.key,lang)} ${r.count}`,()=>update('node',r.key),readonly);text(g,x(r.key)+x.bandwidth()/2,y(r.count)-10,r.count,16,'#25313a','middle');text(g,x(r.key)+x.bandwidth()/2,245,majorName(r.key,lang),12,'#68706e','middle');});
    const selected=groups.find(r=>r.key===p.node)||groups[0];
    status(parent,`${L('总人数','Total')}: <strong>80</strong> · ${majorName(selected.key,lang)}: ${selected.count} · ${section.kind==='pipeline'?`${L('追踪记录','Following')}: ${p.selected} → ${majorName(calc.students.find(r=>r.id===p.selected)?.major,lang)} · `:''}${L('成员','Members')}: ${selected.ids.join(', ')}`);
  }
  function drawTree(parent,p,readonly,list=false) {
    const d3=window.d3;
    const groups=calc.groupRecords(calc.students);
    const hierarchy={name:L('新生','Students'),count:80,children:groups.map(r=>({name:r.key,count:r.count,children:p.collapsed.includes(r.key)?null:calc.groupRecords(r.members,'class').map(c=>({name:c.key,count:c.count,ids:c.ids}))}))};
    const root=d3.hierarchy(hierarchy),vertical=p.orientation==='vertical';
    d3.tree().size(vertical?[520,210]:[250,430])(root);
    const g=svg(parent,L('专业与班级的层次树','Hierarchy of majors and classes'),340);
    const pos=n=>vertical?[40+n.x,50+n.y]:[60+n.y,35+n.x];
    root.links().forEach(link=>{const a=pos(link.source),b=pos(link.target);g.append('path').attr('d',`M${a} C${(a[0]+b[0])/2},${a[1]} ${(a[0]+b[0])/2},${b[1]} ${b}`).attr('fill','none').attr('stroke','#c6c7ba').attr('stroke-width',1.4);});
    root.descendants().forEach(n=>{const [x,y]=pos(n),node=g.append('circle').attr('cx',x).attr('cy',y).attr('r',n.depth===0?9:7).attr('fill',p.node===n.data.name?'#a74732':colors[n.depth]);interactive(node,`${majorName(n.data.name,lang)}, ${n.data.count}`,()=>update('node',n.data.name),readonly);text(g,x+(vertical?0:12),y+(vertical?-14:4),`${majorName(n.data.name,lang)} · ${n.data.count}`,11,'#36423e',vertical?'middle':'start');});
    if(list){const ul=document.createElement('div');ul.className='tree-controls';groups.forEach(r=>{ul.append(button(`${p.collapsed.includes(r.key)?'+':'−'} ${majorName(r.key,lang)} · ${r.count}`,()=>{if(readonly)return;state.collapsed=p.collapsed.includes(r.key)?p.collapsed.filter(x=>x!==r.key):[...p.collapsed,r.key];render();}));});parent.append(ul);}
    const matched=root.descendants().find(n=>n.data.name===p.node);
    status(parent,`${L('总人数始终为','Total remains')} <strong>80</strong> · ${L('当前选择','Selected')}: ${majorName(p.node,lang)}${matched?` · ${matched.data.count}`:L('（已折叠隐藏，选择仍保留）',' (hidden by collapse; selection retained)')}${section.kind==='pipeline'?` · ${L('追踪记录','Following')}: ${p.selected}`:''}`);
  }
  function drawContour(parent,p,readonly) {
    const field=calc.makeField();
    const pair=document.createElement('div');pair.className='contour-grid';
    const fieldPane=document.createElement('div'),cellPane=document.createElement('div');pair.append(fieldPane,cellPane);parent.append(pair);
    const g=svg(fieldPane,L('网格标量场','Scalar grid'),320).attr('viewBox','0 0 300 320');
    const h=svg(cellPane,L('选中单元格的推导','Selected cell construction'),350).attr('viewBox','0 0 300 350');
    const x0=20,y0=35,cellSize=36;
    const fill=window.d3.scaleSequential(window.d3.interpolateYlGnBu).domain([10,90]);
    for(let y=0;y<6;y++)for(let x=0;x<6;x++){
      const vals=[field[y][x],field[y][x+1],field[y+1][x+1],field[y+1][x]],result=calc.marchingCell(vals,p.iso);
      const rect=g.append('rect').attr('x',x0+x*cellSize).attr('y',y0+y*cellSize).attr('width',cellSize).attr('height',cellSize).attr('fill',fill(vals.reduce((a,b)=>a+b)/4)).attr('stroke',p.cell===y*6+x?'#a74732':'#fff').attr('stroke-width',p.cell===y*6+x?3:1);
      interactive(rect,L(`选择网格 ${y*6+x+1}`,`Select cell ${y*6+x+1}`),()=>{state.cell=y*6+x;state.corners=null;render();},readonly);
      result.segments.forEach(seg=>g.append('path').attr('d',window.d3.line()(seg.map(pt=>[x0+(x+pt[0])*cellSize,y0+(y+pt[1])*cellSize]))).attr('stroke','#a74732').attr('stroke-width',2).attr('fill','none'));
    }
    const cy=Math.floor(p.cell/6),cx=p.cell%6;
    const vals=p.corners||[field[cy][cx],field[cy][cx+1],field[cy+1][cx+1],field[cy+1][cx]],result=calc.marchingCell(vals,p.iso);
    const pts=[[40,65],[230,65],[230,255],[40,255]],map=pt=>[40+pt[0]*190,65+pt[1]*190];
    h.append('rect').attr('x',40).attr('y',65).attr('width',190).attr('height',190).attr('fill','#edf2fa').attr('stroke','#bdc2b8');
    pts.forEach(([x,y],i)=>{h.append('circle').attr('cx',x).attr('cy',y).attr('r',15).attr('fill',Number(p.show)>0?(result.high[i]?'#376578':'#c4c5ba'):'#fff').attr('stroke','#376578');text(h,x,y+5,Number(p.show)>0?+result.high[i]:vals[i],12,Number(p.show)>0&&result.high[i]?'#fff':'#25313a','middle');text(h,x,y+(i<2?-25:33),`v${i} = ${vals[i]}`,12,'#68706e','middle');});
    if(Number(p.show)>=2)result.crossings.forEach(c=>{const [x,y]=map(c.point);h.append('circle').attr('cx',x).attr('cy',y).attr('r',5).attr('fill','#a74732');});
    if(Number(p.show)>=3)result.segments.forEach(seg=>h.append('path').attr('d',window.d3.line()(seg.map(map))).attr('fill','none').attr('stroke','#a74732').attr('stroke-width',3));
    text(g,125,287,L(`场中网格 ${p.cell+1}`,`Field cell ${p.cell+1}`),12,'#68706e','middle');text(h,135,325,`case ${result.code} · ${result.high.map(Number).join(' / ')}`,14,'#376578','middle');
    status(parent,`${p.corners?L('独立状态示例；标量场保持原样','Independent case example; field unchanged'):L('选中网格的放大推导','Construction of the selected cell')} · ${L('跨越边','Crossing edges')}: ${result.crossings.map(c=>`e${c.edge}: t=${c.t.toFixed(2)}`).join(' · ')||'∅'}${result.ambiguous?` · ${L('歧义判别','Ambiguity decider')} Q=${result.q}${result.q===0?L('（精确鞍点，采用固定连接）',' (exact saddle; fixed tie)'):''}`:''}`);
  }
  function drawTime(parent,p,readonly) {
    const d3=window.d3,data=calc.daily,selected=data[p.day],color=d3.scaleSequential(d3.interpolateYlGnBu).domain([-5,35]);
    const height=p.view==='calendar'?240:370,g=svg(parent,L('2024 年逐日合成气温','Synthetic daily temperature, 2024'),height);
    if(p.view==='line') {
      const x=d3.scaleLinear([0,365],[0,520]),y=d3.scaleLinear([-5,35],[250,0]);chartAxes(g,x,y,520,250);
      g.append('path').attr('transform','translate(50,30)').attr('d',d3.line().defined(r=>r.value!==null).x(r=>x(r.day)).y(r=>y(r.value))(data)).attr('fill','none').attr('stroke','#376578').attr('stroke-width',2);
      g.append('line').attr('x1',50+x(p.day)).attr('x2',50+x(p.day)).attr('y1',25).attr('y2',280).attr('stroke','#a74732').attr('stroke-dasharray','4 4');
      data.forEach(r=>{if(r.value===null)return;const dot=g.append('circle').attr('cx',50+x(r.day)).attr('cy',30+y(r.value)).attr('r',r.day===p.day?5:3).attr('fill',r.day===p.day?'#a74732':'#376578').attr('opacity',r.day===p.day?1:.25);interactive(dot,`${r.id}: ${r.value}°C`,()=>update('day',r.day),readonly);});
      text(g,50,17,'°C',12);text(g,570,322,L('年内日序（从 0 开始）','Day index (starting at 0)'),12,'#68706e','end');
    } else if(p.view==='calendar') {
      const cw=10,offsetX=38,offsetY=54;
      data.forEach(r=>{const c=calc.calendarPosition(r.id);const cell=g.append('rect').attr('x',offsetX+c.week*cw).attr('y',offsetY+c.weekday*18).attr('width',9).attr('height',16).attr('rx',1).attr('fill',r.value===null?'#cbd4e2':color(r.value)).attr('stroke',r.day===p.day?'#a74732':'none').attr('stroke-width',2);interactive(cell,`${r.id}: ${r.value===null?L('缺失','missing'):r.value+'°C'}`,()=>update('day',r.day),readonly);if(r.id.endsWith('-01'))text(g,offsetX+c.week*cw,35,r.id.slice(5,7),10);});
      [L('一','M'),L('三','W'),L('五','F'),L('日','S')].forEach((v,i)=>text(g,25,67+[0,2,4,6][i]*18,v,10,'#68706e','end'));
      text(g,40,210,L('周一开始 · 每格一天 · 灰色为缺失','Monday first · one cell per day · gray = missing'),12);
    } else {
      const pts=data.map(r=>calc.spiralPoint(r.day,366,[300,170],95));
      g.append('path').attr('d',d3.line()(pts)).attr('fill','none').attr('stroke','#dedbcf');
      data.forEach((r,i)=>{const dot=g.append('circle').attr('cx',pts[i][0]).attr('cy',pts[i][1]).attr('r',r.day===p.day?5:3).attr('fill',r.value===null?'#cbd4e2':color(r.value)).attr('stroke',r.day===p.day?'#a74732':'none').attr('stroke-width',2);interactive(dot,`${r.id}: ${r.value===null?L('缺失','missing'):r.value+'°C'}`,()=>update('day',r.day),readonly);if(r.id.endsWith('-01'))text(g,pts[i][0],pts[i][1]-10,r.id.slice(5,7),10);});
      text(g,300,330,L('一圈 = 366 天 · 向外表示更晚日期','One turn = 366 days · outward = later'),12,'#68706e','middle');
    }
    status(parent,`<strong>${selected.id}</strong> · ${selected.value===null?L('缺失，不能解释为 0°C','Missing, not 0°C'):`${selected.value}°C`} · ${L('全年统一颜色域 −5 至 35°C','Shared annual color domain: −5 to 35°C')}`);
    const legend=document.createElement('div');legend.className='color-legend';legend.innerHTML=`<span>−5°C</span><i style="background:linear-gradient(90deg,${[0,.25,.5,.75,1].map(v=>d3.interpolateYlGnBu(v)).join(',')})"></i><span>35°C</span><span>□ ${L('缺失','Missing')}</span>`;parent.append(legend);
    status(parent,L('366 个日期 · 364 个数值 · 2 天缺失','366 dates · 364 readings · 2 missing days'));
  }
  render();
  return {
    reset:()=>{state=defaults(section);baseline=null;render();},
    applyPreset:value=>{state={...state,...structuredClone(value)};render();onChange();},
    setStep:value=>{stage=value;if(section.kind==='contour'){state.show=[0,2,3][value];render();}},
    getState:()=>structuredClone({state,baseline,stage}),
    restore:value=>{if(value){state={...defaults(section),...value.state};baseline=value.baseline;stage=value.stage||0;render();}},
    setLanguage:value=>{lang=value;render();},
    source:()=>{
      const name=sourceMap[section.kind];
      return (calc[name]||{draw,paletteScale,simulateVision,drawColorModel,drawGamut,drawHarmony,drawCurve,drawStory}[name])?.toString()||'';
    }
  };
}
function drawColorModel(parent,p,lang) {
  const d3=window.d3,g=svg(parent,label('HSL 与灰度预览','HSL and grayscale preview',lang),300);
  const c=d3.hsl(p.hue,p.saturation/100,p.lightness/100).formatHex();
  [c,simulateVision(c,'gray')].forEach((fill,i)=>{g.append('rect').attr('x',60+i*270).attr('y',35).attr('width',210).attr('height',180).attr('rx',4).attr('fill',fill);text(g,165+i*270,250,i===0?`H ${p.hue}° · L ${p.lightness}%`:label('灰度预览','Grayscale',lang),13,'#68706e','middle');});
  const rgb=d3.rgb(c),lab=d3.lab(c);
  text(g,300,278,`${c} · RGB(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`,13,'#376578','middle');
  text(g,300,298,`Lab(${lab.l.toFixed(1)}, ${lab.a.toFixed(1)}, ${lab.b.toFixed(1)})`,12,'#68706e','middle');
}
function drawGamut(parent,p,lang) {
  const d3=window.d3,g=svg(parent,label('Lab 固定明度的 sRGB 色域切片','sRGB gamut slice at fixed Lab lightness',lang),360);
  for(let a=-100;a<=100;a+=5)for(let b=-100;b<=100;b+=5){const c=d3.lab(p.lightness,a,b);g.append('rect').attr('x',145+(a+100)*1.5).attr('y',20+(100-b)*1.5).attr('width',7.6).attr('height',7.6).attr('fill',c.rgb().displayable()?c.formatHex():'#e5ebf4');}
  text(g,300,351,'a: −100 → +100',12,'#68706e','middle');text(g,55,35,'b: +100',12);text(g,55,320,'b: −100',12);text(g,480,175,`L = ${p.lightness}`,15,'#376578');
}
function drawHarmony(parent,p,lang,kind) {
  const d3=window.d3,g=svg(parent,label('色轮与生成色板','Color wheel and generated palette',lang),330);
  for(let h=0;h<360;h+=3){const a=h*Math.PI/180;g.append('circle').attr('cx',160+100*Math.cos(a)).attr('cy',155+100*Math.sin(a)).attr('r',6).attr('fill',d3.hsl(h,.6,.52).formatHex());}
  const offsets=kind==='generator'?Array.from({length:p.count},(_,i)=>i*360/p.count):p.harmony==='monochromatic'?[0,0,0]:p.harmony==='split'?[0,150,210]:p.harmony==='complementary'?[0,180]:p.harmony==='triadic'?[0,120,240]:[-30,0,30];
  offsets.forEach((offset,i)=>{const h=(p.hue+offset+360)%360,a=h*Math.PI/180,light=p.harmony==='monochromatic'?[.32,.52,.74][i]:.52,c=d3.hsl(h,p.saturation/100,light).formatHex();g.append('line').attr('x1',160).attr('y1',155).attr('x2',160+100*Math.cos(a)).attr('y2',155+100*Math.sin(a)).attr('stroke','#25313a');g.append('circle').attr('cx',160+100*Math.cos(a)).attr('cy',155+100*Math.sin(a)).attr('r',10).attr('stroke','#fff').attr('stroke-width',2).attr('fill',c);g.append('rect').attr('x',340).attr('y',25+i*(270/offsets.length)).attr('width',190).attr('height',250/offsets.length).attr('rx',2).attr('fill',c);text(g,435,25+i*(270/offsets.length)+125/offsets.length+4,c,12,light>.65?'#203449':'#fff','middle');});
}
function drawCurve(parent,p,lang) {
  const d3=window.d3,g=svg(parent,label('固定采样点与连接曲线','Fixed samples and interpolated curve',lang),380);
  const data=[{x:0,y:15},{x:1,y:75},{x:2,y:78},{x:3,y:20},{x:4,y:25},{x:5,y:60}];
  const height=p.height||230,x=d3.scaleLinear([0,5],[0,520]),y=d3.scaleLinear([0,100],[height,0]);
  chartAxes(g,x,y,520,height);
  const curve={linear:d3.curveLinear,step:d3.curveStep,stepBefore:d3.curveStepBefore,stepAfter:d3.curveStepAfter,basis:d3.curveBasis,cardinal:d3.curveCardinal,catmull:d3.curveCatmullRom.alpha(.5),natural:d3.curveNatural,monotone:d3.curveMonotoneX,bump:d3.curveBumpX}[p.curve]||d3.curveLinear;
  g.append('path').attr('transform','translate(50,30)').attr('d',d3.line().x(r=>x(r.x)).y(r=>y(r.y)).curve(curve)(data)).attr('fill','none').attr('stroke','#376578').attr('stroke-width',2.5);
  if(p.showFit){
    const fit=calc.leastSquares(data);
    const endpoints=[0,5].map(value=>({x:value,y:fit.intercept+fit.slope*value}));
    g.append('path').attr('class','regression-line').attr('transform','translate(50,30)').attr('d',d3.line().x(r=>x(r.x)).y(r=>y(r.y))(endpoints)).attr('fill','none').attr('stroke','#df744c').attr('stroke-width',2.5).attr('stroke-dasharray','7 5');
    text(g,570,342,label(`最小二乘：y = ${fit.slope.toFixed(2)}x + ${fit.intercept.toFixed(2)}`,`Least squares: y = ${fit.slope.toFixed(2)}x + ${fit.intercept.toFixed(2)}`,lang),12,'#ad613d','end');
  }
  data.forEach(r=>{g.append('circle').attr('cx',50+x(r.x)).attr('cy',30+y(r.y)).attr('r',5).attr('fill','#a74732').attr('stroke','#ffffff').attr('stroke-width',2);text(g,50+x(r.x),20+y(r.y),r.y,12,'#a74732','middle');});
  text(g,570,365,label('固定采样值 · 时间 0 至 5','Fixed samples · time 0 to 5',lang),12,'#68706e','end');
}
function drawStory(parent,p,lang,update) {
  const g=svg(parent,label('虚构考察队的共同活动','Co-occurrence in a fictional expedition',lang),340);
  const d3=window.d3,paths=[[80,80,160,100,170],[100,190,180,120,190],[200,210,80,140,210]],names=lang==='zh'?['林','周','陈']:['Lin','Zhou','Chen'];
  const events=lang==='zh'?['共同出发','分组采样','重新配对','全员会合','返回整理']:['Depart together','Split for sampling','Regroup','All meet','Return'];
  const descriptions=lang==='zh'?['三人出发，林与周同行。','林单独调查，周与陈共同采样。','林与周共同记录，陈前往另一地点。','三人参加同一场讨论。','三人返回，林与周先整理资料。']:['All depart; Lin and Zhou travel together.','Lin works alone; Zhou and Chen sample together.','Lin and Zhou record together; Chen visits another site.','All three join the same discussion.','All return; Lin and Zhou begin organizing notes.'];
  g.append('rect').attr('x',55+Number(p.event)*120-18).attr('y',30).attr('width',36).attr('height',215).attr('fill','#edf1fa');
  paths.forEach((values,i)=>{const pts=values.map((v,j)=>[55+j*120,v]);const path=g.append('path').attr('d',d3.line().curve(d3.curveMonotoneX)(pts)).attr('fill','none').attr('stroke',colors[i]).attr('stroke-width',Number(p.character)===i?5:2).attr('opacity',Number(p.character)===i?1:.5);interactive(path,names[i],()=>update('character',i));text(g,20,values[0]+5,names[i],13,colors[i]);});
  events.forEach((e,i)=>{const node=text(g,55+i*120,278,e,11,'#68706e','middle');interactive(node,e,()=>update('event',i));});
  text(g,300,325,descriptions[p.event],12,'#376578','middle');
}
