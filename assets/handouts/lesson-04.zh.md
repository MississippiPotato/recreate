# 第 4 章 低维数据可视化

表格结构、比例尺、曲线与标量场的表达。

## 4.1 宽表与长表

### 宽表与长表

原课程用美国各州的犯罪数据说明表格转换：一行代表一个州，多列分别记录不同指标。这是宽格式。把每个指标展开为一行，就得到长格式。

| 格式 | 一行代表什么 | 字段示例 |
| --- | --- | --- |
| 宽表 Wide | 一个实体 | state、murder、robbery、burglary |
| 长表 Long | 一个实体的一个指标 | state、metric、value |

### 为什么要转换

宽表便于并排查看多个指标；长表便于按指标过滤、分组和绑定图形。原课程的热图用州名和指标名决定位置，用 value 决定颜色。

### flatMap 与类型转换

`flatMap` 先为每个实体生成一组指标记录，再展开一层数组。转换后保留实体标识和指标名，它们共同确定一个单元格。`d3.autoType` 可以自动转换常见类型；编号等有固定格式的字段也可以在行回调中显式处理。

### 关键代码

#### 1. 读入宽表与自动转换

```javascript
// autoType 是行转换函数，按单元格内容推断常见类型。
const rows = [
  {state:'A',murder:'12',robbery:'30'},
  {state:'B',murder:'8',robbery:'25'}
].map(row => d3.autoType({...row})); // 复制后转换，保留原始对象。
console.log(typeof rows[0].murder); // 'number'
// 在 CSV 中相同写法是：await d3.csv(url, d3.autoType)。
```

**关键点解释**

`autoType` 接收行对象并转换它的值。`{...row}` 用展开语法复制一层对象，再交给转换函数。实际 CSV 加载时可以直接把 `d3.autoType` 作为行回调；若编号含前导零等格式含义，可以自行编写行回调保留该字段。

#### 2. flatMap：宽表转长表

```javascript
const wide = [{state:'A',murder:12,robbery:30},{state:'B',murder:8,robbery:25}];
const metrics = ['murder','robbery'];
// 外层遍历实体，内层遍历字段，flatMap 展开内层数组。
const long = wide.flatMap(row => metrics.map(metric => ({
  state:row.state,
  metric,
  value:row[metric] // 方括号按变量中的字段名读取值。
})));
console.log(long.length); // 2×2 = 4
const groups = d3.group(long,d=>d.metric);
```

**关键点解释**

`row.metric` 会读取名叫 metric 的字段，`row[metric]` 才会使用变量里的字段名。内层 map 为一个州生成多条指标记录，外层 flatMap 把它们合成一个数组。实体名和指标名一起标识单元格。

#### 3. Crime 1985：从宽表到比较指标

```javascript
const rows = await d3.csv(url, row => ({
  category: row['犯罪类型'], male: +row['男性'], female: +row['女性']
}));
// 不改写原字段，增加一个可比较的差比例。
const withRatio = rows.map(row => ({...row,
  ratio: (row.male - row.female) / (row.male + row.female)
}));
const longRows = rows.flatMap(row => [
  {category:row.category, gender:'male', value:row.male},
  {category:row.category, gender:'female', value:row.female}
]);
```

**关键点解释**

宽表把男性、女性放在两列；长表用 `gender` 字段保存列名，用 `value` 保存数值。差比例位于 −1 到 1，便于比较不同总量的类别；并列查看原始人数，才能区分数量与比例。

### 运行示例: flatMap 与联合标识

```javascript
function reshape({svg,d3,n}) {
  const wide=[{id:'A',x:n,y:n*2},{id:'B',x:n+1,y:n*3}];
  // 每个实体生成多个观测；保留实体与字段联合标识。
  const long=wide.flatMap(row=>['x','y'].map(field=>({id:row.id,field,value:row[field]})));
  svg.selectAll('text').data(long).join('text').attr('x',35).attr('y',(d,i)=>40+i*35)
    .text(d=>`${d.id} / ${d.field} = ${d.value}`);
  return {wide,long};
}
```


[D3 官方文档](https://d3js.org/d3-array/transform)

### 演示观察

点击一个单元格后切换宽长格式，查找同一实体、同一指标对应的值。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-1)

## 4.2 比例尺与坐标轴

### 数据空间、坐标系空间与屏幕空间

原课程用散点图说明坐标变换：数据中的数值先映射到绘图区域，再加上边距放到 SVG 中。点、线和坐标轴应使用相同的映射规则。

