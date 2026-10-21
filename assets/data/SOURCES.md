# 课程案例数据

| 文件 | 来源 | 用途 |
| --- | --- | --- |
| `original-students.csv` | [原课程新生 CSV](https://github.com/cinger007/vis/blob/main/supplementary/newstudent.csv) | 首页五章演示台、CSV 读取与类型转换 |
| `crime1985.csv` | [原课程 1985CrimeGender.csv](https://github.com/cinger007/vis/blob/main/supplementary/data/1985CrimeGender.csv) | 宽长表、性别差比例排序、散点和平行坐标 |
| `crime.csv` | [原课程低维案例](https://github.com/cinger007/vis/blob/main/lesson-04/data/crime.csv) | 人口与犯罪数量的曲线对比 |
| `terrain10.csv` | [原课程二维地形](https://github.com/cinger007/vis/blob/main/supplementary/data/terrain10.csv) | 完整填充等值区域与选中单格联动 |

数据保留原字段与数值。`crime1985.csv` 的类别名在读取时去除零宽空白字符；性别差比例在运行时按 `(male - female) / (male + female)` 计算。散点使用 symlog，使 0 仍有对应位置。

算法参考：[D3 曲线工厂](https://d3js.org/d3-shape/curve)、[D3 等值区域](https://d3js.org/d3-contour/contour)、[Heer 的 Banking to 45° 课程讲义](https://hci.stanford.edu/courses/cs448b/w09/lectures/20090202-UsingSpaceEffectively.pdf)、[Machado、Oliveira、Fernandes 的色觉模拟模型](https://profs.ic.uff.br/~laffernandes/content/publications/journal/2009_tvcg_15%286%29/machado_oliveira_fernandes-tvcg-15%286%29-2009-corrected.pdf)。
