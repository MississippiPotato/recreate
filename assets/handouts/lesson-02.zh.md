# 第 2 章 数据可视化流程

分组、层次、布局和事件处理，共同组成完整流程。

## 2.1 数据可视化流程

### 三个可视化流程模型

从数据到图形，可以用几个经典模型来理解。Card 模型说明数据经过哪些步骤，Mackinlay 讨论视觉表达的选择，van Wijk 模型把用户交互和知识获取放进了这个过程。

| 模型 | 核心内容 |
| --- | --- |
| Card、Mackinlay 与 Shneiderman（1999） | 原始数据 → 数据表 → 视觉结构 → 视图 |
| Mackinlay（1986） | 根据数据类型考虑表达能力和视觉通道的有效性 |
| van Wijk（2005） | 数据、可视化、感知与探索组成反馈过程 |

### 沿着数据流看每一步

- **数据变换：**从原始记录中清洗、筛选、分组，得到适合分析的数据表。
- **视觉映射：**选择图元和通道，例如用位置表示层次，用颜色区分类别。
- **视图变换与渲染：**根据布局、坐标和绘图区域生成最终图形。
- **交互反馈：**用户选择、过滤或调整参数后，重新计算相应步骤。

本章使用同一份分组数据串联这些步骤：先统计专业和班级人数，再建立层次结构，计算树布局，最后加入展开、选中和事件处理。

### 关键代码

#### 1. 流程节点、箭头与选中状态

```javascript
// defs 中的 marker 是可复用的箭头定义。
svg.append('defs').append('marker').attr('id', 'pipeline-arrow')
  .attr('viewBox', '0 -5 10 10').attr('refX', 8)
  .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
  .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#8298aa');
// url(#id) 引用当前 SVG 中的定义。
svg.append('line').attr('x1', 40).attr('x2', 160).attr('y1', 60).attr('y2', 60)
  .attr('stroke', '#8298aa').attr('marker-end', 'url(#pipeline-arrow)');
const nodes = svg.selectAll('g.node').data(stages, d => d.id).join('g').attr('class', 'node');
nodes.on('click', (event, picked) => {
  // picked 是点击项；d 是当前正在设置样式的项。
  nodes.classed('selected', d => d.id === picked.id);
});
```

**关键点解释**

`append` 返回新元素的选择集，因此可以继续设置属性或添加子元素。`marker-end` 引用箭头，`orient="auto"` 让它跟随线段方向。`classed("selected", predicate)` 对每个节点求布尔值，一次更新全部选中状态。

### 运行示例: 状态驱动的流程图

```javascript
function flow({svg,d3,n,L}) {
  const stages=L(['记录','数据表','视觉结构','视图'],['Records','Table','Structure','View']);
  // data 绑定阶段，classed 表达当前选中的状态。
  svg.selectAll('line').data(stages.slice(1)).join('line').attr('x1',(d,i)=>120+i*140)
    .attr('x2',(d,i)=>155+i*140).attr('y1',90).attr('y2',90).attr('stroke','#8298aa');
  svg.selectAll('rect').data(stages).join('rect').classed('chosen',(d,i)=>i===n-1)
    .attr('x',(d,i)=>15+i*140).attr('y',60).attr('width',105).attr('height',60)
    .attr('rx',5).attr('fill',(d,i)=>i===n-1?'#e16a45':'#e8f0f7');
  svg.selectAll('text').data(stages).join('text').attr('x',(d,i)=>67+i*140)
    .attr('y',96).attr('text-anchor','middle').text(d=>d);
  return stages[n-1];
}
```


