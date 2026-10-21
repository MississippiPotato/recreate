# 第 5 章 时序数据可视化

折线、日历、螺旋和故事线，各有适用的问题。

## 5.1 时间属性

### 时间的五个属性

| 属性 | 含义 | 可视化中的例子 |
| --- | --- | --- |
| 有序性 | 两个事件有先后次序 | 按时间排序的日志、折线图 |
| 连续性 | 两个时刻之间还有其他时刻 | 用实际时间间隔安排位置 |
| 周期性 | 过程可能重复出现 | 昼夜、星期、季节 |
| 独立于空间 | 可以把时间与空间位置分别表示 | 时间轴与地图分别编码 |
| 结构性 | 年、月、日等尺度构成层次 | 日历、周排列、闰年 |

### 时间本身与采样间隔

时间连续，但记录可能按天、按月采集，也可能间隔不规则。相邻两条记录在数组中相邻，不表示它们相隔同样长的时间。使用时间比例尺，可以把真实的时间间隔保留在图中。

### 日历结构

一个月的天数不同，闰年还包含 2 月 29 日。D3 的时间间隔提供 `range`、`offset` 和 `count`，分别用于生成日期、移动日期和计算间隔数量。

演示把五个属性分别展开，并用一组日期比较按序号等距排列与按实际时间排列。

### 关键代码

#### 1. 用对象数组组织时间属性

```javascript
const attributes=[
  {key:'ordered',name:'有序性'}, {key:'continuous',name:'连续性'},
  {key:'periodic',name:'周期性'}, {key:'spatial',name:'独立于空间'},
  {key:'structured',name:'结构性'}
];
// 同一份数据决定标签和点击时使用的属性。
d3.select('#time-properties').selectAll('button').data(attributes,d=>d.key).join('button')
  .text(d=>d.name).on('click',function(event,picked){
    d3.select('#time-properties').selectAll('button').classed('selected',d=>d.key===picked.key);
    console.log(picked.key);
  });
```

**关键点解释**

对象把稳定 key 与显示名称分开：key 用于数据连接和状态比较，name 用于文字显示。`on` 的 picked 是点击项，`classed` 的 d 是每一个候选项；两个回调分别处理局部事件和整组选中状态。

#### 2. 生成日序列与跨越闰日

```javascript
const start=new Date(Date.UTC(2024,0,1));
const stop=new Date(Date.UTC(2025,0,1));
// stop 不包含在结果中，2024 年自动包含 2 月 29 日。
const days=d3.utcDay.range(start,stop);
console.log(days.length); // 366
const next=d3.utcDay.offset(new Date(Date.UTC(2024,1,28)),1);
console.log(d3.utcFormat('%Y-%m-%d')(next)); // 2024-02-29
```

**关键点解释**

`Date.UTC` 的月份从 0 开始。`utcDay.range` 按日历间隔生成日期，`offset` 移动指定天数。这里统一使用 UTC 构造、间隔和格式化；如果采用本地时间，则对应使用 timeDay、timeFormat 等本地方法。

### 运行示例: UTC 日期间隔

```javascript
function time({svg,d3,n}) {
  // 使用 UTC 间隔，避免本地时区改变日期。
  const start=new Date(Date.UTC(2024,1,25));
  const days=d3.utcDays(start,d3.utcDay.offset(start,n));
  const x=d3.scaleUtc().domain(d3.extent(days)).range([30,550]);
  svg.selectAll('circle').data(days).join('circle').attr('cx',x).attr('cy',80).attr('r',6).attr('fill','#2878ad');
  svg.append('g').attr('transform','translate(0,125)').call(d3.axisBottom(x).ticks(d3.utcDay.every(1)).tickFormat(d3.utcFormat('%m-%d')));
  return days.map(d=>d3.utcFormat('%Y-%m-%d')(d));
}
```


[D3 官方文档](https://d3js.org/d3-time)

### 演示观察

点击时间属性，查看不等间隔、缺失和闰日三个小例子。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-1)

## 5.2 标准时间可视化：折线图

### 标准时序图：折线图

折线图的横轴表示时间，纵轴表示度量。原课程以 Marie、Jean、Camille 等人名的使用频率为例，比较不同名字随年份变化的趋势。

### 时间解析、比例尺与格式化

- `timeParse`：把字符串解析为日期，例如年份“1965”。
- `scaleTime` 或 `scaleUtc`：把日期映射到横坐标。
- `timeFormat` 或 `utcFormat`：把日期显示为刻度和提示中的文字。

