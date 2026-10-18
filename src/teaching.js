const b = (zh, en) => ({ zh, en });
const p = (question, questionEn, a, aEn, c, cEn, answer, insight, insightEn, preset) => ({
  question: b(question, questionEn), options: [b(a, aEn), b(c, cEn)], answer,
  insight: b(insight, insightEn), preset
});

// Predictions are deliberately separate from the transfer questions: commit to
// a hypothesis, manipulate the example, then test it in another context.
export const prompts = {
  records: p('给记录重新排序，同一个点会变成另一个人吗？','Does sorting turn a mark into another person?', '会，行号变了','Yes, the row number changes','不会，编号仍然相同','No, its ID stays the same',1,'位置会变，身份不变。','Position can change while identity stays the same.',{operation:'sort',selected:'S017'}),
  semantics: p('学号用数字存储，求平均值就有意义吗？','Does storing student IDs as numbers make their average meaningful?','有意义，只要能计算','Yes, if it can be computed','没有，编号只区分身份','No, IDs only identify entities',1,'能计算，不等于有意义。','Computable does not mean meaningful.',{semantic:'temperature'}),
  transform: p('只保留 85 分以上的记录，原始人数会减少吗？','Does filtering scores below 85 reduce the source population?','会，数据被删掉了','Yes, those records are deleted','不会，只改变当前结果','No, only the result changes',1,'过滤改变结果集合，排序改变顺序。','Filtering changes membership; sorting changes order.',{operation:'filter',threshold:85}),
  join: p('A、B、C 换成 B、C、D，需要新建图元吗？','Does replacing A,B,C with B,C,D create a new mark?','不需要，仍然是三个','No, there are still three','需要，D 是新的对象','Yes, D is a new entity',1,'更新看身份，不只看数量。','Updates depend on identity, not just count.',{next:'B,C,D',joined:true}),
  pipeline: p('换一种布局，能修正分错的组吗？','Can a different layout fix incorrect grouping?','能，重新画一次就好','Yes, redraw it','不能，要回到分组步骤','No, fix the grouping step',1,'每个图形，都有一条上游的数据链。','Every view has an upstream chain of transformations.',{stage:3}),
  groups: p('专业改成班级分组，总人数还会是 80 吗？','Will the total stay at 80 when grouping by class?','会，只是分法不同','Yes, only the groups change','不会，组数增加了','No, there are more groups',0,'汇总的每一个数，都应该找得到成员。','Every aggregate should be traceable to its members.',{field:'class'}),
  tree: p('把树转个方向，父子关系会改变吗？','Does rotating a tree change parent-child relationships?','会，位置就是关系','Yes, position is relationship','不会，只改变位置','No, only coordinates change',1,'结构是关系，布局是位置。','Structure is relationship; layout is position.',{orientation:'vertical'}),
  treeList: p('折叠“设计”专业，其中的学生还在吗？','Do students remain when Design is collapsed?','还在，只是暂时隐藏','Yes, temporarily hidden','不在，已经移出数据','No, removed from the data',0,'视图隐藏，不等于数据消失。','Hidden in a view does not mean absent from the data.',{collapsed:['Design']}),
  palette: p('用越来越深的颜色表示学院，会暗示大小吗？','Do increasingly dark colors imply magnitude for majors?','会，让人以为存在排名','Yes, they suggest a ranking','不会，只是更好看','No, they are merely decorative',0,'先确定颜色要表达的含义。','Decide what color means before choosing it.',{palette:'categorical'}),
  vision: p('去掉颜色以后，还能可靠地认出数值吗？','Can values still be identified without color?','总可以，颜色不会影响','Always, color makes no difference','要看标签等其他线索','It depends on labels and other cues',1,'重要的信息，需要不止一种线索。','Important information needs more than one cue.',{vision:'gray'}),
  colorModel: p('只改变色相，会让颜色按数量排好序吗？','Does changing hue alone produce a quantitative order?','会，色相本来有大小','Yes, hue implies magnitude','不会，色相更适合区分','No, hue primarily distinguishes',1,'不同的颜色维度，承担不同的任务。','Different color dimensions serve different tasks.',{hue:20}),
  gamut: p('颜色模型中的所有坐标，都能显示出来吗？','Can every coordinate in a color model be displayed?','可以，模型就是屏幕','Yes, the model is the screen','不一定，屏幕有色域边界','Not always; screens have a gamut',1,'模型的范围，不等于设备的能力。','A model’s range is not a device’s capability.',{lightness:85}),
  harmony: p('互补色很协调，就适合表现温度高低吗？','Does a harmonious complementary pair guarantee a temperature scale?','适合，协调就足够了','Yes, harmony is enough','还要检查明度和顺序','Check lightness and order too',1,'配色规则不能替代数据语义。','Color harmony cannot replace data semantics.',{harmony:'complementary'}),
  generator: p('颜色数量翻倍，每一类还容易辨认吗？','Are categories still distinct after doubling the colors?','不一定，需要实际检查','Not necessarily; inspect them','一定，数量没有影响','Always; count makes no difference',0,'色板要放回实际图形里检验。','Inspect a palette in the actual chart.',{count:10}),
  reshape: p('三列数值变成三行，是新增了三个对象吗？','Do three value columns becoming rows create new entities?','是，行数变多了','Yes, there are more rows','不是，要追踪实体编号','No, track the entity IDs',1,'表格的形状改变，观测的含义不变。','The table’s shape can change without new observations.',{layout:'long'}),
  scale: p('1、10、100、1000 能在轴上等距吗？','Can 1,10,100,1000 be equally spaced on an axis?','能，用对数尺度','Yes, on a logarithmic scale','不能，数值差不同','No, their differences are unequal',0,'线性读差值，对数读倍数。','Linear distance expresses differences; log distance expresses ratios.',{scale:'log'}),
  curve: p('把折线变平滑，会增加新的观测点吗？','Does smoothing a line add observations?','会，曲线上都是数据','Yes, every point on the curve is data','不会，只改变连接方式','No, only the connection changes',1,'连线是一种假设，采样点才是观测。','A connection is an assumption; samples are observations.',{curve:'catmull'}),
  aspect: p('把同一张图拉高，数值增长率会变吗？','Does stretching a chart change its numerical growth rate?','会，斜率看起来更大','Yes, it looks steeper','不会，数据没有改变','No, the data stays the same',1,'画面的陡峭程度，不等于真实增长率。','Visual steepness is not the numerical rate of change.',{height:300}),
  contour: p('一个角高于阈值，另外三个低于阈值，会有几个边交点？','With one corner above the threshold, how many edge crossings occur?','2 个','2','4 个','4',0,'先分类，再插值，最后连接。','Classify, interpolate, then connect.',{corners:[70,30,30,30],iso:50,show:3}),
  time: p('传感器某天没记录，就能把那一天画成零吗？','Can a missing sensor reading be shown as zero?','可以，没有就是零','Yes, absence means zero','不可以，未知不等于零','No, unknown is not zero',1,'时间的含义，优先于图形的整齐。','Temporal meaning comes before visual neatness.',{view:'calendar',day:90}),
  period: p('每圈从 14 天改成 7 天，会改变数据本身吗？','Does switching from 14 to 7 days per turn change the data?','会，周期缩短一半','Yes, it halves the period','不会，只改变观察方式','No, it changes the view',1,'显示周期是一个需要验证的假设。','A display period is a hypothesis to test.',{period:7,revealed:false}),
  story: p('两条故事线靠近，一定表示两个数值相近吗？','Do nearby storylines necessarily mean similar numerical values?','是，距离表示差值','Yes, distance means difference','不是，要看事件的定义','No, read the event definition',1,'先读编码约定，再解释线条。','Read the encoding convention before interpreting lines.',{event:2,character:1})
};

