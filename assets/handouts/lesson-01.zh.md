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