### 高亮与时间段筛选

多条曲线可以共享同一个时间轴。悬停时显示当前日期和数值，选中一条曲线时降低其他曲线的透明度；筛选时间段时，同步调整比例尺范围和显示的数据。

### 缺失值如何连接

没有记录的日期与记录为 0 的日期含义不同。`line.defined(...)` 可以在缺失处断开曲线。本节以同一组逐日数值比较断开和补零后的形状。

### 关键代码

#### 1. 解析与格式化日期

```javascript
const parseYear=d3.utcParse('%Y');
const formatYear=d3.utcFormat('%Y');
const date=parseYear('1965'); // 字符串 → Date。
console.log(formatYear(date)); // Date → 字符串。
// %Y 年，%m 月，%d 日，%H 时，%M 分，%S 秒。
const parseDay=d3.utcParse('%Y-%m-%d');
console.log(parseDay('2024-02-29'));
```

**关键点解释**

`utcParse(format)` 与 `utcFormat(format)` 都先返回一个函数，随后再传入具体值。格式符区分大小写：`%m` 是月份，`%M` 是分钟。解析用于计算与比例尺，格式化用于显示。

#### 2. 时间轴与缺失值

```javascript
const x=d3.scaleUtc().domain(d3.extent(series,d=>d.date)).range([0,500]);
const y=d3.scaleLinear().domain([0,d3.max(series,d=>d.value)]).range([180,0]);
const line=d3.line()
  .defined(d=>d.value!==null) // 缺失记录处结束当前子路径。
  .x(d=>x(d.date)).y(d=>y(d.value));
svg.append('path').datum(series).attr('d',line).attr('fill','none').attr('stroke','#2878ad');
svg.append('g').attr('transform','translate(0,180)').call(d3.axisBottom(x));
```

**关键点解释**

`extent` 计算日期的最小值与最大值。`defined` 先判断一个点是否参与路径，只有有效点才进入 x/y 访问器。断开和补零会产生不同的图形，因此要在构造路径时明确处理方式。

#### 3. 鼠标坐标、invert 与最近记录

```javascript
const nearest=d3.bisector(d=>d.date).center; // series 先按日期升序排列。
svg.on('pointermove',event=>{
  const [pixelX]=d3.pointer(event,svg.node()); // 取得 SVG 局部坐标。
  const date=x.invert(pixelX);               // 像素 → 日期。
  const index=nearest(series,date);          // 二分查找最近日期。
  const picked=series[index];
  if (picked) console.log(d3.utcFormat('%Y-%m-%d')(picked.date),picked.value);
});
```

**关键点解释**

`pointer` 把事件位置换算到指定元素的坐标系，`invert` 把横坐标还原为日期，`bisector(...).center` 在有序记录中查找最近项。若图形放在平移后的 g 中，就把该 g 作为 pointer 的第二个参数，让坐标系一致。

### 运行示例: defined 与缺失值

```javascript
function line({svg,d3,n}) {
  const rows=[5,8,null,12,9,15,13].map((value,i)=>({day:i,value}));
  // defined(false) 在此处断开，而不是把缺失当零。
  const draw=d3.line().defined(d=>n===1?d.value!==null:true)
    .x(d=>30+d.day*85).y(d=>170-(d.value??0)*9);
  svg.append('path').datum(rows).attr('d',draw).attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.selectAll('circle').data(rows.filter(d=>d.value!==null)).join('circle')
    .attr('cx',d=>30+d.day*85).attr('cy',d=>170-d.value*9).attr('r',5).attr('fill','#e16a45');
  return {rows,missing:n===1?'gap':'zero (misleading comparison)'};
}
```


[D3 官方文档](https://d3js.org/d3-shape/line)

### 演示观察

在折线与日历间切换，追踪同一天，并检查缺失日有没有被画成零。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-2)

## 5.3 日历热图

### 日历热图

日历热图把每一天画成一个小格，横向表示周，纵向表示星期，颜色表示当天的数值。原课程用每日最高温度展示这种布局，并用月份分隔线帮助定位。

### 从日期计算行与列

| 图形属性 | 计算内容 |
| --- | --- |
| 列 | 从起始周到当前日期跨过了多少周 |
| 行 | 当前日期是星期几 |
| 颜色 | 当天的数值对应的颜色 |
| 边界 | 月份或年份的分隔 |

周日或周一都可以作为一周起点，但列计数和星期编号要配套。以周一为起点时，`(getUTCDay() + 6) % 7` 把星期一转换为第 0 行。