| 空间 | 内容 | 例子 |
| --- | --- | --- |
| 数据空间 | 原始字段值 | 人数 100、成绩 80 |
| 坐标系空间 | 绘图区域内的坐标 | 0 到 innerWidth |
| 屏幕空间 | 加入边距后的 SVG 坐标 | translate(margin.left, margin.top) |

### 选择比例尺

| 比例尺 | 等距表示 | 常见用途 |
| --- | --- | --- |
| scaleLinear | 相同差值 | 普通数值轴 |
| scaleLog | 相同比值 | 跨多个数量级的数据 |
| scaleSqrt | 平方根变化 | 用圆的半径表达面积对应的数量 |
| scaleBand | 离散类别的位置区间 | 柱状图类别轴 |

线性尺度上，1、10、100 的位置不等距；对数尺度上，相邻十倍数等距。改变比例尺后数据值保持不变，变化的是它们在屏幕上的距离。

### 坐标轴的作用

`d3.axisBottom(x)` 根据 x 比例尺生成刻度和文字。坐标轴使用比例尺，图形也使用这个比例尺，二者就能保持对齐。

### 关键代码

#### 1. 比例尺、边距与坐标轴

```javascript
const margin = {left:50,top:20,right:20,bottom:30};
const innerW = 600-margin.left-margin.right;
const innerH = 300-margin.top-margin.bottom;
const x = d3.scaleLinear().domain([0,100]).range([0,innerW]);
const y = d3.scaleLinear().domain([0,100]).range([innerH,0]);
// 整组平移一次，组内使用绘图区域坐标。
const plot = svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
plot.selectAll('circle').data(points).join('circle')
  .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',4);
plot.append('g').attr('transform',`translate(0,${innerH})`).call(d3.axisBottom(x));
```

**关键点解释**

比例尺输出绘图区域内的坐标，父组的 `translate` 负责边距。SVG 的 y 向下增加，因此 y 的 range 从 innerH 到 0。`call(axis)` 把选择集传给坐标轴生成器，生成器在这个 g 中添加刻度与文字。

#### 2. 线性与对数的距离

```javascript
const linear = d3.scaleLinear().domain([1,1000]).range([0,500]);
const log = d3.scaleLog().domain([1,1000]).range([0,500]);
const values = [1,10,100,1000];
console.table(values.map(value=>({value,linear:linear(value),log:log(value)})));
// invert 做反向映射，常用于读取鼠标位置对应的数值。
console.log(log.invert(250));
```

**关键点解释**

线性尺度把相同差值画成相同距离；对数尺度把相同比值画成相同距离。这里相邻值都是前者的十倍，因此在 log 下等距。对数域需要同号且避开 0。`invert` 则把像素坐标转回数据值。

### 运行示例: 线性轴与对数轴

```javascript
function axis({svg,d3,n}) {
  const values=[1,10,100,1000];
  // 对数域不能跨零；线性与对数都保留原始值。
  const x=(n===1?d3.scaleLinear():d3.scaleLog()).domain(n===1?[0,1000]:[1,1000]).range([40,550]);
  svg.append('g').attr('transform','translate(0,135)').call(d3.axisBottom(x).ticks(5,'~g'));
  svg.selectAll('circle').data(values).join('circle').attr('cx',x).attr('cy',80)
    .attr('r',7).attr('fill','#e16a45');
  return values.map(value=>({value,pixel:x(value)}));
}
```


[D3 官方文档](https://d3js.org/d3-axis)

### 演示观察

比较 1、10、100、1000 在线性和对数轴上的位置，解释为什么可以等距。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-2)

## 4.3 曲线连接与拟合

### 插值与拟合

| 方法 | 目的 | 例子 |
| --- | --- | --- |
| 插值 Interpolation | 根据已有采样构造连接或中间值 | 折线、Catmull-Rom、Natural |
| 拟合 Fitting | 用模型概括数据关系 | 线性回归、LOESS |

原课程用 `d3.line().curve(...)` 切换曲线。它决定点之间怎样连接。部分曲线经过采样点，Basis 等曲线采用不同的平滑规则。最小二乘直线则通过最小化残差平方和求出一条模型直线。

### 常用曲线

