# Lesson  1  Data

Provenance, attributes and transformations form the basis of D3 rendering.

## 1.1 Generating and loading data

### The student-data example

This lesson begins with a CSV file containing 80 student records. The first row contains field names; each subsequent row is a record. The original course uses ID, name, gender, birthday, age, class, hometown and ethnicity.

### Fields, records and data types

| Example field | Meaning | After loading |
| --- | --- | --- |
| ID | Identifies a record | Retain as an identifier for lookup and joins |
| Name, class | Text or category | Trim whitespace and use consistent names |
| Age, score | Numeric measure | Convert strings to Number |
| Birthday, date | Time | Parse the specified format into Date |

After loading CSV, `"18"` and `18` have different types. A string is suitable for display, but calculations and numeric sorting need conversion first: `"18" + "2"` produces `"182"`, while `18 + 2` produces `20`.

### Loading and row conversion

`d3.csv(url, transformRow)` loads and parses the CSV, passing each row to `transformRow`. Rename fields, trim text, convert numbers and parse dates here so that filtering, grouping and drawing use a consistent record structure.

Check for missing fields, inconsistent category names and mixed date formats. Handle blank strings before numeric conversion: `Number("")` produces zero.

### Key code

#### 1. Mapping column names

```javascript
// Keys are CSV headers; values are internal field names.
const COLUMN_MAP = {
  '序号': 'id', '姓名': 'name', '性别': 'gender',
  '生日': 'birthday', '年龄': 'age', '班级': 'class'
};
// Object.entries returns an array of [key, value] pairs.
const row = {'序号': '1', '姓名': '张明', '年龄': '18'};
const mapped = Object.fromEntries(
  Object.entries(row).map(([key, value]) => [COLUMN_MAP[key] ?? key, value])
);
console.log(mapped); // {id: '1', name: '张明', age: '18'}
```

**Key-point explanation**

The object maps one field name to another. `[key, value]` destructures an entry; `?? key` keeps unmapped names. Chinese property names are valid JavaScript; mapping establishes a consistent naming convention. Values remain strings.

#### 2. The row conversion function

```javascript
// Specify a format to create a reusable date parser.
const parseDate = d3.utcParse('%Y-%m-%d');
function transformRow(row) {
  const age = row['年龄'].trim();
  return {
    id: row['序号'],                         // Keep the ID as a string.
    name: row['姓名'].trim(),                // Remove surrounding whitespace.
    birthday: parseDate(row['生日']),        // Convert the string to Date.
    age: age === '' ? null : Number(age),   // Handle a blank separately from numbers.
    class: row['班级'].trim()
  };
}
```

**Key-point explanation**

`transformRow` receives one row and returns a new record. Both `Number("18")` and `+"18"` produce 18; the latter uses the unary plus operator. Both convert an empty string to zero, so first trim whitespace and handle a blank separately as `null`. `utcParse` parses the specified date format. Centralizing conversion gives later calculations consistent types.

#### 3. The d3.csv row callback and await

```javascript
// Pass the transformRow function defined above, without invoking it.
const url = new URL('../assets/data/original-students.csv', import.meta.url);
const students = await d3.csv(url, transformRow);
// await yields the parsed record array rather than the Promise.
console.log(students.length);                    // 80
console.log(typeof students[0].age);             // 'number'
console.log(students[0].birthday instanceof Date); // true
```

**Key-point explanation**

`d3.csv` returns a Promise; use `await` or `.then()` to obtain its result. D3 calls the row function for each parsed record and collects the returned objects. Pass `transformRow`, not `transformRow()`, which would call it immediately.

### Runnable example: Load CSV and convert fields

```javascript
async function csv({svg,d3,n}) {
  // Convert types per row; keep IDs as strings.
  const rows=await d3.csv(new URL('../assets/data/students.csv',import.meta.url),row=>({
    id:row.id, score:row.score.trim()===''?null:Number(row.score)
  }));
  const shown=rows.slice(0,n);
  // A scale maps scores to pixels without changing them.
  const x=d3.scaleLinear().domain([0,100]).range([0,440]);
  svg.selectAll('rect').data(shown,d=>d.id).join('rect')
    .attr('x',80).attr('y',(d,i)=>20+i*24).attr('width',d=>x(d.score??0))
    .attr('height',16).attr('fill','#2878ad');
  svg.selectAll('text').data(shown).join('text')
    .attr('x',10).attr('y',(d,i)=>33+i*24).text(d=>d.id);
  return {rows:rows.length,scoreType:typeof rows[0].score,first:rows[0]};
}
```


[D3 documentation](https://d3js.org/d3-fetch)

### Demonstration

Switch between raw strings and converted values. Compare typeof for score, then track whether the ID changes.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-1)

## 1.2 Data definitions and DIKW

### The DIKW pyramid

DIKW stands for Data, Information, Knowledge and Wisdom. Data consists of observations; information is organized data; knowledge captures patterns and understanding; wisdom applies knowledge to judgments and decisions.

| Level | Meaning | Question answered |
| --- | --- | --- |
| Data | Raw, discrete observations | What was recorded? |
| Information | Data that has been processed, organized and given context | Who / What / When / Where |
| Knowledge | Further refinement and understanding of information | How |
| Wisdom | Applying knowledge to judgments and decisions | Why / What to do |

### Visualization in DIKW

Visualization turns tabular data into graphics that reveal distributions, differences and relationships. Bar charts compare class sizes, line charts show change, and heatmaps reveal concentrations of high and low values.

- **Data → Information:** organize and present records to answer a question.
- **Information → Knowledge:** compare views, discover patterns and interpret them using domain knowledge and statistical analysis.
- **Knowledge → Wisdom:** combine goals, experience and constraints to make decisions, supported by visual analysis.

### From records to a judgment

For the student example, class, age and hometown in a record are data. Counting students by class produces information. Comparing class composition can reveal patterns. Using those findings to arrange teaching groups involves a decision. The four pyramid layers demonstrate this progression with the same records.

### Key code

#### 1. Drawing one pyramid layer with SVG path

```javascript
const cx = 200;                       // Horizontal center.
const topW = 60, bottomW = 120;        // Top and bottom widths.
const yTop = 20, yBottom = 100;
// M moves, L draws to the next point, Z closes.
const path = `M ${cx-topW/2} ${yTop}
  L ${cx+topW/2} ${yTop}
  L ${cx+bottomW/2} ${yBottom}
  L ${cx-bottomW/2} ${yBottom} Z`;
const layer = {name:'Data',color:'#2878ad'};
const groups = svg.selectAll('g.layer').data([layer]).join('g').attr('class','layer');
groups.append('path').attr('d', path).attr('fill',d=>d.color);
```

**Key-point explanation**

The `d` attribute stores SVG path commands. Template expressions `${expression}` calculate coordinates within a string. Varying the widths creates trapezoids; arranging four layers forms the DIKW pyramid.

#### 2. Binding data and highlighting on interaction

```javascript
// groups is the layer selection containing paths from above.
groups.on('mouseenter', function(event, d) {
  // In this regular function, this is the g handling the event.
  d3.select(this).select('path').interrupt().transition().duration(150)
    .attr('fill', d3.color(d.color).brighter(0.5));
});
// An arrow function can use event.currentTarget for the element.
groups.on('click', (event, d) => {
  d3.select(event.currentTarget).classed('selected', true);
  console.log(d.name);
});
```

**Key-point explanation**

`.on(type, listener)` attaches a listener. Its arguments are `event` and the bound datum `d`. Use a regular function for D3’s `this`, or access `event.currentTarget` in an arrow function. The transition interpolates color over 150 milliseconds.

### Runnable example: DIKW pyramid paths

```javascript
function dikw({svg,d3,n,L}) {
  const labels=L(['数据','信息','知识','智慧'],['Data','Information','Knowledge','Wisdom']);
  // Bind one layer per trapezoid; index 0 is at the bottom.
  const layers=labels.map((label,i)=>({label,index:i,top:155-i*48,width:380-i*85}));
  const groups=svg.selectAll('g').data(layers).join('g');
  groups.append('path').attr('d',d=>{
    const cx=300,top=d.top,w=d.width;
    // Visit four vertices in order, then close the shape.
    return `M${cx-(w-65)/2},${top}L${cx+(w-65)/2},${top}L${cx+w/2},${top+42}L${cx-w/2},${top+42}Z`;
  }).attr('fill',d=>d.index===n-1?'#e16a45':'#2878ad');
  groups.append('text').attr('x',300).attr('y',d=>d.top+28).attr('text-anchor','middle')
    .attr('fill','white').text(d=>d.label);
  return {selected:labels[n-1],level:n};
}
```


[D3 documentation](https://d3js.org/d3-selection/events)

### Demonstration

Select the four pyramid layers and compare how the same records support information, knowledge and decisions.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-2)

## 1.3 Data attributes and visual channels

### Three basic attribute types

- **Categorical:** symbols or names without a magnitude order, such as name, major and hometown.
- **Ordinal:** values have an order, such as bachelor, master and doctorate, or low, medium and high.
- **Quantitative:** measurable quantities such as age, price, counts and temperature.

### Stevens’ measurement scales

Measurement scales specify the comparisons that values support. Interval scales have meaningful differences; ratio scales also have a meaningful zero.

| Scale | Supported comparison | Example |
| --- | --- | --- |
| Nominal | Same / different | Name, major, ID |
| Ordinal | Equality and order | Ratings, ranks |
| Interval | Compare differences | Celsius temperature, calendar year |
| Ratio | Compare differences and ratios | Counts, length, price |

Zero Celsius does not mean an absence of temperature, so 20°C is not twice 10°C. Counts have a zero: 20 people is twice 10. An ID remains categorical even when stored as a number.

### Matching attributes to visual channels

| Task | Common channels | Example |
| --- | --- | --- |
| Compare quantities | Position on a common scale, length | Scatter plot, bar chart |
| Express order | Position, lightness, size | Ranked chart, sequential palette |
| Distinguish categories | Hue, shape, spatial region | Categorical scatter plot, small multiples |

Mackinlay’s channel rankings guide these choices. Determine what a field means before selecting a scale and channel: use category colors for majors and position or length for scores.

![Original course: visual-channel rankings for different data types.](../figures/01-mackinlay-ranking.png)

![Original course: position, color, shape and size channels.](../figures/03-channels-position-color-shape.png)

### Key code

#### 1. Choosing a scale for an attribute

```javascript
// Continuous scores from 0 to 100 map to pixels from 0 to 800.
const x = d3.scaleLinear().domain([0, 100]).range([0, 800]);
console.log(x(50)); // 400
// Each class receives a band of equal width.
const band = d3.scaleBand()
  .domain(['软件1班', '软件2班']).range([0, 800]).padding(0.1);
console.log(band('软件1班'), band.bandwidth());
// scalePoint assigns category positions without band widths.
const point = d3.scalePoint().domain(['低','中','高']).range([0, 800]);
```

**Key-point explanation**

`domain` is the input domain, `range` the output range, and a scale is callable. `x(50)` gives a pixel coordinate. `band(category)` gives a band’s start and `bandwidth()` its width. Choose the scale according to whether the field is continuous or discrete.

#### 2. Sequential, diverging and qualitative color

```javascript
// Ordered counts are normalized before calling Viridis.
const sequential = d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);
// A three-value domain specifies low, midpoint and high.
const diverging = d3.scaleDiverging(d3.interpolateRdBu).domain([-10, 0, 10]);
// Unordered categories use an explicit domain and color array.
const categorical = d3.scaleOrdinal()
  .domain(['A', 'B', 'C']).range(d3.schemeTableau10);
console.log(sequential(50), diverging(0), categorical('B'));
```

**Key-point explanation**

`interpolateViridis(t)` takes a parameter from 0 to 1. `scaleSequential` maps raw values to that parameter. `scaleDiverging` also specifies a midpoint. `scaleOrdinal` assigns colors by category without interpolating between categories.

### Runnable example: Scales and axes

```javascript
function scales({svg,d3,n}) {
  const values=[0,25,50,75,100];
  // domain is input; range is output; n controls width.
  const x=d3.scaleLinear().domain([0,100]).range([40,40+n*40]);
  svg.selectAll('circle').data(values).join('circle')
    .attr('cx',d=>x(d)).attr('cy',95).attr('r',8).attr('fill','#2878ad');
  // call passes the selection to an axis generator.
  svg.append('g').attr('transform','translate(0,130)').call(d3.axisBottom(x).ticks(4));
  return values.map(value=>({value,pixel:x(value)}));
}
```


