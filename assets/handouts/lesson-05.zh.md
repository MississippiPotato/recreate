# 第 5 章 时序数据可视化

折线、日历、螺旋和故事线，各有适用的问题。

本讲义基于原课程与课程材料重新组织，配套网站保留“讲解 / 关键代码 / 演示”。示例中的学生、气温、场与事件为教学构造数据。

## 5.1 时间属性

时间有顺序、连续、周期和多层结构，记录时间的方式也会影响比较。

### 顺序与采样间隔

时间有先后；样本未必等间隔。把日期当普通类别均匀排列，会掩盖时间间隔差异。缺少一次观测也不等于数值为零。

### 周期与线性时间

昼夜、星期、季节有循环结构。线性轴便于读先后，循环布局便于比较同相位。显示成圆环并不会让数据自动具有周期。

### 日历和时区

月长、闰年和星期起点会影响坐标。此课使用 UTC 日历运算避免浏览器本地时区改变日期，2024 年含 366 天。

### 关键代码: UTC 日期间隔

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **Date.UTC(...)**: 月份从 0 起；1 表示二月。
- **utcDays(start,stop)**: 生成日历日期，stop 不包含在内。
- **scaleUtc()**: 时间轴按实际经过的时间映射。

[D3 官方文档](https://d3js.org/d3-time)

### 演示观察

点击时间属性，查看不等间隔、缺失和闰日三个小例子。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-1)

## 5.2 标准时间可视化：折线图

把真实时间映射到横轴，明确缺失值和连线的处理方式。

### 时间轴与数值轴

横轴使用时间尺度，纵轴表达度量。按时间排序后连接记录；不能依靠 CSV 文件中的出现顺序推断时间顺序。

### 缺失值要留痕迹

d3.line().defined(predicate) 可以在缺失处断开路径。跨过缺失直接连线隐含了一个插值假设；补零则改变了所表达的数值。

### 趋势需要上下文

本课气温序列是合成示例。原课程的人名频率案例说明另一种度量；不同来源和单位的序列不能在缺乏说明时混作同一种数据。

### 关键代码: defined 与缺失值

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **defined(d => d.value !== null)**: 只连接连续有效的采样段。
- **value ?? 0**: 仅为错误对照展示补零，不代表真实观测。

[D3 官方文档](https://d3js.org/d3-shape/line)

### 演示观察

在折线与日历间切换，追踪同一天，并检查缺失日有没有被画成零。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-2)

## 5.3 日历热图

用星期、周和月份组织日期，让日历结构参与比较。

### 日期决定格子的位置

每个有效日期对应一个格子。列由相对年首周的周数决定，行由星期决定；应明确从周一还是周日开始。

### 颜色表达数值

颜色承担数量比较，适合使用顺序型色板并给出图例。缺失值用独立标记，不能混入数值范围。

### 日历适合什么问题

日历便于定位某天、比较星期结构；细微数值差异和连续趋势通常用折线更直接。布局选择应跟随问题。

### 关键代码: 日期到日历坐标

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **utcMonday.count(first,d)**: 从起始周数到该日期的周数。
- **(getUTCDay()+6)%7**: 把星期一设为第 0 行。

[D3 官方文档](https://d3js.org/d3-time)

### 演示观察

定位 2 月 29 日，再切换视图。观察日期和数值不变，阅读入口改变。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-3)

## 5.4 周期时间与螺旋图

每圈代表一个假设周期，比较圈与圈之间同相位的数值。

### 角度与半径

角度按周期重复，半径随时间向外增长。阿基米德螺旋 r=a+bθ 中，每转一圈半径增加 2πb，而不是 b。

### 显示周期不是生成周期

改变每圈天数，只改变布局。应比较多个候选周期，再结合领域知识或分析验证，不能把视觉对齐当成充分证明。

### 保留线性视图作为对照

循环布局便于比较同相位，却较难读取精确时间差和长期趋势。需要时应与折线共同使用。

### 关键代码: 极坐标到笛卡尔坐标

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **theta = day/n * 2π**: n 是显示周期，不改变输入序列。
- **cos / sin**: 角度和半径共同决定位置。

[D3 官方文档](https://d3js.org/d3-shape/line)

### 演示观察

把一圈从 14 天改为 7 天，再揭示合成序列的规则。比较显示周期与生成周期。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-4)

## 5.5 Storyline 故事线

横向时间与角色线共同表达事件；纵向位置通常不是数值大小。

### 先读编码约定

每条线对应一个角色，横轴表达事件进展；线靠近表示共同参与某个事件。图上的距离不自动代表现实距离或关系强度。

### 从事件表生成路径

事件给出时间和参与者，布局再安排每条线的位置。高亮角色与高亮事件回答不同问题，应明确区分。

### 平滑曲线不改变事件

曲线改善追踪连续性，不应添加不存在的相遇。本课使用虚构考察队；原课程《侏罗纪公园》的故事线可作为原案例参考。

### 关键代码: 多条路径的数据连接

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **data(series)**: 每个数组对应一个角色路径。
- **attr("d", path)**: line 生成器逐条处理事件序列。

[D3 官方文档](https://d3js.org/d3-shape/line)

### 演示观察

选择一个角色，再定位一个共同参与的事件，核对线条与事件表。

[打开本节](https://mississippipotato.github.io/recreate/#ch-5-5)