| 曲线 | 特点 | 适合观察 |
| --- | --- | --- |
| linear | 相邻点之间画直线 | 直接查看采样与变化 |
| step / stepBefore / stepAfter | 以阶梯连接 | 状态切换与离散更新 |
| monotoneX | 沿 x 方向保持相邻点间的单调性 | 避免相邻样本间新增局部极值 |
| Catmull-Rom / natural | 经过采样点的平滑连接 | 比较曲线形状 |
| basis | B 样条平滑 | 观察平滑规则对形状的影响 |

### 保持采样点可见

更换曲线时保留原始点，可以看清哪些位置来自观测、哪些形状来自连接规则。叠加拟合直线后，再比较它与采样点之间的残差。

### 关键代码

#### 1. line、datum 与 curve

```javascript
const line = d3.line()
  .x(d=>x(d.x)).y(d=>y(d.y)) // 访问器逐项取得像素坐标。
  .curve(d3.curveCatmullRom.alpha(0.5));
// 一个 path 接收整个点数组，所以使用 datum。
svg.append('path').datum(points)
  .attr('d',line).attr('fill','none').attr('stroke','#2878ad');
// 同一组采样逐项绑定到圆，所以使用 data。
svg.selectAll('circle').data(points).join('circle')
  .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',4);
```

**关键点解释**

`datum(points)` 把数组整体绑定到一个元素；`data(points)` 把数组项逐个匹配到元素。`attr("d", line)` 调用 line 生成路径字符串。更换 curve 保留采样点和比例尺，只改变连接规则。

#### 2. 最小二乘直线

```javascript
const meanX = d3.mean(points,d=>d.x), meanY = d3.mean(points,d=>d.y);
const denominator = d3.sum(points,d=>(d.x-meanX)**2);
if (!denominator) return; // 所有 x 相同时，不能求 y=ax+b 的唯一斜率。
const a = d3.sum(points,d=>(d.x-meanX)*(d.y-meanY))/denominator;
const b = meanY-a*meanX;
const fitted = d3.extent(points,d=>d.x).map(x=>({x,y:a*x+b}));
svg.append('path').datum(fitted)
  .attr('d',d3.line().x(d=>x(d.x)).y(d=>y(d.y)))
  .attr('fill','none').attr('stroke','#e16a45');
```

**关键点解释**

直线模型是 `y = ax + b`。这里用中心化后的 x、y 计算斜率 a，再计算截距 b。`extent` 给出 x 的两端，算出两端的预测值即可画直线。与切换 curve 相比，这一步实际计算了模型参数。

#### 3. 同一组点叠加十种曲线

```javascript
const curves = [d3.curveLinear, d3.curveMonotoneX, d3.curveNatural,
  d3.curveBasis, d3.curveCardinal, d3.curveCatmullRom.alpha(0.5),
  d3.curveStep, d3.curveStepBefore, d3.curveStepAfter, d3.curveBundle.beta(0.85)];
// 每一条路径都使用相同的数据与坐标轴。
svg.selectAll('path.interpolation').data(curves).join('path')
  .attr('class','interpolation').attr('fill','none')
  .attr('d', curve => d3.line().x(d => x(d[0])).y(d => y(d[1])).curve(curve)(points));
```

**关键点解释**

`.curve(curve)` 把一个曲线工厂交给路径生成器。传给 `.data` 的是十个工厂，因此生成十条路径。用平台段比较 Cardinal 的越界和 MonotoneX 的单调性；Basis、Bundle 等规则未必经过每个采样点。

### 运行示例: line 生成器与 curve

```javascript
function curves({svg,d3,n}) {
  const points=[[25,130],[125,55],[225,135],[325,45],[425,125],[545,65]];
  // curve 改变连接方式，不增加采样。
  const choices=[d3.curveLinear,d3.curveStep,d3.curveMonotoneX,d3.curveCatmullRom.alpha(.5),d3.curveBasis];
  const line=d3.line().x(d=>d[0]).y(d=>d[1]).curve(choices[n-1]);
  svg.append('path').datum(points).attr('d',line).attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.selectAll('circle').data(points).join('circle').attr('cx',d=>d[0]).attr('cy',d=>d[1]).attr('r',5).attr('fill','#e16a45');
  return {samples:points.length,curve:['linear','step','monotoneX','Catmull–Rom','Basis'][n-1]};
}
```


[D3 官方文档](https://d3js.org/d3-shape/curve)

### 演示观察

切换十种曲线，检查是否经过采样点；再叠加最小二乘直线，比较连接规则与模型拟合。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-3)

## 4.4 纵横比与倾角感知

### 纵横比与倾角感知

