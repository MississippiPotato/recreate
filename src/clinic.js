export const clinicValues=Object.freeze([80,84]);
export const clinicTemperatures=Object.freeze([18,19,null,21,22,23,21]);
export const visibleRatio=(baseline,a=80,b=84)=>(b-baseline)/(a-baseline);
export const repairMissing=(values,mode)=>values.map(value=>value===null&&mode==='zero'?0:value);

export function mountClinic(host,{L,arrow,classroom=false}){
  const d3=window.d3;
  let current=0,baseline=76,palette='sequential',missing='zero',revealed=false;
  const cases=[
    {name:L('坐标的障眼法','The axis illusion'),question:L('只多了 4，为什么看起来翻倍？','Only 4 more. Why does it look doubled?'),hint:L('两组教学数值为 80 与 84。拖动右图的纵轴起点，观察柱长比例。','The constructed values are 80 and 84. Change the right chart’s baseline and compare lengths.'),route:'#ch-4-2',related:L('继续学习：读懂坐标映射','Continue: reading a scale')},
    {name:L('颜色的潜台词','Color’s hidden message'),question:L('学院名称，也有从小到大的顺序吗？','Do college names have a quantitative order?'),hint:L('四个学院各有 20 条合成记录。这里颜色只负责区分类别。试着消除深浅带来的排名暗示。','Each college has 20 synthetic records. Color only identifies categories. Remove the implied ranking.'),route:'#ch-3-2',related:L('继续学习：颜色表达什么','Continue: what color means')},
    {name:L('消失的一天','The missing day'),question:L('那次“骤降”，真的发生了吗？','Did that sudden drop actually happen?'),hint:L('7 天的合成气温中，第 3 天没有记录。选择处理方式，看看“没测到”会被画成什么。','Day 3 of these seven synthetic temperatures has no reading. Change how missingness is represented.'),route:'#ch-5-1',related:L('继续学习：先读懂时间字段','Continue: temporal data')}
  ];
  function render(){
    const item=cases[current];
    host.innerHTML=`<nav class="clinic-tabs" aria-label="${L('选择病例','Choose a case')}">${cases.map((c,i)=>`<button data-case="${i}" aria-pressed="${current===i}"><span>0${i+1}</span>${c.name}</button>`).join('')}</nav><section class="clinic-case"><div class="clinic-case-heading"><p class="eyebrow">CASE 0${current+1} / ${L('找出误导，动手修复','DIAGNOSE & REPAIR')}</p><h2>${item.question}</h2><p>${item.hint}</p></div><div class="clinic-comparison"><div class="clinic-chart"><span class="chart-tag">${L('原来的画法','ORIGINAL VIEW')}</span><div id="clinic-before"></div></div><div class="clinic-chart repaired-chart"><span class="chart-tag">${(classroom?L('调整之后','AFTER THE CHANGE'):L('你的修复','YOUR REPAIR'))}</span><div id="clinic-after"></div></div></div><div class="repair-controls">${current===0?`<label class="clinic-range"><span>${L('右图纵轴起点','Right chart baseline')} <output id="baseline-output">${baseline}</output></span><input id="baseline" type="range" min="0" max="78" step="2" value="${baseline}" aria-label="${L('纵轴起点','Axis baseline')}"></label><button id="zero-baseline">${L('让柱子从零开始','Start bars at zero')}</button>`:current===1?`<label><span>${L('右图颜色逻辑','Right chart color logic')}</span><select id="clinic-palette"><option value="sequential" ${palette==='sequential'?'selected':''}>${L('顺序：从浅到深','Sequential: light to dark')}</option><option value="categorical" ${palette==='categorical'?'selected':''}>${L('定性：区分类别','Categorical: distinguish groups')}</option></select></label>`:`<label><span>${L('如何处理第 3 天','Treat the missing third day')}</span><select id="clinic-missing"><option value="zero" ${missing==='zero'?'selected':''}>${L('当成 0°C','Treat as 0°C')}</option><option value="connect" ${missing==='connect'?'selected':''}>${L('跨过它，直接连线','Connect across it')}</option><option value="gap" ${missing==='gap'?'selected':''}>${L('保留断点，标记未知','Leave a gap, label unknown')}</option></select></label>`}<button class="primary" id="diagnose">${(classroom?L('讨论后，揭示原因','Reveal after discussion'):L('我改好了，看看解释','Check my repair'))} ${arrow}</button><button id="reset-clinic">${L('重来一次','Reset')}</button></div><div class="clinic-diagnosis" id="clinic-diagnosis" role="status" ${revealed?'':'hidden'}></div><a class="clinic-related" href="${item.route}">${item.related} ${arrow}</a></section>`;
    draw();
    host.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{current=Number(b.dataset.case);revealed=false;render();host.querySelector(`[data-case="${current}"]`).focus({preventScroll:true});});
    if(current===0){
      host.querySelector('#baseline').oninput=event=>{baseline=Number(event.target.value);host.querySelector('#baseline-output').textContent=baseline;draw();if(revealed)explain();};
      host.querySelector('#zero-baseline').onclick=()=>{baseline=0;host.querySelector('#baseline').value=0;host.querySelector('#baseline-output').textContent=0;draw();if(revealed)explain();};
    }
    if(current===1)host.querySelector('#clinic-palette').onchange=event=>{palette=event.target.value;draw();if(revealed)explain();};
    if(current===2)host.querySelector('#clinic-missing').onchange=event=>{missing=event.target.value;draw();if(revealed)explain();};
    host.querySelector('#diagnose').onclick=()=>{revealed=true;explain();};
    host.querySelector('#reset-clinic').onclick=()=>{baseline=76;palette='sequential';missing='zero';revealed=false;render();};
    if(revealed)explain();
  }
  function canvas(id,title){return d3.select(host.querySelector(id)).html('').append('svg').attr('viewBox','0 0 500 330').attr('role','img').attr('aria-label',title);}
  function bars(id,start){
    const g=canvas(id,L(`80 和 84，纵轴从 ${start} 开始`,`80 and 84, axis starts at ${start}`)),y=d3.scaleLinear([start,90],[270,25]);
    g.append('g').attr('transform','translate(65,0)').call(d3.axisLeft(y).ticks(5).tickSize(-390)).selectAll('.tick line').attr('stroke','#e5e7f0');
    g.selectAll('.domain').remove();g.selectAll('.tick text').attr('font-size',15).attr('fill','#71758c');
    clinicValues.forEach((value,i)=>{g.append('rect').attr('x',140+i*180).attr('y',y(value)).attr('width',78).attr('height',270-y(value)).attr('rx',5).attr('fill',i?'#6f5ce5':'#b9adef');g.append('text').attr('x',179+i*180).attr('y',y(value)-12).attr('text-anchor','middle').attr('font-size',24).attr('font-weight',600).attr('fill','#292b43').text(value);g.append('text').attr('x',179+i*180).attr('y',302).attr('text-anchor','middle').attr('font-size',16).attr('fill','#71758c').text(i?'B':'A');});
    if(start)g.append('text').attr('x',65).attr('y',320).attr('font-size',14).attr('fill','#a14a3b').text(L(`注意：纵轴起点为 ${start}`,`Axis starts at ${start}`));
  }
  function colors(id,type){
    const g=canvas(id,L('四个学院各有 20 条记录','Four colleges, 20 records each'));
    const names=[L('设计','Design'),L('计算机','Computing'),L('经济','Economics'),L('生物','Biology')],categorical=['#6554ca','#3b8a8e','#b55b58','#a57e25'];
    names.forEach((name,i)=>{const x=135+i%2*230,y=85+Math.floor(i/2)*148;g.append('circle').attr('cx',x).attr('cy',y).attr('r',49).attr('fill',type==='categorical'?categorical[i]:d3.interpolatePurples(.28+i*.21));g.append('text').attr('x',x).attr('y',y+8).attr('text-anchor','middle').attr('font-size',24).attr('fill',type==='sequential'&&i===0?'#393351':'#fff').text('20');g.append('text').attr('x',x).attr('y',y+78).attr('text-anchor','middle').attr('font-size',17).attr('fill','#555a73').text(name);});
  }
  function temperatures(id,mode){
    const g=canvas(id,L('七天合成气温，第 3 天缺失','Seven synthetic temperatures, day 3 missing')),x=d3.scaleLinear([0,6],[60,465]),y=d3.scaleLinear([0,26],[265,28]);
    g.append('g').attr('transform','translate(0,265)').call(d3.axisBottom(x).ticks(7).tickFormat(v=>v+1));g.append('g').attr('transform','translate(60,0)').call(d3.axisLeft(y).ticks(5).tickSize(-405));g.selectAll('.tick line').attr('stroke','#e5e7f0');g.selectAll('.domain').attr('stroke','#ccd0df');g.selectAll('.tick text').attr('font-size',15).attr('fill','#71758c');
    const values=repairMissing(clinicTemperatures,mode),points=values.map((value,i)=>({value,i}));
    const line=d3.line().defined(d=>d.value!==null).x(d=>x(d.i)).y(d=>y(d.value));
    g.append('path').attr('d',line(mode==='connect'?points.filter(d=>d.value!==null):points)).attr('fill','none').attr('stroke','#6f5ce5').attr('stroke-width',3);
    points.filter(d=>d.value!==null).forEach(d=>g.append('circle').attr('cx',x(d.i)).attr('cy',y(d.value)).attr('r',5).attr('fill',d.i===2?'#bf5d49':'#6f5ce5'));
    g.append('text').attr('x',465).attr('y',311).attr('text-anchor','end').attr('font-size',15).attr('fill','#71758c').text(L('第几天 →','Day →'));
    if(mode==='gap'){g.append('line').attr('x1',x(2)).attr('x2',x(2)).attr('y1',44).attr('y2',255).attr('stroke','#9892b5').attr('stroke-dasharray','4 5');g.append('text').attr('x',x(2)).attr('y',28).attr('text-anchor','middle').attr('font-size',16).attr('fill','#71758c').text(L('未知','Unknown'));}
  }
  function draw(){if(current===0){bars('#clinic-before',76);bars('#clinic-after',baseline);}else if(current===1){colors('#clinic-before','sequential');colors('#clinic-after',palette);}else{temperatures('#clinic-before','zero');temperatures('#clinic-after',missing);}}
  function explain(){
    const correct=current===0?baseline===0:current===1?palette==='categorical':missing==='gap';
    const explanations=[
      L(`真实增幅为 (84−80)÷80 = 5%。原图截断到 76，B 的可见柱长成了 A 的 2 倍。你现在的可见柱长比为 ${visibleRatio(baseline).toFixed(2)}。柱形图依靠长度比较数量，从零开始才能保留这个比例。`,`The true increase is (84−80)/80 = 5%. Starting at 76 makes B look twice as long. Your visible length ratio is ${visibleRatio(baseline).toFixed(2)}. A zero baseline preserves the quantitative ratio encoded by bar length.`),
      L('学院是无序类别。顺序色板的深浅容易暗示排名或程度，而这里没有这样的数据含义。定性色板用不同颜色区分学院，同时保留文字标签。','Colleges are unordered categories. Sequential lightness suggests ranking or magnitude absent from this variable. Categorical colors distinguish colleges while labels preserve identity.'),
      L('没测到，不代表 0°C。补零制造了并不存在的骤降；直接连线又容易让人以为中间有连续观测。保留断点并说明未知，让图形诚实地表达数据的边界。','No reading does not mean 0°C. Filling zero invents a drop; connecting across it may imply continuous observation. A labeled gap makes the boundary of the data visible.')
    ];
    const spokenExplanations=[
      L(`真实增幅只有 5%。原图的可见柱长比为 2，当前为 ${visibleRatio(baseline).toFixed(2)}。柱形依靠长度表达数量，比较比例应从零开始。`,`The real increase is 5%. The original visible length ratio is 2; the current ratio is ${visibleRatio(baseline).toFixed(2)}. Start bars at zero to preserve quantitative ratios.`),
      L('学院没有大小顺序。渐变会暗示程度或排名；定性色板用不同颜色区分类别。','Colleges have no quantitative order. A gradient implies magnitude or ranking; categorical colors distinguish identities.'),
      L('缺失不是 0°C。补零制造骤降，连线暗示已知。保留断点，说明那一天没有观测。','Missing is not 0°C. Zero invents a drop; a connection can imply knowledge. Keep the gap and label the absence of observation.')
    ];
    const output=host.querySelector('#clinic-diagnosis');output.hidden=false;output.classList.toggle('repair-correct',correct);output.innerHTML=`<span>${correct?'✓':'↗'}</span><div><h3>${correct?L('这次修复，保留了数据的含义。','This repair preserves the data’s meaning.'):L('再看一眼，误导还藏在哪里？','Look again. Where does the misleading cue remain?')}</h3><p>${(classroom?spokenExplanations:explanations)[current]}</p></div>`;
  }
  render();return {};
}
