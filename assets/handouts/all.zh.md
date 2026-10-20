# 第 1 章 数据

数据来源、属性与变换，构成 D3 绘图的基础。

本讲义基于原课程与课程材料重新组织，配套网站保留“讲解 / 关键代码 / 演示”。示例中的学生、气温、场与事件为教学构造数据。

## 1.1 数据生成与读取

从新生 CSV 文件开始，区分数据来源、字段含义和 JavaScript 中的数据类型。

### 先说明数据来源

原课程用大模型合成新生记录。本课继续使用固定规则生成的 80 条教学记录，便于重复实验。字段齐全不等于真实采样，图中的差异不能直接推广到现实学生。

### CSV 读进来以后是什么

CSV 的单元格默认是字符串。成绩参与计算前要转换为数值；编号则应保留为标识。空字符串要单独处理，不能因为 Number("") 为 0 就把缺失记为零。

### 用行转换函数统一结构

d3.csv(url, row) 的第二个参数可以转换每一行。中文属性名在 JavaScript 中合法；映射为英文名是团队命名约定，不是语法要求。日期应按明确格式解析。

### 关键代码: 读取 CSV 与转换字段

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
async function csv({svg,d3,n}) {
  // 行回调在解析时转换类型；编号仍是字符串。
  const rows=await d3.csv(new URL('../assets/data/students.csv',import.meta.url),row=>({
    id:row.id, score:row.score.trim()===''?null:Number(row.score)
  }));
  const shown=rows.slice(0,n);
  // 比例尺把成绩转为像素，不修改成绩。
  const x=d3.scaleLinear().domain([0,100]).range([0,440]);
  svg.selectAll('rect').data(shown,d=>d.id).join('rect')
    .attr('x',80).attr('y',(d,i)=>20+i*24).attr('width',d=>x(d.score??0))
    .attr('height',16).attr('fill','#2878ad');
  svg.selectAll('text').data(shown).join('text')
    .attr('x',10).attr('y',(d,i)=>33+i*24).text(d=>d.id);
  return {rows:rows.length,scoreType:typeof rows[0].score,first:rows[0]};
}
```

- **await d3.csv(url, row)**: await 等待异步读取；row 的返回值成为一条记录。
- **Number(row.score)**: 显式数值转换；空值先判断。
- **d => d.id**: 箭头函数返回稳定编号，用于匹配。

[D3 官方文档](https://d3js.org/d3-fetch)

### 演示观察

切换原始字符串与转换后的数值，比较成绩列的 typeof；再选中一条记录，观察编号是否改变。

[打开本节](https://mississippipotato.github.io/recreate/#ch-1-1)

## 1.2 数据、信息与知识

一个数值要放进语境才有意义。DIKW 用来整理这个过程，不是自动升级的算法。

### 数据：先保留观察

“80”只是一个符号。给出字段、单位、采集对象和时间，才能知道它是在说成绩、人数还是温度。

### 信息：回答具体问题

把记录按专业组织，统计人数，就可以回答“各专业多少人”。这一步增加了语境和结构；画图帮助读出结构，却不会改变样本来源。

### 知识与决策：还需要依据

从“这一组均值更高”到解释原因，需要额外证据。DIKW 是讨论数据、信息、知识与智慧的教学框架，实际分析并不总是逐层进行。

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

点击四层金字塔。比较同一份记录在每层能回答什么，以及还缺少什么证据。

[打开本节](https://mississippipotato.github.io/recreate/#ch-1-2)

## 1.3 数据属性与视觉通道

先判断字段允许怎样比较，再选择位置、长度、颜色或形状。

### 存储类型与测量尺度不同

编号用数字存储，也只是名义属性；等级表达顺序，却未必等距。摄氏温度的差值有意义，而 20°C 不是 10°C 的“两倍热”。人数具有有意义的零点。

### 标记与通道各做什么

点、线、面是标记；位置、面积、色相和明度是通道。一个点代表一个学生，横向位置表达成绩，色相区分专业，就是三个层次的选择。

### 表达能力要与任务相符

共用尺度上的位置适合精确比较数量；色相适合区分类别。通道排序是设计依据，实际效果还受大小、背景、数量和任务影响，不能把一种通道讲成处处最优。

![原课程：不同数据类型对应的视觉通道排序。](../figures/01-mackinlay-ranking.png)

![原课程：位置、颜色、形状和大小等视觉通道。](../figures/03-channels-position-color-shape.png)

### 关键代码: 比例尺与坐标轴

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function scales({svg,d3,n}) {
  const values=[0,25,50,75,100];
  // domain 是输入，range 是输出；n 控制屏幕宽度。
  const x=d3.scaleLinear().domain([0,100]).range([40,40+n*40]);
  svg.selectAll('circle').data(values).join('circle')
    .attr('cx',d=>x(d)).attr('cy',95).attr('r',8).attr('fill','#2878ad');
  // call 将选择集交给坐标轴生成器。
  svg.append('g').attr('transform','translate(0,130)').call(d3.axisBottom(x).ticks(4));
  return values.map(value=>({value,pixel:x(value)}));
}
```

