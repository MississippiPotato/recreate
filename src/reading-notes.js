// Definitions, tables and examples follow the original five lessons.
// Source: cinger007/vis, 35a66ecb5e35e8c4f2c54a007cb6c590255b6f06.
const pair=(zh,en)=>({zh,en});
const p=(zh,en)=>({kind:'p',text:pair(zh,en)});
const h=(zh,en)=>({kind:'h',text:pair(zh,en)});
const list=(...items)=>({kind:'list',items:items.map(([zh,en])=>pair(zh,en))});
const table=(zh,en,...rows)=>({kind:'table',head:pair(zh,en),rows:rows.map(([a,b])=>pair(a,b))});

export const readingNotes={
  '1.1':[
    h('新生数据案例','The student-data example'),
    p('本章从一份包含 80 条新生记录的 CSV 文件开始，学习数据的读取、类型转换和整理。CSV 的第一行是字段名，后面每一行是一条记录。原课程的字段包括序号、姓名、性别、生日、年龄、班级、籍贯和民族。','This lesson begins with a CSV file containing 80 student records. The first row contains field names; each subsequent row is a record. The original course uses ID, name, gender, birthday, age, class, hometown and ethnicity.'),
    h('字段、记录与数据类型','Fields, records and data types'),
    table(['字段示例','含义','读入后的处理'],['Example field','Meaning','After loading'],
      [['序号 / id','标识一条记录','保留为标识，用于查找和数据连接'],['ID','Identifies a record','Retain as an identifier for lookup and joins']],
      [['姓名、班级','文本或类别','去除首尾空格，统一名称'],['Name, class','Text or category','Trim whitespace and use consistent names']],
      [['年龄、成绩','数值','从字符串转换为 Number'],['Age, score','Numeric measure','Convert strings to Number']],
      [['生日、日期','时间','按指定格式解析为 Date'],['Birthday, date','Time','Parse the specified format into Date']] ),
    p('读入 CSV 后，<code>"18"</code> 与 <code>18</code> 并不是同一种类型。字符串用于显示没有问题，参与加法、排序或计算均值前，需要先完成类型转换。例如 <code>"18" + "2"</code> 得到 <code>"182"</code>，而 <code>18 + 2</code> 得到 <code>20</code>。','After loading CSV, <code>"18"</code> and <code>18</code> have different types. A string is suitable for display, but calculations and numeric sorting need conversion first: <code>"18" + "2"</code> produces <code>"182"</code>, while <code>18 + 2</code> produces <code>20</code>.'),
    h('数据读取与行转换','Loading and row conversion'),
    p('<code>d3.csv(url, transformRow)</code> 负责加载和解析 CSV，并把每一行交给 <code>transformRow</code>。在这个函数中完成字段重命名、去除空格、数值转换和日期解析，后面的过滤、分组和绘图就可以使用统一的数据结构。','<code>d3.csv(url, transformRow)</code> loads and parses the CSV, passing each row to <code>transformRow</code>. Rename fields, trim text, convert numbers and parse dates here so that filtering, grouping and drawing use a consistent record structure.'),
    p('整理数据时还要检查字段是否齐全、同一类别的写法是否一致、日期格式是否统一。空字符串应先单独处理，再做数值转换；<code>Number("")</code> 会得到 0。','Check for missing fields, inconsistent category names and mixed date formats. Handle blank strings before numeric conversion: <code>Number("")</code> produces zero.')
  ],
  '1.2':[
    h('DIKW 金字塔','The DIKW pyramid'),
    p('DIKW 分别指数据（Data）、信息（Information）、知识（Knowledge）和智慧（Wisdom）。数据是原始的观察结果，信息是组织好的数据，知识是从信息中提炼的模式和规律，智慧是运用知识作出判断和决策。','DIKW stands for Data, Information, Knowledge and Wisdom. Data consists of observations; information is organized data; knowledge captures patterns and understanding; wisdom applies knowledge to judgments and decisions.'),
    table(['层','含义','回答的问题'],['Level','Meaning','Question answered'],
      [['数据 Data','原始、离散的观察结果','记录了什么'],['Data','Raw, discrete observations','What was recorded?']],
      [['信息 Information','经过处理、组织、赋予上下文的数据','谁 / 什么 / 何时 / 何地'],['Information','Data that has been processed, organized and given context','Who / What / When / Where']],
      [['知识 Knowledge','对信息的进一步提炼和理解','如何'],['Knowledge','Further refinement and understanding of information','How']],
      [['智慧 Wisdom','运用知识作出判断和决策','为什么 / 应该怎么做'],['Wisdom','Applying knowledge to judgments and decisions','Why / What to do']] ),
    h('可视化在 DIKW 中的位置','Visualization in DIKW'),
    p('可视化把表格中的数据转换成图形，使分布、差异和联系更容易被发现。柱状图可以比较各班人数，折线图可以观察变化，热图可以查找集中出现的高值和低值。','Visualization turns tabular data into graphics that reveal distributions, differences and relationships. Bar charts compare class sizes, line charts show change, and heatmaps reveal concentrations of high and low values.'),
    list(
      ['<strong>Data → Information：</strong>整理和呈现数据，回答具体问题。','<strong>Data → Information:</strong> organize and present records to answer a question.'],
      ['<strong>Information → Knowledge：</strong>比较多个视图，发现模式，结合领域知识、统计分析进一步解释。','<strong>Information → Knowledge:</strong> compare views, discover patterns and interpret them using domain knowledge and statistical analysis.'],
      ['<strong>Knowledge → Wisdom：</strong>结合目标、经验和条件作出决策，可视化提供分析依据。','<strong>Knowledge → Wisdom:</strong> combine goals, experience and constraints to make decisions, supported by visual analysis.'] ),
    h('从记录到判断','From records to a judgment'),
    p('以新生数据为例：一条记录中的班级、年龄和籍贯属于数据；按班级统计人数形成信息；比较多个班级的构成可以发现规律；结合教学安排决定如何分组，则进入了决策。演示中的四层金字塔用同一份记录说明这个过程。','For the student example, class, age and hometown in a record are data. Counting students by class produces information. Comparing class composition can reveal patterns. Using those findings to arrange teaching groups involves a decision. The four pyramid layers demonstrate this progression with the same records.')
  ],
  '1.3':[
    h('数据属性的三种基本类型','Three basic attribute types'),
    list(
      ['<strong>类别型属性：</strong>符号或名称，没有大小顺序，如姓名、专业和籍贯。','<strong>Categorical:</strong> symbols or names without a magnitude order, such as name, major and hometown.'],
      ['<strong>序数型属性：</strong>属性值有顺序，如本科、硕士、博士，或低、中、高。','<strong>Ordinal:</strong> values have an order, such as bachelor, master and doctorate, or low, medium and high.'],
      ['<strong>数值型属性：</strong>表示可以度量的数量，如年龄、价格、人数和温度。','<strong>Quantitative:</strong> measurable quantities such as age, price, counts and temperature.'] ),
    h('Stevens 测量尺度','Stevens’ measurement scales'),
    p('测量尺度进一步区分了数据允许怎样比较。特别要注意：区间尺度有等距的差值，比率尺度还具有有意义的零点。','Measurement scales specify the comparisons that values support. Interval scales have meaningful differences; ratio scales also have a meaningful zero.'),
    table(['尺度','可以怎样比较','典型示例'],['Scale','Supported comparison','Example'],
      [['名义 Nominal','相同 / 不同','姓名、专业、编号'],['Nominal','Same / different','Name, major, ID']],
      [['序数 Ordinal','相同 / 不同，以及先后或高低','等级、名次'],['Ordinal','Equality and order','Ratings, ranks']],
      [['区间 Interval','比较差值','摄氏温度、年份'],['Interval','Compare differences','Celsius temperature, calendar year']],
      [['比率 Ratio','比较差值与倍数','人数、长度、价格'],['Ratio','Compare differences and ratios','Counts, length, price']] ),
    p('0°C 不表示没有温度，因此不能说 20°C 是 10°C 的两倍。人数则有零点，20 人是 10 人的两倍。编号即使用数字存储，仍然属于类别型属性。','Zero Celsius does not mean an absence of temperature, so 20°C is not twice 10°C. Counts have a zero: 20 people is twice 10. An ID remains categorical even when stored as a number.'),
    h('属性与视觉通道的匹配','Matching attributes to visual channels'),
    table(['表达任务','常用通道','图形例子'],['Task','Common channels','Example'],
      [['比较数量','共用尺度上的位置、长度','散点图、柱状图'],['Compare quantities','Position on a common scale, length','Scatter plot, bar chart']],
      [['表达顺序','位置、明度、大小','排序图、顺序色带'],['Express order','Position, lightness, size','Ranked chart, sequential palette']],
      [['区分类别','色相、形状、空间分区','分类散点、分面图'],['Distinguish categories','Hue, shape, spatial region','Categorical scatter plot, small multiples']] ),
    p('Mackinlay 的视觉通道排序为这种选择提供了依据。先判断字段的含义，再决定使用哪一种比例尺和通道；例如专业用类别颜色，成绩用位置或长度。','Mackinlay’s channel rankings guide these choices. Determine what a field means before selecting a scale and channel: use category colors for majors and position or length for scores.')
  ],
  '1.4':[
    h('常见的数据变换','Common data transformations'),
    p('数据通常需要先整理，再绑定到图形。原课程介绍了八种常见操作，分别处理逐项映射、筛选、组合和数组结构。','Data usually needs transformation before it is bound to graphics. The original course introduces eight operations for mapping, filtering, combining and reshaping arrays.'),
    table(['操作','作用','简单例子'],['Operation','Purpose','Example'],
      [['map','逐项生成新值','年龄数组 → 每人下一岁的年龄'],['map','Produce a value for each item','Ages → ages next year']],
      [['reduce','把多个值归约为一个结果','年龄数组 → 总和'],['reduce','Reduce values into an accumulated result','Ages → total']],
      [['cross','笛卡尔积','性别 × 专业 → 所有组合'],['cross','Cartesian product','Gender × major → combinations']],
      [['merge','把多组数组展开一层','[[1,2],[3]] → [1,2,3]'],['merge','Flatten one array level','[[1,2],[3]] → [1,2,3]']],
      [['pairs','提取相邻元素对','[1,2,3] → [[1,2],[2,3]]'],['pairs','Adjacent pairs','[1,2,3] → [[1,2],[2,3]]']],
      [['transpose','交换矩阵的行与列','两行三列 → 三行两列'],['transpose','Exchange matrix rows and columns','Two by three → three by two']],
      [['zip','按相同索引组合','[1,2] 与 [a,b] → [[1,a],[2,b]]'],['zip','Combine equal indices','[1,2] and [a,b] → [[1,a],[2,b]]']],
      [['filter','保留满足条件的记录','学生数组 → 某专业的学生'],['filter','Retain matching records','Students → students in a major']] ),
    h('用函数组合表达数据流','Composing a data flow'),
    p('例如计算某一组学生的平均年龄，可以先用 <code>filter</code> 选出记录，再用 <code>map</code> 提取年龄，最后用 <code>reduce</code> 求和。每一步处理上一层的结果，便于逐步检查中间值。','To calculate the mean age of a group, use <code>filter</code> to select records, <code>map</code> to extract ages and <code>reduce</code> to sum them. Each step takes the previous result, so intermediate values can be inspected.'),
    p('<code>map</code> 和 <code>filter</code> 会返回新数组；<code>reduce</code> 返回什么取决于累加器。写回调时，尽量只计算并返回结果，让输入记录保持不变。','<code>map</code> and <code>filter</code> return new arrays; the return type of <code>reduce</code> depends on the accumulator. Write callbacks that calculate and return results while leaving the input records unchanged.'),
    h('分组与聚合','Grouping and aggregation'),
    p('<code>d3.group</code> 按字段把记录分组，组内仍保留完整记录；<code>d3.rollup</code> 在分组后计算人数、总和或均值。下一章会把“专业 → 班级 → 人数”的多层聚合结果继续转换为树形结构。','<code>d3.group</code> groups records by keys while retaining each record. <code>d3.rollup</code> reduces each group to a count, sum or mean. The next lesson turns a nested major → class → count result into a hierarchy.')
  ],
  '1.5':[
    h('D3 选择器','D3 selectors'),
    table(['方法','选择范围'],['Method','Selection scope'],
      [['d3.select','第一个匹配的元素'],['d3.select','The first matching element']],
      [['d3.selectAll','所有匹配的元素'],['d3.selectAll','All matching elements']],
      [['selection.select','每个父元素中第一个匹配的后代'],['selection.select','The first matching descendant of each parent']],
      [['selection.selectAll','每个父元素中所有匹配的后代'],['selection.selectAll','All matching descendants of each parent']],
      [['selection.selectChild','每个父元素中第一个匹配的直接子元素'],['selection.selectChild','The first matching direct child of each parent']],
      [['selection.selectChildren','每个父元素中所有匹配的直接子元素'],['selection.selectChildren','All matching direct children of each parent']] ),
    p('这些方法返回的是 <strong>selection（选择集）</strong>。后续的 <code>attr</code>、<code>style</code>、<code>text</code> 和 <code>on</code> 都作用于选择集中的元素。','These methods return a <strong>selection</strong>. Subsequent calls to <code>attr</code>, <code>style</code>, <code>text</code> and <code>on</code> operate on the selected elements.'),
    h('Data-Join：enter / update / exit','Data joins: enter / update / exit'),
    p('数据连接把数据数组与 DOM 元素对应起来。调用 <code>selection.data(data, key)</code> 后，可以根据匹配结果得到三种状态。','A data join matches an array of records to DOM elements. Calling <code>selection.data(data, key)</code> produces three states based on the matches.'),
    table(['状态','匹配情况','常见操作'],['State','Matching result','Typical operation'],
      [['enter','新数据没有对应元素','append 创建元素'],['enter','A new datum has no element','append an element']],
      [['update','数据与已有元素匹配','更新位置、颜色、文字'],['update','A datum matches an existing element','Update position, color or text']],
      [['exit','已有元素没有对应的新数据','remove 移除元素'],['exit','An existing element has no new datum','remove the element']] ),
    p('例如旧数据为 A、B、C，新数据为 B、C、D，按字母作 key：B、C 更新，D 进入，A 退出。虽然两次数组长度相同，仍然会同时出现 enter 和 exit。','For old data A,B,C and new data B,C,D, using the letters as keys updates B/C, enters D and exits A. Both arrays have the same length, yet both enter and exit occur.'),
    h('key 函数与元素身份','Key functions and element identity'),
    p('省略 key 时，D3 按索引匹配；使用 <code>d => d.id</code> 时，D3 按编号匹配。数据重新排序时，稳定的 key 能保留原来的元素，随后再改变它的位置。<code>join</code> 把创建、更新和删除放在同一段流程中处理。','Without a key, D3 matches by index. With <code>d => d.id</code>, it matches by ID. A stable key retains the existing element when records reorder, after which its position can change. <code>join</code> handles creation, update and removal within one flow.')
  ],
  '2.1':[
    h('三个可视化流程模型','Three visualization models'),
    p('从数据到图形，可以用几个经典模型来理解。Card 模型说明数据经过哪些步骤，Mackinlay 讨论视觉表达的选择，van Wijk 模型把用户交互和知识获取放进了这个过程。','Several models explain how data becomes a graphic. Card describes the transformation stages, Mackinlay addresses encoding choices, and van Wijk includes interaction and knowledge acquisition.'),
    table(['模型','核心内容'],['Model','Central idea'],
      [['Card、Mackinlay 与 Shneiderman（1999）','原始数据 → 数据表 → 视觉结构 → 视图'],['Card, Mackinlay and Shneiderman (1999)','Raw data → data tables → visual structures → views']],
      [['Mackinlay（1986）','根据数据类型考虑表达能力和视觉通道的有效性'],['Mackinlay (1986)','Consider expressiveness and channel effectiveness for each data type']],
      [['van Wijk（2005）','数据、可视化、感知与探索组成反馈过程'],['van Wijk (2005)','Data, visualization, perception and exploration form a feedback process']] ),
    h('沿着数据流看每一步','Following the data flow'),
    list(
      ['<strong>数据变换：</strong>从原始记录中清洗、筛选、分组，得到适合分析的数据表。','<strong>Data transformation:</strong> clean, filter and group raw records into a table suited to analysis.'],
      ['<strong>视觉映射：</strong>选择图元和通道，例如用位置表示层次，用颜色区分类别。','<strong>Visual mapping:</strong> choose marks and channels, such as position for hierarchy and color for categories.'],
      ['<strong>视图变换与渲染：</strong>根据布局、坐标和绘图区域生成最终图形。','<strong>View transformation and rendering:</strong> use layout, coordinates and the drawing region to produce the visible graphic.'],
      ['<strong>交互反馈：</strong>用户选择、过滤或调整参数后，重新计算相应步骤。','<strong>Interaction:</strong> selections, filters and parameter changes feed back into the relevant stages.'] ),
    p('本章使用同一份分组数据串联这些步骤：先统计专业和班级人数，再建立层次结构，计算树布局，最后加入展开、选中和事件处理。','This lesson follows the stages with one grouped dataset: count records by major and class, build a hierarchy, calculate a tree layout, then add expansion, selection and event handling.')
  ],
  '2.2':[
    h('数据变换：从记录到分组结果','Data transformation: records to groups'),
    p('按“专业 / 班级”统计新生人数，是一次多维分组聚合。外层按专业分组，内层按班级分组，每组用记录条数表示人数。','Counting students by major and class is a nested aggregation. The outer level groups by major, the inner level by class, and each group is reduced to a record count.'),
    table(['操作','作用','常用写法'],['Operation','Purpose','Typical form'],
      [['清洗 / 过滤','去除空项、筛选满足条件的记录','filter、CSV 行回调'],['Clean / filter','Handle blanks and select matching records','filter, CSV row callback']],
      [['聚合 / 汇总','按 key 分组并计算结果','d3.group、d3.rollup'],['Aggregate','Group by keys and calculate a summary','d3.group, d3.rollup']],
      [['连接 / 关联','按共同字段关联两份记录','Map 索引与字段查找'],['Join','Relate records using shared keys','Map index and key lookup']],
      [['派生字段','从已有字段计算新字段','从班级名称提取专业'],['Derive','Calculate a field from existing values','Extract a major from a class name']] ),
    h('d3.rollup 的参数与返回值','Parameters and results of d3.rollup'),
    p('<code>d3.rollup(data, reducer, key1, key2, ...)</code> 先按 key 分组，再把每个最内层的记录数组交给 reducer。<code>v => v.length</code> 得到人数，<code>v => d3.mean(v, d => d.score)</code> 得到平均分。','<code>d3.rollup(data, reducer, key1, key2, ...)</code> groups records by the keys, then passes each innermost record array to the reducer. <code>v => v.length</code> returns the count; <code>v => d3.mean(v, d => d.score)</code> returns the mean score.'),
    list(
      ['一个 key 返回单层 Map；两个 key 返回嵌套 Map。','One key produces one Map level; two keys produce nested Maps.'],
      ['使用 <code>for (const [key, value] of map)</code> 遍历键值对。','Use <code>for (const [key, value] of map)</code> to iterate entries.'],
      ['<code>group</code> 保留组内记录，<code>rollup</code> 保留聚合结果。','<code>group</code> retains group records; <code>rollup</code> retains the reduced result.'] ),
    h('切片与下钻','Slicing and drilling down'),
    p('只看某专业，可以先过滤再聚合；展开某专业查看各班人数，则是在聚合结果中向下读取一层。这种“总体 → 局部”的组织方式也常用于 OLAP 和交互分析。','To inspect one major, filter before aggregation. Expanding a major to inspect its classes reads the next level of the grouped result. This overview-to-detail organization also appears in OLAP and interactive analysis.')
  ],
  '2.3':[
    h('视觉映射：图元与通道','Visual mapping: marks and channels'),
    p('视觉结构由图元和视觉通道共同组成。<strong>点、线、面</strong>是图元；位置、颜色、形状、倾斜和大小是通道。同样一份数据，可以选择不同图元，也可以用不同通道表达同一个属性。','A visual structure combines marks and channels. <strong>Points, lines and areas</strong> are marks. Position, color, shape, tilt and size are channels. The same dataset can use different marks or different channels for an attribute.'),
    table(['通道类型','表达的属性','常见通道'],['Channel type','Attribute','Examples'],
      [['幅度通道 Magnitude','有序或定量属性','位置、长度、面积、明度'],['Magnitude','Ordered or quantitative','Position, length, area, lightness']],
      [['标识通道 Identity','类别或身份','空间分区、色相、形状'],['Identity','Categories or identity','Spatial region, hue, shape']] ),
    p('原课程的五张图分别展示通道排序、图元、常用通道、幅度通道和标识通道。对数量做精确比较时，通常优先考虑共用尺度上的位置；区分类别时，可以考虑色相、形状或空间分区。','The original five figures cover channel rankings, marks, common channels, magnitude channels and identity channels. Position on a common scale is often a good choice for precise quantitative comparisons; hue, shape and spatial region can distinguish categories.'),
    h('树布局：把层级关系放到屏幕上','Tree layout: placing a hierarchy'),
    p('上一节得到“专业 → 班级”的层级关系。树布局用节点表示对象，用连线表示父子关系，再把层级映射到位置。D3 的 <code>tree</code> 使用 tidy tree 布局，使同一层的节点分开，并把父节点放在子树之间。','The previous section produced a major → class hierarchy. A tree uses nodes for entities and links for parent-child relationships, mapping the hierarchy to position. D3’s <code>tree</code> uses a tidy-tree layout that separates nodes on each level and centers parents over their subtrees.'),
    list(
      ['<code>d3.hierarchy(data)</code> 建立 parent、children、depth 等结构。','<code>d3.hierarchy(data)</code> establishes parent, children, depth and related structure.'],
      ['<code>d3.tree().size([height, width])(root)</code> 为节点计算 x、y。','<code>d3.tree().size([height, width])(root)</code> assigns x and y coordinates.'],
      ['横向树把深度坐标 y 画在水平方向，把 x 画在垂直方向。节点和连线使用同一约定。','For a horizontal tree, draw the depth coordinate y horizontally and x vertically. Use this convention for both nodes and links.'] ),
    h('其他层次布局','Other hierarchical layouts'),
    p('<code>cluster</code> 把叶节点对齐；<code>treemap</code> 用矩形面积表达数量；<code>pack</code> 用圆打包；<code>partition</code> 可以生成 icicle 或 sunburst 的布局坐标。层级数据相同，布局表达的重点可以不同。','<code>cluster</code> aligns leaves, <code>treemap</code> uses rectangle area, <code>pack</code> packs circles, and <code>partition</code> supplies coordinates for icicles and sunbursts. Different layouts emphasize different aspects of the same hierarchy.')
  ],
  '2.4':[
    h('从层次数据到可交互列表','From a hierarchy to an interactive list'),
    p('层次数据除了画成节点连线，也可以渲染为嵌套的 HTML 列表。每个节点对应一个 <code>li</code>，子节点放进它内部的 <code>ul</code>。展开、折叠和选中状态可以用 D3 的 <code>classed</code> 控制。','A hierarchy can be rendered as nested HTML lists as well as a node-link diagram. Each node becomes an <code>li</code>, with children in an inner <code>ul</code>. D3’s <code>classed</code> controls expanded, collapsed and selected states.'),
    h('DOM 事件的三个阶段','Three phases of DOM events'),
    table(['阶段','传播方向','列表中的例子'],['Phase','Direction','List example'],
      [['捕获 Capturing','从外层走向目标','列表容器 → li → 按钮'],['Capturing','Outer elements toward the target','Container → li → button']],
      [['目标 Target','到达实际点击的元素','展开按钮'],['Target','The element that was clicked','Expand button']],
      [['冒泡 Bubbling','从目标返回外层','按钮 → li → 列表容器'],['Bubbling','Target toward outer elements','Button → li → container']] ),
    p('默认监听器通常处理冒泡阶段。点击展开按钮时，事件也会传给外层的节点；如果节点还绑定了“选中”操作，就可能同时触发两个动作。<code>event.stopPropagation()</code> 可以阻止事件继续沿父元素传播。','Listeners normally handle the bubbling phase. A click on an expand button also reaches its ancestor node. If the node has a selection listener, both actions may run. <code>event.stopPropagation()</code> stops further propagation to ancestors.'),
    h('事件委托与 classed','Event delegation and classed'),
    p('事件委托把监听器放在列表容器上，再用 <code>event.target.closest(...)</code> 找到被点击的项目。<code>event.target</code> 是点击来源，<code>event.currentTarget</code> 是当前执行监听器的元素。','Event delegation places a listener on the list container and uses <code>event.target.closest(...)</code> to find the clicked item. <code>event.target</code> is where the event originated; <code>event.currentTarget</code> is the element whose listener is running.'),
    p('<code>selection.classed("selected", true)</code> 添加类，传入 <code>false</code> 移除类，传入函数则根据每条数据计算状态。用这种方式，数据状态和样式规则可以分开。','<code>selection.classed("selected", true)</code> adds a class; <code>false</code> removes it; a function computes the state for each datum. This separates data state from CSS styling.'),
    h('过渡动画','Transitions'),
    p('<code>transition().duration(ms)</code> 让位置、颜色或透明度从旧值逐渐变化到新值。时长为 0 时立即切换；增加时长后，可以观察元素变化的过程。连续操作时，可先调用 <code>interrupt()</code> 终止已有过渡。','<code>transition().duration(ms)</code> interpolates position, color or opacity from old values to new values. A zero duration changes immediately; a longer duration exposes the movement. Call <code>interrupt()</code> to stop an existing transition before another action.')
  ],
  '3.1':[
    h('为什么要学颜色模型','Why study color models?'),
    p('同样的 RGB 数值变化，视觉上不一定产生同样的颜色差异。设计颜色渐变时，需要了解颜色空间如何描述色相、明度和饱和度。','Equal changes in RGB values do not necessarily produce equal perceived color differences. Designing a gradient requires understanding how color spaces describe hue, lightness and saturation.'),
    table(['模型','组成','用途'],['Model','Components','Use'],
      [['RGB','红、绿、蓝三个分量','屏幕显示，加色混合'],['RGB','Red, green and blue','Screen display, additive mixing']],
      [['HSL','色相 H、饱和度 S、亮度 L','按色轮选择颜色，调整浓淡和明暗'],['HSL','Hue, saturation and lightness','Choose hue and adjust saturation and lightness']],
      [['CIE Lab','L* 明度，a* 绿红轴，b* 蓝黄轴','比较颜色差异、设计渐变'],['CIE Lab','L* lightness, a* green-red, b* blue-yellow','Compare color differences and design gradients']],
      [['CMYK','青、品红、黄、黑','印刷中的减色混合'],['CMYK','Cyan, magenta, yellow and black','Subtractive mixing for print']] ),
    h('RGB、HSL 与 Lab','RGB, HSL and Lab'),
    p('RGB 直接对应显示通道；HSL 把颜色组织为色轮，便于讨论互补、类比和三等分配色。Lab 以接近感知均匀为设计目标，在其中插值可以控制明度变化。HSL 的 L 和 Lab 的 L* 含义不同，不能直接互换。','RGB describes display channels. HSL organizes hue on a wheel, useful for complementary, analogous and triadic palettes. Lab aims for approximate perceptual uniformity and offers control over lightness during interpolation. HSL L and Lab L* are different quantities.'),
    h('色觉差异','Color-vision differences'),
    p('常见的色觉差异包括红色觉、绿色觉和蓝色觉方面的变化。设计图表时，除了比较颜色本身，还可以同时使用形状、文字和线型。后面的演示会把同一张图切换到灰度和不同色觉模拟下观察。','Color vision can differ in sensitivity associated with red, green and blue. Along with colors, charts can use shapes, labels and line styles. Later demonstrations compare the same graphic in grayscale and different color-vision simulations.')
  ],
  '3.2':[
    h('三类 colormap','Three types of colormap'),
    p('先判断数据的含义，再选择颜色映射。顺序型、发散型和定性型分别对应数量顺序、有意义的中点和无序类别。','Choose a colormap according to the meaning of the data. Sequential, diverging and qualitative mappings correspond to ordered magnitudes, meaningful midpoints and unordered categories.'),
    table(['类型','数据语义','颜色安排','例子'],['Type','Data meaning','Color arrangement','Examples'],
      [['顺序型 Sequential','从低到高','明度有顺序地变化','Viridis、Cividis、Blues'],['Sequential','Low to high','Ordered changes in lightness','Viridis, Cividis, Blues']],
      [['发散型 Diverging','围绕基准的两侧','两端有区别，中间接近中性色','RdBu、BrBG'],['Diverging','Two sides of a reference','Distinct ends with a neutral middle','RdBu, BrBG']],
      [['定性型 Qualitative','没有大小关系的类别','颜色容易区分','Tableau10、Set1、Okabe-Ito'],['Qualitative','Categories without magnitude order','Distinct colors','Tableau10, Set1, Okabe-Ito']] ),
    h('中点是否有意义','Does the midpoint have meaning?'),
    p('温度相对平均值的偏差可以用 0 作中点：低于平均值用一侧颜色，高于平均值用另一侧。人数从少到多则通常采用顺序型，不需要人为加入一个“正常 / 异常”的分界。','A temperature anomaly can use zero as its midpoint, with opposite colors below and above the reference. Counts from low to high usually use a sequential scale rather than an arbitrary normal/abnormal boundary.'),
    h('颜色变化与图例','Color changes and legends'),
    p('顺序型应让读者容易判断高低；发散型要在图例中明确基准；定性型应保持类别与颜色的固定对应。把同一份数据换成不同色板，是检查颜色含义的直接方法。','A sequential map should make order apparent. A diverging legend should show its reference. A qualitative map should keep each category’s color stable. Applying several palettes to the same data makes their effects easy to compare.')
  ],
  '3.3':[
    h('Lab 色域图','The Lab gamut diagram'),
    p('CIE Lab 用 L*、a*、b* 描述颜色。固定 L* 后，可以把 a*、b* 画成一个平面，观察该明度下哪些颜色能够在屏幕上显示。','CIE Lab describes a color with L*, a* and b*. Fixing L* gives an a*-b* plane that shows which colors at that lightness can be displayed.'),
    list(
      ['<strong>L*：</strong>明度，通常在 0 到 100 之间讨论。','<strong>L*:</strong> lightness, usually discussed from 0 to 100.'],
      ['<strong>a*：</strong>负方向偏绿，正方向偏红。','<strong>a*:</strong> green toward negative values, red toward positive values.'],
      ['<strong>b*：</strong>负方向偏蓝，正方向偏黄。','<strong>b*:</strong> blue toward negative values, yellow toward positive values.'] ),
    h('颜色空间与设备色域','Color spaces and device gamuts'),
    p('颜色空间规定如何描述颜色，色域则是某种设备或标准能够表示的颜色集合。sRGB 常用于 Web，Adobe RGB 和 Rec.2020 覆盖不同的颜色范围。屏幕能显示什么，取决于设备和显示流程。','A color space describes colors; a gamut is the set a device or standard can represent. sRGB is common on the Web, while Adobe RGB and Rec.2020 cover different ranges. Displayed colors depend on the device and display pipeline.'),
    h('在 D3 中检查颜色','Checking a color in D3'),
    p('<code>d3.lab(L, a, b).rgb()</code> 把 Lab 颜色转换为 RGB 对象。先用 <code>displayable()</code> 判断是否落在可显示范围，再用 <code>formatHex()</code> 或 <code>formatRgb()</code> 生成 CSS 颜色。格式化时发生的裁剪可能让不同的 Lab 颜色显示成同一种颜色。','<code>d3.lab(L, a, b).rgb()</code> converts Lab to an RGB object. Check <code>displayable()</code> before formatting with <code>formatHex()</code> or <code>formatRgb()</code>. Clipping during formatting can make different Lab colors display as the same color.'),
    p('比较 RGB 与 Lab 插值时，可以选相同的起点和终点，再观察中间颜色的明度变化。','To compare RGB and Lab interpolation, use the same endpoints and inspect the lightness of the intermediate colors.')
  ],
  '3.4':[
    h('五种色系搭配','Five color harmonies'),
    table(['规则','色轮关系','主要特点'],['Rule','Hue-wheel relationship','Main characteristic'],
      [['单色 Monochromatic','同一色相，改变亮度和饱和度','整体统一'],['Monochromatic','One hue, varying lightness and saturation','A unified palette']],
      [['类比 Analogous','相邻色相，例如 ±30°','颜色接近'],['Analogous','Neighboring hues, for example ±30°','Closely related colors']],
      [['互补 Complementary','相隔 180°','两组颜色对比明显'],['Complementary','180° apart','A strong contrast between two groups']],
      [['三等分 Triadic','相隔 120°','形成三组色相'],['Triadic','120° apart','Three hue families']],
      [['分裂互补 Split-complementary','主色与互补色两侧，例如 +150°、+210°','保留对比，减少正对色的冲突'],['Split-complementary','Base hue and neighbors of its complement, such as +150° and +210°','Contrast with less direct opposition']] ),
    h('在色轮上构造色板','Constructing a palette on the wheel'),
    p('从主色相 H 开始，按规则增加偏移角。HSL 的色相是循环的，例如 350° 再加 30° 得到 20°。单色规则的色相相同，需要通过饱和度或亮度得到不同颜色。','Start from a base hue H and add the offsets for a harmony. Hue wraps around: 350° plus 30° becomes 20°. Monochromatic colors share a hue and differ through saturation or lightness.'),
    h('用到图表中','Using harmonies in charts'),
    p('色轮关系用来组织配色。用于类别图时，还要把颜色放进实际图形，比较小点、细线和背景上的效果；用于数值图时，则先检查是否形成了清楚的明度顺序。','Hue relationships organize a palette. For categories, compare the colors on actual small marks, thin lines and backgrounds. For numeric data, first inspect whether the palette has a clear lightness order.')
  ],
  '3.5':[
    h('常用科研配色','Common scientific palettes'),
    table(['色板','类型','用途'],['Palette','Type','Use'],
      [['Okabe-Ito / Wong','定性，八色','用不同颜色区分类别'],['Okabe-Ito / Wong','Qualitative, eight colors','Distinguish categories']],
      [['Paul Tol bright','定性，七色','白底图表中的类别编码'],['Paul Tol bright','Qualitative, seven colors','Category encoding on light backgrounds']],
      [['Tableau10','定性，十色','常见分类图表'],['Tableau10','Qualitative, ten colors','General categorical charts']],
      [['Viridis / Cividis','顺序型','热图、连续数值'],['Viridis / Cividis','Sequential','Heatmaps and continuous values']],
      [['RdBu / BrBG','发散型','相对基准的正负偏差'],['RdBu / BrBG','Diverging','Deviations around a reference']] ),
    p('定性色板是一个颜色数组；顺序型和发散型通常由插值器生成连续颜色。D3 的 <code>schemeTableau10</code> 属于前者，<code>interpolateViridis</code> 属于后者。','A qualitative palette is an array of colors. Sequential and diverging maps often use interpolators to generate a continuous range. D3’s <code>schemeTableau10</code> is an array; <code>interpolateViridis</code> is an interpolator.'),
    h('类别数量与颜色数量','Category count and palette size'),
    p('类别增加后，颜色间的区分会更困难。可以加入标签、形状和分面，或把次要类别归入“其他”。类别仍然是类别，应继续使用定性编码。','More categories make colors harder to distinguish. Add labels, shapes or small multiples, or group minor categories as “other”. The variable remains categorical and should retain a qualitative encoding.'),
    h('从色块到图形','From swatches to marks'),
    p('色板放成大色块时容易分辨，缩成散点后效果可能不同。演示同时展示色块和散点，可以比较同一套颜色在两种尺寸下的表现。','Large palette swatches may be easy to distinguish while small scatterplot marks are harder. The demonstration shows both so that the same colors can be compared at different sizes.')
  ],
  '3.6':[
    h('配色案例比较','Comparing color choices'),
    p('比较配色时，先固定数据、位置、大小和图例，只改变颜色映射。这样可以看清颜色本身增加了什么含义。','To compare palettes, fix the data, positions, mark sizes and legend, changing only the color mapping. This isolates the meaning introduced by color.'),
    table(['案例','观察内容'],['Case','What to inspect'],
      [['彩虹色编码连续数量','明暗变化是否有序，是否出现突兀的分界'],['Rainbow for continuous quantities','Check lightness order and abrupt visual boundaries']],
      [['红绿区分两组','灰度和色觉模拟下是否仍可区分'],['Red-green groups','Check separation in grayscale and color-vision simulations']],
      [['类别使用连续渐变','颜色深浅是否暗示了类别之间的排名'],['Continuous gradient for categories','Check whether lightness implies a ranking']],
      [['类别使用固定定性色板','同一类别在不同视图中是否保持同色'],['Stable qualitative palette','Check category-color consistency across views']] ),
    h('从读图任务判断配色','Judge colors through a reading task'),
    p('可以先回答“哪一组最大”“哪些点属于同一类”“哪里高于基准”，再比较不同配色下回答是否一致。颜色的选择要服务于这个读图任务。','Ask which group is largest, which points belong to the same category, or where values exceed a reference. Compare the answers across palettes. The palette should support the reading task.'),
    p('本节演示提供类别和连续数值两种任务。切换任务后，再选择顺序型、发散型或定性型，观察数据含义和颜色含义是否相符。','The demonstration provides both categorical and continuous tasks. Switch tasks, then compare sequential, diverging and qualitative choices with the meaning of the variable.')
  ],
  '3.7':[
    h('鲜明的主色与低饱和配色','A distinct main color and muted companions'),
    p('原课程把配色生成概括为几个参数：色相控制颜色之间的区别，饱和度控制鲜艳程度，亮度控制明暗。主色与配套色可以采用不同的饱和度和亮度。','The original course describes palette generation through hue, saturation and lightness. Hue separates color families, saturation controls intensity, and lightness controls darkness. A main color and its companions can use different saturation and lightness.'),
    list(
      ['<strong>主色：</strong>确定主要色相，用于重点对象。','<strong>Main color:</strong> choose the base hue for the emphasized object.'],
      ['<strong>配套色：</strong>从相邻或互补色相出发，适当降低饱和度。','<strong>Companions:</strong> use neighboring or complementary hues with lower saturation.'],
      ['<strong>背景与注释：</strong>用较浅、较低饱和的颜色与主要图形拉开层次。','<strong>Backgrounds and annotations:</strong> use lighter, less saturated colors to separate them from the marks.'] ),
    h('原课程的七色构造','The original seven-color recipe'),
    p('主色、两侧类比色、两个低饱和类比色、互补色、浅色，共七个位置。先计算色相偏移，再分别调整 S 和 L。颜色之间的关系由规则确定，具体参数可以通过演示比较。','The recipe contains a main color, two analogous colors, two muted analogous colors, a complement and a light tint. Calculate hue offsets, then adjust S and L for each role. The demonstration allows the parameters to be compared.'),
    h('把颜色放回图表','Apply the colors to a chart'),
    p('生成色板后，在相同的图形上比较：主色是否突出，背景是否抢眼，细线和文字是否清楚。调整颜色数量时，也要同步检查图例和类别的对应关系。','After generating a palette, compare it on the same chart: whether the main color stands out, whether the background competes with the marks, and whether lines and text are clear. When changing the palette size, also check the category-to-legend mapping.')
  ],
  '3.8':[
    h('用整张图检查颜色','Checking color in the complete figure'),
    p('本节沿用原课程的三个案例：分类散点图、顺序型热图、红绿对比。色块展示颜色本身，整张图则能检查点的大小、线条、背景和图例共同作用后的效果。','This section follows the original three cases: a categorical scatterplot, a sequential heatmap and a red-green comparison. A complete figure reveals how mark size, lines, background and legend interact with color.'),
    h('检查流程','Inspection steps'),
    list(
      ['先阅读原图，明确图中哪些信息依靠颜色表达。','Read the original and identify which information depends on color.'],
      ['切换灰度或色觉模拟，观察类别、数值顺序和图例是否仍能读出。','Switch to grayscale or a color-vision simulation; inspect categories, value order and legend.'],
      ['加入文字、形状或线型，再比较关键对象是否更容易辨认。','Add text, shapes or line styles and compare how clearly key objects can be identified.'] ),
    h('冗余编码','Redundant encoding'),
    p('同一类别可以同时使用颜色和形状，折线可以同时使用颜色和线型，关键数值可以直接标注。这样，读者有多种线索可以交叉判断。','A category can use both color and shape, a line can use both color and dash pattern, and key values can carry direct labels. Readers can then use several cues together.')
  ],
  '4.1':[
    h('宽表与长表','Wide and long tables'),
    p('原课程用美国各州的犯罪数据说明表格转换：一行代表一个州，多列分别记录不同指标。这是宽格式。把每个指标展开为一行，就得到长格式。','The original course uses state-level crime data to explain table reshaping. One row per state and one column per measure is wide format. Expanding the measures into individual rows produces long format.'),
    table(['格式','一行代表什么','字段示例'],['Format','One row represents','Example fields'],
      [['宽表 Wide','一个实体','state、murder、robbery、burglary'],['Wide','An entity','state, murder, robbery, burglary']],
      [['长表 Long','一个实体的一个指标','state、metric、value'],['Long','One measure of an entity','state, metric, value']] ),
    h('为什么要转换','Why reshape?'),
    p('宽表便于并排查看多个指标；长表便于按指标过滤、分组和绑定图形。原课程的热图用州名和指标名决定位置，用 value 决定颜色。','Wide tables place measures side by side. Long tables make filtering, grouping and mark binding convenient. The original heatmap uses state and metric for position and value for color.'),
    h('flatMap 与类型转换','flatMap and type conversion'),
    p('<code>flatMap</code> 先为每个实体生成一组指标记录，再展开一层数组。转换后保留实体标识和指标名，它们共同确定一个单元格。<code>d3.autoType</code> 可以自动转换常见类型；编号等有固定格式的字段也可以在行回调中显式处理。','<code>flatMap</code> generates measure records for each entity and flattens one array level. Retain the entity identifier and measure name as a compound cell key. <code>d3.autoType</code> converts common types, while fields such as formatted IDs can be handled explicitly in a row callback.')
  ],
  '4.2':[
    h('数据空间、坐标系空间与屏幕空间','Data, plot and screen space'),
    p('原课程用散点图说明坐标变换：数据中的数值先映射到绘图区域，再加上边距放到 SVG 中。点、线和坐标轴应使用相同的映射规则。','The original scatterplot illustrates coordinate transformation. Values are mapped into a plotting region, then margins place that region in the SVG. Marks and axes should use the same mapping.'),
    table(['空间','内容','例子'],['Space','Content','Example'],
      [['数据空间','原始字段值','人数 100、成绩 80'],['Data','Original field values','Count 100, score 80']],
      [['坐标系空间','绘图区域内的坐标','0 到 innerWidth'],['Plot','Coordinates within the plotting region','0 to innerWidth']],
      [['屏幕空间','加入边距后的 SVG 坐标','translate(margin.left, margin.top)'],['Screen','SVG coordinates including margins','translate(margin.left, margin.top)']] ),
    h('选择比例尺','Choosing a scale'),
    table(['比例尺','等距表示','常见用途'],['Scale','Equal distances represent','Use'],
      [['scaleLinear','相同差值','普通数值轴'],['scaleLinear','Equal differences','General numeric axis']],
      [['scaleLog','相同比值','跨多个数量级的数据'],['scaleLog','Equal ratios','Values spanning orders of magnitude']],
      [['scaleSqrt','平方根变化','用圆的半径表达面积对应的数量'],['scaleSqrt','Square-root changes','Radius for area-proportional circles']],
      [['scaleBand','离散类别的位置区间','柱状图类别轴'],['scaleBand','Bands for discrete categories','Bar-chart category axis']] ),
    p('线性尺度上，1、10、100 的位置不等距；对数尺度上，相邻十倍数等距。改变比例尺后数据值保持不变，变化的是它们在屏幕上的距离。','On a linear scale, 1, 10 and 100 are not equally spaced. On a log scale, successive powers of ten are equally spaced. The values stay the same; their screen distances change.'),
    h('坐标轴的作用','What an axis does'),
    p('<code>d3.axisBottom(x)</code> 根据 x 比例尺生成刻度和文字。坐标轴使用比例尺，图形也使用这个比例尺，二者就能保持对齐。','<code>d3.axisBottom(x)</code> generates ticks and labels using the x scale. Using the same scale for the axis and marks keeps them aligned.')
  ],
  '4.3':[
    h('插值与拟合','Interpolation and fitting'),
    table(['方法','目的','例子'],['Method','Purpose','Example'],
      [['插值 Interpolation','根据已有采样构造连接或中间值','折线、Catmull-Rom、Natural'],['Interpolation','Construct connections or intermediate values from samples','Linear, Catmull-Rom, natural spline']],
      [['拟合 Fitting','用模型概括数据关系','线性回归、LOESS'],['Fitting','Summarize a relationship with a model','Linear regression, LOESS']] ),
    p('原课程用 <code>d3.line().curve(...)</code> 切换曲线。它决定点之间怎样连接。部分曲线经过采样点，Basis 等曲线采用不同的平滑规则。最小二乘直线则通过最小化残差平方和求出一条模型直线。','The original course switches curves with <code>d3.line().curve(...)</code>. This controls how samples are connected. Some curves pass through samples, while basis uses a different smoothing rule. A least-squares line fits a model by minimizing the sum of squared residuals.'),
    h('常用曲线','Common curves'),
    table(['曲线','特点','适合观察'],['Curve','Characteristic','Useful for'],
      [['linear','相邻点之间画直线','直接查看采样与变化'],['linear','Straight segments between samples','Inspect samples and changes']],
      [['step / stepBefore / stepAfter','以阶梯连接','状态切换与离散更新'],['step / stepBefore / stepAfter','Step connections','State changes and discrete updates']],
      [['monotoneX','沿 x 方向保持相邻点间的单调性','避免相邻样本间新增局部极值'],['monotoneX','Preserves monotonicity between samples along x','Avoid additional local extrema']],
      [['Catmull-Rom / natural','经过采样点的平滑连接','比较曲线形状'],['Catmull-Rom / natural','Smooth connections through samples','Compare curve shape']],
      [['basis','B 样条平滑','观察平滑规则对形状的影响'],['basis','B-spline smoothing','Inspect the effect of smoothing']] ),
    h('保持采样点可见','Keep samples visible'),
    p('更换曲线时保留原始点，可以看清哪些位置来自观测、哪些形状来自连接规则。叠加拟合直线后，再比较它与采样点之间的残差。','Retain the sample marks when switching curves to distinguish observations from the connection rule. Overlay the fitted line and compare residuals between it and the samples.')
  ],
  '4.4':[
    h('纵横比与倾角感知','Aspect ratio and perceived slope'),
    p('同一组数值画在较矮的图中，线条显得平缓；画在较高的图中，线条显得陡峭。图形纵横比会改变视觉倾角，因此比较变化时要同时阅读坐标轴。','The same values appear flatter in a shorter chart and steeper in a taller one. Aspect ratio changes the visual angle, so read the axes when comparing change.'),
    h('45° 的设计启发','Banking toward 45 degrees'),
    p('原课程提出“平均倾斜度约为 45°”的安排。它来自折线图纵横比的设计研究，目的是让局部变化更容易比较。实际作图时，可以调整绘图区域高度，观察哪些变化被压平、哪些变化被夸大。','The original course discusses arranging average slopes near 45 degrees. This comes from research on line-chart aspect ratios and aims to make local changes easier to compare. Adjust the plot height to see which changes become flattened or exaggerated.'),
    h('数据斜率与屏幕斜率','Data slope and screen slope'),
    p('数据中的斜率由 Δy / Δx 决定；屏幕上的斜率还乘上两个方向的像素缩放比例。只改变 y 比例尺的 <code>range</code>，就能在数据不变的情况下改变线条倾角。','Data slope is Δy / Δx. Screen slope also depends on the ratio of pixel scales in the two directions. Changing only the y scale’s <code>range</code> changes the angle while retaining the data.'),
    p('本节可以保存 A 图，再改变 B 图的高度。比较两个视图中的同一段线，并核对对应的数值和坐标范围。','Save chart A, then change the height of B. Compare the same segment in both views and check its values and axis domains.')
  ],
  '4.5':[
    h('标量场与等值线','Scalar fields and contours'),
    p('标量场在空间中的每个位置对应一个数值，例如温度、海拔或密度。等值线连接取值相同的位置，把高于与低于某个阈值的区域分开。','A scalar field assigns a value to each spatial position, such as temperature, elevation or density. A contour connects equal-valued positions and separates regions above and below a threshold.'),
    h('Marching Squares 的 16 种情况','The sixteen Marching Squares cases'),
    p('把标量场采样为网格。每个单元有四个角，每个角根据是否达到阈值得到 0 或 1。四位二进制共有 2⁴ = 16 种组合，每种组合对应一种连线情况。','Sample the field on a grid. Each cell has four corners, each assigned 0 or 1 according to the threshold. Four bits give 2⁴ = 16 combinations, each associated with contour segments.'),
    list(
      ['给四个角确定编号，并使编码、查表和绘图使用相同顺序。','Use the same corner order for bit encoding, table lookup and drawing.'],
      ['检查每条边的两个端点，找出跨过阈值的边。','Inspect edge endpoints to find edges crossing the threshold.'],
      ['在边上做线性插值，再连接相应的交点。','Interpolate crossing positions on edges and connect the corresponding points.'] ),
    h('边插值与歧义','Edge interpolation and ambiguity'),
    p('一条边的端点值为 v₀、v₁，阈值为 t 时，交点比例为 <code>(t − v₀) / (v₁ − v₀)</code>。交替高低的两种状态具有两种连接方式，本节演示可以切换处理方式，观察单元中心附近的连接变化。','For endpoint values v₀ and v₁ and threshold t, the crossing fraction is <code>(t − v₀) / (v₁ − v₀)</code>. Alternating high-low corners admit two connections. The demonstration lets you compare the ambiguous connections around the cell center.'),
    h('D3 中的等值线','Contours in D3'),
    p('<code>d3.contours</code> 接收按行展开的网格数值，输出 GeoJSON MultiPolygon。<code>size</code> 指网格列数与行数，<code>thresholds</code> 指等值，绘图时再把网格坐标映射为屏幕像素。','<code>d3.contours</code> accepts row-major grid values and returns GeoJSON MultiPolygons. <code>size</code> specifies columns and rows; <code>thresholds</code> specifies contour values. Grid coordinates are then mapped to screen pixels.')
  ],
  '5.1':[
    h('时间的五个属性','Five properties of time'),
    table(['属性','含义','可视化中的例子'],['Property','Meaning','Visualization example'],
      [['有序性','两个事件有先后次序','按时间排序的日志、折线图'],['Ordered','Events have an order','Sorted event logs, line charts']],
      [['连续性','两个时刻之间还有其他时刻','用实际时间间隔安排位置'],['Continuous','Other instants exist between two instants','Position by elapsed time']],
      [['周期性','过程可能重复出现','昼夜、星期、季节'],['Periodic','Processes may repeat','Day/night, weeks, seasons']],
      [['独立于空间','可以把时间与空间位置分别表示','时间轴与地图分别编码'],['Independent of space','Time and spatial location can be represented separately','Timeline and map encodings']],
      [['结构性','年、月、日等尺度构成层次','日历、周排列、闰年'],['Structured','Units such as years, months and days form a hierarchy','Calendars, weeks, leap years']] ),
    h('时间本身与采样间隔','Time and sampling intervals'),
    p('时间连续，但记录可能按天、按月采集，也可能间隔不规则。相邻两条记录在数组中相邻，不表示它们相隔同样长的时间。使用时间比例尺，可以把真实的时间间隔保留在图中。','Time is continuous, while records may be daily, monthly or irregular. Adjacent array entries need not be equally spaced in time. A temporal scale retains the elapsed intervals in the graphic.'),
    h('日历结构','Calendar structure'),
    p('一个月的天数不同，闰年还包含 2 月 29 日。D3 的时间间隔提供 <code>range</code>、<code>offset</code> 和 <code>count</code>，分别用于生成日期、移动日期和计算间隔数量。','Months have different lengths, and leap years contain February 29. D3 intervals provide <code>range</code>, <code>offset</code> and <code>count</code> for generating dates, moving dates and counting interval boundaries.'),
    p('演示把五个属性分别展开，并用一组日期比较按序号等距排列与按实际时间排列。','The demonstration expands the five properties and compares equal index spacing with elapsed-time spacing for a set of dates.')
  ],
  '5.2':[
    h('标准时序图：折线图','Standard temporal visualization: line charts'),
    p('折线图的横轴表示时间，纵轴表示度量。原课程以 Marie、Jean、Camille 等人名的使用频率为例，比较不同名字随年份变化的趋势。','A temporal line chart uses time on the horizontal axis and a measure on the vertical axis. The original course compares the frequency of names such as Marie, Jean and Camille over the years.'),
    h('时间解析、比例尺与格式化','Parsing, scaling and formatting time'),
    list(
      ['<code>timeParse</code>：把字符串解析为日期，例如年份“1965”。','<code>timeParse</code> parses a string such as the year “1965” into a date.'],
      ['<code>scaleTime</code> 或 <code>scaleUtc</code>：把日期映射到横坐标。','<code>scaleTime</code> or <code>scaleUtc</code> maps dates to horizontal coordinates.'],
      ['<code>timeFormat</code> 或 <code>utcFormat</code>：把日期显示为刻度和提示中的文字。','<code>timeFormat</code> or <code>utcFormat</code> formats dates in ticks and tooltips.'] ),
    h('高亮与时间段筛选','Highlighting and time-range filters'),
    p('多条曲线可以共享同一个时间轴。悬停时显示当前日期和数值，选中一条曲线时降低其他曲线的透明度；筛选时间段时，同步调整比例尺范围和显示的数据。','Several series can share one time axis. Hovering reveals dates and values; selecting a line can dim the others. A time-range filter updates both the displayed records and the scale domain.'),
    h('缺失值如何连接','Connecting across missing values'),
    p('没有记录的日期与记录为 0 的日期含义不同。<code>line.defined(...)</code> 可以在缺失处断开曲线。本节以同一组逐日数值比较断开和补零后的形状。','A date without a reading differs from a date whose reading is zero. <code>line.defined(...)</code> can break a line at missing values. This section compares gaps and zero substitution using the same daily sequence.')
  ],
  '5.3':[
    h('日历热图','Calendar heatmaps'),
    p('日历热图把每一天画成一个小格，横向表示周，纵向表示星期，颜色表示当天的数值。原课程用每日最高温度展示这种布局，并用月份分隔线帮助定位。','A calendar heatmap represents each day with a cell. Columns represent weeks, rows represent weekdays, and color represents the daily value. The original example uses daily maximum temperatures and month boundaries.'),
    h('从日期计算行与列','Calculating rows and columns'),
    table(['图形属性','计算内容'],['Graphic property','Calculation'],
      [['列','从起始周到当前日期跨过了多少周'],['Column','Week boundaries from the initial week to the date']],
      [['行','当前日期是星期几'],['Row','Day of the week']],
      [['颜色','当天的数值对应的颜色'],['Color','Mapped value for the date']],
      [['边界','月份或年份的分隔'],['Boundary','Month or year division']] ),
    p('周日或周一都可以作为一周起点，但列计数和星期编号要配套。以周一为起点时，<code>(getUTCDay() + 6) % 7</code> 把星期一转换为第 0 行。','A week can start on Sunday or Monday, provided the week count and weekday index agree. For Monday-first UTC calendars, <code>(getUTCDay() + 6) % 7</code> maps Monday to row zero.'),
    h('闰日、月份与缺失日期','Leap days, months and missing dates'),
    p('先生成全年日期，再按日期键查找数值，可以让缺失日期保留自己的位置。闰年会自然生成 366 个日格。月份分隔线沿月初日期的行列位置绘制，便于比较月份之间的变化。','Generate all dates first, then look up readings by date key so missing days retain their positions. A leap year produces 366 cells. Month boundaries follow the row and column positions of the month’s first date.')
  ],
  '5.4':[
    h('周期时间与螺旋布局','Periodic time and spiral layouts'),
    p('折线图沿一个方向展开时间；螺旋图让相同相位重复出现在相近的角度，用半径区分先后周期。每天、每周、每月或每年都可以作为一个待比较的周期。','A line chart unfolds time in one direction. A spiral places equal phases at similar angles and separates successive cycles by radius. A day, week, month or year can be selected as the period to compare.'),
    h('阿基米德螺旋','The Archimedean spiral'),
    p('阿基米德螺旋的公式是 <code>r = a + bθ</code>。θ 增加 2π，半径增加 <code>2πb</code>；因此相邻两圈的径向间距相同。把极坐标转换为 <code>x = r cosθ</code>、<code>y = r sinθ</code>，就能在 SVG 中绘制。','An Archimedean spiral follows <code>r = a + bθ</code>. Increasing θ by 2π increases radius by <code>2πb</code>, so successive turns have equal radial spacing. Convert to <code>x = r cosθ</code> and <code>y = r sinθ</code> to draw it in SVG.'),
    h('两种角度安排','Two ways to allocate angles'),
    list(
      ['<strong>按周期等分：</strong>每个周期占一圈，同一相位的日期沿相近方向排列，便于检查周期。','<strong>Equal phase steps:</strong> assign one turn per period, aligning equal phases for cycle comparisons.'],
      ['<strong>近似等弧长：</strong>半径变大时减小角度增量，原课程使用 <code>Δθ ≈ boxSize / √(b² + r²)</code>，使小格长度接近。','<strong>Approximately equal arc length:</strong> reduce the angular step as radius grows. The original recipe uses <code>Δθ ≈ boxSize / √(b² + r²)</code> for similar cell lengths.'] ),
    h('扇环路径与周期比较','Segment paths and cycle comparison'),
    p('一个螺旋小格可以由起点外侧、终点外侧、终点内侧、起点内侧四个顶点闭合而成。本节演示采用按周期等分的角度排列：改变每圈天数，观察高值区是否在相同方向对齐。','A spiral cell can close four vertices: outer start, outer end, inner end and inner start. This demonstration uses equal phase steps: change days per turn and inspect whether high values align in the same direction.')
  ],
  '5.5':[
    h('Storyline 时间线','Storyline timelines'),
    p('Storyline 把人物、组织或进程画成沿时间延伸的线。线靠近表示同一事件或群组，线分开表示关系发生变化。原课程使用《侏罗纪公园》角色说明人物的聚散。','A storyline draws a character, organization or process as a line extending through time. Nearby lines represent a shared event or group; separation represents a change. The original course illustrates this with Jurassic Park characters.'),
    table(['元素','表达内容'],['Element','Meaning'],
      [['时间轴','事件发生的先后与间隔'],['Time axis','Event order and intervals']],
      [['角色线','同一角色跨时间的连续轨迹'],['Character line','A character’s continuity over time']],
      [['聚拢与分离','参与同一事件或离开群组'],['Grouping and separation','Joining an event or leaving a group']],
      [['事件标记','关键时刻与文字说明'],['Event marker','A key instant and its description']] ),
    h('路径层与事件层','Path and event layers'),
    p('每个角色有一组时间与纵向位置的关键点，<code>d3.line</code> 为它生成路径。事件单独放在另一组 <code>g</code> 中，使用圆、标记和文字说明关键时刻。两层可以分别筛选和高亮。','Each character has time-position key points, which <code>d3.line</code> converts into a path. Events occupy a separate <code>g</code> layer with circles, markers and labels. The layers can be filtered and highlighted independently.'),
    h('怎样阅读纵向位置','Reading vertical position'),
    p('Storyline 的纵向位置用于组织角色关系，并不一定表示一个数值量。同一时刻的靠近应结合事件标签阅读；曲线之间的交叉也要与角色身份、事件信息一起判断。','Vertical position in a storyline organizes relationships and need not represent a measured quantity. Read proximity together with event labels, and interpret crossings using character identities and event information.')
  ]
};