### 闰日、月份与缺失日期

先生成全年日期，再按日期键查找数值，可以让缺失日期保留自己的位置。闰年会自然生成 366 个日格。月份分隔线沿月初日期的行列位置绘制，便于比较月份之间的变化。

### 关键代码

#### 1. 生成日期并查找每日数值

```javascript
const start=new Date(Date.UTC(2024,0,1)), stop=new Date(Date.UTC(2025,0,1));
const key=d3.utcFormat('%Y-%m-%d');
const days=d3.utcDays(start,stop).map(date=>({
  date,
  value:byDate.get(key(date)) ?? null // 查不到值时，仍保留这一天。
}));
console.log(days.length); // 366
```

**关键点解释**

用格式一致的日期字符串作为 Map 键，可把原始记录与完整日历对齐。`?? null` 只处理 null/undefined，不会把有效的 0 当作缺失。先生成日期，能使没有记录的日格也保持正确位置。

#### 2. 以周一为起点计算日格

```javascript
const firstWeek=d3.utcMonday.floor(new Date(Date.UTC(2024,0,1)));
const cellSize=14;
svg.selectAll('rect.day').data(days,d=>+d.date).join('rect').attr('class','day')
  .attr('x',d=>d3.utcMonday.count(firstWeek,d.date)*cellSize)
  .attr('y',d=>(d.date.getUTCDay()+6)%7*cellSize)
  .attr('width',cellSize-1).attr('height',cellSize-1)
  .attr('fill',d=>d.value===null ? '#dce4e9' : color(d.value));
```

**关键点解释**

`utcMonday.floor` 找到日期所在周的周一，`count` 计算跨过的周边界，得到列号。星期编号经取模转换为周一 0 到周日 6。key 中的一元 `+` 把 Date 转成毫秒值，为同一天提供稳定标识。

#### 3. 月份分隔线

```javascript
// 取下月第一天，其前侧就是当前月份的结束边界。
function monthBoundary(date) {
  const weekday=(date.getUTCDay()+6)%7;
  const week=d3.utcMonday.count(firstWeek,date);
  const x=week*cellSize, y=weekday*cellSize;
  return `M ${x+cellSize} 0 V ${y} H ${x} V ${7*cellSize}`;
}
const months=d3.utcMonths(start,stop).slice(1);
svg.selectAll('path.month').data(months).join('path').attr('class','month')
  .attr('d',monthBoundary).attr('fill','none').attr('stroke','#e16a45');
```

**关键点解释**

边界在月初之前走出一个阶梯：先沿该周右边到月初所在行，再向左，最后向下。周一开月时 y 为 0，边界落在整列左侧。使用与日格相同的周计数和星期编号，分隔线就能与网格对齐。

### 运行示例: 日期到日历坐标

```javascript
function calendar({svg,d3,n}) {
  const start=new Date(Date.UTC(2024,0,1));
  const dates=d3.utcDays(start,d3.utcDay.offset(start,n*7));
  // 以周一为一周起点；周偏移与星期分别映射两条轴。
  const first=d3.utcMonday.floor(start);
  svg.selectAll('rect').data(dates).join('rect')
    .attr('x',d=>35+d3.utcMonday.count(first,d)*39)
    .attr('y',d=>15+(d.getUTCDay()+6)%7*24).attr('width',34).attr('height',19)
    .attr('fill',d=>d3.interpolateYlGnBu(d.getUTCDate()/32));
  return {dates:dates.length,first:dates[0].toISOString(),last:dates.at(-1).toISOString()};
}
```


[D3 官方文档](https://d3js.org/d3-time)

### 演示观察

定位 2 月 29 日，再切换视图。观察日期和数值不变，阅读入口改变。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-3)

## 5.4 周期时间与螺旋图

### 周期时间与螺旋布局

折线图沿一个方向展开时间；螺旋图让相同相位重复出现在相近的角度，用半径区分先后周期。每天、每周、每月或每年都可以作为一个待比较的周期。

### 阿基米德螺旋

阿基米德螺旋的公式是 `r = a + bθ`。θ 增加 2π，半径增加 `2πb`；因此相邻两圈的径向间距相同。把极坐标转换为 `x = r cosθ`、`y = r sinθ`，就能在 SVG 中绘制。

### 两种角度安排

