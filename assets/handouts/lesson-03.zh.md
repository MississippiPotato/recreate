# 第 3 章 色彩专题

理解颜色空间、色板语义、色域与可读性。

## 3.1 颜色模型

### 为什么要学颜色模型

同样的 RGB 数值变化，视觉上不一定产生同样的颜色差异。设计颜色渐变时，需要了解颜色空间如何描述色相、明度和饱和度。

| 模型 | 组成 | 用途 |
| --- | --- | --- |
| RGB | 红、绿、蓝三个分量 | 屏幕显示，加色混合 |
| HSL | 色相 H、饱和度 S、亮度 L | 按色轮选择颜色，调整浓淡和明暗 |
| CIE Lab | L* 明度，a* 绿红轴，b* 蓝黄轴 | 比较颜色差异、设计渐变 |
| CMYK | 青、品红、黄、黑 | 印刷中的减色混合 |

### RGB、HSL 与 Lab

RGB 直接对应显示通道；HSL 把颜色组织为色轮，便于讨论互补、类比和三等分配色。Lab 以接近感知均匀为设计目标，在其中插值可以控制明度变化。HSL 的 L 和 Lab 的 L* 含义不同，不能直接互换。

### 色觉差异

常见的色觉差异包括红色觉、绿色觉和蓝色觉方面的变化。设计图表时，除了比较颜色本身，还可以同时使用形状、文字和线型。后面的演示会把同一张图切换到灰度和不同色觉模拟下观察。

### 关键代码

#### 1. RGB 转 HSL

```javascript
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; // RGB 归一化到 0~1。
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  const delta = max-min, l = (max+min)/2;
  if (delta === 0) return [0,0,l]; // 灰色没有色相差和饱和度。
  const s = delta/(1-Math.abs(2*l-1));
  let h = max === r ? ((g-b)/delta)%6 : max === g ? (b-r)/delta+2 : (r-g)/delta+4;
  h = (h*60+360)%360; // 六个色相区段换成角度。
  return [h,s,l];
}
console.log(rgbToHsl(100,50,200));
```

**关键点解释**

RGB 先除以 255。最大与最小通道的差得到 delta；亮度取两者均值。最大通道决定色相所在区段，再换算为度。这里返回的 H 使用度，S、L 使用 0 到 1，可以直接传给 `d3.hsl`。

#### 2. 矩阵怎样改变 RGB

```javascript
const matrix = [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]];
const rgb = [100,50,200];
// 每一行与 RGB 做点积，得到一个新的输出通道。
const transformed = matrix.map(row =>
  row.reduce((sum, coefficient, i) => sum+coefficient*rgb[i], 0)
);
// 格式化前，把通道约束到 0~255。
const result = transformed.map(v => Math.round(Math.max(0,Math.min(255,v))));
console.log(result);
```

**关键点解释**

`matrix.map` 为三个输出通道分别计算；内部的 `reduce` 累加三个乘积。`coefficient` 是权重，`i` 让权重和对应输入通道相乘。原课程用这种矩阵演示色觉条件下的颜色变换。

#### 3. D3 的颜色对象与转换

```javascript
const color = d3.color('rgb(100,50,200)'); // 解析 CSS 颜色。
const rgb = color.rgb();
const hsl = d3.hsl(color);               // 构造目标空间对象。
const lab = d3.lab(color);
const hcl = d3.hcl(color);
console.log(rgb.r, hsl.h, lab.l, hcl.c);
console.log(hsl.formatHex());            // 输出 CSS 十六进制。
```

**关键点解释**

D3 用构造函数 `d3.hsl(color)`、`d3.lab(color)` 和 `d3.hcl(color)` 转换颜色空间；`color.rgb()` 转换为 RGB。读取对象字段得到数值，调用格式化方法得到可用于 fill 的字符串。

### 运行示例: HSL 颜色的构造

```javascript
function hsl({svg,d3,n}) {
  // h 以度计，s/l 在 0 到 1 之间。
  const colors=d3.range(6).map(i=>d3.hsl(i*60,.65,n/10));
  svg.selectAll('rect').data(colors).join('rect').attr('x',(d,i)=>15+i*93)
    .attr('y',40).attr('width',84).attr('height',110).attr('fill',d=>d.formatHex());
  return colors.map(d=>({h:d.h,s:d.s,l:d.l,css:d.formatHex()}));
}
```