[D3 官方文档](https://d3js.org/d3-selection/modifying)

### 演示观察

依次查看记录、分组、层次与树图。说出每一步新增了什么结构，哪些原始记录仍然保留。

[打开本节](https://mississippipotato.github.io/recreate/#ch-2-1)

## 2.2 数据分类树：group 与 rollup

### 数据变换：从记录到分组结果

按“专业 / 班级”统计新生人数，是一次多维分组聚合。外层按专业分组，内层按班级分组，每组用记录条数表示人数。

| 操作 | 作用 | 常用写法 |
| --- | --- | --- |
| 清洗 / 过滤 | 去除空项、筛选满足条件的记录 | filter、CSV 行回调 |
| 聚合 / 汇总 | 按 key 分组并计算结果 | d3.group、d3.rollup |
| 连接 / 关联 | 按共同字段关联两份记录 | Map 索引与字段查找 |
| 派生字段 | 从已有字段计算新字段 | 从班级名称提取专业 |

### d3.rollup 的参数与返回值

`d3.rollup(data, reducer, key1, key2, ...)` 先按 key 分组，再把每个最内层的记录数组交给 reducer。`v => v.length` 得到人数，`v => d3.mean(v, d => d.score)` 得到平均分。

- 一个 key 返回单层 Map；两个 key 返回嵌套 Map。
- 使用 `for (const [key, value] of map)` 遍历键值对。
- `group` 保留组内记录，`rollup` 保留聚合结果。

### 切片与下钻

只看某专业，可以先过滤再聚合；展开某专业查看各班人数，则是在聚合结果中向下读取一层。这种“总体 → 局部”的组织方式也常用于 OLAP 和交互分析。

### 关键代码

#### 1. 双层 rollup 与 Map 遍历

```javascript
const nested = d3.rollup(
  students,
  group => group.length,  // reducer 收到最内层的记录数组。
  d => d.major,           // 第一个 key：专业。
  d => d.class            // 第二个 key：班级。
);
// 外层值是 Map，内层值才是人数。
for (const [major, classes] of nested) {
  for (const [className, count] of classes) console.log(major, className, count);
}
```

**关键点解释**

`rollup` 的分组键是可变数量的参数。传两个键就产生两层 Map，读取时也要对应两层。reducer 决定叶子值的类型；把 `group.length` 换成 `d3.mean(...)`，叶子就从人数变成均值。

#### 2. 从班级名称提取专业

```javascript
const className = '软件工程12班';
// ^ 和 $ 限定完整字符串；两组括号分别捕获专业和班号。
const match = className.match(/^(.+?)(\d+班)$/);
const major = match ? match[1] : className;
// match[0] 是完整匹配，match[1] 与 match[2] 是捕获组。
console.log(major, match?.[2]); // 软件工程, 12班
// 派生字段可以直接放在 CSV 的行回调中。
```

**关键点解释**

`.+?` 从较短的匹配开始尝试，`\d+` 匹配一个或多个数字。整个表达式要求结尾是“数字 + 班”，所以多位班号可以一起捕获。`match` 未匹配时为 null，三元表达式提供回退值；`?.` 在 null 时停止属性读取。

### 运行示例: 多层分组与归约

```javascript
function rollup({svg,d3,n}) {
  const rows=d3.range(n*4).map(i=>({major:['A','B','C'][i%3],class:i%2}));
  // 第二参处理组内数组；后面依次是分组键。
  const groups=d3.rollup(rows,group=>group.length,d=>d.major,d=>d.class);
  const flat=Array.from(groups,([major,classes])=>({major,count:d3.sum(classes.values())}));
  svg.selectAll('rect').data(flat).join('rect').attr('x',60).attr('y',(d,i)=>30+i*45)
    .attr('width',d=>d.count*23).attr('height',25).attr('fill','#2878ad');
  svg.selectAll('text').data(flat).join('text').attr('x',20).attr('y',(d,i)=>48+i*45).text(d=>d.major);
  return {input:rows.length,groups:flat,total:d3.sum(flat,d=>d.count)};
}
```


[D3 官方文档](https://d3js.org/d3-array/group)

### 演示观察

切换专业与班级，选中一组查看成员编号。检查组人数之和是否仍为 80。

[打开本节](https://mississippipotato.github.io/recreate/#ch-2-2)

## 2.3 视觉映射与树布局

### 视觉映射：图元与通道

视觉结构由图元和视觉通道共同组成。**点、线、面**是图元；位置、颜色、形状、倾斜和大小是通道。同样一份数据，可以选择不同图元，也可以用不同通道表达同一个属性。

| 通道类型 | 表达的属性 | 常见通道 |
| --- | --- | --- |
| 幅度通道 Magnitude | 有序或定量属性 | 位置、长度、面积、明度 |
| 标识通道 Identity | 类别或身份 | 空间分区、色相、形状 |

原课程的五张图分别展示通道排序、图元、常用通道、幅度通道和标识通道。对数量做精确比较时，通常优先考虑共用尺度上的位置；区分类别时，可以考虑色相、形状或空间分区。

### 树布局：把层级关系放到屏幕上

上一节得到“专业 → 班级”的层级关系。树布局用节点表示对象，用连线表示父子关系，再把层级映射到位置。D3 的 `tree` 使用 tidy tree 布局，使同一层的节点分开，并把父节点放在子树之间。

- `d3.hierarchy(data)` 建立 parent、children、depth 等结构。
- `d3.tree().size([height, width])(root)` 为节点计算 x、y。
- 横向树把深度坐标 y 画在水平方向，把 x 画在垂直方向。节点和连线使用同一约定。

### 其他层次布局

`cluster` 把叶节点对齐；`treemap` 用矩形面积表达数量；`pack` 用圆打包；`partition` 可以生成 icicle 或 sunburst 的布局坐标。层级数据相同，布局表达的重点可以不同。

![原课程：点、线、面三类标记。](../figures/02-marks-points-lines-areas.png)

![原课程：位置、颜色、形状和大小等视觉通道。](../figures/03-channels-position-color-shape.png)

![原课程：用于表达有序或定量属性的通道。](../figures/04-magnitude-channels.png)

![原课程：用于区分身份和类别的通道。](../figures/05-identity-channels.png)

![原课程：不同数据类型对应的视觉通道排序。](../figures/01-mackinlay-ranking.png)

### 关键代码

#### 1. hierarchy → tree → links / nodes

```javascript
// hierarchy 建关系；此时还没有布局坐标。
const root = d3.hierarchy(rootData);
const layout = d3.tree().size([360, 720]);
layout(root); // 执行布局，为每个节点写入 x、y。
const g = svg.append('g').attr('transform', 'translate(40,20)');
g.selectAll('path.link').data(root.links()).join('path').attr('class', 'link')
  .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x))
  .attr('fill', 'none').attr('stroke','#9bb1bd');
const nodes = g.selectAll('g.node').data(root.descendants()).join('g').attr('class', 'node')
  .attr('transform', d => `translate(${d.y},${d.x})`);
nodes.append('circle').attr('r', 5);
nodes.append('text').attr('x', d => d.children ? -8 : 8)
  .attr('text-anchor', d => d.children ? 'end' : 'start')
  .text(d => d.data.name); // 原始字段保存在 node.data。
```

**关键点解释**

`root.descendants()` 返回节点数组，`root.links()` 返回 source/target 连线数组。tree 的 y 表示深度方向，x 表示同层展开方向；横向树把 y 用作屏幕横坐标。节点的 `transform` 与连线访问器必须采用相同坐标交换。

#### 2. size 与 separation

```javascript
const layout = d3.tree().size([360, 720])
  // a、b 是需要分开的节点，不是父子参数。
  .separation((a, b) => a.parent === b.parent ? 1 : 2);
layout(root);
// 固定节点间距时，可改用 nodeSize。
const fixed = d3.tree().nodeSize([24, 160]);
```

**关键点解释**

`size([360,720])` 指定整个布局的坐标范围；`separation` 控制同层节点之间的相对间隔。1 与 2 表示兄弟与非兄弟的相对分离程度，不是像素。`nodeSize` 则按固定间距安排坐标，与整体 size 是两种布局设置。

### 运行示例: hierarchy → tree → links

```javascript
function tree({svg,d3,n}) {
  const root=d3.hierarchy({name:'root',children:d3.range(n).map(i=>({name:String(i+1)}))});
  // hierarchy 建立关系，tree 为节点计算 x/y。
  d3.tree().size([150,440])(root);
  // 横向树交换坐标，节点和连线必须使用同一约定。
  const g=svg.append('g').attr('transform','translate(40,25)');
  g.selectAll('path').data(root.links()).join('path')
    .attr('d',d3.linkHorizontal().x(d=>d.y).y(d=>d.x))
    .attr('fill','none').attr('stroke','#9bb1bd');
  g.selectAll('circle').data(root.descendants()).join('circle')
    .attr('cx',d=>d.y).attr('cy',d=>d.x).attr('r',7).attr('fill','#2878ad');
  return root.descendants().map(d=>({name:d.data.name,depth:d.depth,x:d.x,y:d.y}));
}
```


[D3 官方文档](https://d3js.org/d3-hierarchy/tree)

### 演示观察

切换横向与纵向树，选择同一个节点。比较位置变化与父子关系的不变。

[打开本节](https://mississippipotato.github.io/recreate/#ch-2-3)

## 2.4 树形列表与事件处理

### 从层次数据到可交互列表

层次数据除了画成节点连线，也可以渲染为嵌套的 HTML 列表。每个节点对应一个 `li`，子节点放进它内部的 `ul`。展开、折叠和选中状态可以用 D3 的 `classed` 控制。

### DOM 事件的三个阶段

| 阶段 | 传播方向 | 列表中的例子 |
| --- | --- | --- |
| 捕获 Capturing | 从外层走向目标 | 列表容器 → li → 按钮 |
| 目标 Target | 到达实际点击的元素 | 展开按钮 |
| 冒泡 Bubbling | 从目标返回外层 | 按钮 → li → 列表容器 |

默认监听器通常处理冒泡阶段。点击展开按钮时，事件也会传给外层的节点；如果节点还绑定了“选中”操作，就可能同时触发两个动作。`event.stopPropagation()` 可以阻止事件继续沿父元素传播。

### 事件委托与 classed

事件委托把监听器放在列表容器上，再用 `event.target.closest(...)` 找到被点击的项目。`event.target` 是点击来源，`event.currentTarget` 是当前执行监听器的元素。

`selection.classed("selected", true)` 添加类，传入 `false` 移除类，传入函数则根据每条数据计算状态。用这种方式，数据状态和样式规则可以分开。

### 过渡动画

`transition().duration(ms)` 让位置、颜色或透明度从旧值逐渐变化到新值。时长为 0 时立即切换；增加时长后，可以观察元素变化的过程。连续操作时，可先调用 `interrupt()` 终止已有过渡。

### 关键代码

#### 1. 展开按钮、选中与事件传播

```javascript
const item = d3.select('li');
const toggle = item.select('button.toggle');
toggle.on('click.toggle', function(event) {
  event.stopPropagation(); // 不再触发外层 li 的点击监听器。
  const open = this.getAttribute('aria-expanded') !== 'true';
  this.setAttribute('aria-expanded', String(open));
  item.classed('expanded', open);
});
// .select 是事件命名空间，便于单独替换或移除监听器。
item.on('click.select', () => item.classed('selected', true));
```

**关键点解释**

`click.toggle` 与 `click.select` 都监听 click，点号后的名字是 D3 的命名空间。点击按钮会先触发按钮监听器，再沿父元素冒泡；`stopPropagation` 阻断这次传播。它不等同于阻止默认动作的 `preventDefault`。

#### 2. 递归生成嵌套列表

```javascript
function buildList(parent, nodes) {
  const items = parent.selectAll('li').data(nodes, d => d.id).join('li');
  items.each(function(d) {
    const item = d3.select(this); // 原生 DOM 转回 D3 选择集。
    item.selectAll('span.label').data([d]).join('span').attr('class', 'label').text(d => d.name);
    const children = d.children ?? [];
    const nested = item.selectAll('ul').data(children.length ? [children] : []).join('ul');
    if (children.length) buildList(nested, children); // 子层重复同样步骤。
  });
}
buildList(d3.select('#tree'), [rootData]);
```

**关键点解释**

`each` 对每个选中元素执行一次函数，适合在每个节点内部继续构造子树。`[children]` 把整个子数组绑定给一个 ul，再在 ul 内把数组逐项绑定为 li。递归在没有 children 时结束。

#### 3. transition 与 duration

```javascript
const nodes = svg.selectAll('circle.node');
// 普通 attr 立即设置；transition 后的 attr 在一段时间内变化。
nodes.interrupt().transition().duration(500)
  .attr('cx', d => d.x).attr('cy', d => d.y).attr('opacity', 1);
// 淡入：先给起始值，再定义终值。
svg.append('circle').attr('r', 8).attr('opacity', 0)
  .transition().duration(500).attr('opacity', 1);
```

**关键点解释**

`duration` 的单位是毫秒。过渡从元素当前属性插值到新属性；先设置 opacity 为 0，再过渡到 1，得到淡入。快速重复操作时，`interrupt` 可以停止旧过渡，随后从当前显示状态开始新的过渡。

#### 4. 用父容器做事件委托

```javascript
d3.select('#tree').on('click', function(event) {
  const label = event.target.closest('.label'); // 从实际点击处向上找。
  if (!label || !this.contains(label)) return;
  const item = label.closest('li');
  const datum = d3.select(item).datum();        // 读取 li 绑定的数据。
  d3.select(this).selectAll('li').classed('selected', function() {
    return this === item;
  });
  console.log(datum);
});
```

**关键点解释**

监听器只放在容器上，新增子项也能利用事件冒泡触发它。`target` 指最初点击的元素，普通函数的 `this` 指绑定监听器的容器；两者可能不同。`datum()` 不传参数时读取当前元素的数据。

### 运行示例: 事件与状态

```javascript
function events({svg,d3,n,L}) {
  const values=d3.range(n);
  const marks=svg.selectAll('circle').data(values).join('circle')
    .attr('cx',(d,i)=>45+i*45).attr('cy',100).attr('r',15).attr('fill','#2878ad');
  // D3 v7 传入 event 与绑定的数据 d。
  marks.on('click',function(event,d){
    // this 是当前圆；箭头函数可改用 event.currentTarget。
    const selected=d3.select(this);
    selected.classed('chosen',!selected.classed('chosen'));
    // interrupt 终止旧过渡；duration 的单位为毫秒。
    selected.interrupt().transition().duration(350)
      .attr('fill',selected.classed('chosen')?'#e16a45':'#2878ad');
    svg.selectAll('text').data([d]).join('text').attr('x',30).attr('y',165)
      .text(L('点击的数据 = ','Clicked datum = ')+d);
  });
  return L('点击圆点，查看 event 和 d 的作用。','Click a circle to inspect event and d.');
}
```


[D3 官方文档](https://d3js.org/d3-selection/events)

### 演示观察

折叠某个专业，观察它的子项收起，其他分支和总人数保持不变。

[打开本节](https://mississippipotato.github.io/recreate/#ch-2-4)
