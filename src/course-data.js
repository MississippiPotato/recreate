import {courses as previousCourses} from './content.js';
import {readingNotes} from './reading-notes.js';
export const B=(zh,en)=>({zh,en});
const sections={
  "1.1": {
    "title": {
      "zh": "数据生成与读取",
      "en": "Generating and loading data"
    },
    "lab": "csv",
    "api": "csv",
    "watch": {
      "zh": "切换原始字符串与转换后的数值，比较成绩列的 typeof；再选中一条记录，观察编号是否改变。",
      "en": "Switch between raw strings and converted values. Compare typeof for score, then track whether the ID changes."
    }
  },
  "1.2": {
    "title": {
      "zh": "数据定义与 DIKW",
      "en": "Data definitions and DIKW"
    },
    "lab": "dikw",
    "api": "dikw",
    "watch": {
      "zh": "点击金字塔的四层，比较同一份记录如何组织成信息、知识与决策。",
      "en": "Select the four pyramid layers and compare how the same records support information, knowledge and decisions."
    }
  },
  "1.3": {
    "title": {
      "zh": "数据属性与视觉通道",
      "en": "Data attributes and visual channels"
    },
    "api": "scales",
    "watch": {
      "zh": "切换编号、等级、温度和人数。观察相同的数值，为什么需要不同的颜色逻辑。",
      "en": "Switch IDs, ranks, temperature and counts. Explain why the same numbers require different color logic."
    },
    "figures": [
      "ranking",
      "channels"
    ]
  },
  "1.4": {
    "title": {
      "zh": "数据变换",
      "en": "Data transformations"
    },
    "lab": "arrays",
    "api": "arrays",
    "watch": {
      "zh": "选择一种操作，先读输入，再读输出。注意结果的类型、长度和嵌套层数。",
      "en": "Choose an operation. Read the input and output, checking type, length and nesting depth."
    }
  },
  "1.5": {
    "title": {
      "zh": "D3 选择集与数据连接",
      "en": "D3 selections and data joins"
    },
    "lab": "join",
    "api": "join",
    "watch": {
      "zh": "比较替换、重排、增加与删除；再切到按索引匹配，观察同一个 DOM 编号对应哪个数据。",
      "en": "Compare replacement, reordering, addition and removal. Switch to index matching and track which datum belongs to each DOM ID."
    },
    "figures": [
      "join"
    ]
  },
  "2.1": {
    "title": {
      "zh": "数据可视化流程",
      "en": "The visualization pipeline"
    },
    "api": "flow",
    "watch": {
      "zh": "依次查看记录、分组、层次与树图。说出每一步新增了什么结构，哪些原始记录仍然保留。",
      "en": "Inspect records, groups, hierarchy and tree. Identify the structure introduced at each stage and the retained records."
    }
  },
  "2.2": {
    "title": {
      "zh": "数据分类树：group 与 rollup",
      "en": "Grouping trees: group and rollup"
    },
    "api": "rollup",
    "watch": {
      "zh": "切换专业与班级，选中一组查看成员编号。检查组人数之和是否仍为 80。",
      "en": "Switch major and class, inspect a group’s IDs, and verify that counts still sum to 80."
    }
  },
  "2.3": {
    "title": {
      "zh": "视觉映射与树布局",
      "en": "Visual mapping and tree layout"
    },
    "api": "tree",
    "watch": {
      "zh": "切换横向与纵向树，选择同一个节点。比较位置变化与父子关系的不变。",
      "en": "Switch horizontal and vertical orientation and select the same node. Separate positional change from unchanged relationships."
    },
    "figures": [
      "marks",
      "channels",
      "magnitude",
      "identity",
      "ranking"
    ]
  },
  "2.4": {
    "title": {
      "zh": "树形列表与事件处理",
      "en": "Tree lists and event handling"
    },
    "lab": "treeList",
    "api": "events",
    "watch": {
      "zh": "折叠某个专业，观察它的子项收起，其他分支和总人数保持不变。",
      "en": "Collapse a major. Its children disappear from the view while other branches and totals remain unchanged."
    }
  },
  "3.1": {
    "title": {
      "zh": "颜色模型",
      "en": "Color models"
    },
    "api": "hsl",
    "watch": {
      "zh": "单独改变 H、S、L，再比较 RGB 与 Lab 表达。留意参数变化和看见的变化是否一致。",
      "en": "Change H, S and L separately, then compare RGB and Lab values. Check whether parameter changes match perceived changes."
    }
  },
  "3.2": {
    "title": {
      "zh": "颜色映射：三类色板",
      "en": "Color mapping: three palette types"
    },
    "api": "sequential",
    "watch": {
      "zh": "在学院类别、气温与偏差三个情境下切换色板，检查颜色暗示的关系是否与字段一致。",
      "en": "Switch palettes for colleges, temperatures and deviations. Check whether implied relationships match the field."
    }
  },
  "3.3": {
    "title": {
      "zh": "Lab 色域与显示范围",
      "en": "Lab gamut and display limits"
    },
    "api": "lab",
    "watch": {
      "zh": "改变 L*，观察可显示区域怎样变化。对照超界位置与灰色区域。",
      "en": "Change L* and observe the displayable region. Compare out-of-gamut locations with gray areas."
    }
  },
  "3.4": {
    "title": {
      "zh": "色系搭配",
      "en": "Color harmony"
    },
    "api": "harmony",
    "watch": {
      "zh": "改变主色相与色系，观察色轮位置和色块同步变化。",
      "en": "Change the base hue and harmony; compare positions on the wheel with the swatches."
    }
  },
  "3.5": {
    "title": {
      "zh": "经典配色方案",
      "en": "Established palettes"
    },
    "lab": "schemes",
    "api": "schemes",
    "watch": {
      "zh": "切换三套定性色板和两套顺序色板，再比较色块与散点里的辨认难度。",
      "en": "Compare three categorical and two sequential palettes in both swatches and a scatterplot."
    }
  },
  "3.6": {
    "title": {
      "zh": "配色案例比较",
      "en": "Comparing color encodings"
    },
    "lab": "contrast",
    "api": "contrast",
    "watch": {
      "zh": "保留左图，改变右图色板和观看条件；比较图例是否支持当前数据语义。",
      "en": "Keep the left view fixed while changing the right palette and viewing condition. Check the legend against the data semantics."
    }
  },
  "3.7": {
    "title": {
      "zh": "配色生成与检验",
      "en": "Generating and checking palettes"
    },
    "api": "generator",
    "watch": {
      "zh": "增加颜色数量，观察色轮上的间隔和色块间的差异。保留一套方案再作比较。",
      "en": "Increase color count and inspect hue separation and swatches. Save a candidate before comparing."
    }
  },
  "3.8": {
    "title": {
      "zh": "色觉差异与冗余编码",
      "en": "Color vision and redundant encoding"
    },
    "api": "accessibility",
    "watch": {
      "zh": "切换原色、灰度和色觉模拟，再隐藏标签，比较哪些信息仍可判断。",
      "en": "Switch original color, grayscale and simulation, then hide labels. Identify the information that remains readable."
    }
  },
  "4.1": {
    "title": {
      "zh": "宽表与长表",
      "en": "Wide and long tables"
    },
    "api": "reshape",
    "watch": {
      "zh": "点击一个单元格后切换宽长格式，查找同一实体、同一指标对应的值。",
      "en": "Select a cell and switch formats. Locate the same entity–measure value."
    }
  },
  "4.2": {
    "title": {
      "zh": "比例尺与坐标轴",
      "en": "Scales and axes"
    },
    "api": "axis",
    "watch": {
      "zh": "比较 1、10、100、1000 在线性和对数轴上的位置，解释为什么可以等距。",
      "en": "Compare 1,10,100,1000 on linear and log axes and explain when they are equally spaced."
    }
  },
  "4.3": {
    "title": {
      "zh": "曲线连接与拟合",
      "en": "Curve interpolation and fitting"
    },
    "api": "curves",
    "watch": {
      "zh": "切换十种曲线，检查是否经过采样点；再叠加最小二乘直线，比较连接规则与模型拟合。",
      "en": "Compare ten curves and inspect sample passage, then overlay least squares to distinguish connection rules from model fitting."
    }
  },
  "4.4": {
    "title": {
      "zh": "纵横比与倾角感知",
      "en": "Aspect ratio and perceived slope"
    },
    "api": "aspect",
    "watch": {
      "zh": "保留 A 后改变 B 的高度。比较线条倾角与点的实际数值。",
      "en": "Save A, change B’s height, and compare visual slope with the unchanged values."
    }
  },
  "4.5": {
    "title": {
      "zh": "等值线：Marching Squares",
      "en": "Contours: Marching Squares"
    },
    "api": "contours",
    "watch": {
      "zh": "选择一个单元格，依次显示分类、交点、线段；再编辑四角数值，比较 16 种状态与鞍点。",
      "en": "Choose a cell, reveal classifications, crossings and segments, then edit corners to compare all sixteen states and saddle cases."
    },
    "figures": [
      "marching"
    ]
  },
  "5.1": {
    "title": {
      "zh": "时间属性",
      "en": "Properties of time"
    },
    "lab": "timeMeta",
    "api": "time",
    "watch": {
      "zh": "点击时间属性，查看不等间隔、缺失和闰日三个小例子。",
      "en": "Select time properties to compare irregular intervals, missing values and leap day."
    }
  },
  "5.2": {
    "title": {
      "zh": "标准时间可视化：折线图",
      "en": "Linear-time visualization"
    },
    "api": "line",
    "watch": {
      "zh": "在折线与日历间切换，追踪同一天，并检查缺失日有没有被画成零。",
      "en": "Switch line and calendar, track the same day, and check that a missing date has not become zero."
    }
  },
  "5.3": {
    "title": {
      "zh": "日历热图",
      "en": "Calendar heatmaps"
    },
    "api": "calendar",
    "watch": {
      "zh": "定位 2 月 29 日，再切换视图。观察日期和数值不变，阅读入口改变。",
      "en": "Locate February 29 and switch views. Date and value remain unchanged while the reading task changes."
    }
  },
  "5.4": {
    "title": {
      "zh": "周期时间与螺旋图",
      "en": "Cyclic time and spiral views"
    },
    "api": "spiral",
    "watch": {
      "zh": "把一圈从 14 天改为 7 天，再揭示合成序列的规则。比较显示周期与生成周期。",
      "en": "Change from fourteen to seven days per turn, then reveal the generator. Distinguish display and generator periods."
    }
  },
  "5.5": {
    "title": {
      "zh": "Storyline 故事线",
      "en": "Storyline visualization"
    },
    "api": "story",
    "watch": {
      "zh": "选择一个角色，再定位一个共同参与的事件，核对线条与事件表。",
      "en": "Choose a character and a shared event, then reconcile paths with the event records."
    }
  }
};