- **domain([0,100])**: 输入数据的范围。
- **range([40,...])**: 输出像素的范围，与 domain 按顺序对应。
- **selection.call(axis)**: 把当前选择集交给坐标轴生成器。

[D3 官方文档](https://d3js.org/d3-scale/linear)

### 演示观察

切换编号、等级、温度和人数。观察相同的数值，为什么需要不同的颜色逻辑。

[打开本节](https://mississippipotato.github.io/recreate/#ch-1-3)

## 1.4 数据变换

把每一步的输入和输出写出来，区分逐项映射、筛选、组合和聚合。

### 逐项处理与筛选

map 为每项计算一个新值；filter 保留符合条件的项。排序只改变顺序。操作以后记录变少，不代表原数组中的记录被永久删除。

### 数组的结构也可以变

cross 构造笛卡尔积，pairs 构造相邻对，zip 按索引组合，transpose 交换矩阵行列，merge 展开一层数组。宽长表转换通常还需要保留实体标识与字段名，不能只做矩阵转置。

### 分组与汇总

d3.group 保留各组记录；d3.rollup 把组内记录归约为人数、均值等值。回调函数可以包含副作用，因此“使用数组方法”并不自动保证纯函数。

### 关键代码: filter → map → sum

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function arrays({svg,d3,n}) {
  const values=d3.range(1,n+1);
  // 先筛选，再映射；原数组仍保留。
  const result=values.filter(d=>d%2===0).map(d=>d*d);
  const x=d3.scaleBand().domain(d3.range(result.length)).range([30,540]).padding(.25);
  const y=d3.scaleLinear().domain([0,n*n]).range([170,15]);
  svg.selectAll('rect').data(result).join('rect').attr('x',(d,i)=>x(i))
    .attr('y',d=>y(d)).attr('width',x.bandwidth()).attr('height',d=>170-y(d)).attr('fill','#2878ad');
  return {input:values,result,sum:d3.sum(result)};
}
```

- **d3.range(1,n+1)**: 终点不包含在结果中。
- **d => d % 2 === 0**: 回调逐项返回布尔值，决定保留哪些元素。
- **map(d => d*d)**: 逐项生成平方值，不修改原数组。

[D3 官方文档](https://d3js.org/d3-array/transform)

### 演示观察

选择一种操作，先读输入，再读输出。注意结果的类型、长度和嵌套层数。

[打开本节](https://mississippipotato.github.io/recreate/#ch-1-4)

## 1.5 D3 选择集与数据连接

选择集负责找到元素，数据连接负责让元素与记录对应。

### 从 DOM 元素到选择集

d3.select 找第一个匹配元素；d3.selectAll 找所有匹配元素。selection.selectAll 会在每个父元素下建立子选择集，因此嵌套表格或分组图形要留意层次。

### 三态来自匹配关系

旧数据 A、B、C 换成 B、C、D，长度仍为 3，但 A 退出、D 进入、B 和 C 更新。enter、update、exit 不能只通过比较数组长度推断。

### key 保留对象身份

data(rows, d => d.id) 按稳定标识匹配；省略 key 时按索引匹配。join 的 enter 与 update 回调应返回选择集或过渡，后续链式调用才作用于合并后的元素。

![原课程：数据与元素的 enter / update / exit 对应关系。](../figures/data-join.png)

### 关键代码: data → join → attr

以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。

```javascript
function join({svg,d3,n}) {
  const rows=['A','B','C','D','E','F','G','H'].slice(0,n).map(id=>({id}));
  // key 按身份匹配；省略时按索引匹配。
  const marks=svg.selectAll('circle').data(rows,d=>d.id);
  const counts={enter:marks.enter().size(),update:marks.size(),exit:marks.exit().size()};
  marks.join(
    // enter 与 update 返回选择集，供后续链式设置。
    enter=>enter.append('circle').attr('fill','#e16a45'),
    update=>update.attr('fill','#2878ad'),
    exit=>exit.remove()
  ).attr('cx',(d,i)=>45+i*65).attr('cy',100).attr('r',22);
  svg.selectAll('text').data(rows,d=>d.id).join('text').attr('x',(d,i)=>45+i*65)
    .attr('y',105).attr('text-anchor','middle').attr('fill','white').text(d=>d.id);
  return counts;
}
```

- **selectAll("circle")**: 选择集可以为空；join 会按需要创建元素。
- **data(rows, d => d.id)**: 第二参是 key 函数，返回唯一身份。
- **enter / update / exit**: 三态由匹配结果决定；拖动参数查看数量。

[D3 官方文档](https://d3js.org/d3-selection/joining)

### 演示观察

比较替换、重排、增加与删除；再切到按索引匹配，观察同一个 DOM 编号对应哪个数据。

[打开本节](https://mississippipotato.github.io/recreate/#ch-1-5)


---

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


---

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


---

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


---

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
