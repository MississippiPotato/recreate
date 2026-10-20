# 第 2 章 数据可视化流程

分组、层次、布局和事件处理，共同组成完整流程。

本讲义基于原课程与课程材料重新组织，配套网站保留“讲解 / 关键代码 / 演示”。示例中的学生、气温、场与事件为教学构造数据。

## 2.1 数据可视化流程

沿着“原始数据 → 数据表 → 视觉结构 → 视图”追踪一份数据。

### 先明确任务

比较人数、查找一条记录、分析关系是不同任务。先明确任务再组织数据；上游分组错了，换一种图形布局并不能修正结果。

### 区分三类变换

数据变换准备表和统计量；视觉映射决定用什么标记与通道；视图变换安排屏幕上的位置和显示条件。它们相互衔接，但不是同一个步骤。

### 交互形成反馈

Card 模型帮助拆解流水线；Mackinlay 的工作帮助讨论表达力与有效性；van Wijk 的模型强调图像、感知、知识与探索的循环。交互可以修改参数、筛选条件或映射。

### 关键代码: 状态驱动的流程图

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **data(stages)**: 每个阶段对应一个矩形和标签。
- **classed("chosen", predicate)**: 对每个元素计算是否为当前阶段。

[D3 官方文档](https://d3js.org/d3-selection/modifying)

### 演示观察

依次查看记录、分组、层次与树图。说出每一步新增了什么结构，哪些原始记录仍然保留。

[打开本节](https://mississippipotato.github.io/recreate/#ch-2-1)

## 2.2 数据分类树：group 与 rollup

先按字段分组，再明确每组要保留记录还是只保留统计量。

### 分组键定义了集合

按专业分组与按班级分组会得到不同集合。改变 key 提取函数，会改变汇总的含义，不只是改变显示标签。

### 理解嵌套 Map

d3.rollup(data, reducer, key1, key2) 先按 key1、再按 key2 分组。叶子是 reducer 的返回值。用 for…of 与解构可读取每层的键和值。

### 总数应当对得上

如果分组覆盖同一批记录且没有重复计数，各叶子的人数之和应等于输入记录数。点击一个组，回查其成员，是检查聚合是否正确的直接方法。

### 关键代码: 多层分组与归约

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **group => group.length**: reducer 接收组内数组，返回人数。
- **d => d.major, d => d.class**: 多个 key 按传入顺序生成嵌套 Map。
- **([major, classes])**: 解构键值对；classes 仍是一个 Map。

[D3 官方文档](https://d3js.org/d3-array/group)

### 演示观察

切换专业与班级，选中一组查看成员编号。检查组人数之和是否仍为 80。

[打开本节](https://mississippipotato.github.io/recreate/#ch-2-2)

## 2.3 视觉映射与树布局

层次关系描述“谁是谁的子节点”，布局算法再为节点计算坐标。

### 数据结构不等于坐标

d3.hierarchy 为嵌套数据补充 parent、children、depth 等关系。此时还没有图上的 x/y 布局坐标；d3.tree(root) 才进行布局。

### 坐标方向由渲染决定

tree 的 x 表示横向排布位置，y 表示深度。画横向树时把节点映射为 translate(d.y, d.x)，并对连线使用相同的交换规则。

### 图元和通道共同编码

圆点是节点标记，线是关系标记，位置表达层次与邻近关系。树布局改变方向时，父子关系不应改变。原课程的通道图可帮助区分“表达多少”和“区分谁”。

![原课程：点、线、面三类标记。](../figures/02-marks-points-lines-areas.png)

![原课程：位置、颜色、形状和大小等视觉通道。](../figures/03-channels-position-color-shape.png)

![原课程：用于表达有序或定量属性的通道。](../figures/04-magnitude-channels.png)

![原课程：用于区分身份和类别的通道。](../figures/05-identity-channels.png)

![原课程：不同数据类型对应的视觉通道排序。](../figures/01-mackinlay-ranking.png)

### 关键代码: hierarchy → tree → links

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **d3.hierarchy(data)**: 计算父子关系、depth 等结构属性。
- **d3.tree().size(...)**: 调用生成器后才为节点提供布局坐标。
- **x(d => d.y).y(d => d.x)**: 横向绘制时，节点与连线一起交换坐标。

[D3 官方文档](https://d3js.org/d3-hierarchy/tree)

### 演示观察

切换横向与纵向树，选择同一个节点。比较位置变化与父子关系的不变。

[打开本节](https://mississippipotato.github.io/recreate/#ch-2-3)

## 2.4 树形列表与事件处理

将层次结构变成可展开的列表，并明确一次点击应该影响哪些节点。

### 列表是另一种视图

树图强调分支结构，缩进列表便于逐项阅读。数据关系可以相同，标记、空间占用和交互方式可以不同。

### 事件对象和数据对象不同

D3 v7 的监听函数接收 (event, d)。event 描述点击和坐标；d 是元素绑定的数据。需要当前元素时可以用普通函数的 this，也可以用 event.currentTarget。

### 控制状态与冒泡

classed(name, boolean) 切换类名；stopPropagation 阻止事件继续冒泡，但不会自动取消默认行为。事件委托把监听器放在父元素上，再用 closest 定位点击目标。

### 关键代码: 事件与状态

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

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

- **(event, d)**: event 是事件，d 是绑定的数据，不要颠倒。
- **function / this**: 普通函数的 this 指向元素；箭头函数改用 currentTarget。
- **classed(name, boolean)**: 布尔值决定添加还是移除类。
- **transition().duration(350)**: 在 350 毫秒内插值属性；interrupt 防止快速点击时堆积旧过渡。

[D3 官方文档](https://d3js.org/d3-selection/events)

### 演示观察

折叠某个专业，观察它的子项收起，其他分支和总人数保持不变。

[打开本节](https://mississippipotato.github.io/recreate/#ch-2-4)
