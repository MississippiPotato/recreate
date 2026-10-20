# 第 3 章 色彩专题

理解颜色空间、色板语义、色域与可读性。

本讲义基于原课程与课程材料重新组织，配套网站保留“讲解 / 关键代码 / 演示”。示例中的学生、气温、场与事件为教学构造数据。

## 3.1 颜色模型

RGB 面向显示设备，HSL 便于调色，Lab/HCL 帮助讨论感知差异。

### RGB 与 CMYK

屏幕混合发光的红、绿、蓝，印刷依靠油墨吸收光。屏幕上看见的颜色不一定能被同样地印刷出来。

### HSL 的三个量

H 是色相角，S 是饱和度，L 是亮度参数。HSL 中相同的 L 并不保证人眼感知到相同明暗，因此不能只看参数是否等距。

### Lab 是近似的感知模型

Lab 用 L*、a*、b* 描述颜色差异，可帮助设计渐变；它并非处处均匀。插值空间应按目的选择，并检查结果是否落在显示色域内。

### 关键代码: HSL 颜色的构造

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function hsl({svg,d3,n}) {
  // h 以度计，s/l 在 0 到 1 之间。
  const colors=d3.range(6).map(i=>d3.hsl(i*60,.65,n/10));
  svg.selectAll('rect').data(colors).join('rect').attr('x',(d,i)=>15+i*93)
    .attr('y',40).attr('width',84).attr('height',110).attr('fill',d=>d.formatHex());
  return colors.map(d=>({h:d.h,s:d.s,l:d.l,css:d.formatHex()}));
}
```

- **d3.hsl(h,s,l)**: 色相用角度，饱和度和亮度用 0–1。
- **formatHex()**: 转换为浏览器可用的十六进制颜色。

[D3 官方文档](https://d3js.org/d3-color)

### 演示观察

单独改变 H、S、L，再比较 RGB 与 Lab 表达。留意参数变化和看见的变化是否一致。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-1)

## 3.2 颜色映射：三类色板

顺序、发散、定性分别表达不同的数据关系，不能只按喜好挑颜色。

### 顺序型

适合从低到高的数量。明度和颜色的变化应便于追踪顺序，图例必须交代数据范围。

### 发散型

适合相对一个有意义中心的偏差，例如相对 0 的盈亏。中心应由问题决定，不能只因为最小值和最大值的均值好算就选它。

### 定性型

适合专业、地区名称等无自然顺序的类别。类别多时，可以分面、直接标注或减少同时显示的类别，不能改成连续色板来暗示大小。

### 关键代码: 顺序颜色比例尺

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function sequential({svg,d3,n}) {
  // 插值器接收归一化参数，比例尺负责数据范围。
  const color=d3.scaleSequential(d3.interpolateViridis).domain([0,n]);
  const values=d3.range(0,n+1);
  const x=d3.scaleBand().domain(values).range([20,570]).padding(.05);
  svg.selectAll('rect').data(values).join('rect').attr('x',x).attr('y',40)
    .attr('width',x.bandwidth()).attr('height',110).attr('fill',color);
  return {domain:color.domain(),middle:color(n/2)};
}
```

- **scaleSequential(interpolator)**: 先选择连续颜色插值器。
- **domain([0,n])**: 再说明数据范围；color(value) 返回颜色。

[D3 官方文档](https://d3js.org/d3-scale/sequential)

### 演示观察

在学院类别、气温与偏差三个情境下切换色板，检查颜色暗示的关系是否与字段一致。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-2)

## 3.3 Lab 色域与显示范围

数学上能写出的 Lab 值，不一定是 sRGB 屏幕能准确显示的颜色。

### 色彩空间与色域

色彩空间定义坐标，色域描述某种设备或标准可表达的范围。不能把所有 Lab 坐标都当作显示器可见颜色。

### 检查转换后的 RGB

用 d3.lab(L, a, b).rgb() 转换，再用 displayable() 检查范围。格式化为 CSS 颜色会裁剪超界通道，因此应在格式化之前检查。

### 切片不是所有设备的轮廓

本演示固定 L*、扫描 a*/b*，显示 sRGB 可显示区域。它不是完整三维色域，也没有据此绘制 Adobe RGB 或 Rec.2020 的精确边界。