- **按周期等分：**每个周期占一圈，同一相位的日期沿相近方向排列，便于检查周期。
- **近似等弧长：**半径变大时减小角度增量，原课程使用 `Δθ ≈ boxSize / √(b² + r²)`，使小格长度接近。

### 扇环路径与周期比较

一个螺旋小格可以由起点外侧、终点外侧、终点内侧、起点内侧四个顶点闭合而成。本节演示采用按周期等分的角度排列：改变每圈天数，观察高值区是否在相同方向对齐。

### 关键代码

#### 1. 极坐标到笛卡尔坐标

```javascript
const a=20, gap=24, b=gap/(2*Math.PI);
function position(theta) {
  const r=a+b*theta;
  return {x:r*Math.cos(theta),y:r*Math.sin(theta),r};
}
console.log(position(0),position(2*Math.PI));
// 每转一圈，半径增加 2πb，也就是 gap。
```

**关键点解释**

`theta` 使用弧度。把每圈间距设为 gap 后，`b = gap/(2π)`。返回对象同时保留 x、y 和 r，后续路径和角度步长都可以使用，不必再次计算半径。

#### 2. 周期等分与等弧长步长

```javascript
// 周期布局：每 period 项一圈，同相位拥有相同方向。
const period=14;
const phaseAngle=index=>index/period*2*Math.PI;
// 原课程的近似等弧长布局：半径越大，角度步长越小。
const boxSize=12;
const arcStep=radius=>boxSize/Math.sqrt(b*b+radius*radius);
console.log(phaseAngle(14),arcStep(100));
```

**关键点解释**

这两种布局解决不同问题：固定角度增量便于周期相位对齐；动态角度增量便于控制小格的弧长。`√(b²+r²)` 是螺旋曲线对角度的弧长变化率，用目标长度除以它得到近似步长。

#### 3. 四个顶点构造螺旋小格

```javascript
function segmentPath(t0,t1) {
  const point=(theta,side)=>{
    const r=position(theta).r+side*gap/2;
    return [r*Math.cos(theta),r*Math.sin(theta)];
  };
  const outer0=point(t0,1),outer1=point(t1,1);
  const inner1=point(t1,-1),inner0=point(t0,-1);
  return `M ${outer0} L ${outer1} L ${inner1} L ${inner0} Z`;
}
// attr 的 d 接收闭合路径，可以分别设置填充和描边。
```

**关键点解释**

外侧按起点到终点连接，内侧反向返回，最后用 Z 闭合。`side` 取 1 或 −1 控制内外偏移。这里用短直线近似小格边缘；缩小角度范围可以让近似更细。

#### 4. 直角坐标到螺旋的连续插值

```javascript
const angle = day / period * 2 * Math.PI - Math.PI / 2;
const radius = 27 + day * radiusStep;
const polar = [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
// u 从 0 到 1；每个点保留自己的 key。
const position = linear.map((coordinate, i) => coordinate + (polar[i] - coordinate) * u);
circles.attr('cx', position[0]).attr('cy', position[1]);
```

**关键点解释**

`u=0` 时使用直线坐标，`u=1` 时使用极坐标，之间是同一个点的位置插值。调整卷曲量不会改变记录值或编号；`period` 决定每圈承载多少天。

### 运行示例: 极坐标到笛卡尔坐标

```javascript
function spiral({svg,d3,n}) {
  const days=d3.range(84);
  // 角度按周期重复，半径逐日向外增加。
  const point=day=>{const theta=day/n*2*Math.PI,r=15+day*1.3;return [300+Math.cos(theta)*r,100+Math.sin(theta)*r*.75];};
  svg.append('path').datum(days).attr('d',d3.line().x(d=>point(d)[0]).y(d=>point(d)[1]))
    .attr('fill','none').attr('stroke','#c1cdd5');
  svg.selectAll('circle').data(days).join('circle').attr('cx',d=>point(d)[0]).attr('cy',d=>point(d)[1])
    .attr('r',3).attr('fill',d=>d3.interpolateYlGnBu((Math.sin(d/14*2*Math.PI)+1)/2));
  return {days:84,displayPeriod:n,generatorPeriod:14};
}
```


[D3 官方文档](https://d3js.org/d3-shape/line)

### 演示观察

把一圈从 14 天改为 7 天，再揭示合成序列的规则。比较显示周期与生成周期。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-4)

## 5.5 Storyline 故事线

### Storyline 时间线

Storyline 把人物、组织或进程画成沿时间延伸的线。线靠近表示同一事件或群组，线分开表示关系发生变化。原课程使用《侏罗纪公园》角色说明人物的聚散。

