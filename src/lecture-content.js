import { students, daily, transformRecords, groupRecords, matchKeys, makeField, marchingCell } from './core.js';
import { teachingFor, describeExperiment } from './teaching.js';

const b=(zh,en)=>({zh,en});
const beat=(zh,en,preset)=>({title:b(zh,en),preset});

export function lectureInitial(section){
  if(section.kind==='contour'){
    const field=makeField();
    for(const iso of [50,45,55,40,60])for(let cell=0;cell<36;cell++){
      const y=Math.floor(cell/6),x=cell%6;
      const corners=[field[y][x],field[y][x+1],field[y+1][x+1],field[y+1][x]];
      if(corners.every(value=>value!==iso)&&marchingCell(corners,iso).code===1)return {cell,iso,show:0,corners:null};
    }
  }
  if(section.kind==='time')return {day:section.id==='5.3'?59:section.id==='5.2'?181:90,view:section.id==='5.2'?'calendar':'line'};
  return {};
}
export function lectureBeats(section){
  const p=teachingFor(section).preset;
  const special={
    pipeline:[beat('把记录按专业分组','Group records by major',{stage:1}),beat('组织成专业与班级的层次','Build the hierarchy',{stage:2}),beat('把关系安排到画布上','Place the hierarchy in a view',{stage:3})],
    contour:[beat('比较角点与阈值，标出高低','Classify corners against the threshold',{show:1}),beat('在跨越阈值的边上找交点','Interpolate edge crossings',{show:2}),beat('把交点连接成线段','Connect the crossings',{show:3})],
    vision:[beat('切到灰度，保留数值标签','Switch to grayscale, keep labels',{vision:'gray'}),beat('再隐藏标签，比较辨识难度','Hide labels and compare legibility',{labels:false})],
    colorModel:[beat('只改变色相','Change hue only',{hue:20}),beat('再改变亮度','Then change lightness',{lightness:75})],
    period:[beat('改成每圈 7 天','Try seven days per turn',{period:7}),beat('再比较每圈 14 天','Compare fourteen days per turn',{period:14}),beat('揭示数据的生成规则','Reveal the generator',{revealed:true})]
  };
  if(special[section.kind])return special[section.kind];
  const captions={
    records:section.id==='1.1'?b('选中 S017，追踪同一条记录','Select S017 and follow one record'):b('重新排序，追踪稳定编号','Sort and track stable IDs'),
    semantics:b('切换到摄氏温度','Switch to Celsius'),transform:b('只显示 85 分及以上','Keep scores of 85 and above'),join:b('把 A、B、C 换成 B、C、D','Replace A,B,C with B,C,D'),groups:b('改成按班级分组','Group by class instead'),tree:b('把树改成纵向布局','Switch to a vertical tree'),treeList:b('折叠设计专业','Collapse Design'),palette:b('改用定性色板','Use a categorical palette'),gamut:b('提高 Lab 明度','Increase Lab lightness'),harmony:b('改为互补色关系','Choose complementary hues'),generator:b('把颜色数量增加到 10','Increase the palette to ten colors'),reshape:b('从宽表变成长表','Reshape wide to long'),scale:b('从线性轴切到对数轴','Switch from linear to log'),curve:b('改变采样点之间的连接','Change the connection between samples'),aspect:b('拉高画布，保持数据不变','Stretch the chart, keep the data'),time:b('换一种时间布局，保留同一天','Change the layout, retain the date'),story:b('定位一场共同参与的事件','Locate a shared event')
  };
  let preset=p;
  if(section.id==='1.2')preset={operation:'sort'};
  if(section.kind==='time')preset=section.id==='5.2'?{view:'line'}:{view:'calendar'};
  return [{title:captions[section.kind],preset}];
}
export function lectureCue(section,lang='zh'){
  const L=(zh,en)=>lang==='zh'?zh:en;
  const cues={
    records:L('请看选中的点：它和表格里的编号，是否仍然指向同一个人？','Follow the selected mark. Does its ID still identify the same entity?'),
    semantics:L('同样是数字，先说清楚它代表身份、等级，还是数量。','The same numeric format may mean identity, rank or quantity.'),
    transform:L('请区分：记录从当前结果中消失，与原始数据被删除，是同一回事吗？','Distinguish absence from a filtered result from deletion in the source.'),
    join:L('总数仍是 3。请逐个跟着字母看，谁保留，谁退出，谁进入？','The count stays at three. Follow each letter: which stays, exits or enters?'),
    pipeline:L('每一步都接着上一步：输入是什么，输出又是什么？','At each stage, identify its input and output.'),
    groups:L('分组的依据改变了，总人数有没有改变？','The grouping criterion changed. Did the total change?'),
    tree:L('方向变了。请找一个班级，看看它的父节点有没有改变。','The direction changed. Follow a class and check its parent.'),
    treeList:L('折叠只影响可见内容。请注意总人数与节点身份。','Collapse affects visibility. Watch the total and node identity.'),
    palette:L('这套深浅，会不会让我们误以为学院有大小或排名？','Does lightness imply a magnitude or rank between colleges?'),
    vision:L('逐步拿掉颜色和标签，看看信息靠哪些线索被读出来。','Remove color and labels in turn. Which cues preserve the meaning?'),
    colorModel:L('分开改变色相与亮度，比较它们制造的视觉差别。','Change hue and lightness separately and compare their effects.'),
    gamut:L('观察边界：模型中的颜色，哪些超出了屏幕可显示的范围？','Look at the boundary. Which colors are outside the display gamut?'),
    harmony:L('协调是审美判断。请继续检查：它有没有表达出数据的顺序？','Harmony is an aesthetic relation. Does the palette express the needed order?'),
    generator:L('颜色变多以后，相邻类别还容易辨认吗？','With more colors, can adjacent categories still be distinguished?'),
    reshape:L('跟住同一个实体和数值，别把行数增加当成新观测。','Track one entity and value. More rows do not imply new observations.'),
    scale:L('请读两种距离：相同差值，与相同倍数。','Compare the meanings of equal differences and equal ratios.'),
    curve:L('采样点始终没变。点之间的曲线，增加了什么假设？','The samples stay fixed. What assumption does the connecting curve add?'),
    aspect:L('先读数据单位，再判断“变陡”是否等于“增长更快”。','Read the data units before equating visual steepness with faster growth.'),
    contour:L('一步一步看：角点分类 → 边上交点 → 连接线段。','Follow the construction: classify corners → find crossings → connect.'),
    time:L('同一个日期，在新布局中在哪里？缺失记录有没有被当成零？','Find the same date in the new layout. Is a missing value treated as zero?'),
    period:L('先比较各圈如何对齐，再揭示生成数据时设定的周期。','Compare alignment before revealing the generator’s period.'),
    story:L('请用事件解释线的靠近，不要把线距当成数值差。','Interpret proximity through the events, not as a numerical distance.')
  };return cues[section.kind];
}
export function lectureReadout(section,state,lang='zh'){
  const L=(zh,en)=>lang==='zh'?zh:en;
  if(['records','transform'].includes(section.kind)){
    const rows=transformRecords(students,state.operation,state.threshold),selected=students.find(r=>r.id===state.selected);
    return L(`当前保留 ${rows.length} / 80 人 · ${selected.id}：${selected.score} 分`,`Retained: ${rows.length} / 80 · ${selected.id}: ${selected.score}`);
  }
  if(section.kind==='join'&&state.joined){const j=matchKeys(['A','B','C'],state.next.split(','));return L(`进入 ${j.enter.join('、')||'无'} · 保留 ${j.update.join('、')||'无'} · 退出 ${j.exit.join('、')||'无'}`,`Enter ${j.enter.join(',')||'none'} · Update ${j.update.join(',')||'none'} · Exit ${j.exit.join(',')||'none'}`);}
  if(section.kind==='groups')return L(`${groupRecords(students,state.field).length} 个组 · 原始总人数仍为 80`,`${groupRecords(students,state.field).length} groups · source total remains 80`);
  if(section.kind==='pipeline')return [L('原始输入：80 条记录 · 表中展示前 8 条','Input: 80 records · first eight shown'),L('按专业统计：4 个组，每组 20 人','Grouped by major: four groups of twenty'),L('层次结构：80 位新生 → 4 个专业 → 8 个班级','Hierarchy: 80 students → 4 majors → 8 classes'),L('安排图形坐标，专业与班级的关系保持不变','Assign coordinates; major/class relationships stay fixed')][Number(state.stage)];
  if(section.kind==='period')return state.revealed?L(`生成周期：14 天 · 当前显示：每圈 ${state.period} 天`,`Generator period: 14 days · display: ${state.period} days per turn`):L(`当前显示：每圈 ${state.period} 天 · 原始数据不变`,`Display: ${state.period} days per turn · source unchanged`);
  if(section.kind==='contour'){
    const f=makeField(),y=Math.floor(state.cell/6),x=state.cell%6,values=state.corners||[f[y][x],f[y][x+1],f[y+1][x+1],f[y+1][x]],c=marchingCell(values,state.iso);
    return L(`阈值 ${state.iso} · 四角 ${values.join(' / ')} · ${Number(state.show)>1?c.crossings.length+' 个边交点':'先比较高低'}`,`Threshold ${state.iso} · corners ${values.join(' / ')} · ${Number(state.show)>1?c.crossings.length+' edge crossings':'classify first'}`);
  }
  if(section.kind==='time'){const d=daily[state.day];return `${d.id} · ${d.value===null?L('未观测，不是 0°C','Not observed; not 0°C'):d.value+'°C'}`;}
  return describeExperiment(section,state,lang).join(' · ');
}