[D3 官方文档](https://d3js.org/d3-color)

### 演示观察

单独改变 H、S、L，再比较 RGB 与 Lab 表达。留意参数变化和看见的变化是否一致。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-1)

## 3.2 颜色映射：三类色板

### 三类 colormap

先判断数据的含义，再选择颜色映射。顺序型、发散型和定性型分别对应数量顺序、有意义的中点和无序类别。

| 类型 | 数据语义 | 颜色安排 | 例子 |
| --- | --- | --- | --- |
| 顺序型 Sequential | 从低到高 | 明度有顺序地变化 | Viridis、Cividis、Blues |
| 发散型 Diverging | 围绕基准的两侧 | 两端有区别，中间接近中性色 | RdBu、BrBG |
| 定性型 Qualitative | 没有大小关系的类别 | 颜色容易区分 | Tableau10、Set1、Okabe-Ito |

### 中点是否有意义

温度相对平均值的偏差可以用 0 作中点：低于平均值用一侧颜色，高于平均值用另一侧。人数从少到多则通常采用顺序型，不需要人为加入一个“正常 / 异常”的分界。

### 颜色变化与图例

顺序型应让读者容易判断高低；发散型要在图例中明确基准；定性型应保持类别与颜色的固定对应。把同一份数据换成不同色板，是检查颜色含义的直接方法。

### 关键代码

#### 1. 三种颜色比例尺

```javascript
// 顺序型：低值到高值。
const sequential = d3.scaleSequential(d3.interpolateViridis).domain([0,100]);
// 发散型：低端、中点、高端共三个位置。
const diverging = d3.scaleDiverging(d3.interpolateRdBu).domain([-20,0,20]);
// 定性型：类别到颜色数组的一一对应。
const qualitative = d3.scaleOrdinal(['A','B','C'], d3.schemeTableau10);
console.log(sequential(50), diverging(0), qualitative('A'));
console.log(d3.interpolateRdBu(0), d3.interpolateRdBu(1)); // 检查两端方向。
```

**关键点解释**

插值器接收归一化参数，比例尺把数据域映射为该参数。发散型的三项 domain 显式设置基准。`interpolateRdBu` 从红到蓝；如果图例方向需要相反，可以反转 domain，或使用 `t => d3.interpolateRdBu(1-t)`。

#### 2. 把选择依据写成条件

```javascript
function pickColormap({isOrdered, hasMeaningfulMidpoint}) {
  // 先判断是否围绕一个明确基准比较。
  if (hasMeaningfulMidpoint) return 'diverging';
  if (isOrdered) return 'sequential';
  return 'categorical';
}
console.log(pickColormap({isOrdered:true,hasMeaningfulMidpoint:false}));
```

**关键点解释**

函数参数使用对象解构，两个布尔字段描述数据含义。if 的顺序决定判断优先级：有中点时返回发散型，其次检查顺序，最后返回定性型。这个判断依据来自任务和字段语义，不是仅凭数值能否转成 Number。

### 运行示例: 顺序颜色比例尺

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


[D3 官方文档](https://d3js.org/d3-scale/sequential)

### 演示观察

在学院类别、气温与偏差三个情境下切换色板，检查颜色暗示的关系是否与字段一致。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-2)

## 3.3 Lab 色域与显示范围

### Lab 色域图

CIE Lab 用 L*、a*、b* 描述颜色。固定 L* 后，可以把 a*、b* 画成一个平面，观察该明度下哪些颜色能够在屏幕上显示。

- **L*：**明度，通常在 0 到 100 之间讨论。
- **a*：**负方向偏绿，正方向偏红。
- **b*：**负方向偏蓝，正方向偏黄。

### 颜色空间与设备色域

颜色空间规定如何描述颜色，色域则是某种设备或标准能够表示的颜色集合。sRGB 常用于 Web，Adobe RGB 和 Rec.2020 覆盖不同的颜色范围。屏幕能显示什么，取决于设备和显示流程。

### 在 D3 中检查颜色

`d3.lab(L, a, b).rgb()` 把 Lab 颜色转换为 RGB 对象。先用 `displayable()` 判断是否落在可显示范围，再用 `formatHex()` 或 `formatRgb()` 生成 CSS 颜色。格式化时发生的裁剪可能让不同的 Lab 颜色显示成同一种颜色。

