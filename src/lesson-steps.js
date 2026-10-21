import {codeGuide} from './code-guide.js';
import {lectureBeats} from './lecture-content.js';
const B=(zh,en)=>({zh,en});
const definitions={
 '1.2':[['数据','Data','const|data'],['信息','Information','attr|path'],['知识','Knowledge','on|select'],['智慧','Wisdom','on|transition']],
 '1.1':[['CSV 原文','CSV text','csv'],['字段与类型','Fields and types','Number|trim|Parse'],['位置映射','Position mapping','scale|range|domain'],['绑定记录','Bind records','csv|await|return']],
 '1.3':[['识别属性','Identify attributes','domain'],['比较位置','Compare positions','scaleLinear'],['区分类别','Distinguish categories','scaleOrdinal'],['选择通道','Choose a channel','scaleSequential|scaleDiverging']],
 '1.4':[['原始数组','Input array','students|const'],['筛选记录','Filter records','filter'],['逐项映射','Map values','map'],['分组聚合','Group and reduce','group|rollup|reduce']],
 '1.5':[['旧元素','Existing elements','selectAll'],['绑定新数据','Bind new data','data\('],['进入与退出','Enter and exit','enter|exit'],['更新位置','Update positions','join|attr']],
 '2.1':[['二维数据表','Flat table','data'],['按字段分组','Group by keys','group|rollup'],['建立层次','Build a hierarchy','hierarchy'],['计算布局','Compute layout','tree|attr']],
 '2.2':[['二维数据表','Flat table','const'],['按字段分组','Group by keys','group|rollup'],['建立层次','Build a hierarchy','Map|children'],['计算布局','Compute layout','entries|return']],
 '2.3':[['二维数据表','Flat table','const'],['JSON 层次','JSON hierarchy','children|hierarchy'],['布局坐标','Layout coordinates','tree|size'],['连边与节点','Links and nodes','link|descendants|attr']],
 '3.7':[['确定主色','Choose a base','hsl'],['拉开色相','Separate hues','hue|harmony|H'],['成对降低饱和度','Pair vivid and muted','saturation|S'],['放入图表检验','Test in a chart','fill|range|color']],
 '3.8':[['原始图形','Original graphics','color|selectAll'],['模拟色觉','Simulate vision','rgb|linear|matrix'],['比较颜色混淆','Compare confusion','map|return'],['增加形状与标签','Add shapes and labels','text|symbol|attr']],
 '4.1':[['原始宽表','Wide table','const'],['展开成长表','Reshape to long','flatMap|map'],['映射视觉变量','Map visual variables','scale|domain'],['多视图比较','Compare views','join|attr|return']],
 '4.3':[['固定采样点','Fixed samples','sort|const'],['直线连接','Linear connection','curveLinear|line'],['比较插值规则','Compare interpolators','curve|Cardinal|Monotone'],['叠加十种曲线','Overlay ten curves','curve|attr']],
 '4.4':[['固定数据','Fixed values','const'],['改变纵横比','Change aspect ratio','range|height'],['计算平均倾角','Calculate mean angle','atan|height|range'],['调整到 45°','Bank to 45°','range|attr']],
 '4.5':[['二维标量场','Scalar field','values|size'],['阈值分类','Classify corners','threshold|iso'],['边上插值','Interpolate edges','interpol|lerp|crossing'],['拼接完整等值线','Assemble contours','contour|geoPath']],
 '5.4':[['时间折线','Time series','line|scale'],['设定周期','Set a period','period|angle'],['连续卷曲','Curl continuously','cos|sin'],['极坐标螺旋','Polar spiral','radius|attr']]
};
export function lessonSteps(section){
  if(definitions[section.id])return definitions[section.id].map(([zh,en,terms],i)=>({title:B(zh,en),terms,guide:Math.min(codeGuide[section.id].length-1,Math.floor(i*codeGuide[section.id].length/4))}));
  const beats=lectureBeats(section);
  return beats.map((beat,i)=>({title:beat.title,preset:beat.preset,guide:Math.min(codeGuide[section.id].length-1,i),terms:'attr|return|domain|range'}));
}