[D3 documentation](https://d3js.org/d3-scale/linear)

### Demonstration

Switch IDs, ranks, temperature and counts. Explain why the same numbers require different color logic.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-3)

## 1.4 Data transformations

### Common data transformations

Data usually needs transformation before it is bound to graphics. The original course introduces eight operations for mapping, filtering, combining and reshaping arrays.

| Operation | Purpose | Example |
| --- | --- | --- |
| map | Produce a value for each item | Ages → ages next year |
| reduce | Reduce values into an accumulated result | Ages → total |
| cross | Cartesian product | Gender × major → combinations |
| merge | Flatten one array level | [[1,2],[3]] → [1,2,3] |
| pairs | Adjacent pairs | [1,2,3] → [[1,2],[2,3]] |
| transpose | Exchange matrix rows and columns | Two by three → three by two |
| zip | Combine equal indices | [1,2] and [a,b] → [[1,a],[2,b]] |
| filter | Retain matching records | Students → students in a major |

### Composing a data flow

To calculate the mean age of a group, use `filter` to select records, `map` to extract ages and `reduce` to sum them. Each step takes the previous result, so intermediate values can be inspected.

`map` and `filter` return new arrays; the return type of `reduce` depends on the accumulator. Write callbacks that calculate and return results while leaving the input records unchanged.

### Grouping and aggregation

`d3.group` groups records by keys while retaining each record. `d3.rollup` reduces each group to a count, sum or mean. The next lesson turns a nested major → class → count result into a hierarchy.

### Key code

#### 1. Composing filter, map and reduce

```javascript
// filter keeps records whose callback returns true.
const group = students.filter(student => student.gender === '男');
// map returns one result per item, here the age.
const ages = group.map(student => student.age);
// sum is the accumulator; zero is its initial value.
const total = ages.reduce((sum, age) => sum + age, 0);
const mean = ages.length ? total / ages.length : null;
console.log({ages, total, mean});
```

**Key-point explanation**

The expression arrow `student => student.age` has an implicit return; a block body requires an explicit `return`. `reduce` passes each accumulated result into the next iteration and returns the numeric total here. Saving the filtered group avoids filtering again to obtain its length.

#### 2. cross: Cartesian products

```javascript
const genders = ['男', '女'];
const majors = ['软件工程', '数据科学'];
// Pair every gender with every major: 2×2 combinations.
const pairs = d3.cross(genders, majors);
// A final reducer converts each combination into an object.
const rows = d3.cross(genders, majors, (gender, major) => ({gender, major}));
console.log(pairs, rows);
```

**Key-point explanation**

`cross` accepts multiple iterables and returns the product of their lengths in combinations. A final reducer receives the items in one combination. Parentheses in `({gender, major})` make the arrow function return an object literal.

#### 3. group and rollup

```javascript
// Each group value remains an array of records.
const byClass = d3.group(students, student => student.class);
// rollup groups first, then reduces each group.
const countByClass = d3.rollup(students, group => group.length, student => student.class);
// Map.get reads a key; entries supplies key-value pairs.
console.log(byClass.get('软件工程1班'));
for (const [className, count] of countByClass) console.log(className, count);
```

**Key-point explanation**

Both functions return Map structures. Their innermost values differ: records for `group`, the reducer’s result for `rollup`. Iterating a Map with `for...of` yields `[key, value]` entries that can be destructured directly.

#### 4. Move data blocks instead of rebuilding the canvas

```javascript
// IDs retain identity; filter selects the result.
const kept = rows.filter(row => row.value > threshold);
const blocks = svg.selectAll('g.block').data(kept, row => row.id).join('g');
// Move the same node smoothly to its new position.
blocks.interrupt().transition().duration(650)
  .attr('transform', row => `translate(${x(row)},${y(row)})`);
```

**Key-point explanation**

Keyed data binding reuses nodes for retained records. A transition interpolates old and new coordinates; interrupt an earlier transition before responding to another operation.

### Runnable example: filter → map → sum

```javascript
function arrays({svg,d3,n}) {
  const values=d3.range(1,n+1);
  // Filter then map; retain the original array.
  const result=values.filter(d=>d%2===0).map(d=>d*d);
  const x=d3.scaleBand().domain(d3.range(result.length)).range([30,540]).padding(.25);
  const y=d3.scaleLinear().domain([0,n*n]).range([170,15]);
  svg.selectAll('rect').data(result).join('rect').attr('x',(d,i)=>x(i))
    .attr('y',d=>y(d)).attr('width',x.bandwidth()).attr('height',d=>170-y(d)).attr('fill','#2878ad');
  return {input:values,result,sum:d3.sum(result)};
}
```


[D3 documentation](https://d3js.org/d3-array/transform)

### Demonstration

Choose an operation. Read the input and output, checking type, length and nesting depth.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-4)

## 1.5 D3 selections and data joins

### D3 selectors

| Method | Selection scope |
| --- | --- |
| d3.select | The first matching element |
| d3.selectAll | All matching elements |
| selection.select | The first matching descendant of each parent |
| selection.selectAll | All matching descendants of each parent |
| selection.selectChild | The first matching direct child of each parent |
| selection.selectChildren | All matching direct children of each parent |

These methods return a **selection**. Subsequent calls to `attr`, `style`, `text` and `on` operate on the selected elements.

### Data joins: enter / update / exit

A data join matches an array of records to DOM elements. Calling `selection.data(data, key)` produces three states based on the matches.

| State | Matching result | Typical operation |
| --- | --- | --- |
| enter | A new datum has no element | append an element |
| update | A datum matches an existing element | Update position, color or text |
| exit | An existing element has no new datum | remove the element |

For old data A,B,C and new data B,C,D, using the letters as keys updates B/C, enters D and exits A. Both arrays have the same length, yet both enter and exit occur.

### Key functions and element identity

Without a key, D3 matches by index. With `d => d.id`, it matches by ID. A stable key retains the existing element when records reorder, after which its position can change. `join` handles creation, update and removal within one flow.

![Original course: matching data and elements through enter, update and exit.](../figures/data-join.png)

### Key code

#### 1. The three join callbacks

```javascript
const circles = svg.selectAll('circle')
  .data(currentData, d => d.id) // Match existing elements using stable IDs.
  .join(
    enter => enter.append('circle').attr('fill', '#e16a45'), // Create.
    update => update.attr('fill', '#2878ad'),                // Reuse.
    exit => exit.remove()                                  // Remove.
  );
// join merges enter and update for shared position updates.
circles.attr('cx', (d, i) => 40 + i * 60).attr('cy', 80).attr('r', 20);
```

**Key-point explanation**

Each callback receives the selection for its state. Return the created or updated selection so `join` can merge it and support chaining. Shared attributes after `join` apply to both entered and updated elements.

#### 2. Index matching and key matching

```javascript
const oldData = [{id:'A'}, {id:'B'}, {id:'C'}];
const newData = [{id:'B'}, {id:'C'}, {id:'D'}];
const indexGroup=svg.append('g'), keyGroup=svg.append('g');
indexGroup.selectAll('circle').data(oldData).join('circle');
keyGroup.selectAll('circle').data(oldData,d=>d.id).join('circle');
// Separate groups keep the two matching comparisons independent.
const byIndex = indexGroup.selectAll('circle').data(newData);
// With IDs, B/C update, D enters and A exits.
const byId = keyGroup.selectAll('circle').data(newData, d => d.id);
console.log(byId.enter().size(), byId.size(), byId.exit().size());
```

**Key-point explanation**

These are alternative matching rules, selectable in the demonstration. `d => d.id` supplies keys for old elements and new data, matching equal keys. Keys should be stable and distinguish records. Reordering by key retains each record’s DOM node.

#### 3. select and selectAll

```javascript
// select finds the first match, often a container or title.
const title = d3.select('#title').text('人数');
// selectAll may be empty; the join creates needed elements.
const bars = d3.select('#chart').selectAll('rect.bar')
  .data([3, 5, 8]).join('rect').attr('class', 'bar');
// d is the datum and i the index within the group.
bars.attr('x', (d, i) => i * 40).attr('width', 30).attr('height', d => d * 10);
```

**Key-point explanation**

`selectAll` finds elements but does not create them. An initially empty selection can create rectangles through `data(...).join("rect")`. D3 evaluates function-valued attributes per element, while constant values apply to the whole selection.

### Runnable example: data → join → attr

```javascript
function join({svg,d3,n}) {
  const rows=['A','B','C','D','E','F','G','H'].slice(0,n).map(id=>({id}));
  // The key matches identity; omission matches by index.
  const marks=svg.selectAll('circle').data(rows,d=>d.id);
  const counts={enter:marks.enter().size(),update:marks.size(),exit:marks.exit().size()};
  marks.join(
    // Return enter and update selections for chaining.
    enter=>enter.append('circle').attr('fill','#e16a45'),
    update=>update.attr('fill','#2878ad'),
    exit=>exit.remove()
  ).attr('cx',(d,i)=>45+i*65).attr('cy',100).attr('r',22);
  svg.selectAll('text').data(rows,d=>d.id).join('text').attr('x',(d,i)=>45+i*65)
    .attr('y',105).attr('text-anchor','middle').attr('fill','white').text(d=>d.id);
  return counts;
}
```


[D3 documentation](https://d3js.org/d3-selection/joining)

### Demonstration

Compare replacement, reordering, addition and removal. Switch to index matching and track which datum belongs to each DOM ID.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-5)


---

# Lesson  2  The visualization pipeline

Grouping, hierarchy, layout and event handling form the full pipeline.

## 2.1 The visualization pipeline

### Three visualization models

Several models explain how data becomes a graphic. Card describes the transformation stages, Mackinlay addresses encoding choices, and van Wijk includes interaction and knowledge acquisition.

| Model | Central idea |
| --- | --- |
| Card, Mackinlay and Shneiderman (1999) | Raw data → data tables → visual structures → views |
| Mackinlay (1986) | Consider expressiveness and channel effectiveness for each data type |
| van Wijk (2005) | Data, visualization, perception and exploration form a feedback process |

### Following the data flow

- **Data transformation:** clean, filter and group raw records into a table suited to analysis.
- **Visual mapping:** choose marks and channels, such as position for hierarchy and color for categories.
- **View transformation and rendering:** use layout, coordinates and the drawing region to produce the visible graphic.
- **Interaction:** selections, filters and parameter changes feed back into the relevant stages.

This lesson follows the stages with one grouped dataset: count records by major and class, build a hierarchy, calculate a tree layout, then add expansion, selection and event handling.

### Key code

#### 1. Pipeline nodes, arrows and selection

```javascript
// A marker in defs defines a reusable arrowhead.
svg.append('defs').append('marker').attr('id', 'pipeline-arrow')
  .attr('viewBox', '0 -5 10 10').attr('refX', 8)
  .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
  .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#8298aa');
// url(#id) references the SVG definition.
svg.append('line').attr('x1', 40).attr('x2', 160).attr('y1', 60).attr('y2', 60)
  .attr('stroke', '#8298aa').attr('marker-end', 'url(#pipeline-arrow)');
const nodes = svg.selectAll('g.node').data(stages, d => d.id).join('g').attr('class', 'node');
nodes.on('click', (event, picked) => {
  // picked is clicked; d is the node whose class is being set.
  nodes.classed('selected', d => d.id === picked.id);
});
```

**Key-point explanation**

`append` returns the new selection for further attributes and children. `marker-end` references the arrowhead and `orient="auto"` follows the line direction. `classed("selected", predicate)` evaluates a boolean for each node to update selection state.

### Runnable example: A state-driven pipeline