比较 RGB 与 Lab 插值时，可以选相同的起点和终点，再观察中间颜色的明度变化。

### 关键代码

#### 1. Lab 对象与色域判断

```javascript
const color = d3.lab(50,30,-20); // 参数顺序是 L*、a*、b*。
const rgb = color.rgb();       // 保留转换后的原始通道数值。
console.log(rgb.r,rgb.g,rgb.b);
console.log(rgb.displayable()); // 在 CSS 格式化前检查。
console.log(rgb.formatHex());
const reverse = d3.lab('#ff0080'); // 直接从 CSS 颜色创建 Lab。
console.log(reverse.l,reverse.a,reverse.b);
```

**关键点解释**

`rgb()` 返回颜色对象，通道可能超出显示范围；`formatHex()` 输出字符串时会裁剪通道。因此先调用 `displayable()`，再格式化，可以区分原始颜色与最终显示颜色。`d3.lab(css)` 是从已有颜色转换到 Lab 的写法。

#### 2. RGB 与 Lab 插值

```javascript
const inLab = d3.interpolateLab('#000000','#ffffff');
const inRgb = d3.interpolateRgb('#000000','#ffffff');
// 相同 t，分别在两种空间计算中间颜色。
const samples = d3.range(5).map(i => {
  const t = i/4;
  return {t,lab:inLab(t),rgb:inRgb(t)};
});
console.table(samples);
```

**关键点解释**

`interpolateLab(a,b)` 返回一个函数，不会立即返回整条色带。调用这个函数并传入 t，才得到该位置的 CSS 颜色。`d3.range(5)` 生成 0、1、2、3、4，再除以 4，包含两个端点。

### 运行示例: 颜色转换与色域判断

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


[D3 官方文档](https://d3js.org/d3-color)

### 演示观察

改变 L*，观察可显示区域怎样变化。对照超界位置与灰色区域。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-3)

## 3.4 色系搭配

### 五种色系搭配

| 规则 | 色轮关系 | 主要特点 |
| --- | --- | --- |
| 单色 Monochromatic | 同一色相，改变亮度和饱和度 | 整体统一 |
| 类比 Analogous | 相邻色相，例如 ±30° | 颜色接近 |
| 互补 Complementary | 相隔 180° | 两组颜色对比明显 |
| 三等分 Triadic | 相隔 120° | 形成三组色相 |
| 分裂互补 Split-complementary | 主色与互补色两侧，例如 +150°、+210° | 保留对比，减少正对色的冲突 |

### 在色轮上构造色板

从主色相 H 开始，按规则增加偏移角。HSL 的色相是循环的，例如 350° 再加 30° 得到 20°。单色规则的色相相同，需要通过饱和度或亮度得到不同颜色。

### 用到图表中

色轮关系用来组织配色。用于类别图时，还要把颜色放进实际图形，比较小点、细线和背景上的效果；用于数值图时，则先检查是否形成了清楚的明度顺序。

### 关键代码

#### 1. 五种规则的色相与明度

```javascript
const wrap = h => (h%360+360)%360; // 同时处理负角度与超过一圈的角度。
const offsets = {
  monochromatic:[0,0,0], analogous:[-30,0,30],
  complementary:[0,180], triadic:[0,120,240], split:[0,150,210]
};
function palette(baseHue,rule) {
  return offsets[rule].map((offset,i) => {
    const lightness = rule === 'monochromatic' ? 0.3+i*0.2 : 0.55;
    return d3.hsl(wrap(baseHue+offset),0.6,lightness).formatHex();
  });
}
console.log(palette(210,'split'));
```

**关键点解释**

对象保存每种规则的偏移数组，`offsets[rule]` 按名称取出它。JavaScript 的 `%` 是余数运算，所以两次取余可把负角度也归入 0 到 360。单色规则不能只重复同一个色相、饱和度和亮度，因此这里单独改变亮度。

### 运行示例: 色轮角度与取模

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


[D3 官方文档](https://d3js.org/d3-color)

### 演示观察

改变主色相与色系，观察色轮位置和色块同步变化。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-4)

## 3.5 经典配色方案

### 常用科研配色

