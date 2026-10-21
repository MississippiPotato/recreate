import { B } from './course-data.js';

// Every function below is both executed in the code tab and displayed as source.
// Comments use Chinese ←→ English so a language switch does not change the program.
async function csv({svg,d3,n}) {
  // 行回调在解析时转换类型；编号仍是字符串。 ←→ Convert types per row; keep IDs as strings.
  const rows=await d3.csv(new URL('../assets/data/students.csv',import.meta.url),row=>({
    id:row.id, score:row.score.trim()===''?null:Number(row.score)
  }));
  const shown=rows.slice(0,n);
  // 比例尺把成绩转为像素，不修改成绩。 ←→ A scale maps scores to pixels without changing them.
  const x=d3.scaleLinear().domain([0,100]).range([0,440]);
  svg.selectAll('rect').data(shown,d=>d.id).join('rect')
    .attr('x',80).attr('y',(d,i)=>20+i*24).attr('width',d=>x(d.score??0))
    .attr('height',16).attr('fill','#2878ad');
  svg.selectAll('text').data(shown).join('text')
    .attr('x',10).attr('y',(d,i)=>33+i*24).text(d=>d.id);
  return {rows:rows.length,scoreType:typeof rows[0].score,first:rows[0]};
}
function dikw({svg,d3,n,L}) {
  const labels=L(['数据','信息','知识','智慧'],['Data','Information','Knowledge','Wisdom']);
  // 每个梯形绑定一层；索引 0 在底部，3 在顶部。 ←→ Bind one layer per trapezoid; index 0 is at the bottom.
  const layers=labels.map((label,i)=>({label,index:i,top:155-i*48,width:380-i*85}));
  const groups=svg.selectAll('g').data(layers).join('g');
  groups.append('path').attr('d',d=>{
    const cx=300,top=d.top,w=d.width;
    // 按顺序画四个顶点，最后闭合。 ←→ Visit four vertices in order, then close the shape.
    return `M${cx-(w-65)/2},${top}L${cx+(w-65)/2},${top}L${cx+w/2},${top+42}L${cx-w/2},${top+42}Z`;
  }).attr('fill',d=>d.index===n-1?'#e16a45':'#2878ad');
  groups.append('text').attr('x',300).attr('y',d=>d.top+28).attr('text-anchor','middle')
    .attr('fill','white').text(d=>d.label);
  return {selected:labels[n-1],level:n};
}
function events({svg,d3,n,L}) {
  const values=d3.range(n);
  const marks=svg.selectAll('circle').data(values).join('circle')
    .attr('cx',(d,i)=>45+i*45).attr('cy',100).attr('r',15).attr('fill','#2878ad');
  // D3 v7 传入 event 与绑定的数据 d。 ←→ D3 v7 passes event and the bound datum d.
  marks.on('click',function(event,d){
    // this 是当前圆；箭头函数可改用 event.currentTarget。 ←→ this is the circle; an arrow may use event.currentTarget.
    const selected=d3.select(this);
    selected.classed('chosen',!selected.classed('chosen'));
    // interrupt 终止旧过渡；duration 的单位为毫秒。 ←→ interrupt stops the prior transition; duration is in milliseconds.
    selected.interrupt().transition().duration(350)
      .attr('fill',selected.classed('chosen')?'#e16a45':'#2878ad');
    svg.selectAll('text').data([d]).join('text').attr('x',30).attr('y',165)
      .text(L('点击的数据 = ','Clicked datum = ')+d);
  });
  return L('点击圆点，查看 event 和 d 的作用。','Click a circle to inspect event and d.');
}
function scales({svg,d3,n}) {
  const values=[0,25,50,75,100];
  // domain 是输入，range 是输出；n 控制屏幕宽度。 ←→ domain is input; range is output; n controls width.
  const x=d3.scaleLinear().domain([0,100]).range([40,40+n*40]);
  svg.selectAll('circle').data(values).join('circle')
    .attr('cx',d=>x(d)).attr('cy',95).attr('r',8).attr('fill','#2878ad');
  // call 将选择集交给坐标轴生成器。 ←→ call passes the selection to an axis generator.
  svg.append('g').attr('transform','translate(0,130)').call(d3.axisBottom(x).ticks(4));
  return values.map(value=>({value,pixel:x(value)}));
}
function arrays({svg,d3,n}) {
  const values=d3.range(1,n+1);
  // 先筛选，再映射；原数组仍保留。 ←→ Filter then map; retain the original array.
  const result=values.filter(d=>d%2===0).map(d=>d*d);
  const x=d3.scaleBand().domain(d3.range(result.length)).range([30,540]).padding(.25);
  const y=d3.scaleLinear().domain([0,n*n]).range([170,15]);
  svg.selectAll('rect').data(result).join('rect').attr('x',(d,i)=>x(i))
    .attr('y',d=>y(d)).attr('width',x.bandwidth()).attr('height',d=>170-y(d)).attr('fill','#2878ad');
  return {input:values,result,sum:d3.sum(result)};
}
function join({svg,d3,n}) {
  const rows=['A','B','C','D','E','F','G','H'].slice(0,n).map(id=>({id}));
  // key 按身份匹配；省略时按索引匹配。 ←→ The key matches identity; omission matches by index.
  const marks=svg.selectAll('circle').data(rows,d=>d.id);
  const counts={enter:marks.enter().size(),update:marks.size(),exit:marks.exit().size()};
  marks.join(
    // enter 与 update 返回选择集，供后续链式设置。 ←→ Return enter and update selections for chaining.
    enter=>enter.append('circle').attr('fill','#e16a45'),
    update=>update.attr('fill','#2878ad'),
    exit=>exit.remove()
  ).attr('cx',(d,i)=>45+i*65).attr('cy',100).attr('r',22);
  svg.selectAll('text').data(rows,d=>d.id).join('text').attr('x',(d,i)=>45+i*65)
    .attr('y',105).attr('text-anchor','middle').attr('fill','white').text(d=>d.id);
  return counts;
}
function flow({svg,d3,n,L}) {
  const stages=L(['记录','数据表','视觉结构','视图'],['Records','Table','Structure','View']);
  // data 绑定阶段，classed 表达当前选中的状态。 ←→ Bind stages; classed represents the selected state.
  svg.selectAll('line').data(stages.slice(1)).join('line').attr('x1',(d,i)=>120+i*140)
    .attr('x2',(d,i)=>155+i*140).attr('y1',90).attr('y2',90).attr('stroke','#8298aa');
  svg.selectAll('rect').data(stages).join('rect').classed('chosen',(d,i)=>i===n-1)
    .attr('x',(d,i)=>15+i*140).attr('y',60).attr('width',105).attr('height',60)
    .attr('rx',5).attr('fill',(d,i)=>i===n-1?'#e16a45':'#e8f0f7');
  svg.selectAll('text').data(stages).join('text').attr('x',(d,i)=>67+i*140)
    .attr('y',96).attr('text-anchor','middle').text(d=>d);
  return stages[n-1];
}
function rollup({svg,d3,n}) {
  const rows=d3.range(n*4).map(i=>({major:['A','B','C'][i%3],class:i%2}));
  // 第二参处理组内数组；后面依次是分组键。 ←→ The reducer handles each group; subsequent functions are grouping keys.
  const groups=d3.rollup(rows,group=>group.length,d=>d.major,d=>d.class);
  const flat=Array.from(groups,([major,classes])=>({major,count:d3.sum(classes.values())}));
  svg.selectAll('rect').data(flat).join('rect').attr('x',60).attr('y',(d,i)=>30+i*45)
    .attr('width',d=>d.count*23).attr('height',25).attr('fill','#2878ad');
  svg.selectAll('text').data(flat).join('text').attr('x',20).attr('y',(d,i)=>48+i*45).text(d=>d.major);
  return {input:rows.length,groups:flat,total:d3.sum(flat,d=>d.count)};
}
function tree({svg,d3,n}) {
  const root=d3.hierarchy({name:'root',children:d3.range(n).map(i=>({name:String(i+1)}))});
  // hierarchy 建立关系，tree 为节点计算 x/y。 ←→ hierarchy establishes relationships; tree computes x/y.
  d3.tree().size([150,440])(root);
  // 横向树交换坐标，节点和连线必须使用同一约定。 ←→ Swap coordinates consistently for nodes and links in a horizontal tree.
  const g=svg.append('g').attr('transform','translate(40,25)');
  g.selectAll('path').data(root.links()).join('path')
    .attr('d',d3.linkHorizontal().x(d=>d.y).y(d=>d.x))
    .attr('fill','none').attr('stroke','#9bb1bd');
  g.selectAll('circle').data(root.descendants()).join('circle')
    .attr('cx',d=>d.y).attr('cy',d=>d.x).attr('r',7).attr('fill','#2878ad');
  return root.descendants().map(d=>({name:d.data.name,depth:d.depth,x:d.x,y:d.y}));
}
function hsl({svg,d3,n}) {
  // h 以度计，s/l 在 0 到 1 之间。 ←→ Hue uses degrees; saturation and lightness use 0–1.
  const colors=d3.range(6).map(i=>d3.hsl(i*60,.65,n/10));
  svg.selectAll('rect').data(colors).join('rect').attr('x',(d,i)=>15+i*93)
    .attr('y',40).attr('width',84).attr('height',110).attr('fill',d=>d.formatHex());
  return colors.map(d=>({h:d.h,s:d.s,l:d.l,css:d.formatHex()}));
}
function sequential({svg,d3,n}) {
  // 插值器接收归一化参数，比例尺负责数据范围。 ←→ The interpolator takes a normalized value; the scale handles the data domain.
  const color=d3.scaleSequential(d3.interpolateViridis).domain([0,n]);
  const values=d3.range(0,n+1);
  const x=d3.scaleBand().domain(values).range([20,570]).padding(.05);
  svg.selectAll('rect').data(values).join('rect').attr('x',x).attr('y',40)
    .attr('width',x.bandwidth()).attr('height',110).attr('fill',color);
  return {domain:color.domain(),middle:color(n/2)};
}
function lab({svg,d3,n}) {
  const colors=d3.range(8).map(i=>d3.lab(n*10,-90+i*26,45).rgb());
  // 检查原始 RGB 是否越界，再格式化为 CSS。 ←→ Check raw RGB displayability before CSS formatting clamps it.
  svg.selectAll('rect').data(colors).join('rect').attr('x',(d,i)=>20+i*70)
    .attr('y',40).attr('width',62).attr('height',100)
    .attr('fill',d=>d.displayable()?d.formatHex():'#d4dce1');
  return colors.map(d=>({r:Math.round(d.r),g:Math.round(d.g),b:Math.round(d.b),displayable:d.displayable()}));
}
function harmony({svg,d3,n}) {
  const hues=[n*30,n*30+150,n*30+210];
  // 取模把角度放回色轮；颜色并不是数值大小。 ←→ Modulo returns angles to the wheel; these colors encode identity, not magnitude.
  const color=h=>d3.hsl(h%360,.6,.52).formatHex();
  svg.selectAll('circle').data(hues).join('circle').attr('cx',(d,i)=>110+i*170)
    .attr('cy',95).attr('r',48).attr('fill',color);
  return hues.map(h=>({h:h%360,color:color(h)}));
}
function schemes({svg,d3,n}) {
  const categories=d3.range(n).map(i=>'C'+(i+1));
  // 显式 domain 固定“类别到颜色”的对应关系。 ←→ An explicit domain fixes category-to-color correspondence.
  const color=d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10);
  svg.selectAll('circle').data(categories).join('circle')
    .attr('cx',(d,i)=>35+i*52).attr('cy',90).attr('r',18).attr('fill',color);
  return categories.map(category=>({category,color:color(category)}));
}
function contrast({svg,d3,n}) {
  const values=d3.range(10),width=52;
  // 上下两行使用同一数值，只改变插值器。 ←→ Both rows use the same values with different interpolators.
  const scales=[d3.scaleSequential(d3.interpolateRainbow),d3.scaleSequential(d3.interpolateViridis)]
    .map(scale=>scale.domain([0,n]));
  scales.forEach((color,row)=>svg.append('g').selectAll('rect').data(values).join('rect')
    .attr('x',d=>20+d*width).attr('y',30+row*80).attr('width',width-2)
    .attr('height',55).attr('fill',color));
  return {values,domain:[0,n]};
}
function generator({svg,d3,n}) {
  // d3.range 生成索引；等间隔色相只是候选方案。 ←→ d3.range creates indices; equal hue steps are only candidate colors.
  const hues=d3.range(n).map(i=>i*360/n);
  svg.selectAll('rect').data(hues).join('rect').attr('x',(d,i)=>20+i*550/n)
    .attr('y',45).attr('width',550/n-4).attr('height',100)
    .attr('fill',h=>d3.hsl(h,.42,.6).formatHex());
  return {count:n,hueStep:360/n,hues};
}
function accessibility({svg,d3,n}) {
  const values=[4,6,8,5];
  // symbol 的类型提供颜色以外的线索。 ←→ Symbol type supplies a cue beyond color.
  const shapes=[d3.symbolCircle,d3.symbolSquare,d3.symbolTriangle,d3.symbolDiamond];
  const symbol=d3.symbol().size(500);
  svg.selectAll('path').data(values).join('path')
    .attr('transform',(d,i)=>`translate(${90+i*130},95)`)
    .attr('d',(d,i)=>symbol.type(shapes[i])()).attr('fill',n===1?'#71818a':(d,i)=>d3.schemeTableau10[i]);
  svg.selectAll('text').data(values).join('text').attr('x',(d,i)=>90+i*130)
    .attr('y',150).attr('text-anchor','middle').text(d=>d);
  return {values,shapeCue:true,gray:n===1};
}
function reshape({svg,d3,n}) {
  const wide=[{id:'A',x:n,y:n*2},{id:'B',x:n+1,y:n*3}];
  // 每个实体生成多个观测；保留实体与字段联合标识。 ←→ Create observations per entity; preserve entity and field identifiers.
  const long=wide.flatMap(row=>['x','y'].map(field=>({id:row.id,field,value:row[field]})));
  svg.selectAll('text').data(long).join('text').attr('x',35).attr('y',(d,i)=>40+i*35)
    .text(d=>`${d.id} / ${d.field} = ${d.value}`);
  return {wide,long};
}
function axis({svg,d3,n}) {
  const values=[1,10,100,1000];
  // 对数域不能跨零；线性与对数都保留原始值。 ←→ A log domain cannot cross zero; neither scale changes the values.
  const x=(n===1?d3.scaleLinear():d3.scaleLog()).domain(n===1?[0,1000]:[1,1000]).range([40,550]);
  svg.append('g').attr('transform','translate(0,135)').call(d3.axisBottom(x).ticks(5,'~g'));
  svg.selectAll('circle').data(values).join('circle').attr('cx',x).attr('cy',80)
    .attr('r',7).attr('fill','#e16a45');
  return values.map(value=>({value,pixel:x(value)}));
}
function curves({svg,d3,n}) {
  const points=[[25,130],[125,55],[225,135],[325,45],[425,125],[545,65]];
  // curve 改变连接方式，不增加采样。 ←→ curve changes connections, not the samples.
  const choices=[d3.curveLinear,d3.curveStep,d3.curveMonotoneX,d3.curveCatmullRom.alpha(.5),d3.curveBasis];
  const line=d3.line().x(d=>d[0]).y(d=>d[1]).curve(choices[n-1]);
  svg.append('path').datum(points).attr('d',line).attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.selectAll('circle').data(points).join('circle').attr('cx',d=>d[0]).attr('cy',d=>d[1]).attr('r',5).attr('fill','#e16a45');
  return {samples:points.length,curve:['linear','step','monotoneX','Catmull–Rom','Basis'][n-1]};
}
function aspect({svg,d3,n}) {
  const values=[2,4,3,6,8,7];
  // 固定 domain，只改变纵向像素范围。 ←→ Fix the domain and change only the vertical pixel range.
  const x=d3.scaleLinear().domain([0,5]).range([30,550]);
  const y=d3.scaleLinear().domain([0,10]).range([175,175-n*15]);
  svg.append('path').datum(values).attr('d',d3.line().x((d,i)=>x(i)).y(y))
    .attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.append('g').attr('transform','translate(30,0)').call(d3.axisLeft(y).ticks(4));
  return {values,pixelHeight:n*15};
}
function contours({svg,d3,n}) {
  const size=12,values=d3.range(size*size).map(i=>Math.sin(i%size/3)*Math.cos(Math.floor(i/size)/3)*50+50);
  // size 按列数、行数设置；values 是逐行展开的一维数组。 ←→ size specifies columns and rows; values is row-major flattened data.
  const polygons=d3.contours().size([size,size]).thresholds([n*10])(values);
  const path=d3.geoPath(d3.geoIdentity().scale(15));
  svg.append('g').attr('transform','translate(170,5)').selectAll('path').data(polygons).join('path')
    .attr('d',path).attr('fill','#b7dfdb').attr('stroke','#2878ad').attr('stroke-width',2);
  return {threshold:n*10,grid:[size,size],polygons:polygons[0].coordinates.length};
}
function time({svg,d3,n}) {
  // 使用 UTC 间隔，避免本地时区改变日期。 ←→ Use UTC intervals to avoid local-time shifts.
  const start=new Date(Date.UTC(2024,1,25));
  const days=d3.utcDays(start,d3.utcDay.offset(start,n));
  const x=d3.scaleUtc().domain(d3.extent(days)).range([30,550]);
  svg.selectAll('circle').data(days).join('circle').attr('cx',x).attr('cy',80).attr('r',6).attr('fill','#2878ad');
  svg.append('g').attr('transform','translate(0,125)').call(d3.axisBottom(x).ticks(d3.utcDay.every(1)).tickFormat(d3.utcFormat('%m-%d')));
  return days.map(d=>d3.utcFormat('%Y-%m-%d')(d));
}
function line({svg,d3,n}) {
  const rows=[5,8,null,12,9,15,13].map((value,i)=>({day:i,value}));
  // defined(false) 在此处断开，而不是把缺失当零。 ←→ defined(false) breaks the path rather than substituting zero.
  const draw=d3.line().defined(d=>n===1?d.value!==null:true)
    .x(d=>30+d.day*85).y(d=>170-(d.value??0)*9);
  svg.append('path').datum(rows).attr('d',draw).attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.selectAll('circle').data(rows.filter(d=>d.value!==null)).join('circle')
    .attr('cx',d=>30+d.day*85).attr('cy',d=>170-d.value*9).attr('r',5).attr('fill','#e16a45');
  return {rows,missing:n===1?'gap':'zero (misleading comparison)'};
}
function calendar({svg,d3,n}) {
  const start=new Date(Date.UTC(2024,0,1));
  const dates=d3.utcDays(start,d3.utcDay.offset(start,n*7));
  // 以周一为一周起点；周偏移与星期分别映射两条轴。 ←→ Start weeks Monday; map week offset and weekday to separate axes.
  const first=d3.utcMonday.floor(start);
  svg.selectAll('rect').data(dates).join('rect')
    .attr('x',d=>35+d3.utcMonday.count(first,d)*39)
    .attr('y',d=>15+(d.getUTCDay()+6)%7*24).attr('width',34).attr('height',19)
    .attr('fill',d=>d3.interpolateYlGnBu(d.getUTCDate()/32));
  return {dates:dates.length,first:dates[0].toISOString(),last:dates.at(-1).toISOString()};
}
function spiral({svg,d3,n}) {
  const days=d3.range(84);
  // 角度按周期重复，半径逐日向外增加。 ←→ Angle repeats by period while radius grows with time.
  const point=day=>{const theta=day/n*2*Math.PI,r=15+day*1.3;return [300+Math.cos(theta)*r,100+Math.sin(theta)*r*.75];};
  svg.append('path').datum(days).attr('d',d3.line().x(d=>point(d)[0]).y(d=>point(d)[1]))
    .attr('fill','none').attr('stroke','#c1cdd5');
  svg.selectAll('circle').data(days).join('circle').attr('cx',d=>point(d)[0]).attr('cy',d=>point(d)[1])
    .attr('r',3).attr('fill',d=>d3.interpolateYlGnBu((Math.sin(d/14*2*Math.PI)+1)/2));
  return {days:84,displayPeriod:n,generatorPeriod:14};
}
function story({svg,d3,n}) {
  const series=d3.range(3).map(role=>d3.range(6).map(time=>({time,y:50+role*50+(time===n?15:0)})));
  // 每个角色绑定一条路径，每条路径再绑定一组事件点。 ←→ Bind one path per character and one point sequence per path.
  const path=d3.line().x(d=>30+d.time*100).y(d=>d.y).curve(d3.curveMonotoneX);
  svg.selectAll('path').data(series).join('path').attr('d',path).attr('fill','none')
    .attr('stroke',(d,i)=>d3.schemeTableau10[i]).attr('stroke-width',3);
  return {characters:3,event:n,note:'vertical position is not a measured quantity'};
}