export function readingOutline(id,lang='zh'){
  return (readingNotes[id]||[]).filter(block=>block.kind==='h').map((block,i)=>({id:`reading-${i}`,title:block.text[lang]}));
}

export function renderReading(id,lang='zh'){
  let heading=0;
  return (readingNotes[id]||[]).map(block=>{
    if(block.kind==='h')return `<h2 id="reading-${heading++}">${block.text[lang]}</h2>`;
    if(block.kind==='p')return `<p>${block.text[lang]}</p>`;
    if(block.kind==='list')return `<ul>${block.items.map(item=>`<li>${item[lang]}</li>`).join('')}</ul>`;
    if(block.kind==='table')return `<div class="reading-table-wrap" role="region" tabindex="0" aria-label="${block.head[lang].join(' / ')}"><table class="reading-table"><thead><tr>${block.head[lang].map(cell=>`<th scope="col">${cell}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row=>`<tr>${row[lang].map((cell,i)=>i===0?`<th scope="row">${cell}</th>`:`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return '';
  }).join('');
}

const markdownInline=text=>text.replace(/<code>(.*?)<\/code>/g,'`$1`').replace(/<strong>(.*?)<\/strong>/g,'**$1**').replace(/<[^>]+>/g,'');
export function readingMarkdown(id,lang='zh'){
  return (readingNotes[id]||[]).map(block=>{
    if(block.kind==='h')return `### ${block.text[lang]}`;
    if(block.kind==='p')return markdownInline(block.text[lang]);
    if(block.kind==='list')return block.items.map(item=>'- '+markdownInline(item[lang])).join('\n');
    if(block.kind==='table')return ['| '+block.head[lang].join(' | ')+' |','| '+block.head[lang].map(()=>'---').join(' | ')+' |',...block.rows.map(row=>'| '+row[lang].map(markdownInline).join(' | ')+' |')].join('\n');
    return '';
  }).join('\n\n');
}