### 关键代码: 颜色转换与色域判断

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function lab({svg,d3,n}) {
  const colors=d3.range(8).map(i=>d3.lab(n*10,-90+i*26,45).rgb());
  // 检查原始 RGB 是否越界，再格式化为 CSS。
  svg.selectAll('rect').data(colors).join('rect').attr('x',(d,i)=>20+i*70)
    .attr('y',40).attr('width',62).attr('height',100)
    .attr('fill',d=>d.displayable()?d.formatHex():'#d4dce1');
  return colors.map(d=>({r:Math.round(d.r),g:Math.round(d.g),b:Math.round(d.b),displayable:d.displayable()}));
}
```

- **d3.lab(L,a,b).rgb()**: 创建 Lab 颜色，再转换为 RGB 对象。
- **displayable()**: 在格式化裁剪之前检查可显示范围。

[D3 官方文档](https://d3js.org/d3-color)

### 演示观察

改变 L*，观察可显示区域怎样变化。对照超界位置与灰色区域。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-3)

## 3.4 色系搭配

用色轮组织色相，再回到图形检查对比、数量和用途。

### 几何关系

单色保持色相；类比取相邻色相；互补相差 180°；三等分相隔 120°；分裂互补取互补色两侧。

### 和谐不等于可读

配色关系只提供候选。小标记、低对比背景和大量类别都会影响辨认，需要同时检查明度、饱和度和标签。

### 强调需要节制

保留一种强调色，其他颜色适度减弱，可以建立主次。但若颜色承载定量含义，不能为了协调而破坏数值顺序。

### 关键代码: 色轮角度与取模

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function harmony({svg,d3,n}) {
  const hues=[n*30,n*30+150,n*30+210];
  // 取模把角度放回色轮；颜色并不是数值大小。
  const color=h=>d3.hsl(h%360,.6,.52).formatHex();
  svg.selectAll('circle').data(hues).join('circle').attr('cx',(d,i)=>110+i*170)
    .attr('cy',95).attr('r',48).attr('fill',color);
  return hues.map(h=>({h:h%360,color:color(h)}));
}
```

- **h % 360**: 让色相回到 0–360° 范围。
- **attr("fill", color)**: 传函数时会对每条数据分别求值。

[D3 官方文档](https://d3js.org/d3-color)

### 演示观察

改变主色相与色系，观察色轮位置和色块同步变化。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-4)

## 3.5 经典配色方案

比较现成方案的用途，而不是把“经典”当成任何场景的保证。

### 先分用途

Okabe–Ito、Tableau、Tol 等定性方案用于区分类别；Viridis、Cividis 用于顺序数值；RdBu 等发散方案需要有意义的中心。

### 色板要放进图里

色块排在一起能看清差异，不代表散点或细线也能区分。标记大小、背景、数量以及显示设备都会改变效果。

### 模拟检查有边界

色觉缺陷模拟有助于发现问题，但不等于验证所有读者都能读图。灰度下仍可依靠形状、文字或直接标注识别。

### 关键代码: 固定类别色板

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function schemes({svg,d3,n}) {
  const categories=d3.range(n).map(i=>'C'+(i+1));
  // 显式 domain 固定“类别到颜色”的对应关系。
  const color=d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10);
  svg.selectAll('circle').data(categories).join('circle')
    .attr('cx',(d,i)=>35+i*52).attr('cy',90).attr('r',18).attr('fill',color);
  return categories.map(category=>({category,color:color(category)}));
}
```

- **scaleOrdinal()**: 输入是离散类别，不表示连续数量。
- **domain(categories)**: 显式设定类别顺序，防止筛选后颜色漂移。
- **schemeTableau10**: 预定义色板是颜色数组。

[D3 官方文档](https://d3js.org/d3-scale/ordinal)

### 演示观察

切换三套定性色板和两套顺序色板，再比较色块与散点里的辨认难度。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-5)

## 3.6 配色案例比较

同一份数据、同一套几何形状，只改变颜色，观察哪些判断被改变。

### 无序类别不应暗示排名

把学院名称染成从浅到深，会额外暗示大小。若颜色只负责身份，应使用定性方案或直接标签。

### 彩虹色的局部边界

不均匀的明度变化可能制造视觉边界或掩盖局部变化。比较颜色时，要让数据范围和几何形状保持一致。

### 把诊断说清楚

不要只说“这套颜色不好看”。应指出它是否暗示错误顺序、遮蔽差异，或把颜色当作唯一识别通道。

### 关键代码: 同数据的双视图比较

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function contrast({svg,d3,n}) {
  const values=d3.range(10),width=52;
  // 上下两行使用同一数值，只改变插值器。
  const scales=[d3.scaleSequential(d3.interpolateRainbow),d3.scaleSequential(d3.interpolateViridis)]
    .map(scale=>scale.domain([0,n]));
  scales.forEach((color,row)=>svg.append('g').selectAll('rect').data(values).join('rect')
    .attr('x',d=>20+d*width).attr('y',30+row*80).attr('width',width-2)
    .attr('height',55).attr('fill',color));
  return {values,domain:[0,n]};
}
```

