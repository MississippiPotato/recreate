# 第 4 章 低维数据可视化

表格结构、比例尺、曲线与标量场的表达。

本讲义基于原课程与课程材料重新组织，配套网站保留“讲解 / 关键代码 / 演示”。示例中的学生、气温、场与事件为教学构造数据。

## 4.1 宽表与长表

改的是表格结构，记录所代表的实体和观测含义要能追溯。

### 两种形式

宽表把指标放在多列，便于横向阅读；长表用字段名和数值两列表达指标，便于筛选、分组和数据连接。

### 保留联合标识

一行宽表可以生成多行长表。用“实体编号 + 指标名”区分观测，避免行数增加后误认为新增了实体。

### 从结构到语法

flatMap 把每条记录映射为多个观测，再展开一层。展开时明确列出指标，避免把编号、名称等元数据也当作数值。

### 关键代码: flatMap 与联合标识

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **flatMap(callback)**: 每项返回一个数组，结果展开一层。
- **{ id, field, value }**: 长表仍保留实体与指标。

[D3 官方文档](https://d3js.org/d3-array/transform)

### 演示观察

点击一个单元格后切换宽长格式，查找同一实体、同一指标对应的值。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-1)

## 4.2 比例尺与坐标轴

比例尺计算数据到像素的映射，坐标轴把这条映射标出来。

### domain 与 range

domain 是输入数据范围，range 是输出位置范围。SVG 的 y 向下增加，因此纵轴通常把较大数值映射到较小的像素坐标。

### 线性与对数

线性尺度的等距表达相同差值；对数尺度的等距表达相同比值。普通对数尺度不能跨过零，改变尺度也不会改写原始值。

### 坐标轴是生成器

d3.axisBottom(scale) 创建生成器，再通过 selection.call(axis) 将刻度和标签加入 g。平移 g 用于安排边距，不需要改动数据。

### 关键代码: 线性轴与对数轴

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **scaleLog().domain([1,1000])**: 正数域中，相同倍数对应相同距离。
- **axisBottom(x).ticks(...)**: ticks 是刻度数量的建议值，不是保证。

[D3 官方文档](https://d3js.org/d3-axis)

### 演示观察

比较 1、10、100、1000 在线性和对数轴上的位置，解释为什么可以等距。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-2)

## 4.3 曲线连接与拟合

采样点、插值线和拟合结果分别代表不同的信息。

### 连线没有新增观测

采样点是已知数据。两点之间的连接方式是一种表达假设；画得平滑不说明真实过程也如此。

### 不同 curve 的约束

linear 使用折线，step 适合状态跳变，monotoneX 约束分段单调性。Catmull–Rom 和 Natural 经过采样点；Basis 通常不经过所有内部点。

### 插值与拟合不要混称

插值与平滑曲线着眼于连接方式；回归等拟合方法通过模型估计趋势。选择 d3.line().curve(...) 本身不等于完成统计回归。

### 关键代码: line 生成器与 curve

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **datum(points)**: 将整个数组作为一条路径的数据。
- **line.x(...).y(...)**: 访问器把每个采样映射到像素坐标。
- **curve(...)**: 更换连接规则，采样点不变。

[D3 官方文档](https://d3js.org/d3-shape/curve)

### 演示观察

切换十种曲线，检查是否经过采样点；再叠加最小二乘直线，比较连接规则与模型拟合。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-3)

## 4.4 纵横比与倾角感知

同一组数值，画布的高宽变化也会改变人对“陡峭”的判断。

### 屏幕斜率包含尺度

屏幕上的斜率同时受数据差值、横轴范围、纵轴范围和画布尺寸影响。拉高画布会让线更陡，但数值增长率没有改变。

### 45° 是设计启发

适当安排平均倾角有助于比较局部变化，但不能把所有图都拉成 45°。任务、异常值、坐标范围和比较对象都应参与决定。

### 比较时统一条件

并排展示多条趋势时应交代坐标范围与纵横比。不同画布上看起来一样陡，不保证增长速度相同。

### 关键代码: 用 range 改变画布倾角

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **固定 domain**: 数值不变，先固定输入范围。
- **range([175,...])**: 减小 y 像素值让数值向上绘制。

[D3 官方文档](https://d3js.org/d3-scale/linear)

### 演示观察

保留 A 后改变 B 的高度。比较线条倾角与点的实际数值。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-4)

## 4.5 等值线：Marching Squares

把一个网格单元的角点分类、边上插值和线段连接分开理解。

### 四个角产生 16 种状态

按左上、右上、右下、左下顺时针编号。本实现用 value ≥ threshold 判为高值，将四个布尔量编码为 0–15。编号约定不同，查表也应一致改变。

### 沿边计算交点

一条边的两个端点分属高低两侧时，用 t=(threshold−a)/(b−a) 插值定位。等值线不是简单连接网格中心。

### 鞍点存在歧义

交替高低的角点会产生两种连接方式。本实现根据双线性判别选择连接，并单独处理等于阈值的情况。三维 Marching Cubes 有 2⁸=256 种原始状态，不等于按对称性合并后的类别数。

![讲义中的 Marching Squares 16 种情况。图中编号约定需与实现保持一致。](../figures/marching-squares-16.png)

### 关键代码: d3.contours 的输入约定

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **size([columns,rows])**: 这里是采样网格大小，不是像素尺寸。
- **thresholds([value])**: 显式指定要提取的等值。
- **geoIdentity().scale(15)**: 把网格坐标映射到绘图像素。

[D3 官方文档](https://d3js.org/d3-contour/contour)

### 演示观察

选择一个单元格，依次显示分类、交点、线段；再编辑四角数值，比较 16 种状态与鞍点。

[打开本节](https://mississippipotato.github.io/recreate/#ch-4-5)