| 色板 | 类型 | 用途 |
| --- | --- | --- |
| Okabe-Ito / Wong | 定性，八色 | 用不同颜色区分类别 |
| Paul Tol bright | 定性，七色 | 白底图表中的类别编码 |
| Tableau10 | 定性，十色 | 常见分类图表 |
| Viridis / Cividis | 顺序型 | 热图、连续数值 |
| RdBu / BrBG | 发散型 | 相对基准的正负偏差 |

定性色板是一个颜色数组；顺序型和发散型通常由插值器生成连续颜色。D3 的 `schemeTableau10` 属于前者，`interpolateViridis` 属于后者。

### 类别数量与颜色数量

类别增加后，颜色间的区分会更困难。可以加入标签、形状和分面，或把次要类别归入“其他”。类别仍然是类别，应继续使用定性编码。

### 从色块到图形

色板放成大色块时容易分辨，缩成散点后效果可能不同。演示同时展示色块和散点，可以比较同一套颜色在两种尺寸下的表现。

### 关键代码

#### 1. 颜色数组与连续插值器

```javascript
const palettes = {
  okabeIto:['#000000','#E69F00','#56B4E9','#009E73','#F0E442','#0072B2','#D55E00','#CC79A7'],
  tolBright:['#4477AA','#EE6677','#228833','#CCBB44','#66CCEE','#AA3377','#BBBBBB'],
  tableau:d3.schemeTableau10
};
// 定性色板直接传给 range。
const color = d3.scaleOrdinal().domain(['A','B','C']).range(palettes.okabeIto);
// 连续插值器按 t 取样，也可以生成离散颜色数组。
const sequential = d3.quantize(d3.interpolateViridis,7);
console.log(color('B'),sequential);
```

**关键点解释**

`scheme...` 通常是数组，`interpolate...` 是函数。`range` 接收数组；`scaleSequential` 接收插值器。`quantize(interpolator,n)` 在 0 到 1 之间取 n 个样本，方便生成图例或离散色块。

### 运行示例: 固定类别色板

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


[D3 官方文档](https://d3js.org/d3-scale/ordinal)

### 演示观察

切换三套定性色板和两套顺序色板，再比较色块与散点里的辨认难度。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-5)

## 3.6 配色案例比较

### 配色案例比较

比较配色时，先固定数据、位置、大小和图例，只改变颜色映射。这样可以看清颜色本身增加了什么含义。

| 案例 | 观察内容 |
| --- | --- |
| 彩虹色编码连续数量 | 明暗变化是否有序，是否出现突兀的分界 |
| 红绿区分两组 | 灰度和色觉模拟下是否仍可区分 |
| 类别使用连续渐变 | 颜色深浅是否暗示了类别之间的排名 |
| 类别使用固定定性色板 | 同一类别在不同视图中是否保持同色 |

### 从读图任务判断配色

可以先回答“哪一组最大”“哪些点属于同一类”“哪里高于基准”，再比较不同配色下回答是否一致。颜色的选择要服务于这个读图任务。

本节演示提供类别和连续数值两种任务。切换任务后，再选择顺序型、发散型或定性型，观察数据含义和颜色含义是否相符。

### 关键代码

#### 1. 固定数据，切换颜色映射

```javascript
const values = [12,35,60,85];
const maps = {viridis:d3.interpolateViridis,rainbow:d3.interpolateRainbow};
function draw(name) {
  const color = d3.scaleSequential(maps[name]).domain([0,100]);
  svg.selectAll('rect').data(values).join('rect')
    .attr('x',(d,i)=>i*60).attr('y',20).attr('width',50).attr('height',80)
    .attr('fill',color); // 只有 fill 使用可切换的比例尺。
}
draw('viridis');
d3.select('#palette-choice').on('change', event => draw(event.currentTarget.value));
```

**关键点解释**

把不变的数据和几何位置留在同一处，每次切换只选择新的颜色函数。`attr("fill", color)` 会为每条数据调用 `color(d)`。事件回调中从 `currentTarget.value` 读取 select 的当前选项，再重新绘制。

### 运行示例: 同数据的双视图比较

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


[D3 官方文档](https://d3js.org/d3-scale-chromatic)

### 演示观察

保留左图，改变右图色板和观看条件；比较图例是否支持当前数据语义。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-6)

## 3.7 配色生成与检验