- **scales.forEach(...)**: 对同一组 values 应用不同颜色映射。
- **append("g")**: 用组分别管理两个视图的元素。

[D3 官方文档](https://d3js.org/d3-scale-chromatic)

### 演示观察

保留左图，改变右图色板和观看条件；比较图例是否支持当前数据语义。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-6)

## 3.7 配色生成与检验

参数生成的是候选色板，是否适用还要在实际图形里检验。

### 色相、饱和度和亮度

色相间隔有助于区分类别，降低饱和度可以减轻大面积色块的刺激；但过低饱和度也可能让类别趋同。

### 数量没有统一阈值

可辨认的颜色数量取决于任务和图形。增加类别后，应实际检查小标记、相邻颜色与图例，不应把“7 色”当作硬性界限。

### 生成以后还要选择

候选方案可以用于探索。正式编码时应固定类别与颜色的对应关系，让筛选前后保持同一身份。

### 关键代码: 参数化生成色板

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function generator({svg,d3,n}) {
  // d3.range 生成索引；等间隔色相只是候选方案。
  const hues=d3.range(n).map(i=>i*360/n);
  svg.selectAll('rect').data(hues).join('rect').attr('x',(d,i)=>20+i*550/n)
    .attr('y',45).attr('width',550/n-4).attr('height',100)
    .attr('fill',h=>d3.hsl(h,.42,.6).formatHex());
  return {count:n,hueStep:360/n,hues};
}
```

- **d3.range(n)**: 生成 0 到 n−1 的整数。
- **i * 360 / n**: 把色相分成 n 份；只是候选，不保证可读。

[D3 官方文档](https://d3js.org/d3-color)

### 演示观察

增加颜色数量，观察色轮上的间隔和色块间的差异。保留一套方案再作比较。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-7)

## 3.8 色觉差异与冗余编码

颜色不能是唯一线索。用文字、形状和位置保留同一条信息。

### 区分视觉条件

灰度去除色相信息；色觉缺陷模拟近似特定条件下的颜色感受，两者不是同一件事。

### 增加第二条线索

线条可用虚实、点可用形状，关键值可直接标注。冗余编码让读者不用只靠颜色猜测。

### 保持比较条件一致

模拟前后使用同一份数据、数值范围和几何布局。否则很难判断可读性差异来自哪里。

### 关键代码: 形状与文字冗余编码

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function accessibility({svg,d3,n}) {
  const values=[4,6,8,5];
  // symbol 的类型提供颜色以外的线索。
  const shapes=[d3.symbolCircle,d3.symbolSquare,d3.symbolTriangle,d3.symbolDiamond];
  const symbol=d3.symbol().size(500);
  svg.selectAll('path').data(values).join('path')
    .attr('transform',(d,i)=>`translate(${90+i*130},95)`)
    .attr('d',(d,i)=>symbol.type(shapes[i])()).attr('fill',n===1?'#71818a':(d,i)=>d3.schemeTableau10[i]);
  svg.selectAll('text').data(values).join('text').attr('x',(d,i)=>90+i*130)
    .attr('y',150).attr('text-anchor','middle').text(d=>d);
  return {values,shapeCue:true,gray:n===1};
}
```

- **d3.symbol().size(500)**: size 表示符号面积，不是半径。
- **symbol.type(type)()**: 设置类型，再调用生成器得到路径字符串。

[D3 官方文档](https://d3js.org/d3-shape/symbol)

### 演示观察

切换原色、灰度和色觉模拟，再隐藏标签，比较哪些信息仍可判断。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-8)