const lessonInfo=[
  ['数据','Data','从 CSV 到数据连接','From CSV to data joins','数据来源、属性与变换，构成 D3 绘图的基础。','Provenance, attributes and transformations form the basis of D3 rendering.'],
  ['数据可视化流程','The visualization pipeline','从数据表到交互视图','From tables to interactive views','分组、层次、布局和事件处理，共同组成完整流程。','Grouping, hierarchy, layout and event handling form the full pipeline.'],
  ['色彩专题','Color','让颜色准确表达关系','Encoding relationships with color','理解颜色空间、色板语义、色域与可读性。','Understand color spaces, palette semantics, gamut and readability.'],
  ['低维数据可视化','Low-dimensional visualization','从坐标到等值线','From coordinates to contours','表格结构、比例尺、曲线与标量场的表达。','Represent tables, scales, curves and scalar fields.'],
  ['时序数据可视化','Time-series visualization','选择适合时间问题的布局','Choosing views for temporal tasks','折线、日历、螺旋和故事线，各有适用的问题。','Lines, calendars, spirals and storylines suit different temporal tasks.']
];

export const curriculum=previousCourses.map((course,i)=>({
  ...course,title:B(lessonInfo[i][0],lessonInfo[i][1]),subtitle:B(lessonInfo[i][2],lessonInfo[i][3]),summary:B(lessonInfo[i][4],lessonInfo[i][5]),
  sections:[...course.sections].sort((a,b)=>Number(a.id.split('.')[1])-Number(b.id.split('.')[1])).map(section=>({
    ...section,...sections[section.id],intro:readingNotes[section.id].find(block=>block.kind==='p').text
  }))
}));
export const allSections=curriculum.flatMap(course=>course.sections);
export const figures={
  join:{file:'data-join.png',caption:B('原课程：数据与元素的 enter / update / exit 对应关系。','Original course: matching data and elements through enter, update and exit.')},
  ranking:{file:'01-mackinlay-ranking.png',caption:B('原课程：不同数据类型对应的视觉通道排序。','Original course: visual-channel rankings for different data types.')},
  marks:{file:'02-marks-points-lines-areas.png',caption:B('原课程：点、线、面三类标记。','Original course: point, line and area marks.')},
  channels:{file:'03-channels-position-color-shape.png',caption:B('原课程：位置、颜色、形状和大小等视觉通道。','Original course: position, color, shape and size channels.')},
  magnitude:{file:'04-magnitude-channels.png',caption:B('原课程：用于表达有序或定量属性的通道。','Original course: channels for ordered or quantitative attributes.')},
  identity:{file:'05-identity-channels.png',caption:B('原课程：用于区分身份和类别的通道。','Original course: channels for identity and categories.')},
  marching:{file:'marching-squares-16.png',caption:B('讲义中的 Marching Squares 16 种情况。图中编号约定需与实现保持一致。','The sixteen Marching Squares cases from the course material. Case numbering must follow the implementation’s convention.')}
};