const config=(title,en,run,control,controlEn,min,max,value,notes,docs,persistent=false)=>({title:B(title,en),run,control:B(control,controlEn),min,max,value,notes:notes.map(([term,zh,en])=>({term,text:B(zh,en)})),docs,persistent});
export const codeLabs={
  dikw:config('DIKW 金字塔与路径','DIKW pyramid paths',dikw,'高亮层级','Highlighted level',1,4,1,[['path.attr("d",...)','M、L 与 Z 分别移动、画线和闭合。','M moves, L draws a line, and Z closes.'],['data(layers)','每层数据对应一组图形和文字。','Each layer binds to one group of marks and text.']],'https://d3js.org/d3-selection/events'),
  csv:config('读取 CSV 与转换字段','Load CSV and convert fields',csv,'显示条数','Visible records',2,7,5,[['await d3.csv(url, row)','await 等待异步读取；row 的返回值成为一条记录。','await waits for loading; the row callback returns each converted record.'],['Number(row.score)','显式数值转换；空值先判断。','Convert explicitly after checking for blanks.'],['d => d.id','箭头函数返回稳定编号，用于匹配。','The arrow function returns a stable key.']],'https://d3js.org/d3-fetch'),
  events:config('事件与状态','Events and state',events,'圆点数量','Circle count',2,10,6,[['(event, d)','event 是事件，d 是绑定的数据，不要颠倒。','event is the action; d is the bound datum.'],['function / this','普通函数的 this 指向元素；箭头函数改用 currentTarget。','A regular function receives the element as this; use currentTarget in an arrow.'],['classed(name, boolean)','布尔值决定添加还是移除类。','The boolean determines whether the class is present.'],['transition().duration(350)','在 350 毫秒内插值属性；interrupt 防止快速点击时堆积旧过渡。','Interpolate attributes over 350 ms; interrupt prevents old transitions accumulating on rapid clicks.']],'https://d3js.org/d3-selection/events'),
  scales:config('比例尺与坐标轴','Scales and axes',scales,'宽度参数','Width parameter',3,12,10,[['domain([0,100])','输入数据的范围。','The range of input values.'],['range([40,...])','输出像素的范围，与 domain 按顺序对应。','The output pixel range corresponds to domain order.'],['selection.call(axis)','把当前选择集交给坐标轴生成器。','Pass the current selection to the axis generator.']],'https://d3js.org/d3-scale/linear'),
  arrays:config('filter → map → sum','filter → map → sum',arrays,'输入长度','Input length',3,12,8,[['d3.range(1,n+1)','终点不包含在结果中。','The stop value is exclusive.'],['d => d % 2 === 0','回调逐项返回布尔值，决定保留哪些元素。','The predicate returns a boolean per item.'],['map(d => d*d)','逐项生成平方值，不修改原数组。','Produce squared values without mutating the input.']],'https://d3js.org/d3-array/transform'),
  join:config('data → join → attr','data → join → attr',join,'数据数量','Data count',1,8,3,[['selectAll("circle")','选择集可以为空；join 会按需要创建元素。','The selection may be empty; join creates elements as needed.'],['data(rows, d => d.id)','第二参是 key 函数，返回唯一身份。','The second argument is the key accessor.'],['enter / update / exit','三态由匹配结果决定；拖动参数查看数量。','The states follow matching; change the parameter to inspect counts.']],'https://d3js.org/d3-selection/joining',true),
  flow:config('状态驱动的流程图','A state-driven pipeline',flow,'当前阶段','Current stage',1,4,1,[['data(stages)','每个阶段对应一个矩形和标签。','Each stage corresponds to a rectangle and label.'],['classed("chosen", predicate)','对每个元素计算是否为当前阶段。','Evaluate whether each element is the selected stage.']],'https://d3js.org/d3-selection/modifying'),
  rollup:config('多层分组与归约','Nested grouping and reduction',rollup,'输入规模','Input size',2,10,5,[['group => group.length','reducer 接收组内数组，返回人数。','The reducer receives a group array and returns its count.'],['d => d.major, d => d.class','多个 key 按传入顺序生成嵌套 Map。','Keys create nested Maps in argument order.'],['([major, classes])','解构键值对；classes 仍是一个 Map。','Destructure an entry; classes remains a Map.']],'https://d3js.org/d3-array/group'),
  tree:config('hierarchy → tree → links','hierarchy → tree → links',tree,'子节点数量','Child count',2,8,5,[['d3.hierarchy(data)','计算父子关系、depth 等结构属性。','Compute parent/child relationships and depth.'],['d3.tree().size(...)','调用生成器后才为节点提供布局坐标。','Calling the layout assigns node coordinates.'],['x(d => d.y).y(d => d.x)','横向绘制时，节点与连线一起交换坐标。','Swap coordinates consistently for horizontal rendering.']],'https://d3js.org/d3-hierarchy/tree'),
  hsl:config('HSL 颜色的构造','Constructing HSL colors',hsl,'亮度 × 10','Lightness × 10',2,8,5,[['d3.hsl(h,s,l)','色相用角度，饱和度和亮度用 0–1。','Hue is degrees; saturation and lightness use 0–1.'],['formatHex()','转换为浏览器可用的十六进制颜色。','Format as a CSS hexadecimal color.']],'https://d3js.org/d3-color'),
  sequential:config('顺序颜色比例尺','A sequential color scale',sequential,'数值上界','Domain maximum',3,12,8,[['scaleSequential(interpolator)','先选择连续颜色插值器。','Choose a continuous color interpolator.'],['domain([0,n])','再说明数据范围；color(value) 返回颜色。','Set the data domain; color(value) returns a color.']],'https://d3js.org/d3-scale/sequential'),
  lab:config('颜色转换与色域判断','Color conversion and gamut checks',lab,'L* ÷ 10','L* / 10',2,9,6,[['d3.lab(L,a,b).rgb()','创建 Lab 颜色，再转换为 RGB 对象。','Construct Lab and convert to an RGB object.'],['displayable()','在格式化裁剪之前检查可显示范围。','Check the range before CSS formatting clamps it.']],'https://d3js.org/d3-color'),
  harmony:config('色轮角度与取模','Hue angles and modulo',harmony,'主色相 ÷ 30','Base hue / 30',0,11,6,[['h % 360','让色相回到 0–360° 范围。','Wrap hue to 0–360 degrees.'],['attr("fill", color)','传函数时会对每条数据分别求值。','A function-valued attribute is evaluated per datum.']],'https://d3js.org/d3-color'),
  schemes:config('固定类别色板','A stable categorical palette',schemes,'类别数量','Category count',2,10,6,[['scaleOrdinal()','输入是离散类别，不表示连续数量。','Inputs are categories rather than continuous magnitudes.'],['domain(categories)','显式设定类别顺序，防止筛选后颜色漂移。','Fix category order so filtering does not change colors.'],['schemeTableau10','预定义色板是颜色数组。','A predefined scheme is an array of colors.']],'https://d3js.org/d3-scale/ordinal'),
  contrast:config('同数据的双视图比较','Two views of the same values',contrast,'数值范围上界','Domain maximum',9,15,9,[['scales.forEach(...)','对同一组 values 应用不同颜色映射。','Apply different mappings to the same values.'],['append("g")','用组分别管理两个视图的元素。','Use a group to contain each view.']],'https://d3js.org/d3-scale-chromatic'),
  generator:config('参数化生成色板','Parameterized palette generation',generator,'颜色数量','Color count',2,12,5,[['d3.range(n)','生成 0 到 n−1 的整数。','Generate integers 0 through n−1.'],['i * 360 / n','把色相分成 n 份；只是候选，不保证可读。','Divide hue into n steps; this is a candidate, not a readability guarantee.']],'https://d3js.org/d3-color'),
  accessibility:config('形状与文字冗余编码','Redundant shape and text',accessibility,'1 灰度 / 2 原色','1 gray / 2 color',1,2,2,[['d3.symbol().size(500)','size 表示符号面积，不是半径。','size specifies symbol area, not radius.'],['symbol.type(type)()','设置类型，再调用生成器得到路径字符串。','Set the type, then invoke the generator to obtain path data.']],'https://d3js.org/d3-shape/symbol'),
  reshape:config('flatMap 与联合标识','flatMap and compound identity',reshape,'示例数值','Example value',1,9,4,[['flatMap(callback)','每项返回一个数组，结果展开一层。','Return an array per item and flatten one level.'],['{ id, field, value }','长表仍保留实体与指标。','The long table retains entity and measure.']],'https://d3js.org/d3-array/transform'),
  axis:config('线性轴与对数轴','Linear and log axes',axis,'1 线性 / 2 对数','1 linear / 2 log',1,2,1,[['scaleLog().domain([1,1000])','正数域中，相同倍数对应相同距离。','Equal ratios map to equal distances on this positive domain.'],['axisBottom(x).ticks(...)','ticks 是刻度数量的建议值，不是保证。','The tick count is a hint rather than a guarantee.']],'https://d3js.org/d3-axis'),
  curves:config('line 生成器与 curve','Line generators and curves',curves,'曲线序号','Curve index',1,5,1,[['datum(points)','将整个数组作为一条路径的数据。','Bind the entire array as one path’s datum.'],['line.x(...).y(...)','访问器把每个采样映射到像素坐标。','Accessors map each sample to pixels.'],['curve(...)','更换连接规则，采样点不变。','Change the connection rule, retaining the samples.']],'https://d3js.org/d3-shape/curve'),
  aspect:config('用 range 改变画布倾角','Changing slope through range',aspect,'纵向像素参数','Vertical pixel parameter',3,10,7,[['固定 domain','数值不变，先固定输入范围。','Retain values and fix the input domain.'],['range([175,...])','减小 y 像素值让数值向上绘制。','Smaller y pixels place larger values higher.']],'https://d3js.org/d3-scale/linear'),
  contours:config('d3.contours 的输入约定','The d3.contours input contract',contours,'阈值 ÷ 10','Threshold / 10',1,9,5,[['size([columns,rows])','这里是采样网格大小，不是像素尺寸。','This is the sampling grid, not pixel dimensions.'],['thresholds([value])','显式指定要提取的等值。','Specify the contour threshold explicitly.'],['geoIdentity().scale(15)','把网格坐标映射到绘图像素。','Map grid coordinates to pixels.']],'https://d3js.org/d3-contour/contour'),
  time:config('UTC 日期间隔','UTC date intervals',time,'连续日期数量','Consecutive date count',3,8,6,[['Date.UTC(...)','月份从 0 起；1 表示二月。','Months start at zero; 1 is February.'],['utcDays(start,stop)','生成日历日期，stop 不包含在内。','Generate calendar dates, excluding stop.'],['scaleUtc()','时间轴按实际经过的时间映射。','Map actual elapsed time.']],'https://d3js.org/d3-time'),
  line:config('defined 与缺失值','defined and missing values',line,'1 断开 / 2 补零','1 gap / 2 zero',1,2,1,[['defined(d => d.value !== null)','只连接连续有效的采样段。','Connect contiguous valid sample runs.'],['value ?? 0','null 转成零后会改变缺失日期处的曲线形状。','Replacing null with zero changes the line at missing dates.']],'https://d3js.org/d3-shape/line'),
  calendar:config('日期到日历坐标','Dates to calendar coordinates',calendar,'周数','Week count',3,12,7,[['utcMonday.count(first,d)','从起始周数到该日期的周数。','Count week boundaries from the initial week.'],['(getUTCDay()+6)%7','把星期一设为第 0 行。','Make Monday row zero.']],'https://d3js.org/d3-time'),
  spiral:config('极坐标到笛卡尔坐标','Polar to Cartesian coordinates',spiral,'每圈天数','Days per turn',7,21,14,[['theta = day/n * 2π','n 是显示周期，不改变输入序列。','n is the display period, not a source-data change.'],['cos / sin','角度和半径共同决定位置。','Angle and radius determine position.']],'https://d3js.org/d3-shape/line'),
  story:config('多条路径的数据连接','Joining multiple paths',story,'事件序号','Event index',0,5,2,[['data(series)','每个数组对应一个角色路径。','Each nested array represents a character path.'],['attr("d", path)','line 生成器逐条处理事件序列。','The line generator processes each event sequence.']],'https://d3js.org/d3-shape/line')
};

export function programSource(lab,lang='zh') {
  return lab.run.toString().split('\n').map(line=>{
    const divider=line.indexOf(' ←→ ');
    if(divider<0)return line;
    if(lang==='zh')return line.slice(0,divider);
    const comment=line.indexOf('//');
    return line.slice(0,comment)+'// '+line.slice(divider+4);
  }).join('\n');
}