const overrides = {
  '1.1': p('合成样本里的平均分，能代表真实学生吗？','Can synthetic averages represent real students?','能，有 80 条记录就够了','Yes, 80 records are enough','不能，需要真实采样依据','No, real sampling evidence is needed',1,'看图之前，先问数据从哪里来。','Before reading a chart, ask where its data came from.',{selected:'S017'}),
  '5.2': p('要看一整年的升降，先选哪种图？','Which view would you try first for annual change?','折线图','A line chart','日历格子','A calendar',0,'让图形的结构，贴近要回答的问题。','Match the structure of the view to the question.',{view:'line',day:181}),
  '5.3': p('要查 2 月 29 日，哪种布局更直接？','Which layout makes February 29 easier to locate?','日历布局','A calendar layout','年度螺旋','An annual spiral',0,'同一份数据，可以有不同的阅读入口。','The same data can support different reading tasks.',{view:'calendar',day:59})
};
export const teachingFor = section => overrides[section.id] || prompts[section.kind];

export function describeExperiment(section, state, lang='zh') {
  const L=(zh,en)=>lang==='zh'?zh:en;
  const values={all:L('原始记录','original'),sort:L('成绩降序','score descending'),filter:L('成绩过滤','score filter'),id:L('编号','ID'),rank:L('等级','rank'),temperature:L('温度','temperature'),count:L('人数','count'),major:L('专业','major'),class:L('班级','class'),horizontal:L('横向','horizontal'),vertical:L('纵向','vertical'),category:L('学院类别','college categories'),deviation:L('相对基准偏差','deviation'),categorical:L('定性','categorical'),sequential:L('顺序','sequential'),diverging:L('发散','diverging'),original:L('原色','original'),gray:L('灰度','grayscale'),cvd:L('绿色觉缺陷近似','deuteranopia preview'),analogous:L('类似色','analogous'),complementary:L('互补色','complementary'),triadic:L('三角色','triadic'),wide:L('宽表','wide'),long:L('长表','long'),linear:L('线性','linear'),log:L('对数','logarithmic'),line:L('折线','line'),calendar:L('日历','calendar'),spiral:L('年度螺旋','annual spiral')};
  const v=key=>values[state[key]]??String(state[key]);
  const item=(zh,en,key)=>`${L(zh,en)}${L('：',': ')}${v(key)}`;
  const common=[item('选中记录','Selected record','selected')];
  switch(section.kind){
    case 'records':case 'transform':return [item('处理方式','Operation','operation'),...(state.operation==='filter'?[`${L('最低成绩','Minimum score')}: ${state.threshold}`]:[]),...common];
    case 'semantics':return [item('数字含义','Number meaning','semantic')];
    case 'join':return [`${L('新数据','New data')}: ${state.next}`,L(state.joined?'已应用新数据':'尚未应用新数据',state.joined?'New data applied':'New data not yet applied')];
    case 'pipeline':return [`${L('阶段','Stage')}: ${[L('原始记录','records'),L('分组统计','groups'),L('层次结构','hierarchy'),L('图形视图','view')][Number(state.stage)]}`,...common];
    case 'groups':return [item('分组字段','Group by','field')];
    case 'tree':return [item('方向','Orientation','orientation')];
    case 'treeList':return [`${L('折叠的专业','Collapsed majors')}: ${state.collapsed.length?state.collapsed.join(', '):L('无','none')}`];
    case 'palette':case 'vision':return [item('数据情境','Data context','context'),item('色板','Palette','palette'),...(section.kind==='vision'?[item('观看条件','Viewing condition','vision'),L(state.labels?'显示数值标签':'隐藏数值标签',state.labels?'Value labels visible':'Value labels hidden')]:[])];
    case 'colorModel':return [`H: ${state.hue}°`,`${L('HSL 亮度','HSL lightness')}: ${state.lightness}%`];
    case 'gamut':return [`Lab L: ${state.lightness}`];
    case 'harmony':return [`${L('基准色相','Base hue')}: ${state.hue}°`,item('色相关系','Hue relationship','harmony')];
    case 'generator':return [`${L('基准色相','Base hue')}: ${state.hue}°`,`${L('饱和度','Saturation')}: ${state.saturation}%`,`${L('颜色数量','Color count')}: ${state.count}`];
    case 'reshape':return [item('表格形式','Table form','layout'),`${L('追踪数值','Following value')}: ${state.cellKey}`];
    case 'scale':return [item('尺度','Scale','scale')];
    case 'curve':return [item('连接方式','Interpolation','curve')];
    case 'aspect':return [`${L('图形高度','Chart height')}: ${state.height}`];
    case 'contour':return [`${L('阈值','Threshold')}: ${state.iso}`,state.corners?`${L('独立角点','Independent corners')}: ${state.corners.join(', ')}`:`${L('场中网格','Field cell')}: ${state.cell+1}`,`${L('推导阶段','Construction stage')}: ${Number(state.show)+1}`];
    case 'time':return [item('时间视图','Time view','view'),`${L('选中日期','Selected date')}: ${new Date(Date.UTC(2024,0,1)+state.day*86400000).toISOString().slice(0,10)}`];
    case 'period':return [`${L('每圈天数','Days per turn')}: ${state.period}`];
    case 'story':return [`${L('角色','Character')}: ${L(['林','周','陈'][state.character],['Lin','Zhou','Chen'][state.character])}`,`${L('事件','Event')}: ${Number(state.event)+1}`];
    default:return [];
  }
}

export const lessonTakeaways = [
  b('知道数据代表谁，也知道它不能代表谁。','Know whom the data represents, and whom it does not.'),
  b('沿着记录、分组和布局，把结果追溯到原因。','Trace a result back through records, grouping and layout.'),
  b('让颜色传达含义，并让不同的人读懂。','Make color meaningful and readable to different people.'),
  b('分清数据事实，与绘图方式制造的印象。','Separate data facts from impressions created by a drawing.'),
  b('按问题选择时间视图，保留日期与缺失的含义。','Choose temporal views by task, preserving dates and missingness.')
];