同一组数值画在较矮的图中，线条显得平缓；画在较高的图中，线条显得陡峭。图形纵横比会改变视觉倾角，因此比较变化时要同时阅读坐标轴。

### 45° 的设计启发

原课程提出“平均倾斜度约为 45°”的安排。它来自折线图纵横比的设计研究，目的是让局部变化更容易比较。实际作图时，可以调整绘图区域高度，观察哪些变化被压平、哪些变化被夸大。

### 数据斜率与屏幕斜率

数据中的斜率由 Δy / Δx 决定；屏幕上的斜率还乘上两个方向的像素缩放比例。只改变 y 比例尺的 `range`，就能在数据不变的情况下改变线条倾角。

本节可以保存 A 图，再改变 B 图的高度。比较两个视图中的同一段线，并核对对应的数值和坐标范围。

### 关键代码

#### 1. 用像素范围改变倾角

```javascript
const values = [2,4,3,6,8,7];
const height = 180;
const x = d3.scaleLinear().domain([0,values.length-1]).range([0,500]);
const y = d3.scaleLinear().domain([0,10]).range([height,0]);
const line = d3.line().x((d,i)=>x(i)).y(d=>y(d));
// 保留数据和 domain，只改变纵向像素范围。
y.range([height/2,0]);
svg.append('path').datum(values).attr('d',line).attr('fill','none').attr('stroke','#2878ad');
```

**关键点解释**

比例尺是函数对象，`y.range(...)` 会更新它的映射。line 的访问器在运行时调用 y，因此会使用新范围。同一段 Δy 被映射为更少的像素时，线条看起来更平缓。

#### 2. 角度到屏幕坐标

```javascript
function lineAtAngle(degrees,length=240) {
  const radians = degrees*Math.PI/180; // 三角函数使用弧度。
  const origin = {x:60,y:260};
  return {
    x1:origin.x,y1:origin.y,
    x2:origin.x+length*Math.cos(radians),
    y2:origin.y-length*Math.sin(radians) // 向上需要减小 SVG y。
  };
}
console.log(lineAtAngle(45));
```

**关键点解释**

角度先乘 π/180 转为弧度。cos 给出水平分量，sin 给出竖直分量。数学坐标通常向上为正，SVG 则向下为正，因此这里使用负号。返回的四个值可以分别设置到 line 的 x1、y1、x2、y2。

#### 3. 平均绝对倾角的计算

```javascript
// 点先归一化到 0–1，W、H 是绘图区的实际宽高。
const angles = d3.pairs(points, (a, b) => {
  const dx = Math.abs(b[0] - a[0]) * W;
  const dy = Math.abs(b[1] - a[1]) * H;
  return Math.atan2(dy, dx) * 180 / Math.PI;
});
const meanAngle = d3.mean(angles);
// 二分查找 H，使平均角度接近 45°；保留原数据。
console.log(meanAngle);
```

**关键点解释**

`d3.pairs` 把相邻点变成线段。`atan2(dy, dx)` 返回弧度，乘以 `180 / π` 后得到角度。这里计算未加权的平均绝对倾角；改变 H/W 会改变屏幕倾角，点的原始数值保持不变。

### 运行示例: 用 range 改变画布倾角

```javascript
function aspect({svg,d3,n}) {
  const values=[2,4,3,6,8,7];
  // 固定 domain，只改变纵向像素范围。
  const x=d3.scaleLinear().domain([0,5]).range([30,550]);
  const y=d3.scaleLinear().domain([0,10]).range([175,175-n*15]);
  svg.append('path').datum(values).attr('d',d3.line().x((d,i)=>x(i)).y(y))
    .attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.append('g').attr('transform','translate(30,0)').call(d3.axisLeft(y).ticks(4));
  return {values,pixelHeight:n*15};
}
```


[D3 官方文档](https://d3js.org/d3-scale/linear)

### 演示观察

保留 A 后改变 B 的高度。比较线条倾角与点的实际数值。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-4)

## 4.5 等值线：Marching Squares

### 标量场与等值线

标量场在空间中的每个位置对应一个数值，例如温度、海拔或密度。等值线连接取值相同的位置，把高于与低于某个阈值的区域分开。

### Marching Squares 的 16 种情况

把标量场采样为网格。每个单元有四个角，每个角根据是否达到阈值得到 0 或 1。四位二进制共有 2⁴ = 16 种组合，每种组合对应一种连线情况。

