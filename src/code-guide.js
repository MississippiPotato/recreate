// Section-by-section explanations expand the original course's code excerpts.
// The runnable examples are maintained separately in code-labs.js.
const G=(zh,en,source,explanation,explanationEn)=>({title:{zh,en},source,explanation:{zh:explanation,en:explanationEn}});

export const codeGuide={
  '1.1':[
    G('字段名映射','Mapping column names',function(){
      // 左侧是 CSV 列名，右侧是程序内部使用的字段名。 ←→ Keys are CSV headers; values are internal field names.
      const COLUMN_MAP = {
        '序号': 'id', '姓名': 'name', '性别': 'gender',
        '生日': 'birthday', '年龄': 'age', '班级': 'class'
      };
      // Object.entries 把对象转换为 [键, 值] 数组。 ←→ Object.entries returns an array of [key, value] pairs.
      const row = {'序号': '1', '姓名': '张明', '年龄': '18'};
      const mapped = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [COLUMN_MAP[key] ?? key, value])
      );
      console.log(mapped); // {id: '1', name: '张明', age: '18'}
    },'对象中的 <code>key: value</code> 建立字段对应关系。<code>[key, value]</code> 是数组解构；<code>?? key</code> 表示没有配置映射时沿用原列名。中文属性名在 JavaScript 中合法；映射为英文名是为了让后面的代码采用统一命名。此时字段名变了，字段值仍是字符串。','The object maps one field name to another. <code>[key, value]</code> destructures an entry; <code>?? key</code> keeps unmapped names. Chinese property names are valid JavaScript; mapping establishes a consistent naming convention. Values remain strings.'),
    G('类型转换函数','The row conversion function',function(){
      // 先指定格式，再得到一个可重复使用的日期解析函数。 ←→ Specify a format to create a reusable date parser.
      const parseDate = d3.utcParse('%Y-%m-%d');
      function transformRow(row) {
        const age = row['年龄'].trim();
        return {
          id: row['序号'],                         // 编号保留字符串。 ←→ Keep the ID as a string.
          name: row['姓名'].trim(),                // 去掉首尾空格。 ←→ Remove surrounding whitespace.
          birthday: parseDate(row['生日']),        // 字符串转换为 Date。 ←→ Convert the string to Date.
          age: age === '' ? null : Number(age),   // 空项与数字分别处理。 ←→ Handle a blank separately from numbers.
          class: row['班级'].trim()
        };
      }
    },'<code>transformRow</code> 接收一行对象，<code>return { ... }</code> 返回新的记录。<code>Number("18")</code> 与 <code>+"18"</code> 都得到数字 18，后一种写法中的 <code>+</code> 是一元加运算符。两者都会把空字符串转成 0，因此先用 <code>trim()</code> 去掉首尾空格，再把空项单独记为 <code>null</code>。<code>utcParse</code> 按明确格式解释日期。把转换放在同一处，后续计算就不必反复判断字段类型。','<code>transformRow</code> receives one row and returns a new record. Both <code>Number("18")</code> and <code>+"18"</code> produce 18; the latter uses the unary plus operator. Both convert an empty string to zero, so first trim whitespace and handle a blank separately as <code>null</code>. <code>utcParse</code> parses the specified date format. Centralizing conversion gives later calculations consistent types.'),
    G('d3.csv 的行回调与 await','The d3.csv row callback and await',async function(){
      // transformRow 是上一段定义的函数，这里传函数本身。 ←→ Pass the transformRow function defined above, without invoking it.
      const url = new URL('../assets/data/original-students.csv', import.meta.url);
      const students = await d3.csv(url, transformRow);
      // await 得到解析后的记录数组，而不是 Promise。 ←→ await yields the parsed record array rather than the Promise.
      console.log(students.length);                    // 80
      console.log(typeof students[0].age);             // 'number'
      console.log(students[0].birthday instanceof Date); // true
    },'<code>d3.csv</code> 返回 Promise，可以用 <code>await</code> 或 <code>.then()</code> 取得结果。第二个参数是行转换函数，D3 会对解析出的每一行调用它，返回值进入最终数组。这里写 <code>transformRow</code>，不是 <code>transformRow()</code>；后者会立即调用函数。','<code>d3.csv</code> returns a Promise; use <code>await</code> or <code>.then()</code> to obtain its result. D3 calls the row function for each parsed record and collects the returned objects. Pass <code>transformRow</code>, not <code>transformRow()</code>, which would call it immediately.')
  ],
  '1.2':[
    G('用 SVG path 画金字塔的一层','Drawing one pyramid layer with SVG path',function(){
      const cx = 200;                       // 水平中心。 ←→ Horizontal center.
      const topW = 60, bottomW = 120;        // 上边宽度和下边宽度。 ←→ Top and bottom widths.
      const yTop = 20, yBottom = 100;
      // M 移到起点，L 连到下一点，Z 闭合路径。 ←→ M moves, L draws to the next point, Z closes.
      const path = `M ${cx-topW/2} ${yTop}
        L ${cx+topW/2} ${yTop}
        L ${cx+bottomW/2} ${yBottom}
        L ${cx-bottomW/2} ${yBottom} Z`;
      const layer = {name:'Data',color:'#2878ad'};
      const groups = svg.selectAll('g.layer').data([layer]).join('g').attr('class','layer');
      groups.append('path').attr('d', path).attr('fill',d=>d.color);
    },'<code>path</code> 的 <code>d</code> 属性保存路径指令。模板字符串中的 <code>${表达式}</code> 会先计算坐标，再拼成字符串。改变上下边宽度就可以得到不同梯形；把四层依次排列，就能组成 DIKW 金字塔。','The <code>d</code> attribute stores SVG path commands. Template expressions <code>${expression}</code> calculate coordinates within a string. Varying the widths creates trapezoids; arranging four layers forms the DIKW pyramid.'),
    G('绑定数据、事件与交互高亮','Binding data and highlighting on interaction',function(){
      // groups 是上一段包含 path 的图层选择集。 ←→ groups is the layer selection containing paths from above.
      groups.on('mouseenter', function(event, d) {
        // 普通函数中的 this 是正在处理事件的 g。 ←→ In this regular function, this is the g handling the event.
        d3.select(this).select('path').interrupt().transition().duration(150)
          .attr('fill', d3.color(d.color).brighter(0.5));
      });
      // 箭头函数可用 event.currentTarget 取得相同元素。 ←→ An arrow function can use event.currentTarget for the element.
      groups.on('click', (event, d) => {
        d3.select(event.currentTarget).classed('selected', true);
        console.log(d.name);
      });
    },'<code>.on(type, listener)</code> 把事件监听器绑定到选择集，回调参数依次是事件 <code>event</code> 和当前数据 <code>d</code>。使用 <code>this</code> 时写普通函数；使用箭头函数时可以写 <code>event.currentTarget</code>。<code>transition().duration(150)</code> 在 150 毫秒内插值颜色。','<code>.on(type, listener)</code> attaches a listener. Its arguments are <code>event</code> and the bound datum <code>d</code>. Use a regular function for D3’s <code>this</code>, or access <code>event.currentTarget</code> in an arrow function. The transition interpolates color over 150 milliseconds.')
  ],
  '1.3':[
    G('根据属性选择比例尺','Choosing a scale for an attribute',function(){
      // 连续数值：成绩 0~100 映射到像素 0~800。 ←→ Continuous scores from 0 to 100 map to pixels from 0 to 800.
      const x = d3.scaleLinear().domain([0, 100]).range([0, 800]);
      console.log(x(50)); // 400
      // 离散类别：每个班级分到一个带宽相同的区间。 ←→ Each class receives a band of equal width.
      const band = d3.scaleBand()
        .domain(['软件1班', '软件2班']).range([0, 800]).padding(0.1);
      console.log(band('软件1班'), band.bandwidth());
      // scalePoint 为离散类别分配位置，不分配矩形带宽。 ←→ scalePoint assigns category positions without band widths.
      const point = d3.scalePoint().domain(['低','中','高']).range([0, 800]);
    },'<code>domain</code> 是输入域，<code>range</code> 是输出域，比例尺本身是可以调用的函数。<code>x(50)</code> 得到对应像素；<code>band(category)</code> 得到柱子的起点，<code>bandwidth()</code> 得到柱宽。数据是连续数量还是离散类别，决定了这里应使用哪类比例尺。','<code>domain</code> is the input domain, <code>range</code> the output range, and a scale is callable. <code>x(50)</code> gives a pixel coordinate. <code>band(category)</code> gives a band’s start and <code>bandwidth()</code> its width. Choose the scale according to whether the field is continuous or discrete.'),
    G('顺序型、发散型和定性型颜色','Sequential, diverging and qualitative color',function(){
      // 有大小顺序：把人数范围先归一化，再调用 Viridis。 ←→ Ordered counts are normalized before calling Viridis.
      const sequential = d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);
      // 有基准值：三项 domain 分别是低端、中点、高端。 ←→ A three-value domain specifies low, midpoint and high.
      const diverging = d3.scaleDiverging(d3.interpolateRdBu).domain([-10, 0, 10]);
      // 无序类别：显式给出类别与颜色数组。 ←→ Unordered categories use an explicit domain and color array.
      const categorical = d3.scaleOrdinal()
        .domain(['A', 'B', 'C']).range(d3.schemeTableau10);
      console.log(sequential(50), diverging(0), categorical('B'));
    },'<code>interpolateViridis(t)</code> 接收 0 到 1 的参数；<code>scaleSequential</code> 负责把原始数值转为这个参数。<code>scaleDiverging</code> 还明确一个中点。<code>scaleOrdinal</code> 则按类别在颜色数组中查找，不计算类别之间的中间颜色。','<code>interpolateViridis(t)</code> takes a parameter from 0 to 1. <code>scaleSequential</code> maps raw values to that parameter. <code>scaleDiverging</code> also specifies a midpoint. <code>scaleOrdinal</code> assigns colors by category without interpolating between categories.')
  ],
  '1.4':[
    G('filter、map、reduce 的组合','Composing filter, map and reduce',function(){
      // filter 的回调返回布尔值，决定是否保留记录。 ←→ filter keeps records whose callback returns true.
      const group = students.filter(student => student.gender === '男');
      // map 返回与输入长度相同的新数组，这里只保留年龄。 ←→ map returns one result per item, here the age.
      const ages = group.map(student => student.age);
      // sum 是累加器；0 是初始值。 ←→ sum is the accumulator; zero is its initial value.
      const total = ages.reduce((sum, age) => sum + age, 0);
      const mean = ages.length ? total / ages.length : null;
      console.log({ages, total, mean});
    },'箭头函数 <code>student => student.age</code> 省略了 <code>return</code>；如果函数体写成花括号，就需要显式返回。<code>reduce</code> 每轮把上次结果作为下一轮的累加器，最终返回这里的数值总和。先保存筛选结果，也避免为求人数再次筛选。','The expression arrow <code>student => student.age</code> has an implicit return; a block body requires an explicit <code>return</code>. <code>reduce</code> passes each accumulated result into the next iteration and returns the numeric total here. Saving the filtered group avoids filtering again to obtain its length.'),
    G('cross：笛卡尔积','cross: Cartesian products',function(){
      const genders = ['男', '女'];
      const majors = ['软件工程', '数据科学'];
      // 每个性别与每个专业各组合一次，共 2×2 项。 ←→ Pair every gender with every major: 2×2 combinations.
      const pairs = d3.cross(genders, majors);
      // 最后的函数把每个组合转换为对象。 ←→ A final reducer converts each combination into an object.
      const rows = d3.cross(genders, majors, (gender, major) => ({gender, major}));
      console.log(pairs, rows);
    },'<code>cross</code> 的输入可以是多个可迭代对象，结果数量是各输入长度的乘积。最后一个参数可以是 reducer，它接收一次组合中的各项。<code>({gender, major})</code> 外面的圆括号让箭头函数返回对象字面量。','<code>cross</code> accepts multiple iterables and returns the product of their lengths in combinations. A final reducer receives the items in one combination. Parentheses in <code>({gender, major})</code> make the arrow function return an object literal.'),
    G('group 与 rollup','group and rollup',function(){
      // group 的每个值仍是完整记录数组。 ←→ Each group value remains an array of records.
      const byClass = d3.group(students, student => student.class);
      // rollup 先分组，再让 reducer 计算每组的值。 ←→ rollup groups first, then reduces each group.
      const countByClass = d3.rollup(students, group => group.length, student => student.class);
      // Map 的 get 按键读取，entries 提供键值对。 ←→ Map.get reads a key; entries supplies key-value pairs.
      console.log(byClass.get('软件工程1班'));
      for (const [className, count] of countByClass) console.log(className, count);
    },'<code>group</code> 与 <code>rollup</code> 都返回 Map 结构。区别在最内层：前者是记录数组，后者是 reducer 的返回值。<code>for...of</code> 遍历 Map 时，每一项是 <code>[key, value]</code>，可以直接解构。','Both functions return Map structures. Their innermost values differ: records for <code>group</code>, the reducer’s result for <code>rollup</code>. Iterating a Map with <code>for...of</code> yields <code>[key, value]</code> entries that can be destructured directly.')
  ],
  '1.5':[
    G('join 的三种回调','The three join callbacks',function(){
      const circles = svg.selectAll('circle')
        .data(currentData, d => d.id) // 用稳定编号匹配旧元素。 ←→ Match existing elements using stable IDs.
        .join(
          enter => enter.append('circle').attr('fill', '#e16a45'), // 创建。 ←→ Create.
          update => update.attr('fill', '#2878ad'),                // 复用。 ←→ Reuse.
          exit => exit.remove()                                  // 删除。 ←→ Remove.
        );
      // join 合并 enter 与 update，后面统一设置位置。 ←→ join merges enter and update for shared position updates.
      circles.attr('cx', (d, i) => 40 + i * 60).attr('cy', 80).attr('r', 20);
    },'<code>enter</code>、<code>update</code>、<code>exit</code> 参数都是对应状态的选择集。箭头函数返回创建或更新后的选择集，<code>join</code> 才能合并它们并继续链式调用。把公共的大小、位置放在 <code>join</code> 后面，可以同时设置新旧元素。','Each callback receives the selection for its state. Return the created or updated selection so <code>join</code> can merge it and support chaining. Shared attributes after <code>join</code> apply to both entered and updated elements.'),
    G('按索引与按 key 匹配','Index matching and key matching',function(){
      const oldData = [{id:'A'}, {id:'B'}, {id:'C'}];
      const newData = [{id:'B'}, {id:'C'}, {id:'D'}];
      const indexGroup=svg.append('g'), keyGroup=svg.append('g');
      indexGroup.selectAll('circle').data(oldData).join('circle');
      keyGroup.selectAll('circle').data(oldData,d=>d.id).join('circle');
      // 两个独立分组对照，避免一次连接影响另一次连接。 ←→ Separate groups keep the two matching comparisons independent.
      const byIndex = indexGroup.selectAll('circle').data(newData);
      // 指定 key：B、C 复用，D 进入，A 退出。 ←→ With IDs, B/C update, D enters and A exits.
      const byId = keyGroup.selectAll('circle').data(newData, d => d.id);
      console.log(byId.enter().size(), byId.size(), byId.exit().size());
    },'这两种写法是两种匹配方式，演示中可以分别选择。<code>d => d.id</code> 会对已有元素和新数据求 key，按相同 key 匹配。key 应稳定且能区分记录。重排只改变顺序时，按 key 可以继续使用原来的 DOM 节点。','These are alternative matching rules, selectable in the demonstration. <code>d => d.id</code> supplies keys for old elements and new data, matching equal keys. Keys should be stable and distinguish records. Reordering by key retains each record’s DOM node.'),
    G('select 与 selectAll','select and selectAll',function(){
      // select 取第一个匹配项，常用于容器、标题和单个提示框。 ←→ select finds the first match, often a container or title.
      const title = d3.select('#title').text('人数');
      // selectAll 可以得到空选择集；数据连接负责补齐元素。 ←→ selectAll may be empty; the join creates needed elements.
      const bars = d3.select('#chart').selectAll('rect.bar')
        .data([3, 5, 8]).join('rect').attr('class', 'bar');
      // 回调的 d 是当前数据，i 是当前组中的索引。 ←→ d is the datum and i the index within the group.
      bars.attr('x', (d, i) => i * 40).attr('width', 30).attr('height', d => d * 10);
    },'<code>selectAll</code> 找到的是元素，不会自动创建它们。即使开始没有任何 <code>rect.bar</code>，<code>data(...).join("rect")</code> 也可以创建所需矩形。传给 <code>attr</code> 的函数由 D3 逐元素调用，而固定值会应用到整个选择集。','<code>selectAll</code> finds elements but does not create them. An initially empty selection can create rectangles through <code>data(...).join("rect")</code>. D3 evaluates function-valued attributes per element, while constant values apply to the whole selection.')
  ],
  '2.1':[
    G('流程节点、箭头与选中状态','Pipeline nodes, arrows and selection',function(){
      // defs 中的 marker 是可复用的箭头定义。 ←→ A marker in defs defines a reusable arrowhead.
      svg.append('defs').append('marker').attr('id', 'pipeline-arrow')
        .attr('viewBox', '0 -5 10 10').attr('refX', 8)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#8298aa');
      // url(#id) 引用当前 SVG 中的定义。 ←→ url(#id) references the SVG definition.
      svg.append('line').attr('x1', 40).attr('x2', 160).attr('y1', 60).attr('y2', 60)
        .attr('stroke', '#8298aa').attr('marker-end', 'url(#pipeline-arrow)');
      const nodes = svg.selectAll('g.node').data(stages, d => d.id).join('g').attr('class', 'node');
      nodes.on('click', (event, picked) => {
        // picked 是点击项；d 是当前正在设置样式的项。 ←→ picked is clicked; d is the node whose class is being set.
        nodes.classed('selected', d => d.id === picked.id);
      });
    },'<code>append</code> 返回新元素的选择集，因此可以继续设置属性或添加子元素。<code>marker-end</code> 引用箭头，<code>orient="auto"</code> 让它跟随线段方向。<code>classed("selected", predicate)</code> 对每个节点求布尔值，一次更新全部选中状态。','<code>append</code> returns the new selection for further attributes and children. <code>marker-end</code> references the arrowhead and <code>orient="auto"</code> follows the line direction. <code>classed("selected", predicate)</code> evaluates a boolean for each node to update selection state.')
  ],
  '2.2':[
    G('双层 rollup 与 Map 遍历','Nested rollup and Map iteration',function(){
      const nested = d3.rollup(
        students,
        group => group.length,  // reducer 收到最内层的记录数组。 ←→ The reducer receives an innermost record array.
        d => d.major,           // 第一个 key：专业。 ←→ First key: major.
        d => d.class            // 第二个 key：班级。 ←→ Second key: class.
      );
      // 外层值是 Map，内层值才是人数。 ←→ Outer values are Maps; inner values are counts.
      for (const [major, classes] of nested) {
        for (const [className, count] of classes) console.log(major, className, count);
      }
    },'<code>rollup</code> 的分组键是可变数量的参数。传两个键就产生两层 Map，读取时也要对应两层。reducer 决定叶子值的类型；把 <code>group.length</code> 换成 <code>d3.mean(...)</code>，叶子就从人数变成均值。','Grouping keys are rest parameters. Two keys produce two Map levels, which require two levels of access. The reducer determines the leaf type; replacing the count with <code>d3.mean(...)</code> yields group means.'),
    G('从班级名称提取专业','Extracting a major from a class name',function(){
      const className = '软件工程12班';
      // ^ 和 $ 限定完整字符串；两组括号分别捕获专业和班号。 ←→ ^/$ anchor the string; groups capture major and class number.
      const match = className.match(/^(.+?)(\d+班)$/);
      const major = match ? match[1] : className;
      // match[0] 是完整匹配，match[1] 与 match[2] 是捕获组。 ←→ match[0] is the full match; [1]/[2] are capture groups.
      console.log(major, match?.[2]); // 软件工程, 12班
      // 派生字段可以直接放在 CSV 的行回调中。 ←→ A derived field can be added in the CSV row callback.
    },'<code>.+?</code> 从较短的匹配开始尝试，<code>\\d+</code> 匹配一个或多个数字。整个表达式要求结尾是“数字 + 班”，所以多位班号可以一起捕获。<code>match</code> 未匹配时为 null，三元表达式提供回退值；<code>?.</code> 在 null 时停止属性读取。','<code>.+?</code> starts with a shorter match and <code>\\d+</code> matches one or more digits. The ending requires digits followed by 班, keeping a multi-digit class number together. A failed match is null; the conditional provides a fallback and optional chaining stops access on null.')
  ],
  '2.3':[
    G('hierarchy → tree → links / nodes','hierarchy → tree → links / nodes',function(){
      // hierarchy 建关系；此时还没有布局坐标。 ←→ hierarchy builds relationships, not layout coordinates.
      const root = d3.hierarchy(rootData);
      const layout = d3.tree().size([360, 720]);
      layout(root); // 执行布局，为每个节点写入 x、y。 ←→ Run the layout to assign x and y.
      const g = svg.append('g').attr('transform', 'translate(40,20)');
      g.selectAll('path.link').data(root.links()).join('path').attr('class', 'link')
        .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x))
        .attr('fill', 'none').attr('stroke','#9bb1bd');
      const nodes = g.selectAll('g.node').data(root.descendants()).join('g').attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);
      nodes.append('circle').attr('r', 5);
      nodes.append('text').attr('x', d => d.children ? -8 : 8)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name); // 原始字段保存在 node.data。 ←→ Original fields live in node.data.
    },'<code>root.descendants()</code> 返回节点数组，<code>root.links()</code> 返回 source/target 连线数组。tree 的 y 表示深度方向，x 表示同层展开方向；横向树把 y 用作屏幕横坐标。节点的 <code>transform</code> 与连线访问器必须采用相同坐标交换。','<code>root.descendants()</code> returns nodes; <code>root.links()</code> returns source/target links. Tree y is depth and x spreads nodes across a level. A horizontal tree uses y horizontally. Node transforms and link accessors must use the same swap.'),
    G('size 与 separation','size and separation',function(){
      const layout = d3.tree().size([360, 720])
        // a、b 是需要分开的节点，不是父子参数。 ←→ a/b are nodes to separate, not a parent-child parameter pair.
        .separation((a, b) => a.parent === b.parent ? 1 : 2);
      layout(root);
      // 固定节点间距时，可改用 nodeSize。 ←→ Use nodeSize when fixed node spacing is desired.
      const fixed = d3.tree().nodeSize([24, 160]);
    },'<code>size([360,720])</code> 指定整个布局的坐标范围；<code>separation</code> 控制同层节点之间的相对间隔。1 与 2 表示兄弟与非兄弟的相对分离程度，不是像素。<code>nodeSize</code> 则按固定间距安排坐标，与整体 size 是两种布局设置。','<code>size</code> sets the overall coordinate extent. <code>separation</code> controls relative spacing between nodes on a level; 1 and 2 are relative weights, not pixels. <code>nodeSize</code> instead uses fixed coordinate spacing.')
  ],
  '2.4':[
    G('展开按钮、选中与事件传播','Expansion, selection and event propagation',function(){
      const item = d3.select('li');
      const toggle = item.select('button.toggle');
      toggle.on('click.toggle', function(event) {
        event.stopPropagation(); // 不再触发外层 li 的点击监听器。 ←→ Stop the event before it reaches the ancestor li listener.
        const open = this.getAttribute('aria-expanded') !== 'true';
        this.setAttribute('aria-expanded', String(open));
        item.classed('expanded', open);
      });
      // .select 是事件命名空间，便于单独替换或移除监听器。 ←→ .select is a namespace for replacing/removing this listener.
      item.on('click.select', () => item.classed('selected', true));
    },'<code>click.toggle</code> 与 <code>click.select</code> 都监听 click，点号后的名字是 D3 的命名空间。点击按钮会先触发按钮监听器，再沿父元素冒泡；<code>stopPropagation</code> 阻断这次传播。它不等同于阻止默认动作的 <code>preventDefault</code>。','Both names listen for click; the suffix is a D3 event namespace. A button click runs its listener and then bubbles to ancestors. <code>stopPropagation</code> stops that propagation; <code>preventDefault</code> instead prevents a default browser action.'),
    G('递归生成嵌套列表','Recursively building nested lists',function(){
      function buildList(parent, nodes) {
        const items = parent.selectAll('li').data(nodes, d => d.id).join('li');
        items.each(function(d) {
          const item = d3.select(this); // 原生 DOM 转回 D3 选择集。 ←→ Wrap this DOM node as a D3 selection.
          item.selectAll('span.label').data([d]).join('span').attr('class', 'label').text(d => d.name);
          const children = d.children ?? [];
          const nested = item.selectAll('ul').data(children.length ? [children] : []).join('ul');
          if (children.length) buildList(nested, children); // 子层重复同样步骤。 ←→ Repeat for the child level.
        });
      }
      buildList(d3.select('#tree'), [rootData]);
    },'<code>each</code> 对每个选中元素执行一次函数，适合在每个节点内部继续构造子树。<code>[children]</code> 把整个子数组绑定给一个 ul，再在 ul 内把数组逐项绑定为 li。递归在没有 children 时结束。','<code>each</code> runs a function for every selected element, allowing a subtree to be built inside each node. <code>[children]</code> binds the entire child array to one ul, whose items are then bound to li elements. Recursion stops at leaves.'),
    G('transition 与 duration','transition and duration',function(){
      const nodes = svg.selectAll('circle.node');
      // 普通 attr 立即设置；transition 后的 attr 在一段时间内变化。 ←→ Ordinary attr sets immediately; attr after transition interpolates.
      nodes.interrupt().transition().duration(500)
        .attr('cx', d => d.x).attr('cy', d => d.y).attr('opacity', 1);
      // 淡入：先给起始值，再定义终值。 ←→ Fade in by setting a start value followed by a target value.
      svg.append('circle').attr('r', 8).attr('opacity', 0)
        .transition().duration(500).attr('opacity', 1);
    },'<code>duration</code> 的单位是毫秒。过渡从元素当前属性插值到新属性；先设置 opacity 为 0，再过渡到 1，得到淡入。快速重复操作时，<code>interrupt</code> 可以停止旧过渡，随后从当前显示状态开始新的过渡。','Duration is in milliseconds. A transition interpolates from current attributes to targets. Opacity zero followed by a target of one creates a fade. On rapid actions, <code>interrupt</code> stops the old transition before a new one starts from the current displayed state.'),
    G('用父容器做事件委托','Delegating an event to the container',function(){
      d3.select('#tree').on('click', function(event) {
        const label = event.target.closest('.label'); // 从实际点击处向上找。 ←→ Search upward from the clicked element.
        if (!label || !this.contains(label)) return;
        const item = label.closest('li');
        const datum = d3.select(item).datum();        // 读取 li 绑定的数据。 ←→ Read the datum bound to this li.
        d3.select(this).selectAll('li').classed('selected', function() {
          return this === item;
        });
        console.log(datum);
      });
    },'监听器只放在容器上，新增子项也能利用事件冒泡触发它。<code>target</code> 指最初点击的元素，普通函数的 <code>this</code> 指绑定监听器的容器；两者可能不同。<code>datum()</code> 不传参数时读取当前元素的数据。','A single container listener also receives bubbled clicks from newly added items. <code>target</code> is the original clicked element; <code>this</code> in the regular listener is the container. Calling <code>datum()</code> with no argument reads the element’s bound data.')
  ],
  '3.1':[
    G('RGB 转 HSL','Converting RGB to HSL',function(){
      function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255; // RGB 归一化到 0~1。 ←→ Normalize RGB to 0–1.
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        const delta = max-min, l = (max+min)/2;
        if (delta === 0) return [0,0,l]; // 灰色没有色相差和饱和度。 ←→ Gray has zero chroma and saturation.
        const s = delta/(1-Math.abs(2*l-1));
        let h = max === r ? ((g-b)/delta)%6 : max === g ? (b-r)/delta+2 : (r-g)/delta+4;
        h = (h*60+360)%360; // 六个色相区段换成角度。 ←→ Convert the six hue sectors to degrees.
        return [h,s,l];
      }
      console.log(rgbToHsl(100,50,200));
    },'RGB 先除以 255。最大与最小通道的差得到 delta；亮度取两者均值。最大通道决定色相所在区段，再换算为度。这里返回的 H 使用度，S、L 使用 0 到 1，可以直接传给 <code>d3.hsl</code>。','Normalize RGB by 255. The channel range gives delta and their midpoint gives lightness. The largest channel selects a hue sector, converted to degrees. The result uses degrees for H and 0–1 for S/L, matching <code>d3.hsl</code>.'),
    G('矩阵怎样改变 RGB','Applying a matrix to RGB',function(){
      const matrix = [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]];
      const rgb = [100,50,200];
      // 每一行与 RGB 做点积，得到一个新的输出通道。 ←→ Each matrix row forms a dot product with RGB.
      const transformed = matrix.map(row =>
        row.reduce((sum, coefficient, i) => sum+coefficient*rgb[i], 0)
      );
      // 格式化前，把通道约束到 0~255。 ←→ Constrain channel values to 0–255 before formatting.
      const result = transformed.map(v => Math.round(Math.max(0,Math.min(255,v))));
      console.log(result);
    },'<code>matrix.map</code> 为三个输出通道分别计算；内部的 <code>reduce</code> 累加三个乘积。<code>coefficient</code> 是权重，<code>i</code> 让权重和对应输入通道相乘。原课程用这种矩阵演示色觉条件下的颜色变换。','The outer <code>map</code> calculates each output channel. The inner <code>reduce</code> adds three weighted products; index <code>i</code> pairs each coefficient with the corresponding channel. The original example uses a matrix to illustrate color transformations for color-vision conditions.'),
    G('D3 的颜色对象与转换','D3 color objects and conversion',function(){
      const color = d3.color('rgb(100,50,200)'); // 解析 CSS 颜色。 ←→ Parse a CSS color.
      const rgb = color.rgb();
      const hsl = d3.hsl(color);               // 构造目标空间对象。 ←→ Construct an object in the target space.
      const lab = d3.lab(color);
      const hcl = d3.hcl(color);
      console.log(rgb.r, hsl.h, lab.l, hcl.c);
      console.log(hsl.formatHex());            // 输出 CSS 十六进制。 ←→ Format as CSS hexadecimal.
    },'D3 用构造函数 <code>d3.hsl(color)</code>、<code>d3.lab(color)</code> 和 <code>d3.hcl(color)</code> 转换颜色空间；<code>color.rgb()</code> 转换为 RGB。读取对象字段得到数值，调用格式化方法得到可用于 fill 的字符串。','Use constructors <code>d3.hsl(color)</code>, <code>d3.lab(color)</code> and <code>d3.hcl(color)</code> to convert spaces, and <code>color.rgb()</code> for RGB. Read fields for numeric components; format the object to obtain a CSS string for fill.')
  ],
  '3.2':[
    G('三种颜色比例尺','Three color scales',function(){
      // 顺序型：低值到高值。 ←→ Sequential: low to high.
      const sequential = d3.scaleSequential(d3.interpolateViridis).domain([0,100]);
      // 发散型：低端、中点、高端共三个位置。 ←→ Diverging: low, midpoint and high.
      const diverging = d3.scaleDiverging(d3.interpolateRdBu).domain([-20,0,20]);
      // 定性型：类别到颜色数组的一一对应。 ←→ Qualitative: categories assigned to a color array.
      const qualitative = d3.scaleOrdinal(['A','B','C'], d3.schemeTableau10);
      console.log(sequential(50), diverging(0), qualitative('A'));
      console.log(d3.interpolateRdBu(0), d3.interpolateRdBu(1)); // 检查两端方向。 ←→ Inspect the endpoint direction.
    },'插值器接收归一化参数，比例尺把数据域映射为该参数。发散型的三项 domain 显式设置基准。<code>interpolateRdBu</code> 从红到蓝；如果图例方向需要相反，可以反转 domain，或使用 <code>t => d3.interpolateRdBu(1-t)</code>。','An interpolator takes a normalized parameter; a scale maps the data domain to it. A diverging domain explicitly sets the reference. <code>interpolateRdBu</code> runs from red to blue; reverse the domain or evaluate at <code>1-t</code> to reverse the direction.'),
    G('把选择依据写成条件','Encoding the selection rule',function(){
      function pickColormap({isOrdered, hasMeaningfulMidpoint}) {
        // 先判断是否围绕一个明确基准比较。 ←→ First check for comparison around a meaningful reference.
        if (hasMeaningfulMidpoint) return 'diverging';
        if (isOrdered) return 'sequential';
        return 'categorical';
      }
      console.log(pickColormap({isOrdered:true,hasMeaningfulMidpoint:false}));
    },'函数参数使用对象解构，两个布尔字段描述数据含义。if 的顺序决定判断优先级：有中点时返回发散型，其次检查顺序，最后返回定性型。这个判断依据来自任务和字段语义，不是仅凭数值能否转成 Number。','The parameter destructures two booleans describing the variable. The first matching condition returns: midpoint, then order, then categories. These properties come from the task and field semantics, rather than whether values can be stored as numbers.')
  ],
  '3.3':[
    G('Lab 对象与色域判断','Lab objects and gamut checks',function(){
      const color = d3.lab(50,30,-20); // 参数顺序是 L*、a*、b*。 ←→ Arguments are L*, a* and b*.
      const rgb = color.rgb();       // 保留转换后的原始通道数值。 ←→ Preserve the converted channel values.
      console.log(rgb.r,rgb.g,rgb.b);
      console.log(rgb.displayable()); // 在 CSS 格式化前检查。 ←→ Check before CSS formatting.
      console.log(rgb.formatHex());
      const reverse = d3.lab('#ff0080'); // 直接从 CSS 颜色创建 Lab。 ←→ Construct Lab directly from a CSS color.
      console.log(reverse.l,reverse.a,reverse.b);
    },'<code>rgb()</code> 返回颜色对象，通道可能超出显示范围；<code>formatHex()</code> 输出字符串时会裁剪通道。因此先调用 <code>displayable()</code>，再格式化，可以区分原始颜色与最终显示颜色。<code>d3.lab(css)</code> 是从已有颜色转换到 Lab 的写法。','<code>rgb()</code> returns an object whose channels may be outside display bounds. Hex formatting clips channels, so check <code>displayable()</code> first. <code>d3.lab(css)</code> converts an existing CSS color into Lab.'),
    G('RGB 与 Lab 插值','RGB and Lab interpolation',function(){
      const inLab = d3.interpolateLab('#000000','#ffffff');
      const inRgb = d3.interpolateRgb('#000000','#ffffff');
      // 相同 t，分别在两种空间计算中间颜色。 ←→ Evaluate the same t in two interpolation spaces.
      const samples = d3.range(5).map(i => {
        const t = i/4;
        return {t,lab:inLab(t),rgb:inRgb(t)};
      });
      console.table(samples);
    },'<code>interpolateLab(a,b)</code> 返回一个函数，不会立即返回整条色带。调用这个函数并传入 t，才得到该位置的 CSS 颜色。<code>d3.range(5)</code> 生成 0、1、2、3、4，再除以 4，包含两个端点。','<code>interpolateLab(a,b)</code> returns a function, not a complete palette. Call it with t to obtain a CSS color. Dividing the indices from <code>d3.range(5)</code> by four gives five samples including both endpoints.')
  ],
  '3.4':[
    G('五种规则的色相与明度','Hue and lightness for five harmonies',function(){
      const wrap = h => (h%360+360)%360; // 同时处理负角度与超过一圈的角度。 ←→ Handle negative angles and values beyond one turn.
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
    },'对象保存每种规则的偏移数组，<code>offsets[rule]</code> 按名称取出它。JavaScript 的 <code>%</code> 是余数运算，所以两次取余可把负角度也归入 0 到 360。单色规则不能只重复同一个色相、饱和度和亮度，因此这里单独改变亮度。','The object stores hue offsets per rule. <code>offsets[rule]</code> selects an array by name. JavaScript’s remainder can be negative; wrapping twice handles negative hue offsets. A monochromatic palette varies lightness to avoid producing identical colors.')
  ],
  '3.5':[
    G('颜色数组与连续插值器','Color arrays and continuous interpolators',function(){
      const palettes = {
        okabeIto:['#000000','#E69F00','#56B4E9','#009E73','#F0E442','#0072B2','#D55E00','#CC79A7'],
        tolBright:['#4477AA','#EE6677','#228833','#CCBB44','#66CCEE','#AA3377','#BBBBBB'],
        tableau:d3.schemeTableau10
      };
      // 定性色板直接传给 range。 ←→ Pass a qualitative array to range.
      const color = d3.scaleOrdinal().domain(['A','B','C']).range(palettes.okabeIto);
      // 连续插值器按 t 取样，也可以生成离散颜色数组。 ←→ Sample a continuous interpolator to produce an array.
      const sequential = d3.quantize(d3.interpolateViridis,7);
      console.log(color('B'),sequential);
    },'<code>scheme...</code> 通常是数组，<code>interpolate...</code> 是函数。<code>range</code> 接收数组；<code>scaleSequential</code> 接收插值器。<code>quantize(interpolator,n)</code> 在 0 到 1 之间取 n 个样本，方便生成图例或离散色块。','<code>scheme...</code> values are generally arrays, while <code>interpolate...</code> values are functions. <code>range</code> takes an array; <code>scaleSequential</code> takes an interpolator. <code>quantize(interpolator,n)</code> samples n positions from 0 to 1 for swatches or legends.')
  ],
  '3.6':[
    G('固定数据，切换颜色映射','Fixing the data while switching colors',function(){
      const values = [12,35,60,85];
      const maps = {viridis:d3.interpolateViridis,rainbow:d3.interpolateRainbow};
      function draw(name) {
        const color = d3.scaleSequential(maps[name]).domain([0,100]);
        svg.selectAll('rect').data(values).join('rect')
          .attr('x',(d,i)=>i*60).attr('y',20).attr('width',50).attr('height',80)
          .attr('fill',color); // 只有 fill 使用可切换的比例尺。 ←→ Only fill uses the changing scale.
      }
      draw('viridis');
      d3.select('#palette-choice').on('change', event => draw(event.currentTarget.value));
    },'把不变的数据和几何位置留在同一处，每次切换只选择新的颜色函数。<code>attr("fill", color)</code> 会为每条数据调用 <code>color(d)</code>。事件回调中从 <code>currentTarget.value</code> 读取 select 的当前选项，再重新绘制。','Keep data and geometry fixed, selecting only a new color function. Function-valued <code>fill</code> calls <code>color(d)</code> per datum. Read the select value through <code>currentTarget.value</code> and redraw when it changes.')
  ],
  '3.7':[
    G('七色生成规则','A seven-color recipe',function(){
      const wrap = h => (h%360+360)%360;
      const clamp = value => Math.max(0,Math.min(1,value));
      function genPalette(H,S,L) {
        const color = (h,s,l) => d3.hsl(wrap(h),clamp(s),clamp(l)).formatHex();
        return [
          color(H-30,S*0.6,L*1.1), // 左侧类比，低饱和。 ←→ Muted left analogous.
          color(H-30,S,L), color(H,S,L), color(H+30,S,L),
          color(H+30,S*0.6,L*1.1), // 右侧类比，低饱和。 ←→ Muted right analogous.
          color(H+180,S*0.8,L*0.95), // 互补色。 ←→ Complement.
          color(H,S*0.2,L*1.4)      // 浅色。 ←→ Light tint.
        ];
      }
      console.log(genPalette(210,0.6,0.55));
    },'内部的 <code>color</code> 函数复用色相循环、范围处理和格式化步骤。每一项保留主色 H、S、L 的关系，只改变相应偏移或倍数。返回值是颜色数组，可以交给 <code>scaleOrdinal().range(...)</code>，也可以直接生成色块。','The inner <code>color</code> function reuses wrapping, bounds handling and formatting. Each entry derives from the base H/S/L through offsets or factors. The returned array can feed an ordinal range or swatch display.')
  ],
  '3.8':[
    G('用形状和文字补充颜色','Adding shape and text to color',function(){
      const categories = ['A','B','C'];
      const color = d3.scaleOrdinal(categories,d3.schemeTableau10);
      const shape = d3.scaleOrdinal(categories,[d3.symbolCircle,d3.symbolSquare,d3.symbolTriangle]);
      const symbol = d3.symbol().size(100); // size 是面积，不是半径。 ←→ size is area, not radius.
      const nodes = svg.selectAll('g.point').data(data).join('g').attr('class','point')
        .attr('transform',d=>`translate(${x(d.x)},${y(d.y)})`);
      nodes.selectAll('path').data(d=>[d]).join('path')
        .attr('d',d=>symbol.type(shape(d.category))()).attr('fill',d=>color(d.category));
      nodes.selectAll('text').data(d=>[d]).join('text').attr('x',10).text(d=>d.category);
    },'<code>d3.symbol()</code> 是路径生成器。<code>type(...)</code> 设置形状，再加一对 <code>()</code> 才生成 SVG path 字符串。父组绑定一条记录，子选择集通过 <code>d => [d]</code> 继承该记录；文字、形状和颜色共同标识类别。','<code>d3.symbol()</code> is a path generator. Set its type and then invoke it with <code>()</code> to obtain SVG path data. Each parent group has one record; <code>d => [d]</code> binds that record to each child mark. Text, shape and color identify the category together.')
  ],
  '4.1':[
    G('读入宽表与自动转换','Loading a wide table with automatic conversion',function(){
      // autoType 是行转换函数，按单元格内容推断常见类型。 ←→ autoType converts each row using common value types.
      const rows = [
        {state:'A',murder:'12',robbery:'30'},
        {state:'B',murder:'8',robbery:'25'}
      ].map(row => d3.autoType({...row})); // 复制后转换，保留原始对象。 ←→ Copy before conversion to retain the originals.
      console.log(typeof rows[0].murder); // 'number'
      // 在 CSV 中相同写法是：await d3.csv(url, d3.autoType)。 ←→ For CSV, use await d3.csv(url, d3.autoType).
    },'<code>autoType</code> 接收行对象并转换它的值。<code>{...row}</code> 用展开语法复制一层对象，再交给转换函数。实际 CSV 加载时可以直接把 <code>d3.autoType</code> 作为行回调；若编号含前导零等格式含义，可以自行编写行回调保留该字段。','<code>autoType</code> converts values on the row object. <code>{...row}</code> makes a shallow copy before conversion. Pass <code>d3.autoType</code> directly as a CSV row callback, or use a custom callback for fields such as IDs with meaningful leading zeros.'),
    G('flatMap：宽表转长表','flatMap: wide to long',function(){
      const wide = [{state:'A',murder:12,robbery:30},{state:'B',murder:8,robbery:25}];
      const metrics = ['murder','robbery'];
      // 外层遍历实体，内层遍历字段，flatMap 展开内层数组。 ←→ Iterate entities, then fields, and flatten the resulting arrays.
      const long = wide.flatMap(row => metrics.map(metric => ({
        state:row.state,
        metric,
        value:row[metric] // 方括号按变量中的字段名读取值。 ←→ Brackets read the field named by the variable.
      })));
      console.log(long.length); // 2×2 = 4
      const groups = d3.group(long,d=>d.metric);
    },'<code>row.metric</code> 会读取名叫 metric 的字段，<code>row[metric]</code> 才会使用变量里的字段名。内层 map 为一个州生成多条指标记录，外层 flatMap 把它们合成一个数组。实体名和指标名一起标识单元格。','<code>row.metric</code> accesses a literal field named metric, whereas <code>row[metric]</code> uses the variable’s value as the field name. The inner map creates measure records; flatMap combines them. Entity and measure jointly identify each cell.')
  ],
  '4.2':[
    G('比例尺、边距与坐标轴','Scales, margins and axes',function(){
      const margin = {left:50,top:20,right:20,bottom:30};
      const innerW = 600-margin.left-margin.right;
      const innerH = 300-margin.top-margin.bottom;
      const x = d3.scaleLinear().domain([0,100]).range([0,innerW]);
      const y = d3.scaleLinear().domain([0,100]).range([innerH,0]);
      // 整组平移一次，组内使用绘图区域坐标。 ←→ Translate the group once, then use plot-local coordinates.
      const plot = svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
      plot.selectAll('circle').data(points).join('circle')
        .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',4);
      plot.append('g').attr('transform',`translate(0,${innerH})`).call(d3.axisBottom(x));
    },'比例尺输出绘图区域内的坐标，父组的 <code>translate</code> 负责边距。SVG 的 y 向下增加，因此 y 的 range 从 innerH 到 0。<code>call(axis)</code> 把选择集传给坐标轴生成器，生成器在这个 g 中添加刻度与文字。','Scales produce plot-local coordinates, while the parent translation adds margins. SVG y increases downward, so the y range runs from innerH to zero. <code>call(axis)</code> passes the selection to the axis generator, which creates ticks and labels inside the group.'),
    G('线性与对数的距离','Linear and logarithmic distances',function(){
      const linear = d3.scaleLinear().domain([1,1000]).range([0,500]);
      const log = d3.scaleLog().domain([1,1000]).range([0,500]);
      const values = [1,10,100,1000];
      console.table(values.map(value=>({value,linear:linear(value),log:log(value)})));
      // invert 做反向映射，常用于读取鼠标位置对应的数值。 ←→ invert maps pixels back to values, useful for pointer interaction.
      console.log(log.invert(250));
    },'线性尺度把相同差值画成相同距离；对数尺度把相同比值画成相同距离。这里相邻值都是前者的十倍，因此在 log 下等距。对数域需要同号且避开 0。<code>invert</code> 则把像素坐标转回数据值。','Linear scales map equal differences to equal distances; log scales map equal ratios to equal distances. Successive tenfold values are therefore evenly spaced on log. A log domain uses one sign and excludes zero. <code>invert</code> maps pixels back to data values.')
  ],
  '4.3':[
    G('line、datum 与 curve','line, datum and curve',function(){
      const line = d3.line()
        .x(d=>x(d.x)).y(d=>y(d.y)) // 访问器逐项取得像素坐标。 ←→ Accessors produce pixel coordinates per sample.
        .curve(d3.curveCatmullRom.alpha(0.5));
      // 一个 path 接收整个点数组，所以使用 datum。 ←→ One path receives the complete point array through datum.
      svg.append('path').datum(points)
        .attr('d',line).attr('fill','none').attr('stroke','#2878ad');
      // 同一组采样逐项绑定到圆，所以使用 data。 ←→ Bind individual samples to circles with data.
      svg.selectAll('circle').data(points).join('circle')
        .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',4);
    },'<code>datum(points)</code> 把数组整体绑定到一个元素；<code>data(points)</code> 把数组项逐个匹配到元素。<code>attr("d", line)</code> 调用 line 生成路径字符串。更换 curve 保留采样点和比例尺，只改变连接规则。','<code>datum(points)</code> binds the whole array to one element; <code>data(points)</code> matches items to elements. A function-valued d calls the line generator. Switching curve retains the samples and scales while changing the connection rule.'),
    G('最小二乘直线','A least-squares line',function(){
      const meanX = d3.mean(points,d=>d.x), meanY = d3.mean(points,d=>d.y);
      const denominator = d3.sum(points,d=>(d.x-meanX)**2);
      if (!denominator) return; // 所有 x 相同时，不能求 y=ax+b 的唯一斜率。 ←→ Equal x values do not determine a unique slope.
      const a = d3.sum(points,d=>(d.x-meanX)*(d.y-meanY))/denominator;
      const b = meanY-a*meanX;
      const fitted = d3.extent(points,d=>d.x).map(x=>({x,y:a*x+b}));
      svg.append('path').datum(fitted)
        .attr('d',d3.line().x(d=>x(d.x)).y(d=>y(d.y)))
        .attr('fill','none').attr('stroke','#e16a45');
    },'直线模型是 <code>y = ax + b</code>。这里用中心化后的 x、y 计算斜率 a，再计算截距 b。<code>extent</code> 给出 x 的两端，算出两端的预测值即可画直线。与切换 curve 相比，这一步实际计算了模型参数。','The model is <code>y = ax + b</code>. Centered x/y values determine slope a and intercept b. Evaluate the model at the two x endpoints to draw the fitted line. Unlike choosing a curve, this calculates model parameters.')
  ],
  '4.4':[
    G('用像素范围改变倾角','Changing slope with pixel ranges',function(){
      const values = [2,4,3,6,8,7];
      const height = 180;
      const x = d3.scaleLinear().domain([0,values.length-1]).range([0,500]);
      const y = d3.scaleLinear().domain([0,10]).range([height,0]);
      const line = d3.line().x((d,i)=>x(i)).y(d=>y(d));
      // 保留数据和 domain，只改变纵向像素范围。 ←→ Keep data/domain fixed and change the vertical pixel range.
      y.range([height/2,0]);
      svg.append('path').datum(values).attr('d',line).attr('fill','none').attr('stroke','#2878ad');
    },'比例尺是函数对象，<code>y.range(...)</code> 会更新它的映射。line 的访问器在运行时调用 y，因此会使用新范围。同一段 Δy 被映射为更少的像素时，线条看起来更平缓。','A scale is a callable object; <code>y.range(...)</code> updates its mapping. The line accessor calls the scale when generating the path, using the new range. Fewer pixels for the same Δy make the segment look flatter.'),
    G('角度到屏幕坐标','Angle to screen coordinates',function(){
      function lineAtAngle(degrees,length=240) {
        const radians = degrees*Math.PI/180; // 三角函数使用弧度。 ←→ Trigonometric functions use radians.
        const origin = {x:60,y:260};
        return {
          x1:origin.x,y1:origin.y,
          x2:origin.x+length*Math.cos(radians),
          y2:origin.y-length*Math.sin(radians) // 向上需要减小 SVG y。 ←→ Subtract to move upward in SVG.
        };
      }
      console.log(lineAtAngle(45));
    },'角度先乘 π/180 转为弧度。cos 给出水平分量，sin 给出竖直分量。数学坐标通常向上为正，SVG 则向下为正，因此这里使用负号。返回的四个值可以分别设置到 line 的 x1、y1、x2、y2。','Convert degrees to radians with π/180. Cosine supplies the horizontal component and sine the vertical component. SVG y points downward, so subtract the sine term for an upward line. The four returned fields map to the line’s endpoint attributes.')
  ],
  '4.5':[
    G('四个角的位编码与边插值','Corner bits and edge interpolation',function(){
      // 本页顺序：左上、右上、右下、左下，对应位 1、2、4、8。 ←→ Order: TL, TR, BR, BL with bits 1, 2, 4, 8.
      const values = [8,2,7,1], threshold = 5;
      const code = values.reduce((bits,value,i)=>bits | ((value>=threshold ? 1 : 0)<<i),0);
      console.log(code); // 5，即二进制 0101。 ←→ 5, binary 0101.
      function crossing(v0,v1,t) {
        return (t-v0)/(v1-v0); // 在确实跨越阈值的边上调用。 ←→ Evaluate on an edge that crosses the threshold.
      }
      const fraction = crossing(values[0],values[1],threshold);
      console.log(fraction); // 左上到右上的相对位置。 ←→ Relative position from TL to TR.
    },'<code>&lt;&lt; i</code> 把 1 移到第 i 位，<code>|</code> 把各位合并为 0 到 15 的编号。编号依赖角点顺序，查表时必须使用同一约定。插值比例为 0 表示端点 v₀，为 1 表示端点 v₁；0.5 位于边的中间。','<code>&lt;&lt; i</code> moves one bit to position i; <code>|</code> combines the bits into a case from 0 to 15. Corner order must agree with the lookup table. An interpolation fraction of zero is at v₀, one at v₁ and one half at the edge midpoint.'),
    G('d3.contours：从网格到多边形','d3.contours: grids to polygons',function(){
      const columns=12, rows=12;
      // values[y*columns+x]：先横向、再逐行。 ←→ values[y*columns+x]: row-major order.
      const values=d3.range(columns*rows).map(i=>Math.sin(i%columns/3)*Math.cos(Math.floor(i/columns)/3));
      const contours=d3.contours().size([columns,rows]).thresholds([0])(values);
      const path=d3.geoPath(d3.geoIdentity().scale(15)); // 网格单位转像素。 ←→ Grid units to pixels.
      svg.selectAll('path.contour').data(contours).join('path').attr('class','contour')
        .attr('d',path).attr('fill','#b7dfdb').attr('stroke','#2878ad');
    },'<code>d3.contours()</code> 创建生成器，<code>size</code> 和 <code>thresholds</code> 配置它，最后的 <code>(values)</code> 执行计算。输出是等值区域的 MultiPolygon；<code>geoPath</code> 将多边形变为 path 字符串。这里的填充表示阈值区域，描边显示区域边界。','Create and configure a contour generator, then call it with values. It returns MultiPolygons for threshold regions. <code>geoPath</code> converts the polygon geometry to SVG path data; fill shows the region and stroke its boundary.')
  ],
  '5.1':[
    G('用对象数组组织时间属性','Organizing time properties in an array',function(){
      const attributes=[
        {key:'ordered',name:'有序性'}, {key:'continuous',name:'连续性'},
        {key:'periodic',name:'周期性'}, {key:'spatial',name:'独立于空间'},
        {key:'structured',name:'结构性'}
      ];
      // 同一份数据决定标签和点击时使用的属性。 ←→ One array supplies labels and interaction keys.
      d3.select('#time-properties').selectAll('button').data(attributes,d=>d.key).join('button')
        .text(d=>d.name).on('click',function(event,picked){
          d3.select('#time-properties').selectAll('button').classed('selected',d=>d.key===picked.key);
          console.log(picked.key);
        });
    },'对象把稳定 key 与显示名称分开：key 用于数据连接和状态比较，name 用于文字显示。<code>on</code> 的 picked 是点击项，<code>classed</code> 的 d 是每一个候选项；两个回调分别处理局部事件和整组选中状态。','Stable keys identify items for joins and state comparison; names supply labels. The event’s picked datum is the clicked item, whereas classed evaluates each candidate d. The two callbacks handle the local action and the group-wide selection state.'),
    G('生成日序列与跨越闰日','Generating days and crossing leap day',function(){
      const start=new Date(Date.UTC(2024,0,1));
      const stop=new Date(Date.UTC(2025,0,1));
      // stop 不包含在结果中，2024 年自动包含 2 月 29 日。 ←→ Stop is exclusive; leap day is included automatically.
      const days=d3.utcDay.range(start,stop);
      console.log(days.length); // 366
      const next=d3.utcDay.offset(new Date(Date.UTC(2024,1,28)),1);
      console.log(d3.utcFormat('%Y-%m-%d')(next)); // 2024-02-29
    },'<code>Date.UTC</code> 的月份从 0 开始。<code>utcDay.range</code> 按日历间隔生成日期，<code>offset</code> 移动指定天数。这里统一使用 UTC 构造、间隔和格式化；如果采用本地时间，则对应使用 timeDay、timeFormat 等本地方法。','Months in <code>Date.UTC</code> start at zero. <code>utcDay.range</code> generates calendar dates and <code>offset</code> moves by days. This example consistently uses UTC construction, intervals and formatting. Local-time versions use timeDay and timeFormat.')
  ],
  '5.2':[
    G('解析与格式化日期','Parsing and formatting dates',function(){
      const parseYear=d3.utcParse('%Y');
      const formatYear=d3.utcFormat('%Y');
      const date=parseYear('1965'); // 字符串 → Date。 ←→ String to Date.
      console.log(formatYear(date)); // Date → 字符串。 ←→ Date to string.
      // %Y 年，%m 月，%d 日，%H 时，%M 分，%S 秒。 ←→ %Y year, %m month, %d day, %H hour, %M minute, %S second.
      const parseDay=d3.utcParse('%Y-%m-%d');
      console.log(parseDay('2024-02-29'));
    },'<code>utcParse(format)</code> 与 <code>utcFormat(format)</code> 都先返回一个函数，随后再传入具体值。格式符区分大小写：<code>%m</code> 是月份，<code>%M</code> 是分钟。解析用于计算与比例尺，格式化用于显示。','Both functions first create a parser or formatter, then accept a concrete value. Tokens are case sensitive: <code>%m</code> is month and <code>%M</code> is minute. Parsing supplies dates for computation; formatting supplies display text.'),
    G('时间轴与缺失值','Time axes and missing values',function(){
      const x=d3.scaleUtc().domain(d3.extent(series,d=>d.date)).range([0,500]);
      const y=d3.scaleLinear().domain([0,d3.max(series,d=>d.value)]).range([180,0]);
      const line=d3.line()
        .defined(d=>d.value!==null) // 缺失记录处结束当前子路径。 ←→ End the current subpath at a missing record.
        .x(d=>x(d.date)).y(d=>y(d.value));
      svg.append('path').datum(series).attr('d',line).attr('fill','none').attr('stroke','#2878ad');
      svg.append('g').attr('transform','translate(0,180)').call(d3.axisBottom(x));
    },'<code>extent</code> 计算日期的最小值与最大值。<code>defined</code> 先判断一个点是否参与路径，只有有效点才进入 x/y 访问器。断开和补零会产生不同的图形，因此要在构造路径时明确处理方式。','<code>extent</code> finds the minimum and maximum dates. <code>defined</code> determines whether a point participates before its x/y accessors run. Gaps and zero substitution produce different shapes, so specify the missing-value handling in the path generator.'),
    G('鼠标坐标、invert 与最近记录','Pointer coordinates, invert and the nearest record',function(){
      const nearest=d3.bisector(d=>d.date).center; // series 先按日期升序排列。 ←→ series must be sorted by date.
      svg.on('pointermove',event=>{
        const [pixelX]=d3.pointer(event,svg.node()); // 取得 SVG 局部坐标。 ←→ Get coordinates local to this SVG.
        const date=x.invert(pixelX);               // 像素 → 日期。 ←→ Pixel to date.
        const index=nearest(series,date);          // 二分查找最近日期。 ←→ Binary search for the closest date.
        const picked=series[index];
        if (picked) console.log(d3.utcFormat('%Y-%m-%d')(picked.date),picked.value);
      });
    },'<code>pointer</code> 把事件位置换算到指定元素的坐标系，<code>invert</code> 把横坐标还原为日期，<code>bisector(...).center</code> 在有序记录中查找最近项。若图形放在平移后的 g 中，就把该 g 作为 pointer 的第二个参数，让坐标系一致。','<code>pointer</code> obtains coordinates in a specified element, <code>invert</code> converts x to a date, and a bisector finds the nearest sorted record. For a translated plotting group, use that group as the pointer reference to keep coordinate systems consistent.')
  ],
  '5.3':[
    G('生成日期并查找每日数值','Generating dates and looking up readings',function(){
      const start=new Date(Date.UTC(2024,0,1)), stop=new Date(Date.UTC(2025,0,1));
      const key=d3.utcFormat('%Y-%m-%d');
      const days=d3.utcDays(start,stop).map(date=>({
        date,
        value:byDate.get(key(date)) ?? null // 查不到值时，仍保留这一天。 ←→ Retain the date when its reading is absent.
      }));
      console.log(days.length); // 366
    },'用格式一致的日期字符串作为 Map 键，可把原始记录与完整日历对齐。<code>?? null</code> 只处理 null/undefined，不会把有效的 0 当作缺失。先生成日期，能使没有记录的日格也保持正确位置。','Consistent date strings align readings with the complete calendar through Map keys. <code>?? null</code> handles null/undefined while preserving a valid zero. Generating dates first retains the position of missing days.'),
    G('以周一为起点计算日格','Positioning Monday-first cells',function(){
      const firstWeek=d3.utcMonday.floor(new Date(Date.UTC(2024,0,1)));
      const cellSize=14;
      svg.selectAll('rect.day').data(days,d=>+d.date).join('rect').attr('class','day')
        .attr('x',d=>d3.utcMonday.count(firstWeek,d.date)*cellSize)
        .attr('y',d=>(d.date.getUTCDay()+6)%7*cellSize)
        .attr('width',cellSize-1).attr('height',cellSize-1)
        .attr('fill',d=>d.value===null ? '#dce4e9' : color(d.value));
    },'<code>utcMonday.floor</code> 找到日期所在周的周一，<code>count</code> 计算跨过的周边界，得到列号。星期编号经取模转换为周一 0 到周日 6。key 中的一元 <code>+</code> 把 Date 转成毫秒值，为同一天提供稳定标识。','Floor finds the Monday of the containing week; count gives the number of week boundaries, hence the column. Modulo maps weekdays to Monday zero through Sunday six. Unary plus converts Date to milliseconds for a stable date key.'),
    G('月份分隔线','Month boundaries',function(){
      // 取下月第一天，其前侧就是当前月份的结束边界。 ←→ The first of next month marks the current month’s ending boundary.
      function monthBoundary(date) {
        const weekday=(date.getUTCDay()+6)%7;
        const week=d3.utcMonday.count(firstWeek,date);
        const x=week*cellSize, y=weekday*cellSize;
        return `M ${x+cellSize} 0 V ${y} H ${x} V ${7*cellSize}`;
      }
      const months=d3.utcMonths(start,stop).slice(1);
      svg.selectAll('path.month').data(months).join('path').attr('class','month')
        .attr('d',monthBoundary).attr('fill','none').attr('stroke','#e16a45');
    },'边界在月初之前走出一个阶梯：先沿该周右边到月初所在行，再向左，最后向下。周一开月时 y 为 0，边界落在整列左侧。使用与日格相同的周计数和星期编号，分隔线就能与网格对齐。','The boundary steps around the first date of the month: follow the week’s right edge to its row, move left, then go down. A Monday start has y zero and a full boundary on the column’s left. Reusing the cell’s week and weekday calculations aligns both.')
  ],
  '5.4':[
    G('极坐标到笛卡尔坐标','Polar to Cartesian coordinates',function(){
      const a=20, gap=24, b=gap/(2*Math.PI);
      function position(theta) {
        const r=a+b*theta;
        return {x:r*Math.cos(theta),y:r*Math.sin(theta),r};
      }
      console.log(position(0),position(2*Math.PI));
      // 每转一圈，半径增加 2πb，也就是 gap。 ←→ One turn increases radius by 2πb, equal to gap.
    },'<code>theta</code> 使用弧度。把每圈间距设为 gap 后，<code>b = gap/(2π)</code>。返回对象同时保留 x、y 和 r，后续路径和角度步长都可以使用，不必再次计算半径。','Theta is in radians. Set <code>b = gap/(2π)</code> to obtain the desired radial gap per turn. Returning x, y and r lets path construction and step calculations share the result.'),
    G('周期等分与等弧长步长','Equal phase steps and equal arc-length steps',function(){
      // 周期布局：每 period 项一圈，同相位拥有相同方向。 ←→ Phase layout: period items per turn align equal phases.
      const period=14;
      const phaseAngle=index=>index/period*2*Math.PI;
      // 原课程的近似等弧长布局：半径越大，角度步长越小。 ←→ Approximately equal arc length needs smaller steps at larger radii.
      const boxSize=12;
      const arcStep=radius=>boxSize/Math.sqrt(b*b+radius*radius);
      console.log(phaseAngle(14),arcStep(100));
    },'这两种布局解决不同问题：固定角度增量便于周期相位对齐；动态角度增量便于控制小格的弧长。<code>√(b²+r²)</code> 是螺旋曲线对角度的弧长变化率，用目标长度除以它得到近似步长。','Fixed angular steps align periodic phases. Dynamic steps control approximate cell arc length. <code>√(b²+r²)</code> is the rate of spiral arc length with angle; dividing the target length by it gives an approximate step.'),
    G('四个顶点构造螺旋小格','Building a spiral cell from four vertices',function(){
      function segmentPath(t0,t1) {
        const point=(theta,side)=>{
          const r=position(theta).r+side*gap/2;
          return [r*Math.cos(theta),r*Math.sin(theta)];
        };
        const outer0=point(t0,1),outer1=point(t1,1);
        const inner1=point(t1,-1),inner0=point(t0,-1);
        return `M ${outer0} L ${outer1} L ${inner1} L ${inner0} Z`;
      }
      // attr 的 d 接收闭合路径，可以分别设置填充和描边。 ←→ A closed d path supports independent fill and stroke.
    },'外侧按起点到终点连接，内侧反向返回，最后用 Z 闭合。<code>side</code> 取 1 或 −1 控制内外偏移。这里用短直线近似小格边缘；缩小角度范围可以让近似更细。','Follow the outer start to outer end, then return along the inner edge and close with Z. Side 1/−1 selects the radial offset. Short straight edges approximate each small cell; smaller angular spans refine the approximation.')
  ],
  '5.5':[
    G('每个角色一条路径','One path per character',function(){
      const x=d3.scaleLinear().domain([0,127]).range([50,550]);
      const characters=[
        {name:'T-REX',points:[{time:75,y:150},{time:78,y:100},{time:88,y:160}]},
        {name:'Grant',points:[{time:0,y:60},{time:78,y:100},{time:120,y:40}]}
      ];
      const line=d3.line().x(d=>x(d.time)).y(d=>d.y).curve(d3.curveCatmullRom.alpha(0.5));
      // 外层 data 按角色连接；line 接收该角色的 points。 ←→ Join characters, then draw each character’s points.
      svg.selectAll('path.character').data(characters,d=>d.name).join('path').attr('class','character')
        .attr('d',d=>line(d.points)).attr('fill','none')
        .attr('stroke',(d,i)=>d3.schemeTableau10[i]).attr('stroke-width',3);
    },'这里的数据有两层：外层每项是角色，内部 points 是该角色的时间序列。<code>attr("d", d => line(d.points))</code> 明确把内层数组交给路径生成器。相同时刻的相近 y 表示事件或群组关系。','Data has two levels: each outer item is a character and points is its sequence. The accessor explicitly passes that inner array to the line generator. Nearby y positions at the same instant indicate an event or group relationship.'),
    G('独立的事件图层','A separate event layer',function(){
      const events=[{id:'attack',time:78,y:100,name:'T-REX attack'}];
      const layer=svg.append('g').attr('class','event-layer');
      const marks=layer.selectAll('g.event').data(events,d=>d.id).join('g').attr('class','event')
        .attr('transform',d=>`translate(${x(d.time)},${d.y})`);
      // 子元素通过单项数组继承父组数据。 ←→ Children receive the parent datum through one-item arrays.
      marks.selectAll('circle').data(d=>[d]).join('circle').attr('r',18).attr('fill','#e16a4530');
      marks.selectAll('text').data(d=>[d]).join('text').attr('y',-23).attr('text-anchor','middle')
        .text(d=>d.name);
      marks.on('mouseenter',(event,d)=>console.log(d.name,d.time));
    },'事件位置用组的 transform 设置，内部圆和文字使用局部坐标。事件和角色路径放在不同的 g 中，就可以分别隐藏、筛选或高亮。一个图层中的改动不必重新创建另一层。','Position each event through its group transform, with local coordinates for its circle and label. Separate event and path groups allow independent visibility, filtering and highlighting.'),
    G('Catmull-Rom 的 alpha','Catmull-Rom alpha',function(){
      const choices={
        uniform:d3.curveCatmullRom.alpha(0),       // 均匀参数化。 ←→ Uniform parameterization.
        centripetal:d3.curveCatmullRom.alpha(0.5), // 向心参数化。 ←→ Centripetal parameterization.
        chordal:d3.curveCatmullRom.alpha(1)       // 弦长参数化。 ←→ Chordal parameterization.
      };
      const alternativeLine=d3.line().x(d=>x(d.time)).y(d=>d.y).curve(choices.centripetal);
    },'<code>alpha</code> 控制样条的参数化方式，不是数据拟合的置信度，也不是简单的“越大越弯”。0、0.5、1 分别对应均匀、向心和弦长参数化。比较时应保留相同关键点，观察点间距离不均匀时的曲线变化。','Alpha controls spline parameterization rather than model confidence or a simple amount of bending. Values 0, 0.5 and 1 select uniform, centripetal and chordal parameterization. Retain the same key points and compare the effects of unequal point spacing.')
  ]
};

export function guideSource(guide,lang='zh'){
  const lines=guide.source.toString().split('\n').slice(1,-1);
  const indent=Math.min(...lines.filter(line=>line.trim()).map(line=>line.match(/^ */)[0].length));
  return lines.map(line=>{
    let text=line.slice(indent);
    const divider=text.indexOf(' ←→ ');
    if(divider<0)return text;
    return lang==='zh'?text.slice(0,divider):text.slice(0,text.indexOf('//'))+'// '+text.slice(divider+4);
  }).join('\n');
}