```javascript
function flow({svg,d3,n,L}) {
  const stages=L(['记录','数据表','视觉结构','视图'],['Records','Table','Structure','View']);
  // Bind stages; classed represents the selected state.
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


[D3 documentation](https://d3js.org/d3-selection/modifying)

### Demonstration

Inspect records, groups, hierarchy and tree. Identify the structure introduced at each stage and the retained records.

[Open section](https://mississippipotato.github.io/recreate/#ch-2-1)

## 2.2 Grouping trees: group and rollup

### Data transformation: records to groups

Counting students by major and class is a nested aggregation. The outer level groups by major, the inner level by class, and each group is reduced to a record count.

| Operation | Purpose | Typical form |
| --- | --- | --- |
| Clean / filter | Handle blanks and select matching records | filter, CSV row callback |
| Aggregate | Group by keys and calculate a summary | d3.group, d3.rollup |
| Join | Relate records using shared keys | Map index and key lookup |
| Derive | Calculate a field from existing values | Extract a major from a class name |

### Parameters and results of d3.rollup

`d3.rollup(data, reducer, key1, key2, ...)` groups records by the keys, then passes each innermost record array to the reducer. `v => v.length` returns the count; `v => d3.mean(v, d => d.score)` returns the mean score.

- One key produces one Map level; two keys produce nested Maps.
- Use `for (const [key, value] of map)` to iterate entries.
- `group` retains group records; `rollup` retains the reduced result.

### Slicing and drilling down

To inspect one major, filter before aggregation. Expanding a major to inspect its classes reads the next level of the grouped result. This overview-to-detail organization also appears in OLAP and interactive analysis.

### Key code

#### 1. Nested rollup and Map iteration

```javascript
const nested = d3.rollup(
  students,
  group => group.length,  // The reducer receives an innermost record array.
  d => d.major,           // First key: major.
  d => d.class            // Second key: class.
);
// Outer values are Maps; inner values are counts.
for (const [major, classes] of nested) {
  for (const [className, count] of classes) console.log(major, className, count);
}
```

**Key-point explanation**

Grouping keys are rest parameters. Two keys produce two Map levels, which require two levels of access. The reducer determines the leaf type; replacing the count with `d3.mean(...)` yields group means.

#### 2. Extracting a major from a class name

```javascript
const className = '软件工程12班';
// ^/$ anchor the string; groups capture major and class number.
const match = className.match(/^(.+?)(\d+班)$/);
const major = match ? match[1] : className;
// match[0] is the full match; [1]/[2] are capture groups.
console.log(major, match?.[2]); // 软件工程, 12班
// A derived field can be added in the CSV row callback.
```

**Key-point explanation**

`.+?` starts with a shorter match and `\d+` matches one or more digits. The ending requires digits followed by 班, keeping a multi-digit class number together. A failed match is null; the conditional provides a fallback and optional chaining stops access on null.

### Runnable example: Nested grouping and reduction

```javascript
function rollup({svg,d3,n}) {
  const rows=d3.range(n*4).map(i=>({major:['A','B','C'][i%3],class:i%2}));
  // The reducer handles each group; subsequent functions are grouping keys.
  const groups=d3.rollup(rows,group=>group.length,d=>d.major,d=>d.class);
  const flat=Array.from(groups,([major,classes])=>({major,count:d3.sum(classes.values())}));
  svg.selectAll('rect').data(flat).join('rect').attr('x',60).attr('y',(d,i)=>30+i*45)
    .attr('width',d=>d.count*23).attr('height',25).attr('fill','#2878ad');
  svg.selectAll('text').data(flat).join('text').attr('x',20).attr('y',(d,i)=>48+i*45).text(d=>d.major);
  return {input:rows.length,groups:flat,total:d3.sum(flat,d=>d.count)};
}
```


[D3 documentation](https://d3js.org/d3-array/group)

### Demonstration

Switch major and class, inspect a group’s IDs, and verify that counts still sum to 80.

[Open section](https://mississippipotato.github.io/recreate/#ch-2-2)

## 2.3 Visual mapping and tree layout

### Visual mapping: marks and channels

A visual structure combines marks and channels. **Points, lines and areas** are marks. Position, color, shape, tilt and size are channels. The same dataset can use different marks or different channels for an attribute.

| Channel type | Attribute | Examples |
| --- | --- | --- |
| Magnitude | Ordered or quantitative | Position, length, area, lightness |
| Identity | Categories or identity | Spatial region, hue, shape |

The original five figures cover channel rankings, marks, common channels, magnitude channels and identity channels. Position on a common scale is often a good choice for precise quantitative comparisons; hue, shape and spatial region can distinguish categories.

### Tree layout: placing a hierarchy

The previous section produced a major → class hierarchy. A tree uses nodes for entities and links for parent-child relationships, mapping the hierarchy to position. D3’s `tree` uses a tidy-tree layout that separates nodes on each level and centers parents over their subtrees.

- `d3.hierarchy(data)` establishes parent, children, depth and related structure.
- `d3.tree().size([height, width])(root)` assigns x and y coordinates.
- For a horizontal tree, draw the depth coordinate y horizontally and x vertically. Use this convention for both nodes and links.

### Other hierarchical layouts

`cluster` aligns leaves, `treemap` uses rectangle area, `pack` packs circles, and `partition` supplies coordinates for icicles and sunbursts. Different layouts emphasize different aspects of the same hierarchy.

![Original course: point, line and area marks.](../figures/02-marks-points-lines-areas.png)

![Original course: position, color, shape and size channels.](../figures/03-channels-position-color-shape.png)

![Original course: channels for ordered or quantitative attributes.](../figures/04-magnitude-channels.png)

![Original course: channels for identity and categories.](../figures/05-identity-channels.png)

![Original course: visual-channel rankings for different data types.](../figures/01-mackinlay-ranking.png)

### Key code

#### 1. hierarchy → tree → links / nodes

```javascript
// hierarchy builds relationships, not layout coordinates.
const root = d3.hierarchy(rootData);
const layout = d3.tree().size([360, 720]);
layout(root); // Run the layout to assign x and y.
const g = svg.append('g').attr('transform', 'translate(40,20)');
g.selectAll('path.link').data(root.links()).join('path').attr('class', 'link')
  .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x))
  .attr('fill', 'none').attr('stroke','#9bb1bd');
const nodes = g.selectAll('g.node').data(root.descendants()).join('g').attr('class', 'node')
  .attr('transform', d => `translate(${d.y},${d.x})`);
nodes.append('circle').attr('r', 5);
nodes.append('text').attr('x', d => d.children ? -8 : 8)
  .attr('text-anchor', d => d.children ? 'end' : 'start')
  .text(d => d.data.name); // Original fields live in node.data.
```

**Key-point explanation**

`root.descendants()` returns nodes; `root.links()` returns source/target links. Tree y is depth and x spreads nodes across a level. A horizontal tree uses y horizontally. Node transforms and link accessors must use the same swap.

#### 2. size and separation

```javascript
const layout = d3.tree().size([360, 720])
  // a/b are nodes to separate, not a parent-child parameter pair.
  .separation((a, b) => a.parent === b.parent ? 1 : 2);
layout(root);
// Use nodeSize when fixed node spacing is desired.
const fixed = d3.tree().nodeSize([24, 160]);
```

**Key-point explanation**

`size` sets the overall coordinate extent. `separation` controls relative spacing between nodes on a level; 1 and 2 are relative weights, not pixels. `nodeSize` instead uses fixed coordinate spacing.

### Runnable example: hierarchy → tree → links

```javascript
function tree({svg,d3,n}) {
  const root=d3.hierarchy({name:'root',children:d3.range(n).map(i=>({name:String(i+1)}))});
  // hierarchy establishes relationships; tree computes x/y.
  d3.tree().size([150,440])(root);
  // Swap coordinates consistently for nodes and links in a horizontal tree.
  const g=svg.append('g').attr('transform','translate(40,25)');
  g.selectAll('path').data(root.links()).join('path')
    .attr('d',d3.linkHorizontal().x(d=>d.y).y(d=>d.x))
    .attr('fill','none').attr('stroke','#9bb1bd');
  g.selectAll('circle').data(root.descendants()).join('circle')
    .attr('cx',d=>d.y).attr('cy',d=>d.x).attr('r',7).attr('fill','#2878ad');
  return root.descendants().map(d=>({name:d.data.name,depth:d.depth,x:d.x,y:d.y}));
}
```


[D3 documentation](https://d3js.org/d3-hierarchy/tree)

### Demonstration

Switch horizontal and vertical orientation and select the same node. Separate positional change from unchanged relationships.

[Open section](https://mississippipotato.github.io/recreate/#ch-2-3)

## 2.4 Tree lists and event handling

### From a hierarchy to an interactive list

A hierarchy can be rendered as nested HTML lists as well as a node-link diagram. Each node becomes an `li`, with children in an inner `ul`. D3’s `classed` controls expanded, collapsed and selected states.

### Three phases of DOM events

| Phase | Direction | List example |
| --- | --- | --- |
| Capturing | Outer elements toward the target | Container → li → button |
| Target | The element that was clicked | Expand button |
| Bubbling | Target toward outer elements | Button → li → container |

Listeners normally handle the bubbling phase. A click on an expand button also reaches its ancestor node. If the node has a selection listener, both actions may run. `event.stopPropagation()` stops further propagation to ancestors.

### Event delegation and classed

Event delegation places a listener on the list container and uses `event.target.closest(...)` to find the clicked item. `event.target` is where the event originated; `event.currentTarget` is the element whose listener is running.

`selection.classed("selected", true)` adds a class; `false` removes it; a function computes the state for each datum. This separates data state from CSS styling.

### Transitions

`transition().duration(ms)` interpolates position, color or opacity from old values to new values. A zero duration changes immediately; a longer duration exposes the movement. Call `interrupt()` to stop an existing transition before another action.

### Key code

#### 1. Expansion, selection and event propagation

```javascript
const item = d3.select('li');
const toggle = item.select('button.toggle');
toggle.on('click.toggle', function(event) {
  event.stopPropagation(); // Stop the event before it reaches the ancestor li listener.
  const open = this.getAttribute('aria-expanded') !== 'true';
  this.setAttribute('aria-expanded', String(open));
  item.classed('expanded', open);
});
// .select is a namespace for replacing/removing this listener.
item.on('click.select', () => item.classed('selected', true));
```

**Key-point explanation**

Both names listen for click; the suffix is a D3 event namespace. A button click runs its listener and then bubbles to ancestors. `stopPropagation` stops that propagation; `preventDefault` instead prevents a default browser action.

#### 2. Recursively building nested lists

```javascript
function buildList(parent, nodes) {
  const items = parent.selectAll('li').data(nodes, d => d.id).join('li');
  items.each(function(d) {
    const item = d3.select(this); // Wrap this DOM node as a D3 selection.
    item.selectAll('span.label').data([d]).join('span').attr('class', 'label').text(d => d.name);
    const children = d.children ?? [];
    const nested = item.selectAll('ul').data(children.length ? [children] : []).join('ul');
    if (children.length) buildList(nested, children); // Repeat for the child level.
  });
}
buildList(d3.select('#tree'), [rootData]);
```

**Key-point explanation**

`each` runs a function for every selected element, allowing a subtree to be built inside each node. `[children]` binds the entire child array to one ul, whose items are then bound to li elements. Recursion stops at leaves.

#### 3. transition and duration

```javascript
const nodes = svg.selectAll('circle.node');
// Ordinary attr sets immediately; attr after transition interpolates.
nodes.interrupt().transition().duration(500)
  .attr('cx', d => d.x).attr('cy', d => d.y).attr('opacity', 1);
// Fade in by setting a start value followed by a target value.
svg.append('circle').attr('r', 8).attr('opacity', 0)
  .transition().duration(500).attr('opacity', 1);