- 给四个角确定编号，并使编码、查表和绘图使用相同顺序。
- 检查每条边的两个端点，找出跨过阈值的边。
- 在边上做线性插值，再连接相应的交点。

### 边插值与歧义

一条边的端点值为 v₀、v₁，阈值为 t 时，交点比例为 `(t − v₀) / (v₁ − v₀)`。交替高低的两种状态具有两种连接方式，本节演示可以切换处理方式，观察单元中心附近的连接变化。

### D3 中的等值线

`d3.contours` 接收按行展开的网格数值，输出 GeoJSON MultiPolygon。`size` 指网格列数与行数，`thresholds` 指等值，绘图时再把网格坐标映射为屏幕像素。

![讲义中的 Marching Squares 16 种情况。图中编号约定需与实现保持一致。](../figures/marching-squares-16.png)

### 关键代码

#### 1. 四个角的位编码与边插值

```javascript
// 本页顺序：左上、右上、右下、左下，对应位 1、2、4、8。
const values = [8,2,7,1], threshold = 5;
const code = values.reduce((bits,value,i)=>bits | ((value>=threshold ? 1 : 0)<<i),0);
console.log(code); // 5，即二进制 0101。
function crossing(v0,v1,t) {
  return (t-v0)/(v1-v0); // 在确实跨越阈值的边上调用。
}
const fraction = crossing(values[0],values[1],threshold);
console.log(fraction); // 左上到右上的相对位置。
```

**关键点解释**

`&lt;&lt; i` 把 1 移到第 i 位，`|` 把各位合并为 0 到 15 的编号。编号依赖角点顺序，查表时必须使用同一约定。插值比例为 0 表示端点 v₀，为 1 表示端点 v₁；0.5 位于边的中间。

#### 2. d3.contours：从网格到多边形

```javascript
const columns=12, rows=12;
// values[y*columns+x]：先横向、再逐行。
const values=d3.range(columns*rows).map(i=>Math.sin(i%columns/3)*Math.cos(Math.floor(i/columns)/3));
const contours=d3.contours().size([columns,rows]).thresholds([0])(values);
const path=d3.geoPath(d3.geoIdentity().scale(15)); // 网格单位转像素。
svg.selectAll('path.contour').data(contours).join('path').attr('class','contour')
  .attr('d',path).attr('fill','#b7dfdb').attr('stroke','#2878ad');
```

**关键点解释**

`d3.contours()` 创建生成器，`size` 和 `thresholds` 配置它，最后的 `(values)` 执行计算。输出是等值区域的 MultiPolygon；`geoPath` 将多边形变为 path 字符串。这里的填充表示阈值区域，描边显示区域边界。

#### 3. 从完整二维场生成填充等值面

```javascript
const rows = d3.csvParseRows(text, row => row.map(Number));
const values = rows.flat();
// size 的顺序是 [列数, 行数]，values 按行展开。
const contours = d3.contours().size([rows[0].length, rows.length])
  .thresholds(d3.range(-20, 46, 5))(values);
const path = d3.geoPath(d3.geoIdentity().scale(cellSize));
svg.selectAll('path.contour').data(contours, d => d.value).join('path')
  .attr('class','contour').attr('d',path).attr('fill',d => color(d.value));
```

**关键点解释**

`d3.contours` 对每个阈值返回一个 MultiPolygon，表示数值不小于该阈值的区域。`geoPath` 将几何对象转成 SVG 路径。选中某个单元格后，右侧小图解释该区域边界如何由四角分类和边插值构成。

### 运行示例: d3.contours 的输入约定

```javascript
function contours({svg,d3,n}) {
  const size=12,values=d3.range(size*size).map(i=>Math.sin(i%size/3)*Math.cos(Math.floor(i/size)/3)*50+50);
  // size 按列数、行数设置；values 是逐行展开的一维数组。
  const polygons=d3.contours().size([size,size]).thresholds([n*10])(values);
  const path=d3.geoPath(d3.geoIdentity().scale(15));
  svg.append('g').attr('transform','translate(170,5)').selectAll('path').data(polygons).join('path')
    .attr('d',path).attr('fill','#b7dfdb').attr('stroke','#2878ad').attr('stroke-width',2);
  return {threshold:n*10,grid:[size,size],polygons:polygons[0].coordinates.length};
}
```


[D3 官方文档](https://d3js.org/d3-contour/contour)

### 演示观察

选择一个单元格，依次显示分类、交点、线段；再编辑四角数值，比较 16 种状态与鞍点。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-5)