### 鲜明的主色与低饱和配色

原课程把配色生成概括为几个参数：色相控制颜色之间的区别，饱和度控制鲜艳程度，亮度控制明暗。主色与配套色可以采用不同的饱和度和亮度。

- **主色：**确定主要色相，用于重点对象。
- **配套色：**从相邻或互补色相出发，适当降低饱和度。
- **背景与注释：**用较浅、较低饱和的颜色与主要图形拉开层次。

### 原课程的七色构造

主色、两侧类比色、两个低饱和类比色、互补色、浅色，共七个位置。先计算色相偏移，再分别调整 S 和 L。颜色之间的关系由规则确定，具体参数可以通过演示比较。

### 把颜色放回图表

生成色板后，在相同的图形上比较：主色是否突出，背景是否抢眼，细线和文字是否清楚。调整颜色数量时，也要同步检查图例和类别的对应关系。

### 关键代码

#### 1. 七色生成规则

```javascript
const wrap = h => (h%360+360)%360;
const clamp = value => Math.max(0,Math.min(1,value));
function genPalette(H,S,L) {
  const color = (h,s,l) => d3.hsl(wrap(h),clamp(s),clamp(l)).formatHex();
  return [
    color(H-30,S*0.6,L*1.1), // 左侧类比，低饱和。
    color(H-30,S,L), color(H,S,L), color(H+30,S,L),
    color(H+30,S*0.6,L*1.1), // 右侧类比，低饱和。
    color(H+180,S*0.8,L*0.95), // 互补色。
    color(H,S*0.2,L*1.4)      // 浅色。
  ];
}
console.log(genPalette(210,0.6,0.55));
```

**关键点解释**

内部的 `color` 函数复用色相循环、范围处理和格式化步骤。每一项保留主色 H、S、L 的关系，只改变相应偏移或倍数。返回值是颜色数组，可以交给 `scaleOrdinal().range(...)`，也可以直接生成色块。

### 运行示例: 参数化生成色板

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


[D3 官方文档](https://d3js.org/d3-color)

### 演示观察

增加颜色数量，观察色轮上的间隔和色块间的差异。保留一套方案再作比较。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-7)

## 3.8 色觉差异与冗余编码

### 用整张图检查颜色

本节沿用原课程的三个案例：分类散点图、顺序型热图、红绿对比。色块展示颜色本身，整张图则能检查点的大小、线条、背景和图例共同作用后的效果。

### 检查流程

- 先阅读原图，明确图中哪些信息依靠颜色表达。
- 切换灰度或色觉模拟，观察类别、数值顺序和图例是否仍能读出。
- 加入文字、形状或线型，再比较关键对象是否更容易辨认。

### 冗余编码

同一类别可以同时使用颜色和形状，折线可以同时使用颜色和线型，关键数值可以直接标注。这样，读者有多种线索可以交叉判断。

### 关键代码

#### 1. 用形状和文字补充颜色

```javascript
const categories = ['A','B','C'];
const color = d3.scaleOrdinal(categories,d3.schemeTableau10);
const shape = d3.scaleOrdinal(categories,[d3.symbolCircle,d3.symbolSquare,d3.symbolTriangle]);
const symbol = d3.symbol().size(100); // size 是面积，不是半径。
const nodes = svg.selectAll('g.point').data(data).join('g').attr('class','point')
  .attr('transform',d=>`translate(${x(d.x)},${y(d.y)})`);
nodes.selectAll('path').data(d=>[d]).join('path')
  .attr('d',d=>symbol.type(shape(d.category))()).attr('fill',d=>color(d.category));
nodes.selectAll('text').data(d=>[d]).join('text').attr('x',10).text(d=>d.category);
```

**关键点解释**

`d3.symbol()` 是路径生成器。`type(...)` 设置形状，再加一对 `()` 才生成 SVG path 字符串。父组绑定一条记录，子选择集通过 `d => [d]` 继承该记录；文字、形状和颜色共同标识类别。

### 运行示例: 形状与文字冗余编码

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


[D3 官方文档](https://d3js.org/d3-shape/symbol)

### 演示观察

切换原色、灰度和色觉模拟，再隐藏标签，比较哪些信息仍可判断。

[打开本节](https://mississippipotato.github.io/recreate/#ch-3-8)
