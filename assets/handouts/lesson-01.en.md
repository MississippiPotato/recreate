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