```

**Key-point explanation**

Duration is in milliseconds. A transition interpolates from current attributes to targets. Opacity zero followed by a target of one creates a fade. On rapid actions, `interrupt` stops the old transition before a new one starts from the current displayed state.

#### 4. Delegating an event to the container

```javascript
d3.select('#tree').on('click', function(event) {
  const label = event.target.closest('.label'); // Search upward from the clicked element.
  if (!label || !this.contains(label)) return;
  const item = label.closest('li');
  const datum = d3.select(item).datum();        // Read the datum bound to this li.
  d3.select(this).selectAll('li').classed('selected', function() {
    return this === item;
  });
  console.log(datum);
});
```

**Key-point explanation**

A single container listener also receives bubbled clicks from newly added items. `target` is the original clicked element; `this` in the regular listener is the container. Calling `datum()` with no argument reads the element’s bound data.

### Runnable example: Events and state

```javascript
function events({svg,d3,n,L}) {
  const values=d3.range(n);
  const marks=svg.selectAll('circle').data(values).join('circle')
    .attr('cx',(d,i)=>45+i*45).attr('cy',100).attr('r',15).attr('fill','#2878ad');
  // D3 v7 passes event and the bound datum d.
  marks.on('click',function(event,d){
    // this is the circle; an arrow may use event.currentTarget.
    const selected=d3.select(this);
    selected.classed('chosen',!selected.classed('chosen'));
    // interrupt stops the prior transition; duration is in milliseconds.
    selected.interrupt().transition().duration(350)
      .attr('fill',selected.classed('chosen')?'#e16a45':'#2878ad');
    svg.selectAll('text').data([d]).join('text').attr('x',30).attr('y',165)
      .text(L('点击的数据 = ','Clicked datum = ')+d);
  });
  return L('点击圆点，查看 event 和 d 的作用。','Click a circle to inspect event and d.');
}
```


[D3 documentation](https://d3js.org/d3-selection/events)

### Demonstration

Collapse a major. Its children disappear from the view while other branches and totals remain unchanged.

[Open section](https://mississippipotato.github.io/recreate/#ch-2-4)


---

# Lesson  3  Color

Understand color spaces, palette semantics, gamut and readability.

## 3.1 Color models

### Why study color models?

Equal changes in RGB values do not necessarily produce equal perceived color differences. Designing a gradient requires understanding how color spaces describe hue, lightness and saturation.

| Model | Components | Use |
| --- | --- | --- |
| RGB | Red, green and blue | Screen display, additive mixing |
| HSL | Hue, saturation and lightness | Choose hue and adjust saturation and lightness |
| CIE Lab | L* lightness, a* green-red, b* blue-yellow | Compare color differences and design gradients |
| CMYK | Cyan, magenta, yellow and black | Subtractive mixing for print |

### RGB, HSL and Lab

RGB describes display channels. HSL organizes hue on a wheel, useful for complementary, analogous and triadic palettes. Lab aims for approximate perceptual uniformity and offers control over lightness during interpolation. HSL L and Lab L* are different quantities.

### Color-vision differences

Color vision can differ in sensitivity associated with red, green and blue. Along with colors, charts can use shapes, labels and line styles. Later demonstrations compare the same graphic in grayscale and different color-vision simulations.

### Key code

#### 1. Converting RGB to HSL

```javascript
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; // Normalize RGB to 0–1.
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  const delta = max-min, l = (max+min)/2;
  if (delta === 0) return [0,0,l]; // Gray has zero chroma and saturation.
  const s = delta/(1-Math.abs(2*l-1));
  let h = max === r ? ((g-b)/delta)%6 : max === g ? (b-r)/delta+2 : (r-g)/delta+4;
  h = (h*60+360)%360; // Convert the six hue sectors to degrees.
  return [h,s,l];
}
console.log(rgbToHsl(100,50,200));
```

**Key-point explanation**

Normalize RGB by 255. The channel range gives delta and their midpoint gives lightness. The largest channel selects a hue sector, converted to degrees. The result uses degrees for H and 0–1 for S/L, matching `d3.hsl`.

#### 2. Applying a matrix to RGB

```javascript
const matrix = [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]];
const rgb = [100,50,200];
// Each matrix row forms a dot product with RGB.
const transformed = matrix.map(row =>
  row.reduce((sum, coefficient, i) => sum+coefficient*rgb[i], 0)
);
// Constrain channel values to 0–255 before formatting.
const result = transformed.map(v => Math.round(Math.max(0,Math.min(255,v))));
console.log(result);
```

**Key-point explanation**

The outer `map` calculates each output channel. The inner `reduce` adds three weighted products; index `i` pairs each coefficient with the corresponding channel. The original example uses a matrix to illustrate color transformations for color-vision conditions.

#### 3. D3 color objects and conversion

```javascript
const color = d3.color('rgb(100,50,200)'); // Parse a CSS color.
const rgb = color.rgb();
const hsl = d3.hsl(color);               // Construct an object in the target space.
const lab = d3.lab(color);
const hcl = d3.hcl(color);
console.log(rgb.r, hsl.h, lab.l, hcl.c);
console.log(hsl.formatHex());            // Format as CSS hexadecimal.
```

**Key-point explanation**

Use constructors `d3.hsl(color)`, `d3.lab(color)` and `d3.hcl(color)` to convert spaces, and `color.rgb()` for RGB. Read fields for numeric components; format the object to obtain a CSS string for fill.

### Runnable example: Constructing HSL colors

```javascript
function hsl({svg,d3,n}) {
  // Hue uses degrees; saturation and lightness use 0–1.
  const colors=d3.range(6).map(i=>d3.hsl(i*60,.65,n/10));
  svg.selectAll('rect').data(colors).join('rect').attr('x',(d,i)=>15+i*93)
    .attr('y',40).attr('width',84).attr('height',110).attr('fill',d=>d.formatHex());
  return colors.map(d=>({h:d.h,s:d.s,l:d.l,css:d.formatHex()}));
}
```


[D3 documentation](https://d3js.org/d3-color)

### Demonstration

Change H, S and L separately, then compare RGB and Lab values. Check whether parameter changes match perceived changes.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-1)

## 3.2 Color mapping: three palette types

### Three types of colormap

Choose a colormap according to the meaning of the data. Sequential, diverging and qualitative mappings correspond to ordered magnitudes, meaningful midpoints and unordered categories.

| Type | Data meaning | Color arrangement | Examples |
| --- | --- | --- | --- |
| Sequential | Low to high | Ordered changes in lightness | Viridis, Cividis, Blues |
| Diverging | Two sides of a reference | Distinct ends with a neutral middle | RdBu, BrBG |
| Qualitative | Categories without magnitude order | Distinct colors | Tableau10, Set1, Okabe-Ito |

### Does the midpoint have meaning?

A temperature anomaly can use zero as its midpoint, with opposite colors below and above the reference. Counts from low to high usually use a sequential scale rather than an arbitrary normal/abnormal boundary.

### Color changes and legends

A sequential map should make order apparent. A diverging legend should show its reference. A qualitative map should keep each category’s color stable. Applying several palettes to the same data makes their effects easy to compare.

### Key code

#### 1. Three color scales

```javascript
// Sequential: low to high.
const sequential = d3.scaleSequential(d3.interpolateViridis).domain([0,100]);
// Diverging: low, midpoint and high.
const diverging = d3.scaleDiverging(d3.interpolateRdBu).domain([-20,0,20]);
// Qualitative: categories assigned to a color array.
const qualitative = d3.scaleOrdinal(['A','B','C'], d3.schemeTableau10);
console.log(sequential(50), diverging(0), qualitative('A'));
console.log(d3.interpolateRdBu(0), d3.interpolateRdBu(1)); // Inspect the endpoint direction.
```

**Key-point explanation**

An interpolator takes a normalized parameter; a scale maps the data domain to it. A diverging domain explicitly sets the reference. `interpolateRdBu` runs from red to blue; reverse the domain or evaluate at `1-t` to reverse the direction.

#### 2. Encoding the selection rule

```javascript
function pickColormap({isOrdered, hasMeaningfulMidpoint}) {
  // First check for comparison around a meaningful reference.
  if (hasMeaningfulMidpoint) return 'diverging';
  if (isOrdered) return 'sequential';
  return 'categorical';
}
console.log(pickColormap({isOrdered:true,hasMeaningfulMidpoint:false}));
```

**Key-point explanation**

The parameter destructures two booleans describing the variable. The first matching condition returns: midpoint, then order, then categories. These properties come from the task and field semantics, rather than whether values can be stored as numbers.

### Runnable example: A sequential color scale

```javascript
function sequential({svg,d3,n}) {
  // The interpolator takes a normalized value; the scale handles the data domain.
  const color=d3.scaleSequential(d3.interpolateViridis).domain([0,n]);
  const values=d3.range(0,n+1);
  const x=d3.scaleBand().domain(values).range([20,570]).padding(.05);
  svg.selectAll('rect').data(values).join('rect').attr('x',x).attr('y',40)
    .attr('width',x.bandwidth()).attr('height',110).attr('fill',color);
  return {domain:color.domain(),middle:color(n/2)};
}
```


[D3 documentation](https://d3js.org/d3-scale/sequential)

### Demonstration

Switch palettes for colleges, temperatures and deviations. Check whether implied relationships match the field.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-2)

## 3.3 Lab gamut and display limits

### The Lab gamut diagram

CIE Lab describes a color with L*, a* and b*. Fixing L* gives an a*-b* plane that shows which colors at that lightness can be displayed.

- **L*:** lightness, usually discussed from 0 to 100.
- **a*:** green toward negative values, red toward positive values.
- **b*:** blue toward negative values, yellow toward positive values.

### Color spaces and device gamuts

A color space describes colors; a gamut is the set a device or standard can represent. sRGB is common on the Web, while Adobe RGB and Rec.2020 cover different ranges. Displayed colors depend on the device and display pipeline.

### Checking a color in D3

`d3.lab(L, a, b).rgb()` converts Lab to an RGB object. Check `displayable()` before formatting with `formatHex()` or `formatRgb()`. Clipping during formatting can make different Lab colors display as the same color.

To compare RGB and Lab interpolation, use the same endpoints and inspect the lightness of the intermediate colors.

### Key code

#### 1. Lab objects and gamut checks

```javascript
const color = d3.lab(50,30,-20); // Arguments are L*, a* and b*.
const rgb = color.rgb();       // Preserve the converted channel values.
console.log(rgb.r,rgb.g,rgb.b);
console.log(rgb.displayable()); // Check before CSS formatting.
console.log(rgb.formatHex());
const reverse = d3.lab('#ff0080'); // Construct Lab directly from a CSS color.
console.log(reverse.l,reverse.a,reverse.b);
```

**Key-point explanation**

`rgb()` returns an object whose channels may be outside display bounds. Hex formatting clips channels, so check `displayable()` first. `d3.lab(css)` converts an existing CSS color into Lab.

#### 2. RGB and Lab interpolation

```javascript
const inLab = d3.interpolateLab('#000000','#ffffff');
const inRgb = d3.interpolateRgb('#000000','#ffffff');
// Evaluate the same t in two interpolation spaces.
const samples = d3.range(5).map(i => {
  const t = i/4;
  return {t,lab:inLab(t),rgb:inRgb(t)};
});
console.table(samples);
```

**Key-point explanation**

`interpolateLab(a,b)` returns a function, not a complete palette. Call it with t to obtain a CSS color. Dividing the indices from `d3.range(5)` by four gives five samples including both endpoints.

### Runnable example: Color conversion and gamut checks

```javascript
function lab({svg,d3,n}) {
  const colors=d3.range(8).map(i=>d3.lab(n*10,-90+i*26,45).rgb());
  // Check raw RGB displayability before CSS formatting clamps it.
  svg.selectAll('rect').data(colors).join('rect').attr('x',(d,i)=>20+i*70)
    .attr('y',40).attr('width',62).attr('height',100)
    .attr('fill',d=>d.displayable()?d.formatHex():'#d4dce1');
  return colors.map(d=>({r:Math.round(d.r),g:Math.round(d.g),b:Math.round(d.b),displayable:d.displayable()}));
}
```


[D3 documentation](https://d3js.org/d3-color)

### Demonstration

Change L* and observe the displayable region. Compare out-of-gamut locations with gray areas.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-3)

## 3.4 Color harmony

### Five color harmonies

| Rule | Hue-wheel relationship | Main characteristic |
| --- | --- | --- |
| Monochromatic | One hue, varying lightness and saturation | A unified palette |
| Analogous | Neighboring hues, for example ±30° | Closely related colors |
| Complementary | 180° apart | A strong contrast between two groups |
| Triadic | 120° apart | Three hue families |
| Split-complementary | Base hue and neighbors of its complement, such as +150° and +210° | Contrast with less direct opposition |

### Constructing a palette on the wheel

Start from a base hue H and add the offsets for a harmony. Hue wraps around: 350° plus 30° becomes 20°. Monochromatic colors share a hue and differ through saturation or lightness.

### Using harmonies in charts

Hue relationships organize a palette. For categories, compare the colors on actual small marks, thin lines and backgrounds. For numeric data, first inspect whether the palette has a clear lightness order.

### Key code

#### 1. Hue and lightness for five harmonies

```javascript
const wrap = h => (h%360+360)%360; // Handle negative angles and values beyond one turn.
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
```

**Key-point explanation**

The object stores hue offsets per rule. `offsets[rule]` selects an array by name. JavaScript’s remainder can be negative; wrapping twice handles negative hue offsets. A monochromatic palette varies lightness to avoid producing identical colors.

### Runnable example: Hue angles and modulo

```javascript
function harmony({svg,d3,n}) {
  const hues=[n*30,n*30+150,n*30+210];
  // Modulo returns angles to the wheel; these colors encode identity, not magnitude.
  const color=h=>d3.hsl(h%360,.6,.52).formatHex();
  svg.selectAll('circle').data(hues).join('circle').attr('cx',(d,i)=>110+i*170)
    .attr('cy',95).attr('r',48).attr('fill',color);
  return hues.map(h=>({h:h%360,color:color(h)}));
}
```


[D3 documentation](https://d3js.org/d3-color)

### Demonstration

Change the base hue and harmony; compare positions on the wheel with the swatches.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-4)

## 3.5 Established palettes

### Common scientific palettes

| Palette | Type | Use |
| --- | --- | --- |
| Okabe-Ito / Wong | Qualitative, eight colors | Distinguish categories |
| Paul Tol bright | Qualitative, seven colors | Category encoding on light backgrounds |
| Tableau10 | Qualitative, ten colors | General categorical charts |
| Viridis / Cividis | Sequential | Heatmaps and continuous values |
| RdBu / BrBG | Diverging | Deviations around a reference |

A qualitative palette is an array of colors. Sequential and diverging maps often use interpolators to generate a continuous range. D3’s `schemeTableau10` is an array; `interpolateViridis` is an interpolator.

### Category count and palette size

More categories make colors harder to distinguish. Add labels, shapes or small multiples, or group minor categories as “other”. The variable remains categorical and should retain a qualitative encoding.

### From swatches to marks

Large palette swatches may be easy to distinguish while small scatterplot marks are harder. The demonstration shows both so that the same colors can be compared at different sizes.

### Key code

#### 1. Color arrays and continuous interpolators

```javascript
const palettes = {
  okabeIto:['#000000','#E69F00','#56B4E9','#009E73','#F0E442','#0072B2','#D55E00','#CC79A7'],
  tolBright:['#4477AA','#EE6677','#228833','#CCBB44','#66CCEE','#AA3377','#BBBBBB'],
  tableau:d3.schemeTableau10
};
// Pass a qualitative array to range.
const color = d3.scaleOrdinal().domain(['A','B','C']).range(palettes.okabeIto);
// Sample a continuous interpolator to produce an array.
const sequential = d3.quantize(d3.interpolateViridis,7);
console.log(color('B'),sequential);
```

**Key-point explanation**

`scheme...` values are generally arrays, while `interpolate...` values are functions. `range` takes an array; `scaleSequential` takes an interpolator. `quantize(interpolator,n)` samples n positions from 0 to 1 for swatches or legends.

### Runnable example: A stable categorical palette

```javascript
function schemes({svg,d3,n}) {
  const categories=d3.range(n).map(i=>'C'+(i+1));
  // An explicit domain fixes category-to-color correspondence.
  const color=d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10);
  svg.selectAll('circle').data(categories).join('circle')
    .attr('cx',(d,i)=>35+i*52).attr('cy',90).attr('r',18).attr('fill',color);
  return categories.map(category=>({category,color:color(category)}));
}
```


[D3 documentation](https://d3js.org/d3-scale/ordinal)

### Demonstration

Compare three categorical and two sequential palettes in both swatches and a scatterplot.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-5)

## 3.6 Comparing color encodings

### Comparing color choices

To compare palettes, fix the data, positions, mark sizes and legend, changing only the color mapping. This isolates the meaning introduced by color.

| Case | What to inspect |
| --- | --- |
| Rainbow for continuous quantities | Check lightness order and abrupt visual boundaries |
| Red-green groups | Check separation in grayscale and color-vision simulations |
| Continuous gradient for categories | Check whether lightness implies a ranking |
| Stable qualitative palette | Check category-color consistency across views |

### Judge colors through a reading task

Ask which group is largest, which points belong to the same category, or where values exceed a reference. Compare the answers across palettes. The palette should support the reading task.

The demonstration provides both categorical and continuous tasks. Switch tasks, then compare sequential, diverging and qualitative choices with the meaning of the variable.

### Key code

#### 1. Fixing the data while switching colors

```javascript
const values = [12,35,60,85];
const maps = {viridis:d3.interpolateViridis,rainbow:d3.interpolateRainbow};
function draw(name) {
  const color = d3.scaleSequential(maps[name]).domain([0,100]);
  svg.selectAll('rect').data(values).join('rect')
    .attr('x',(d,i)=>i*60).attr('y',20).attr('width',50).attr('height',80)
    .attr('fill',color); // Only fill uses the changing scale.
}
draw('viridis');
d3.select('#palette-choice').on('change', event => draw(event.currentTarget.value));
```

**Key-point explanation**

Keep data and geometry fixed, selecting only a new color function. Function-valued `fill` calls `color(d)` per datum. Read the select value through `currentTarget.value` and redraw when it changes.

### Runnable example: Two views of the same values

```javascript
function contrast({svg,d3,n}) {
  const values=d3.range(10),width=52;
  // Both rows use the same values with different interpolators.
  const scales=[d3.scaleSequential(d3.interpolateRainbow),d3.scaleSequential(d3.interpolateViridis)]
    .map(scale=>scale.domain([0,n]));
  scales.forEach((color,row)=>svg.append('g').selectAll('rect').data(values).join('rect')
    .attr('x',d=>20+d*width).attr('y',30+row*80).attr('width',width-2)
    .attr('height',55).attr('fill',color));
  return {values,domain:[0,n]};
}
```


[D3 documentation](https://d3js.org/d3-scale-chromatic)

### Demonstration

Keep the left view fixed while changing the right palette and viewing condition. Check the legend against the data semantics.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-6)

## 3.7 Generating and checking palettes

### A distinct main color and muted companions

The original course describes palette generation through hue, saturation and lightness. Hue separates color families, saturation controls intensity, and lightness controls darkness. A main color and its companions can use different saturation and lightness.

- **Main color:** choose the base hue for the emphasized object.
- **Companions:** use neighboring or complementary hues with lower saturation.
- **Backgrounds and annotations:** use lighter, less saturated colors to separate them from the marks.

### The original seven-color recipe

The recipe contains a main color, two analogous colors, two muted analogous colors, a complement and a light tint. Calculate hue offsets, then adjust S and L for each role. The demonstration allows the parameters to be compared.

### Apply the colors to a chart

After generating a palette, compare it on the same chart: whether the main color stands out, whether the background competes with the marks, and whether lines and text are clear. When changing the palette size, also check the category-to-legend mapping.

### Key code

#### 1. A seven-color recipe

```javascript
const wrap = h => (h%360+360)%360;
const clamp = value => Math.max(0,Math.min(1,value));
function genPalette(H,S,L) {
  const color = (h,s,l) => d3.hsl(wrap(h),clamp(s),clamp(l)).formatHex();
  return [
    color(H-30,S*0.6,L*1.1), // Muted left analogous.
    color(H-30,S,L), color(H,S,L), color(H+30,S,L),
    color(H+30,S*0.6,L*1.1), // Muted right analogous.
    color(H+180,S*0.8,L*0.95), // Complement.
    color(H,S*0.2,L*1.4)      // Light tint.
  ];
}
console.log(genPalette(210,0.6,0.55));
```

**Key-point explanation**

The inner `color` function reuses wrapping, bounds handling and formatting. Each entry derives from the base H/S/L through offsets or factors. The returned array can feed an ordinal range or swatch display.

#### 2. Generate vivid and muted pairs

```javascript
const hues = [H, H + 30, H + 180];
// Produce two saturations for each hue, retaining its identity.
const pairs = hues.flatMap(hue => [
  d3.hsl(hue, S / 100, L / 100).formatHex(),
  d3.hsl(hue, S * 0.48 / 100, Math.min(95, L + 22) / 100).formatHex()
]);
const background = d3.hsl(H, S * 0.14 / 100, 0.92).formatHex();
console.log([...pairs, background]);
```

**Key-point explanation**

flatMap flattens two colors per hue into one array. D3 HSL saturation and lightness use 0–1, so convert percentage controls. Paired colors share a hue; the final low-saturation color supplies a background.

### Runnable example: Parameterized palette generation

```javascript
function generator({svg,d3,n}) {
  // d3.range creates indices; equal hue steps are only candidate colors.
  const hues=d3.range(n).map(i=>i*360/n);
  svg.selectAll('rect').data(hues).join('rect').attr('x',(d,i)=>20+i*550/n)
    .attr('y',45).attr('width',550/n-4).attr('height',100)
    .attr('fill',h=>d3.hsl(h,.42,.6).formatHex());
  return {count:n,hueStep:360/n,hues};
}
```


[D3 documentation](https://d3js.org/d3-color)

### Demonstration

Increase color count and inspect hue separation and swatches. Save a candidate before comparing.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-7)

## 3.8 Color vision and redundant encoding

### Checking color in the complete figure

This section follows the original three cases: a categorical scatterplot, a sequential heatmap and a red-green comparison. A complete figure reveals how mark size, lines, background and legend interact with color.

### Inspection steps

- Read the original and identify which information depends on color.
- Switch to grayscale or a color-vision simulation; inspect categories, value order and legend.
- Add text, shapes or line styles and compare how clearly key objects can be identified.

### Redundant encoding

A category can use both color and shape, a line can use both color and dash pattern, and key values can carry direct labels. Readers can then use several cues together.

### Key code

#### 1. Adding shape and text to color

```javascript
const categories = ['A','B','C'];
const color = d3.scaleOrdinal(categories,d3.schemeTableau10);
const shape = d3.scaleOrdinal(categories,[d3.symbolCircle,d3.symbolSquare,d3.symbolTriangle]);
const symbol = d3.symbol().size(100); // size is area, not radius.
const nodes = svg.selectAll('g.point').data(data).join('g').attr('class','point')
  .attr('transform',d=>`translate(${x(d.x)},${y(d.y)})`);