| 元素 | 表达内容 |
| --- | --- |
| 时间轴 | 事件发生的先后与间隔 |
| 角色线 | 同一角色跨时间的连续轨迹 |
| 聚拢与分离 | 参与同一事件或离开群组 |
| 事件标记 | 关键时刻与文字说明 |

### 路径层与事件层

每个角色有一组时间与纵向位置的关键点，`d3.line` 为它生成路径。事件单独放在另一组 `g` 中，使用圆、标记和文字说明关键时刻。两层可以分别筛选和高亮。

### 怎样阅读纵向位置

Storyline 的纵向位置用于组织角色关系，并不一定表示一个数值量。同一时刻的靠近应结合事件标签阅读；曲线之间的交叉也要与角色身份、事件信息一起判断。

### 关键代码

#### 1. 每个角色一条路径

```javascript
const x=d3.scaleLinear().domain([0,127]).range([50,550]);
const characters=[
  {name:'T-REX',points:[{time:75,y:150},{time:78,y:100},{time:88,y:160}]},
  {name:'Grant',points:[{time:0,y:60},{time:78,y:100},{time:120,y:40}]}
];
const line=d3.line().x(d=>x(d.time)).y(d=>d.y).curve(d3.curveCatmullRom.alpha(0.5));
// 外层 data 按角色连接；line 接收该角色的 points。
svg.selectAll('path.character').data(characters,d=>d.name).join('path').attr('class','character')
  .attr('d',d=>line(d.points)).attr('fill','none')
  .attr('stroke',(d,i)=>d3.schemeTableau10[i]).attr('stroke-width',3);
```

**关键点解释**

这里的数据有两层：外层每项是角色，内部 points 是该角色的时间序列。`attr("d", d => line(d.points))` 明确把内层数组交给路径生成器。相同时刻的相近 y 表示事件或群组关系。

#### 2. 独立的事件图层

```javascript
const events=[{id:'attack',time:78,y:100,name:'T-REX attack'}];
const layer=svg.append('g').attr('class','event-layer');
const marks=layer.selectAll('g.event').data(events,d=>d.id).join('g').attr('class','event')
  .attr('transform',d=>`translate(${x(d.time)},${d.y})`);
// 子元素通过单项数组继承父组数据。
marks.selectAll('circle').data(d=>[d]).join('circle').attr('r',18).attr('fill','#e16a4530');
marks.selectAll('text').data(d=>[d]).join('text').attr('y',-23).attr('text-anchor','middle')
  .text(d=>d.name);
marks.on('mouseenter',(event,d)=>console.log(d.name,d.time));
```

**关键点解释**

事件位置用组的 transform 设置，内部圆和文字使用局部坐标。事件和角色路径放在不同的 g 中，就可以分别隐藏、筛选或高亮。一个图层中的改动不必重新创建另一层。

#### 3. Catmull-Rom 的 alpha

```javascript
const choices={
  uniform:d3.curveCatmullRom.alpha(0),       // 均匀参数化。
  centripetal:d3.curveCatmullRom.alpha(0.5), // 向心参数化。
  chordal:d3.curveCatmullRom.alpha(1)       // 弦长参数化。
};
const alternativeLine=d3.line().x(d=>x(d.time)).y(d=>d.y).curve(choices.centripetal);
```

**关键点解释**

`alpha` 控制样条的参数化方式，不是数据拟合的置信度，也不是简单的“越大越弯”。0、0.5、1 分别对应均匀、向心和弦长参数化。比较时应保留相同关键点，观察点间距离不均匀时的曲线变化。

### 运行示例: 多条路径的数据连接

```javascript
function story({svg,d3,n}) {
  const series=d3.range(3).map(role=>d3.range(6).map(time=>({time,y:50+role*50+(time===n?15:0)})));
  // 每个角色绑定一条路径，每条路径再绑定一组事件点。
  const path=d3.line().x(d=>30+d.time*100).y(d=>d.y).curve(d3.curveMonotoneX);
  svg.selectAll('path').data(series).join('path').attr('d',path).attr('fill','none')
    .attr('stroke',(d,i)=>d3.schemeTableau10[i]).attr('stroke-width',3);
  return {characters:3,event:n,note:'vertical position is not a measured quantity'};
}
```


[D3 官方文档](https://d3js.org/d3-shape/line)

### 演示观察

选择一个角色，再定位一个共同参与的事件，核对线条与事件表。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-5)