nodes.selectAll('path').data(d=>[d]).join('path')
  .attr('d',d=>symbol.type(shape(d.category))()).attr('fill',d=>color(d.category));
nodes.selectAll('text').data(d=>[d]).join('text').attr('x',10).text(d=>d.category);
```

**Key-point explanation**

`d3.symbol()` is a path generator. Set its type and then invoke it with `()` to obtain SVG path data. Each parent group has one record; `d => [d]` binds that record to each child mark. Text, shape and color identify the category together.

#### 2. Simulate vision in linear RGB

```javascript
// Decode sRGB before applying the matrix.
const linear = channel => channel <= 0.04045
  ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const rgb = [color.r, color.g, color.b].map(v => linear(v / 255));
// Each row of the deuteranopia matrix produces one output channel.
const matrix = [[0.367322,0.860646,-0.227968],
  [0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]];
const simulated = matrix.map(row => row.reduce((sum, coefficient, i) => sum + coefficient * rgb[i], 0));
```

**Key-point explanation**

Map produces output channels and reduce computes each dot product. Re-encode the result as sRGB and clamp it for display. The canvas compares three vision modes while retaining shapes and labels as independent encodings.

### Runnable example: Redundant shape and text

```javascript
function accessibility({svg,d3,n}) {
  const values=[4,6,8,5];
  // Symbol type supplies a cue beyond color.
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


[D3 documentation](https://d3js.org/d3-shape/symbol)

### Demonstration

Switch original color, grayscale and simulation, then hide labels. Identify the information that remains readable.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-8)


---

# Lesson  4  Low-dimensional visualization

Represent tables, scales, curves and scalar fields.

## 4.1 Wide and long tables

### Wide and long tables

The original course uses state-level crime data to explain table reshaping. One row per state and one column per measure is wide format. Expanding the measures into individual rows produces long format.

| Format | One row represents | Example fields |
| --- | --- | --- |
| Wide | An entity | state, murder, robbery, burglary |
| Long | One measure of an entity | state, metric, value |

### Why reshape?

Wide tables place measures side by side. Long tables make filtering, grouping and mark binding convenient. The original heatmap uses state and metric for position and value for color.

### flatMap and type conversion

`flatMap` generates measure records for each entity and flattens one array level. Retain the entity identifier and measure name as a compound cell key. `d3.autoType` converts common types, while fields such as formatted IDs can be handled explicitly in a row callback.

### Key code

#### 1. Loading a wide table with automatic conversion

```javascript
// autoType converts each row using common value types.
const rows = [
  {state:'A',murder:'12',robbery:'30'},
  {state:'B',murder:'8',robbery:'25'}
].map(row => d3.autoType({...row})); // Copy before conversion to retain the originals.
console.log(typeof rows[0].murder); // 'number'
// For CSV, use await d3.csv(url, d3.autoType).
```

**Key-point explanation**

`autoType` converts values on the row object. `{...row}` makes a shallow copy before conversion. Pass `d3.autoType` directly as a CSV row callback, or use a custom callback for fields such as IDs with meaningful leading zeros.

#### 2. flatMap: wide to long

```javascript
const wide = [{state:'A',murder:12,robbery:30},{state:'B',murder:8,robbery:25}];
const metrics = ['murder','robbery'];
// Iterate entities, then fields, and flatten the resulting arrays.
const long = wide.flatMap(row => metrics.map(metric => ({
  state:row.state,
  metric,
  value:row[metric] // Brackets read the field named by the variable.
})));
console.log(long.length); // 2×2 = 4
const groups = d3.group(long,d=>d.metric);
```

**Key-point explanation**

`row.metric` accesses a literal field named metric, whereas `row[metric]` uses the variable’s value as the field name. The inner map creates measure records; flatMap combines them. Entity and measure jointly identify each cell.

#### 3. Crime 1985: reshape and derive a comparison

```javascript
const rows = await d3.csv(url, row => ({
  category: row['犯罪类型'], male: +row['男性'], female: +row['女性']
}));
// Add a difference ratio without changing source fields.
const withRatio = rows.map(row => ({...row,
  ratio: (row.male - row.female) / (row.male + row.female)
}));
const longRows = rows.flatMap(row => [
  {category:row.category, gender:'male', value:row.male},
  {category:row.category, gender:'female', value:row.female}
]);
```

**Key-point explanation**

The wide table has male and female columns. The long table stores the column identity in gender and its count in value. A difference ratio supports comparison across unequal totals; inspect source counts alongside it.

### Runnable example: flatMap and compound identity

```javascript
function reshape({svg,d3,n}) {
  const wide=[{id:'A',x:n,y:n*2},{id:'B',x:n+1,y:n*3}];
  // Create observations per entity; preserve entity and field identifiers.
  const long=wide.flatMap(row=>['x','y'].map(field=>({id:row.id,field,value:row[field]})));
  svg.selectAll('text').data(long).join('text').attr('x',35).attr('y',(d,i)=>40+i*35)
    .text(d=>`${d.id} / ${d.field} = ${d.value}`);
  return {wide,long};
}
```


[D3 documentation](https://d3js.org/d3-array/transform)

### Demonstration

Select a cell and switch formats. Locate the same entity–measure value.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-1)

## 4.2 Scales and axes

### Data, plot and screen space

The original scatterplot illustrates coordinate transformation. Values are mapped into a plotting region, then margins place that region in the SVG. Marks and axes should use the same mapping.

| Space | Content | Example |
| --- | --- | --- |
| Data | Original field values | Count 100, score 80 |
| Plot | Coordinates within the plotting region | 0 to innerWidth |
| Screen | SVG coordinates including margins | translate(margin.left, margin.top) |

### Choosing a scale

| Scale | Equal distances represent | Use |
| --- | --- | --- |
| scaleLinear | Equal differences | General numeric axis |
| scaleLog | Equal ratios | Values spanning orders of magnitude |
| scaleSqrt | Square-root changes | Radius for area-proportional circles |
| scaleBand | Bands for discrete categories | Bar-chart category axis |

On a linear scale, 1, 10 and 100 are not equally spaced. On a log scale, successive powers of ten are equally spaced. The values stay the same; their screen distances change.

### What an axis does

`d3.axisBottom(x)` generates ticks and labels using the x scale. Using the same scale for the axis and marks keeps them aligned.

### Key code

#### 1. Scales, margins and axes

```javascript
const margin = {left:50,top:20,right:20,bottom:30};
const innerW = 600-margin.left-margin.right;
const innerH = 300-margin.top-margin.bottom;
const x = d3.scaleLinear().domain([0,100]).range([0,innerW]);
const y = d3.scaleLinear().domain([0,100]).range([innerH,0]);
// Translate the group once, then use plot-local coordinates.
const plot = svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
plot.selectAll('circle').data(points).join('circle')
  .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',4);
plot.append('g').attr('transform',`translate(0,${innerH})`).call(d3.axisBottom(x));
```

**Key-point explanation**

Scales produce plot-local coordinates, while the parent translation adds margins. SVG y increases downward, so the y range runs from innerH to zero. `call(axis)` passes the selection to the axis generator, which creates ticks and labels inside the group.

#### 2. Linear and logarithmic distances

```javascript
const linear = d3.scaleLinear().domain([1,1000]).range([0,500]);
const log = d3.scaleLog().domain([1,1000]).range([0,500]);
const values = [1,10,100,1000];
console.table(values.map(value=>({value,linear:linear(value),log:log(value)})));
// invert maps pixels back to values, useful for pointer interaction.
console.log(log.invert(250));
```

**Key-point explanation**

Linear scales map equal differences to equal distances; log scales map equal ratios to equal distances. Successive tenfold values are therefore evenly spaced on log. A log domain uses one sign and excludes zero. `invert` maps pixels back to data values.

### Runnable example: Linear and log axes

```javascript
function axis({svg,d3,n}) {
  const values=[1,10,100,1000];
  // A log domain cannot cross zero; neither scale changes the values.
  const x=(n===1?d3.scaleLinear():d3.scaleLog()).domain(n===1?[0,1000]:[1,1000]).range([40,550]);
  svg.append('g').attr('transform','translate(0,135)').call(d3.axisBottom(x).ticks(5,'~g'));
  svg.selectAll('circle').data(values).join('circle').attr('cx',x).attr('cy',80)
    .attr('r',7).attr('fill','#e16a45');
  return values.map(value=>({value,pixel:x(value)}));
}
```


[D3 documentation](https://d3js.org/d3-axis)

### Demonstration

Compare 1,10,100,1000 on linear and log axes and explain when they are equally spaced.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-2)

## 4.3 Curve interpolation and fitting

### Interpolation and fitting

| Method | Purpose | Example |
| --- | --- | --- |
| Interpolation | Construct connections or intermediate values from samples | Linear, Catmull-Rom, natural spline |
| Fitting | Summarize a relationship with a model | Linear regression, LOESS |

The original course switches curves with `d3.line().curve(...)`. This controls how samples are connected. Some curves pass through samples, while basis uses a different smoothing rule. A least-squares line fits a model by minimizing the sum of squared residuals.

### Common curves

| Curve | Characteristic | Useful for |
| --- | --- | --- |
| linear | Straight segments between samples | Inspect samples and changes |
| step / stepBefore / stepAfter | Step connections | State changes and discrete updates |
| monotoneX | Preserves monotonicity between samples along x | Avoid additional local extrema |
| Catmull-Rom / natural | Smooth connections through samples | Compare curve shape |
| basis | B-spline smoothing | Inspect the effect of smoothing |

### Keep samples visible

Retain the sample marks when switching curves to distinguish observations from the connection rule. Overlay the fitted line and compare residuals between it and the samples.

### Key code

#### 1. line, datum and curve

```javascript
const line = d3.line()
  .x(d=>x(d.x)).y(d=>y(d.y)) // Accessors produce pixel coordinates per sample.
  .curve(d3.curveCatmullRom.alpha(0.5));
// One path receives the complete point array through datum.
svg.append('path').datum(points)
  .attr('d',line).attr('fill','none').attr('stroke','#2878ad');
// Bind individual samples to circles with data.
svg.selectAll('circle').data(points).join('circle')
  .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',4);
```

**Key-point explanation**

`datum(points)` binds the whole array to one element; `data(points)` matches items to elements. A function-valued d calls the line generator. Switching curve retains the samples and scales while changing the connection rule.

#### 2. A least-squares line

```javascript
const meanX = d3.mean(points,d=>d.x), meanY = d3.mean(points,d=>d.y);
const denominator = d3.sum(points,d=>(d.x-meanX)**2);
if (!denominator) return; // Equal x values do not determine a unique slope.
const a = d3.sum(points,d=>(d.x-meanX)*(d.y-meanY))/denominator;
const b = meanY-a*meanX;
const fitted = d3.extent(points,d=>d.x).map(x=>({x,y:a*x+b}));
svg.append('path').datum(fitted)
  .attr('d',d3.line().x(d=>x(d.x)).y(d=>y(d.y)))
  .attr('fill','none').attr('stroke','#e16a45');
```

**Key-point explanation**

The model is `y = ax + b`. Centered x/y values determine slope a and intercept b. Evaluate the model at the two x endpoints to draw the fitted line. Unlike choosing a curve, this calculates model parameters.

#### 3. Overlay ten curves on the same points

```javascript
const curves = [d3.curveLinear, d3.curveMonotoneX, d3.curveNatural,
  d3.curveBasis, d3.curveCardinal, d3.curveCatmullRom.alpha(0.5),
  d3.curveStep, d3.curveStepBefore, d3.curveStepAfter, d3.curveBundle.beta(0.85)];
// Every path uses the same data and axes.
svg.selectAll('path.interpolation').data(curves).join('path')
  .attr('class','interpolation').attr('fill','none')
  .attr('d', curve => d3.line().x(d => x(d[0])).y(d => y(d[1])).curve(curve)(points));
```

**Key-point explanation**

The curve factory configures a line generator. Binding ten factories produces ten paths on shared scales. Plateaus expose Cardinal overshoot and MonotoneX monotonicity; Basis and Bundle need not pass through every sample.

### Runnable example: Line generators and curves

```javascript
function curves({svg,d3,n}) {
  const points=[[25,130],[125,55],[225,135],[325,45],[425,125],[545,65]];
  // curve changes connections, not the samples.
  const choices=[d3.curveLinear,d3.curveStep,d3.curveMonotoneX,d3.curveCatmullRom.alpha(.5),d3.curveBasis];
  const line=d3.line().x(d=>d[0]).y(d=>d[1]).curve(choices[n-1]);
  svg.append('path').datum(points).attr('d',line).attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.selectAll('circle').data(points).join('circle').attr('cx',d=>d[0]).attr('cy',d=>d[1]).attr('r',5).attr('fill','#e16a45');
  return {samples:points.length,curve:['linear','step','monotoneX','Catmull–Rom','Basis'][n-1]};
}
```


[D3 documentation](https://d3js.org/d3-shape/curve)

### Demonstration

Compare ten curves and inspect sample passage, then overlay least squares to distinguish connection rules from model fitting.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-3)

## 4.4 Aspect ratio and perceived slope

### Aspect ratio and perceived slope

The same values appear flatter in a shorter chart and steeper in a taller one. Aspect ratio changes the visual angle, so read the axes when comparing change.

### Banking toward 45 degrees

The original course discusses arranging average slopes near 45 degrees. This comes from research on line-chart aspect ratios and aims to make local changes easier to compare. Adjust the plot height to see which changes become flattened or exaggerated.

### Data slope and screen slope

Data slope is Δy / Δx. Screen slope also depends on the ratio of pixel scales in the two directions. Changing only the y scale’s `range` changes the angle while retaining the data.

Save chart A, then change the height of B. Compare the same segment in both views and check its values and axis domains.

### Key code

#### 1. Changing slope with pixel ranges

```javascript
const values = [2,4,3,6,8,7];
const height = 180;
const x = d3.scaleLinear().domain([0,values.length-1]).range([0,500]);
const y = d3.scaleLinear().domain([0,10]).range([height,0]);
const line = d3.line().x((d,i)=>x(i)).y(d=>y(d));
// Keep data/domain fixed and change the vertical pixel range.
y.range([height/2,0]);
svg.append('path').datum(values).attr('d',line).attr('fill','none').attr('stroke','#2878ad');
```

**Key-point explanation**

A scale is a callable object; `y.range(...)` updates its mapping. The line accessor calls the scale when generating the path, using the new range. Fewer pixels for the same Δy make the segment look flatter.

#### 2. Angle to screen coordinates

```javascript
function lineAtAngle(degrees,length=240) {
  const radians = degrees*Math.PI/180; // Trigonometric functions use radians.
  const origin = {x:60,y:260};
  return {
    x1:origin.x,y1:origin.y,
    x2:origin.x+length*Math.cos(radians),
    y2:origin.y-length*Math.sin(radians) // Subtract to move upward in SVG.
  };
}
console.log(lineAtAngle(45));
```

**Key-point explanation**

Convert degrees to radians with π/180. Cosine supplies the horizontal component and sine the vertical component. SVG y points downward, so subtract the sine term for an upward line. The four returned fields map to the line’s endpoint attributes.

#### 3. Compute the mean absolute angle

```javascript
// Normalize points to 0–1; W and H are plot dimensions.
const angles = d3.pairs(points, (a, b) => {
  const dx = Math.abs(b[0] - a[0]) * W;
  const dy = Math.abs(b[1] - a[1]) * H;
  return Math.atan2(dy, dx) * 180 / Math.PI;
});
const meanAngle = d3.mean(angles);
// Bisect H to approach a mean angle of 45°, keeping data fixed.
console.log(meanAngle);
```

**Key-point explanation**

Pairs produces adjacent segments. atan2 returns radians, converted to degrees by 180/π. The calculator uses an unweighted mean absolute angle. Changing H/W changes screen orientation while preserving source values.

### Runnable example: Changing slope through range

```javascript
function aspect({svg,d3,n}) {
  const values=[2,4,3,6,8,7];
  // Fix the domain and change only the vertical pixel range.
  const x=d3.scaleLinear().domain([0,5]).range([30,550]);
  const y=d3.scaleLinear().domain([0,10]).range([175,175-n*15]);
  svg.append('path').datum(values).attr('d',d3.line().x((d,i)=>x(i)).y(y))
    .attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.append('g').attr('transform','translate(30,0)').call(d3.axisLeft(y).ticks(4));
  return {values,pixelHeight:n*15};
}
```


[D3 documentation](https://d3js.org/d3-scale/linear)

### Demonstration

Save A, change B’s height, and compare visual slope with the unchanged values.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-4)

## 4.5 Contours: Marching Squares

### Scalar fields and contours

A scalar field assigns a value to each spatial position, such as temperature, elevation or density. A contour connects equal-valued positions and separates regions above and below a threshold.

### The sixteen Marching Squares cases

Sample the field on a grid. Each cell has four corners, each assigned 0 or 1 according to the threshold. Four bits give 2⁴ = 16 combinations, each associated with contour segments.

- Use the same corner order for bit encoding, table lookup and drawing.
- Inspect edge endpoints to find edges crossing the threshold.
- Interpolate crossing positions on edges and connect the corresponding points.

### Edge interpolation and ambiguity

For endpoint values v₀ and v₁ and threshold t, the crossing fraction is `(t − v₀) / (v₁ − v₀)`. Alternating high-low corners admit two connections. The demonstration lets you compare the ambiguous connections around the cell center.

### Contours in D3

`d3.contours` accepts row-major grid values and returns GeoJSON MultiPolygons. `size` specifies columns and rows; `thresholds` specifies contour values. Grid coordinates are then mapped to screen pixels.

![The sixteen Marching Squares cases from the course material. Case numbering must follow the implementation’s convention.](../figures/marching-squares-16.png)

### Key code

#### 1. Corner bits and edge interpolation

```javascript
// Order: TL, TR, BR, BL with bits 1, 2, 4, 8.
const values = [8,2,7,1], threshold = 5;
const code = values.reduce((bits,value,i)=>bits | ((value>=threshold ? 1 : 0)<<i),0);
console.log(code); // 5, binary 0101.
function crossing(v0,v1,t) {
  return (t-v0)/(v1-v0); // Evaluate on an edge that crosses the threshold.
}
const fraction = crossing(values[0],values[1],threshold);
console.log(fraction); // Relative position from TL to TR.
```

**Key-point explanation**

`&lt;&lt; i` moves one bit to position i; `|` combines the bits into a case from 0 to 15. Corner order must agree with the lookup table. An interpolation fraction of zero is at v₀, one at v₁ and one half at the edge midpoint.

#### 2. d3.contours: grids to polygons

```javascript
const columns=12, rows=12;
// values[y*columns+x]: row-major order.
const values=d3.range(columns*rows).map(i=>Math.sin(i%columns/3)*Math.cos(Math.floor(i/columns)/3));
const contours=d3.contours().size([columns,rows]).thresholds([0])(values);
const path=d3.geoPath(d3.geoIdentity().scale(15)); // Grid units to pixels.
svg.selectAll('path.contour').data(contours).join('path').attr('class','contour')
  .attr('d',path).attr('fill','#b7dfdb').attr('stroke','#2878ad');
```

**Key-point explanation**

Create and configure a contour generator, then call it with values. It returns MultiPolygons for threshold regions. `geoPath` converts the polygon geometry to SVG path data; fill shows the region and stroke its boundary.

#### 3. Generate filled contours from a full field

```javascript
const rows = d3.csvParseRows(text, row => row.map(Number));
const values = rows.flat();
// Size is [columns, rows]; values are row-major.
const contours = d3.contours().size([rows[0].length, rows.length])
  .thresholds(d3.range(-20, 46, 5))(values);
const path = d3.geoPath(d3.geoIdentity().scale(cellSize));
svg.selectAll('path.contour').data(contours, d => d.value).join('path')
  .attr('class','contour').attr('d',path).attr('fill',d => color(d.value));
```

**Key-point explanation**

Each threshold produces a MultiPolygon covering values at or above it. GeoPath converts the geometry to an SVG path. The selected-cell view explains the local classification and edge interpolation behind the region boundary.

### Runnable example: The d3.contours input contract

```javascript
function contours({svg,d3,n}) {
  const size=12,values=d3.range(size*size).map(i=>Math.sin(i%size/3)*Math.cos(Math.floor(i/size)/3)*50+50);
  // size specifies columns and rows; values is row-major flattened data.
  const polygons=d3.contours().size([size,size]).thresholds([n*10])(values);
  const path=d3.geoPath(d3.geoIdentity().scale(15));
  svg.append('g').attr('transform','translate(170,5)').selectAll('path').data(polygons).join('path')
    .attr('d',path).attr('fill','#b7dfdb').attr('stroke','#2878ad').attr('stroke-width',2);
  return {threshold:n*10,grid:[size,size],polygons:polygons[0].coordinates.length};
}
```


[D3 documentation](https://d3js.org/d3-contour/contour)

### Demonstration

Choose a cell, reveal classifications, crossings and segments, then edit corners to compare all sixteen states and saddle cases.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-5)


---

# Lesson  5  Time-series visualization

Lines, calendars, spirals and storylines suit different temporal tasks.

## 5.1 Properties of time

### Five properties of time

| Property | Meaning | Visualization example |
| --- | --- | --- |
| Ordered | Events have an order | Sorted event logs, line charts |
| Continuous | Other instants exist between two instants | Position by elapsed time |
| Periodic | Processes may repeat | Day/night, weeks, seasons |
| Independent of space | Time and spatial location can be represented separately | Timeline and map encodings |
| Structured | Units such as years, months and days form a hierarchy | Calendars, weeks, leap years |

### Time and sampling intervals

Time is continuous, while records may be daily, monthly or irregular. Adjacent array entries need not be equally spaced in time. A temporal scale retains the elapsed intervals in the graphic.

### Calendar structure

Months have different lengths, and leap years contain February 29. D3 intervals provide `range`, `offset` and `count` for generating dates, moving dates and counting interval boundaries.

The demonstration expands the five properties and compares equal index spacing with elapsed-time spacing for a set of dates.

### Key code

#### 1. Organizing time properties in an array

```javascript
const attributes=[
  {key:'ordered',name:'有序性'}, {key:'continuous',name:'连续性'},
  {key:'periodic',name:'周期性'}, {key:'spatial',name:'独立于空间'},
  {key:'structured',name:'结构性'}
];
// One array supplies labels and interaction keys.
d3.select('#time-properties').selectAll('button').data(attributes,d=>d.key).join('button')
  .text(d=>d.name).on('click',function(event,picked){
    d3.select('#time-properties').selectAll('button').classed('selected',d=>d.key===picked.key);
    console.log(picked.key);
  });
```

**Key-point explanation**

Stable keys identify items for joins and state comparison; names supply labels. The event’s picked datum is the clicked item, whereas classed evaluates each candidate d. The two callbacks handle the local action and the group-wide selection state.

#### 2. Generating days and crossing leap day

```javascript
const start=new Date(Date.UTC(2024,0,1));
const stop=new Date(Date.UTC(2025,0,1));
// Stop is exclusive; leap day is included automatically.
const days=d3.utcDay.range(start,stop);
console.log(days.length); // 366
const next=d3.utcDay.offset(new Date(Date.UTC(2024,1,28)),1);
console.log(d3.utcFormat('%Y-%m-%d')(next)); // 2024-02-29
```

**Key-point explanation**

Months in `Date.UTC` start at zero. `utcDay.range` generates calendar dates and `offset` moves by days. This example consistently uses UTC construction, intervals and formatting. Local-time versions use timeDay and timeFormat.

### Runnable example: UTC date intervals

```javascript
function time({svg,d3,n}) {
  // Use UTC intervals to avoid local-time shifts.
  const start=new Date(Date.UTC(2024,1,25));
  const days=d3.utcDays(start,d3.utcDay.offset(start,n));
  const x=d3.scaleUtc().domain(d3.extent(days)).range([30,550]);
  svg.selectAll('circle').data(days).join('circle').attr('cx',x).attr('cy',80).attr('r',6).attr('fill','#2878ad');
  svg.append('g').attr('transform','translate(0,125)').call(d3.axisBottom(x).ticks(d3.utcDay.every(1)).tickFormat(d3.utcFormat('%m-%d')));
  return days.map(d=>d3.utcFormat('%Y-%m-%d')(d));
}
```


[D3 documentation](https://d3js.org/d3-time)

### Demonstration

Select time properties to compare irregular intervals, missing values and leap day.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-1)

## 5.2 Linear-time visualization

### Standard temporal visualization: line charts

A temporal line chart uses time on the horizontal axis and a measure on the vertical axis. The original course compares the frequency of names such as Marie, Jean and Camille over the years.

### Parsing, scaling and formatting time

- `timeParse` parses a string such as the year “1965” into a date.
- `scaleTime` or `scaleUtc` maps dates to horizontal coordinates.
- `timeFormat` or `utcFormat` formats dates in ticks and tooltips.

### Highlighting and time-range filters

Several series can share one time axis. Hovering reveals dates and values; selecting a line can dim the others. A time-range filter updates both the displayed records and the scale domain.

### Connecting across missing values

A date without a reading differs from a date whose reading is zero. `line.defined(...)` can break a line at missing values. This section compares gaps and zero substitution using the same daily sequence.

### Key code

#### 1. Parsing and formatting dates

```javascript
const parseYear=d3.utcParse('%Y');
const formatYear=d3.utcFormat('%Y');
const date=parseYear('1965'); // String to Date.
console.log(formatYear(date)); // Date to string.
// %Y year, %m month, %d day, %H hour, %M minute, %S second.
const parseDay=d3.utcParse('%Y-%m-%d');
console.log(parseDay('2024-02-29'));
```

**Key-point explanation**

Both functions first create a parser or formatter, then accept a concrete value. Tokens are case sensitive: `%m` is month and `%M` is minute. Parsing supplies dates for computation; formatting supplies display text.

#### 2. Time axes and missing values

```javascript
const x=d3.scaleUtc().domain(d3.extent(series,d=>d.date)).range([0,500]);
const y=d3.scaleLinear().domain([0,d3.max(series,d=>d.value)]).range([180,0]);
const line=d3.line()
  .defined(d=>d.value!==null) // End the current subpath at a missing record.
  .x(d=>x(d.date)).y(d=>y(d.value));
svg.append('path').datum(series).attr('d',line).attr('fill','none').attr('stroke','#2878ad');
svg.append('g').attr('transform','translate(0,180)').call(d3.axisBottom(x));
```

**Key-point explanation**

`extent` finds the minimum and maximum dates. `defined` determines whether a point participates before its x/y accessors run. Gaps and zero substitution produce different shapes, so specify the missing-value handling in the path generator.

#### 3. Pointer coordinates, invert and the nearest record

```javascript
const nearest=d3.bisector(d=>d.date).center; // series must be sorted by date.
svg.on('pointermove',event=>{
  const [pixelX]=d3.pointer(event,svg.node()); // Get coordinates local to this SVG.
  const date=x.invert(pixelX);               // Pixel to date.
  const index=nearest(series,date);          // Binary search for the closest date.
  const picked=series[index];
  if (picked) console.log(d3.utcFormat('%Y-%m-%d')(picked.date),picked.value);
});
```

**Key-point explanation**

`pointer` obtains coordinates in a specified element, `invert` converts x to a date, and a bisector finds the nearest sorted record. For a translated plotting group, use that group as the pointer reference to keep coordinate systems consistent.

### Runnable example: defined and missing values

```javascript
function line({svg,d3,n}) {
  const rows=[5,8,null,12,9,15,13].map((value,i)=>({day:i,value}));
  // defined(false) breaks the path rather than substituting zero.
  const draw=d3.line().defined(d=>n===1?d.value!==null:true)
    .x(d=>30+d.day*85).y(d=>170-(d.value??0)*9);
  svg.append('path').datum(rows).attr('d',draw).attr('fill','none').attr('stroke','#2878ad').attr('stroke-width',3);
  svg.selectAll('circle').data(rows.filter(d=>d.value!==null)).join('circle')
    .attr('cx',d=>30+d.day*85).attr('cy',d=>170-d.value*9).attr('r',5).attr('fill','#e16a45');
  return {rows,missing:n===1?'gap':'zero (misleading comparison)'};
}
```


[D3 documentation](https://d3js.org/d3-shape/line)

### Demonstration

Switch line and calendar, track the same day, and check that a missing date has not become zero.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-2)

## 5.3 Calendar heatmaps

### Calendar heatmaps

A calendar heatmap represents each day with a cell. Columns represent weeks, rows represent weekdays, and color represents the daily value. The original example uses daily maximum temperatures and month boundaries.

### Calculating rows and columns

| Graphic property | Calculation |
| --- | --- |
| Column | Week boundaries from the initial week to the date |
| Row | Day of the week |
| Color | Mapped value for the date |
| Boundary | Month or year division |

A week can start on Sunday or Monday, provided the week count and weekday index agree. For Monday-first UTC calendars, `(getUTCDay() + 6) % 7` maps Monday to row zero.

### Leap days, months and missing dates

Generate all dates first, then look up readings by date key so missing days retain their positions. A leap year produces 366 cells. Month boundaries follow the row and column positions of the month’s first date.

### Key code

#### 1. Generating dates and looking up readings

```javascript
const start=new Date(Date.UTC(2024,0,1)), stop=new Date(Date.UTC(2025,0,1));
const key=d3.utcFormat('%Y-%m-%d');
const days=d3.utcDays(start,stop).map(date=>({
  date,
  value:byDate.get(key(date)) ?? null // Retain the date when its reading is absent.
}));
console.log(days.length); // 366
```

**Key-point explanation**

Consistent date strings align readings with the complete calendar through Map keys. `?? null` handles null/undefined while preserving a valid zero. Generating dates first retains the position of missing days.

#### 2. Positioning Monday-first cells

```javascript
const firstWeek=d3.utcMonday.floor(new Date(Date.UTC(2024,0,1)));
const cellSize=14;
svg.selectAll('rect.day').data(days,d=>+d.date).join('rect').attr('class','day')
  .attr('x',d=>d3.utcMonday.count(firstWeek,d.date)*cellSize)
  .attr('y',d=>(d.date.getUTCDay()+6)%7*cellSize)
  .attr('width',cellSize-1).attr('height',cellSize-1)
  .attr('fill',d=>d.value===null ? '#dce4e9' : color(d.value));
```

**Key-point explanation**

Floor finds the Monday of the containing week; count gives the number of week boundaries, hence the column. Modulo maps weekdays to Monday zero through Sunday six. Unary plus converts Date to milliseconds for a stable date key.

#### 3. Month boundaries

```javascript
// The first of next month marks the current month’s ending boundary.
function monthBoundary(date) {
  const weekday=(date.getUTCDay()+6)%7;
  const week=d3.utcMonday.count(firstWeek,date);
  const x=week*cellSize, y=weekday*cellSize;
  return `M ${x+cellSize} 0 V ${y} H ${x} V ${7*cellSize}`;
}
const months=d3.utcMonths(start,stop).slice(1);
svg.selectAll('path.month').data(months).join('path').attr('class','month')
  .attr('d',monthBoundary).attr('fill','none').attr('stroke','#e16a45');
```

**Key-point explanation**

The boundary steps around the first date of the month: follow the week’s right edge to its row, move left, then go down. A Monday start has y zero and a full boundary on the column’s left. Reusing the cell’s week and weekday calculations aligns both.

### Runnable example: Dates to calendar coordinates

```javascript
function calendar({svg,d3,n}) {
  const start=new Date(Date.UTC(2024,0,1));
  const dates=d3.utcDays(start,d3.utcDay.offset(start,n*7));
  // Start weeks Monday; map week offset and weekday to separate axes.
  const first=d3.utcMonday.floor(start);
  svg.selectAll('rect').data(dates).join('rect')
    .attr('x',d=>35+d3.utcMonday.count(first,d)*39)
    .attr('y',d=>15+(d.getUTCDay()+6)%7*24).attr('width',34).attr('height',19)
    .attr('fill',d=>d3.interpolateYlGnBu(d.getUTCDate()/32));
  return {dates:dates.length,first:dates[0].toISOString(),last:dates.at(-1).toISOString()};
}
```


[D3 documentation](https://d3js.org/d3-time)

### Demonstration

Locate February 29 and switch views. Date and value remain unchanged while the reading task changes.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-3)

## 5.4 Cyclic time and spiral views

### Periodic time and spiral layouts

A line chart unfolds time in one direction. A spiral places equal phases at similar angles and separates successive cycles by radius. A day, week, month or year can be selected as the period to compare.

### The Archimedean spiral

An Archimedean spiral follows `r = a + bθ`. Increasing θ by 2π increases radius by `2πb`, so successive turns have equal radial spacing. Convert to `x = r cosθ` and `y = r sinθ` to draw it in SVG.

### Two ways to allocate angles

- **Equal phase steps:** assign one turn per period, aligning equal phases for cycle comparisons.
- **Approximately equal arc length:** reduce the angular step as radius grows. The original recipe uses `Δθ ≈ boxSize / √(b² + r²)` for similar cell lengths.

### Segment paths and cycle comparison

A spiral cell can close four vertices: outer start, outer end, inner end and inner start. This demonstration uses equal phase steps: change days per turn and inspect whether high values align in the same direction.

### Key code

#### 1. Polar to Cartesian coordinates

```javascript
const a=20, gap=24, b=gap/(2*Math.PI);
function position(theta) {
  const r=a+b*theta;
  return {x:r*Math.cos(theta),y:r*Math.sin(theta),r};
}
console.log(position(0),position(2*Math.PI));
// One turn increases radius by 2πb, equal to gap.
```

**Key-point explanation**

Theta is in radians. Set `b = gap/(2π)` to obtain the desired radial gap per turn. Returning x, y and r lets path construction and step calculations share the result.

#### 2. Equal phase steps and equal arc-length steps

```javascript
// Phase layout: period items per turn align equal phases.
const period=14;
const phaseAngle=index=>index/period*2*Math.PI;
// Approximately equal arc length needs smaller steps at larger radii.
const boxSize=12;
const arcStep=radius=>boxSize/Math.sqrt(b*b+radius*radius);
console.log(phaseAngle(14),arcStep(100));
```

**Key-point explanation**

Fixed angular steps align periodic phases. Dynamic steps control approximate cell arc length. `√(b²+r²)` is the rate of spiral arc length with angle; dividing the target length by it gives an approximate step.

#### 3. Building a spiral cell from four vertices

```javascript
function segmentPath(t0,t1) {
  const point=(theta,side)=>{
    const r=position(theta).r+side*gap/2;
    return [r*Math.cos(theta),r*Math.sin(theta)];
  };
  const outer0=point(t0,1),outer1=point(t1,1);
  const inner1=point(t1,-1),inner0=point(t0,-1);
  return `M ${outer0} L ${outer1} L ${inner1} L ${inner0} Z`;
}
// A closed d path supports independent fill and stroke.
```

**Key-point explanation**

Follow the outer start to outer end, then return along the inner edge and close with Z. Side 1/−1 selects the radial offset. Short straight edges approximate each small cell; smaller angular spans refine the approximation.

#### 4. Interpolate Cartesian coordinates into a spiral

```javascript
const angle = day / period * 2 * Math.PI - Math.PI / 2;
const radius = 27 + day * radiusStep;
const polar = [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
// u ranges from 0 to 1; each point retains its key.
const position = linear.map((coordinate, i) => coordinate + (polar[i] - coordinate) * u);
circles.attr('cx', position[0]).attr('cy', position[1]);
```

**Key-point explanation**

At u=0 the point uses Cartesian coordinates; at u=1 it uses polar coordinates. Intermediate values interpolate the same point without changing its observation or key. Period controls days per turn.

### Runnable example: Polar to Cartesian coordinates

```javascript
function spiral({svg,d3,n}) {
  const days=d3.range(84);
  // Angle repeats by period while radius grows with time.
  const point=day=>{const theta=day/n*2*Math.PI,r=15+day*1.3;return [300+Math.cos(theta)*r,100+Math.sin(theta)*r*.75];};
  svg.append('path').datum(days).attr('d',d3.line().x(d=>point(d)[0]).y(d=>point(d)[1]))
    .attr('fill','none').attr('stroke','#c1cdd5');
  svg.selectAll('circle').data(days).join('circle').attr('cx',d=>point(d)[0]).attr('cy',d=>point(d)[1])
    .attr('r',3).attr('fill',d=>d3.interpolateYlGnBu((Math.sin(d/14*2*Math.PI)+1)/2));
  return {days:84,displayPeriod:n,generatorPeriod:14};
}
```


[D3 documentation](https://d3js.org/d3-shape/line)

### Demonstration

Change from fourteen to seven days per turn, then reveal the generator. Distinguish display and generator periods.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-4)

## 5.5 Storyline visualization

### Storyline timelines

A storyline draws a character, organization or process as a line extending through time. Nearby lines represent a shared event or group; separation represents a change. The original course illustrates this with Jurassic Park characters.

| Element | Meaning |
| --- | --- |
| Time axis | Event order and intervals |
| Character line | A character’s continuity over time |
| Grouping and separation | Joining an event or leaving a group |
| Event marker | A key instant and its description |

### Path and event layers

Each character has time-position key points, which `d3.line` converts into a path. Events occupy a separate `g` layer with circles, markers and labels. The layers can be filtered and highlighted independently.

### Reading vertical position

Vertical position in a storyline organizes relationships and need not represent a measured quantity. Read proximity together with event labels, and interpret crossings using character identities and event information.

### Key code

#### 1. One path per character

```javascript
const x=d3.scaleLinear().domain([0,127]).range([50,550]);
const characters=[
  {name:'T-REX',points:[{time:75,y:150},{time:78,y:100},{time:88,y:160}]},
  {name:'Grant',points:[{time:0,y:60},{time:78,y:100},{time:120,y:40}]}
];
const line=d3.line().x(d=>x(d.time)).y(d=>d.y).curve(d3.curveCatmullRom.alpha(0.5));
// Join characters, then draw each character’s points.
svg.selectAll('path.character').data(characters,d=>d.name).join('path').attr('class','character')
  .attr('d',d=>line(d.points)).attr('fill','none')
  .attr('stroke',(d,i)=>d3.schemeTableau10[i]).attr('stroke-width',3);
```

**Key-point explanation**

Data has two levels: each outer item is a character and points is its sequence. The accessor explicitly passes that inner array to the line generator. Nearby y positions at the same instant indicate an event or group relationship.

#### 2. A separate event layer

```javascript
const events=[{id:'attack',time:78,y:100,name:'T-REX attack'}];
const layer=svg.append('g').attr('class','event-layer');
const marks=layer.selectAll('g.event').data(events,d=>d.id).join('g').attr('class','event')
  .attr('transform',d=>`translate(${x(d.time)},${d.y})`);
// Children receive the parent datum through one-item arrays.
marks.selectAll('circle').data(d=>[d]).join('circle').attr('r',18).attr('fill','#e16a4530');
marks.selectAll('text').data(d=>[d]).join('text').attr('y',-23).attr('text-anchor','middle')
  .text(d=>d.name);
marks.on('mouseenter',(event,d)=>console.log(d.name,d.time));
```

**Key-point explanation**

Position each event through its group transform, with local coordinates for its circle and label. Separate event and path groups allow independent visibility, filtering and highlighting.

#### 3. Catmull-Rom alpha

```javascript
const choices={
  uniform:d3.curveCatmullRom.alpha(0),       // Uniform parameterization.
  centripetal:d3.curveCatmullRom.alpha(0.5), // Centripetal parameterization.
  chordal:d3.curveCatmullRom.alpha(1)       // Chordal parameterization.
};
const alternativeLine=d3.line().x(d=>x(d.time)).y(d=>d.y).curve(choices.centripetal);
```

**Key-point explanation**

Alpha controls spline parameterization rather than model confidence or a simple amount of bending. Values 0, 0.5 and 1 select uniform, centripetal and chordal parameterization. Retain the same key points and compare the effects of unequal point spacing.

### Runnable example: Joining multiple paths

```javascript
function story({svg,d3,n}) {
  const series=d3.range(3).map(role=>d3.range(6).map(time=>({time,y:50+role*50+(time===n?15:0)})));
  // Bind one path per character and one point sequence per path.
  const path=d3.line().x(d=>30+d.time*100).y(d=>d.y).curve(d3.curveMonotoneX);
  svg.selectAll('path').data(series).join('path').attr('d',path).attr('fill','none')
    .attr('stroke',(d,i)=>d3.schemeTableau10[i]).attr('stroke-width',3);
  return {characters:3,event:n,note:'vertical position is not a measured quantity'};
}
```


[D3 documentation](https://d3js.org/d3-shape/line)

### Demonstration

Choose a character and a shared event, then reconcile paths with the event records.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-5)
