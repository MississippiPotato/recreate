# Lesson  1  Data

Provenance, attributes and transformations form the basis of D3 rendering.

These revised notes accompany the explanation, key-code and demonstration tabs. Student, temperature, field and event examples are constructed teaching data.

## 1.1 Generating and loading data

Start with a student CSV: distinguish provenance, field meaning and JavaScript types.

### State the source

The original course used AI-generated student records. Here 80 deterministic synthetic records make experiments repeatable. Complete fields do not establish real sampling; differences cannot be generalized to real students.

### What CSV parsing returns

CSV cells are strings by default. Convert scores before calculation, but retain IDs as identifiers. Handle blank cells separately: Number("") returning zero does not make missingness a zero reading.

### Normalize each row

The row callback in d3.csv(url, row) converts each record. Chinese property names are valid JavaScript; English names are a naming convention, not a syntax requirement. Parse dates with an explicit format.

### Key code: Load CSV and convert fields

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **await d3.csv(url, row)**: await waits for loading; the row callback returns each converted record.
- **Number(row.score)**: Convert explicitly after checking for blanks.
- **d => d.id**: The arrow function returns a stable key.

[D3 documentation](https://d3js.org/d3-fetch)

### Demonstration

Switch between raw strings and converted values. Compare typeof for score, then track whether the ID changes.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-1)

## 1.2 Data, information and knowledge

A value needs context. DIKW organizes the reasoning; it is not an automatic algorithm.

### Data: preserve observations

“80” is a symbol. Field, unit, entity and time establish whether it means score, population or temperature.

### Information: answer a question

Grouping records by major and counting them answers “how many in each major?” Context and structure make information. A view reveals structure without changing provenance.

### Knowledge and decisions need evidence

Explaining why one group has a higher mean requires additional evidence. DIKW is a teaching framework for data, information, knowledge and wisdom; real analysis need not follow a strict sequence.

### Key code: Events and state

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **(event, d)**: event is the action; d is the bound datum.
- **function / this**: A regular function receives the element as this; use currentTarget in an arrow.
- **classed(name, boolean)**: The boolean determines whether the class is present.
- **transition().duration(350)**: Interpolate attributes over 350 ms; interrupt prevents old transitions accumulating on rapid clicks.

[D3 documentation](https://d3js.org/d3-selection/events)

### Demonstration

Select the four pyramid layers. Compare what the same records can answer and what evidence is still missing.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-2)

## 1.3 Data attributes and visual channels

Determine valid comparisons before choosing position, length, color or shape.

### Storage type is not measurement scale

Numeric IDs remain nominal. Ranks imply order, not equal spacing. Celsius supports differences, but 20°C is not twice as hot as 10°C. Counts have a meaningful zero.

### Marks and channels

Points, lines and areas are marks. Position, area, hue and lightness are channels. A point per student, horizontal position for score and hue for major are three distinct design choices.

### Match encoding to the task

Position on a common scale supports precise quantitative comparison; hue distinguishes categories. Channel rankings guide design, but size, background, set size and task also affect performance.

![Original course: visual-channel rankings for different data types.](../figures/01-mackinlay-ranking.png)

![Original course: position, color, shape and size channels.](../figures/03-channels-position-color-shape.png)

### Key code: Scales and axes

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **domain([0,100])**: The range of input values.
- **range([40,...])**: The output pixel range corresponds to domain order.
- **selection.call(axis)**: Pass the current selection to the axis generator.

[D3 documentation](https://d3js.org/d3-scale/linear)

### Demonstration

Switch IDs, ranks, temperature and counts. Explain why the same numbers require different color logic.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-3)

## 1.4 Data transformations

Make inputs and outputs explicit: distinguish mapping, filtering, combination and aggregation.

### Mapping and filtering

map computes a value per item; filter retains matching items. Sorting changes order. Fewer result records do not imply deletion from the source.

### Transforming array structure

cross creates Cartesian products, pairs adjacent pairs, zip index-aligned tuples, transpose swaps rows and columns, and merge flattens one level. Wide-to-long reshaping also needs entity IDs and field names; a matrix transpose alone is not enough.

### Grouping and aggregation

d3.group retains group records; d3.rollup reduces groups to counts, means or other values. Callbacks can contain side effects, so array methods do not automatically guarantee purity.

### Key code: filter → map → sum

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **d3.range(1,n+1)**: The stop value is exclusive.
- **d => d % 2 === 0**: The predicate returns a boolean per item.
- **map(d => d*d)**: Produce squared values without mutating the input.

[D3 documentation](https://d3js.org/d3-array/transform)

### Demonstration

Choose an operation. Read the input and output, checking type, length and nesting depth.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-4)

## 1.5 D3 selections and data joins

Selections locate elements; data joins match elements to records.

### From DOM to a selection

d3.select finds the first matching element; d3.selectAll finds all matches. selection.selectAll creates child groups under each selected parent, which matters in nested tables and charts.

### Three states come from matching

Replacing A,B,C with B,C,D keeps length three, yet A exits, D enters and B/C update. Array lengths alone cannot determine enter, update and exit.

### Keys preserve object identity

data(rows, d => d.id) matches stable identifiers; without a key, matching is by index. Return a selection or transition from enter and update callbacks so chaining acts on the merged elements.

![Original course: matching data and elements through enter, update and exit.](../figures/data-join.png)

### Key code: data → join → attr

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **selectAll("circle")**: The selection may be empty; join creates elements as needed.
- **data(rows, d => d.id)**: The second argument is the key accessor.
- **enter / update / exit**: The states follow matching; change the parameter to inspect counts.

[D3 documentation](https://d3js.org/d3-selection/joining)

### Demonstration

Compare replacement, reordering, addition and removal. Switch to index matching and track which datum belongs to each DOM ID.

[Open section](https://mississippipotato.github.io/recreate/#ch-1-5)


---

# Lesson  2  The visualization pipeline

Grouping, hierarchy, layout and event handling form the full pipeline.

These revised notes accompany the explanation, key-code and demonstration tabs. Student, temperature, field and event examples are constructed teaching data.

## 2.1 The visualization pipeline

Follow a dataset through raw data, data tables, visual structures and views.

### Define the task

Comparing counts, finding a record and analyzing relationships are different tasks. Organize data for a defined task; a new layout cannot repair incorrect grouping.

### Distinguish three transformations

Data transformation prepares tables and statistics; visual mapping chooses marks and channels; view transformation arranges the screen representation. The stages connect but have distinct responsibilities.

### Interaction closes the loop

Card’s model describes the pipeline; Mackinlay’s work addresses expressiveness and effectiveness; van Wijk models the cycle of imagery, perception, knowledge and exploration. Interaction can change parameters, filters or mappings.

### Key code: A state-driven pipeline

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **data(stages)**: Each stage corresponds to a rectangle and label.
- **classed("chosen", predicate)**: Evaluate whether each element is the selected stage.

[D3 documentation](https://d3js.org/d3-selection/modifying)

### Demonstration

Inspect records, groups, hierarchy and tree. Identify the structure introduced at each stage and the retained records.

[Open section](https://mississippipotato.github.io/recreate/#ch-2-1)

## 2.2 Grouping trees: group and rollup

Group by fields, then decide whether to keep records or only statistics.

### Keys define the groups

Grouping by major and by class produces different sets. A key accessor changes the meaning of the summary, not merely its label.

### Understand nested Maps

d3.rollup(data, reducer, key1, key2) groups by key1 then key2. Leaves contain reducer results. Use for…of and destructuring to read keys and values at each level.

### Reconcile the totals

For a complete, nonoverlapping partition, leaf counts sum to input size. Selecting a group and inspecting members checks the aggregation.

### Key code: Nested grouping and reduction

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **group => group.length**: The reducer receives a group array and returns its count.
- **d => d.major, d => d.class**: Keys create nested Maps in argument order.
- **([major, classes])**: Destructure an entry; classes remains a Map.

[D3 documentation](https://d3js.org/d3-array/group)

### Demonstration

Switch major and class, inspect a group’s IDs, and verify that counts still sum to 80.

[Open section](https://mississippipotato.github.io/recreate/#ch-2-2)

## 2.3 Visual mapping and tree layout

Hierarchy describes parent–child relationships; a layout computes positions.

### Structure is not position

d3.hierarchy augments nested data with parent, children and depth. It does not yet assign layout x/y coordinates; d3.tree(root) performs the layout.

### Rendering chooses orientation

In tree layout, x locates nodes across the breadth and y represents depth. A horizontal tree renders translate(d.y, d.x) and uses the same coordinate swap for links.

### Marks and channels encode together

Circles mark nodes, lines mark relationships, and position expresses hierarchy and proximity. Changing orientation should preserve parent–child relationships. The original channel figures distinguish magnitude from identity.

![Original course: point, line and area marks.](../figures/02-marks-points-lines-areas.png)

![Original course: position, color, shape and size channels.](../figures/03-channels-position-color-shape.png)

![Original course: channels for ordered or quantitative attributes.](../figures/04-magnitude-channels.png)

![Original course: channels for identity and categories.](../figures/05-identity-channels.png)

![Original course: visual-channel rankings for different data types.](../figures/01-mackinlay-ranking.png)

### Key code: hierarchy → tree → links

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **d3.hierarchy(data)**: Compute parent/child relationships and depth.
- **d3.tree().size(...)**: Calling the layout assigns node coordinates.
- **x(d => d.y).y(d => d.x)**: Swap coordinates consistently for horizontal rendering.

[D3 documentation](https://d3js.org/d3-hierarchy/tree)

### Demonstration

Switch horizontal and vertical orientation and select the same node. Separate positional change from unchanged relationships.

[Open section](https://mississippipotato.github.io/recreate/#ch-2-3)

## 2.4 Tree lists and event handling

Turn a hierarchy into an expandable list, with explicit click behavior.

### A list is another view

A tree emphasizes branching; an indented list supports sequential reading. The same relationships can use different marks, space and interactions.

### Event and datum are different

D3 v7 listeners receive (event, d). event describes the action and coordinates; d is the bound datum. Access the element with a regular function’s this or event.currentTarget.

### Control state and bubbling

classed(name, boolean) toggles a class. stopPropagation stops bubbling, but does not cancel default behavior. Delegation listens on a parent and locates the clicked target with closest.

### Key code: Events and state

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **(event, d)**: event is the action; d is the bound datum.
- **function / this**: A regular function receives the element as this; use currentTarget in an arrow.
- **classed(name, boolean)**: The boolean determines whether the class is present.
- **transition().duration(350)**: Interpolate attributes over 350 ms; interrupt prevents old transitions accumulating on rapid clicks.

[D3 documentation](https://d3js.org/d3-selection/events)

### Demonstration

Collapse a major. Its children disappear from the view while other branches and totals remain unchanged.

[Open section](https://mississippipotato.github.io/recreate/#ch-2-4)


---

# Lesson  3  Color

Understand color spaces, palette semantics, gamut and readability.

These revised notes accompany the explanation, key-code and demonstration tabs. Student, temperature, field and event examples are constructed teaching data.

## 3.1 Color models

RGB serves displays, HSL supports editing, and Lab/HCL help reason about perception.

### RGB and CMYK

Screens mix emitted red, green and blue light; printing uses inks that absorb light. Screen colors do not necessarily reproduce identically in print.

### The three HSL components

H is hue angle, S saturation and L lightness. Equal HSL L does not guarantee equal perceived lightness, so equal parameter steps are insufficient.

### Lab is approximately perceptual

Lab describes colors through L*, a* and b* and can support gradient design; it is not uniformly perceptual everywhere. Choose an interpolation space for the task and check display gamut.

### Key code: Constructing HSL colors

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

```javascript
function hsl({svg,d3,n}) {
  // Hue uses degrees; saturation and lightness use 0–1.
  const colors=d3.range(6).map(i=>d3.hsl(i*60,.65,n/10));
  svg.selectAll('rect').data(colors).join('rect').attr('x',(d,i)=>15+i*93)
    .attr('y',40).attr('width',84).attr('height',110).attr('fill',d=>d.formatHex());
  return colors.map(d=>({h:d.h,s:d.s,l:d.l,css:d.formatHex()}));
}
```

- **d3.hsl(h,s,l)**: Hue is degrees; saturation and lightness use 0–1.
- **formatHex()**: Format as a CSS hexadecimal color.

[D3 documentation](https://d3js.org/d3-color)

### Demonstration

Change H, S and L separately, then compare RGB and Lab values. Check whether parameter changes match perceived changes.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-1)

## 3.2 Color mapping: three palette types

Sequential, diverging and categorical palettes express different relationships.

### Sequential

Use for ordered magnitude. Lightness and color changes should make order traceable, with a legend stating the domain.

### Diverging

Use for deviations around a meaningful center, such as profit versus loss around zero. The task determines the center, not the convenience of averaging extremes.

### Categorical

Use for unordered categories such as major or region. With many categories, facet, label directly or reduce simultaneous categories; a continuous palette would imply magnitude.

### Key code: A sequential color scale

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **scaleSequential(interpolator)**: Choose a continuous color interpolator.
- **domain([0,n])**: Set the data domain; color(value) returns a color.

[D3 documentation](https://d3js.org/d3-scale/sequential)

### Demonstration

Switch palettes for colleges, temperatures and deviations. Check whether implied relationships match the field.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-2)

## 3.3 Lab gamut and display limits

A mathematically valid Lab value may lie outside the sRGB display gamut.

### Color space and gamut

A color space defines coordinates; a gamut describes a device or standard’s reproducible range. Not every Lab coordinate is displayable.

### Check converted RGB

Convert with d3.lab(L, a, b).rgb(), then call displayable(). CSS formatting clamps out-of-range channels, so check before formatting.

### A slice is not every device gamut

This demo fixes L* and scans a*/b* for sRGB displayability. It is a slice, not the full 3D gamut or an exact Adobe RGB/Rec.2020 boundary.

### Key code: Color conversion and gamut checks

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **d3.lab(L,a,b).rgb()**: Construct Lab and convert to an RGB object.
- **displayable()**: Check the range before CSS formatting clamps it.

[D3 documentation](https://d3js.org/d3-color)

### Demonstration

Change L* and observe the displayable region. Compare out-of-gamut locations with gray areas.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-3)

## 3.4 Color harmony

Organize hues on a wheel, then check contrast, count and purpose in a view.

### Geometric relationships

Monochromatic schemes retain hue; analogous schemes use nearby hues; complements differ by 180°; triads by 120°; split complements use hues around the complement.

### Harmony is not readability

Harmony provides candidates. Small marks, background contrast and category count affect discrimination; also inspect lightness, saturation and labels.

### Use emphasis selectively

One accent with restrained supporting colors can establish hierarchy. When color encodes quantities, aesthetic adjustments must preserve numerical order.

### Key code: Hue angles and modulo

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **h % 360**: Wrap hue to 0–360 degrees.
- **attr("fill", color)**: A function-valued attribute is evaluated per datum.

[D3 documentation](https://d3js.org/d3-color)

### Demonstration

Change the base hue and harmony; compare positions on the wheel with the swatches.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-4)

## 3.5 Established palettes

Compare established palettes by purpose rather than treating familiarity as a guarantee.

### Start with purpose

Categorical schemes such as Okabe–Ito, Tableau and Tol distinguish groups. Viridis and Cividis encode ordered values. Diverging schemes such as RdBu need a meaningful center.

### Evaluate a palette in a chart

Distinct adjacent swatches may still be hard to distinguish as small points or thin lines. Mark size, background, count and display all matter.

### Simulation has limits

Color-vision simulation can reveal problems but does not validate every reader’s experience. Shapes, text and direct labels remain useful in grayscale.

### Key code: A stable categorical palette

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **scaleOrdinal()**: Inputs are categories rather than continuous magnitudes.
- **domain(categories)**: Fix category order so filtering does not change colors.
- **schemeTableau10**: A predefined scheme is an array of colors.

[D3 documentation](https://d3js.org/d3-scale/ordinal)

### Demonstration

Compare three categorical and two sequential palettes in both swatches and a scatterplot.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-5)

## 3.6 Comparing color encodings

Keep data and geometry fixed; change color and observe how interpretation changes.

### Avoid ranking unordered categories

Light-to-dark colors on college names imply magnitude. If color only identifies groups, use a categorical scheme or direct labels.

### Local boundaries in rainbow scales

Uneven lightness can create apparent boundaries or hide local changes. Hold domains and geometry constant when comparing colors.

### Explain the diagnosis

Rather than saying a palette looks bad, identify an incorrect implied order, hidden differences or reliance on color alone.

### Key code: Two views of the same values

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **scales.forEach(...)**: Apply different mappings to the same values.
- **append("g")**: Use a group to contain each view.

[D3 documentation](https://d3js.org/d3-scale-chromatic)

### Demonstration

Keep the left view fixed while changing the right palette and viewing condition. Check the legend against the data semantics.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-6)

## 3.7 Generating and checking palettes

Parameters generate candidate palettes; suitability must be checked in a view.

### Hue, saturation and lightness

Hue separation helps distinguish groups. Lower saturation can soften large areas, but very low saturation can also make groups similar.

### There is no universal count threshold

Discriminable color count depends on task and view. When adding categories, inspect small marks, adjacent colors and legends rather than treating seven as a hard limit.

### Generation still needs judgment

Candidates support exploration. For an encoding, fix category-to-color correspondence so filtering preserves identity.

### Key code: Parameterized palette generation

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **d3.range(n)**: Generate integers 0 through n−1.
- **i * 360 / n**: Divide hue into n steps; this is a candidate, not a readability guarantee.

[D3 documentation](https://d3js.org/d3-color)

### Demonstration

Increase color count and inspect hue separation and swatches. Save a candidate before comparing.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-7)

## 3.8 Color vision and redundant encoding

Color should not be the only cue. Retain information through text, shape and position.

### Distinguish viewing conditions

Grayscale removes hue information. A color-vision-deficiency simulation approximates a particular viewing condition; the two are different.

### Add a second cue

Use line dashes, point shapes and direct value labels. Redundant encoding reduces dependence on color alone.

### Keep comparison conditions fixed

Use the same data, numerical domain and geometry before and after simulation to isolate readability differences.

### Key code: Redundant shape and text

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **d3.symbol().size(500)**: size specifies symbol area, not radius.
- **symbol.type(type)()**: Set the type, then invoke the generator to obtain path data.

[D3 documentation](https://d3js.org/d3-shape/symbol)

### Demonstration

Switch original color, grayscale and simulation, then hide labels. Identify the information that remains readable.

[Open section](https://mississippipotato.github.io/recreate/#ch-3-8)


---

# Lesson  4  Low-dimensional visualization

Represent tables, scales, curves and scalar fields.

These revised notes accompany the explanation, key-code and demonstration tabs. Student, temperature, field and event examples are constructed teaching data.

## 4.1 Wide and long tables

Reshape the table while keeping entities and measurements traceable.

### Two representations

Wide tables place measures in columns for side-by-side reading. Long tables use field and value columns for filtering, grouping and joins.

### Preserve a compound identifier

One wide row can produce several long rows. Use entity ID plus measure name to distinguish observations rather than counting more rows as new entities.

### From structure to syntax

flatMap maps each record to several observations and flattens one level. List measure columns explicitly so IDs and names remain metadata.

### Key code: flatMap and compound identity

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **flatMap(callback)**: Return an array per item and flatten one level.
- **{ id, field, value }**: The long table retains entity and measure.

[D3 documentation](https://d3js.org/d3-array/transform)

### Demonstration

Select a cell and switch formats. Locate the same entity–measure value.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-1)

## 4.2 Scales and axes

Scales map data to pixels; axes make the mapping readable.

### Domain and range

domain is the input range; range is the output position range. SVG y increases downward, so larger values commonly map to smaller y coordinates.

### Linear and log scales

Linear equal spacing represents equal differences; log equal spacing represents equal ratios. A standard log scale cannot cross zero and does not rewrite values.

### An axis is a generator

d3.axisBottom(scale) creates a generator. selection.call(axis) renders ticks and labels into a group. Translate the group for margins rather than changing data.

### Key code: Linear and log axes

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **scaleLog().domain([1,1000])**: Equal ratios map to equal distances on this positive domain.
- **axisBottom(x).ticks(...)**: The tick count is a hint rather than a guarantee.

[D3 documentation](https://d3js.org/d3-axis)

### Demonstration

Compare 1,10,100,1000 on linear and log axes and explain when they are equally spaced.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-2)

## 4.3 Curve interpolation and fitting

Samples, interpolating curves and fitted models represent different information.

### Connections do not create observations

Sample points are observations. The connection between them is a representational assumption; smooth rendering does not establish a smooth real process.

### Different curve constraints

linear joins with segments, step represents state changes, and monotoneX preserves segmentwise monotonicity. Catmull–Rom and Natural pass through samples; Basis generally does not pass through every interior point.

### Distinguish interpolation and fitting

Interpolation and smoothing address connections; regression estimates a trend through a model. Choosing d3.line().curve(...) does not perform statistical regression.

### Key code: Line generators and curves

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **datum(points)**: Bind the entire array as one path’s datum.
- **line.x(...).y(...)**: Accessors map each sample to pixels.
- **curve(...)**: Change the connection rule, retaining the samples.

[D3 documentation](https://d3js.org/d3-shape/curve)

### Demonstration

Compare ten curves and inspect sample passage, then overlay least squares to distinguish connection rules from model fitting.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-3)

## 4.4 Aspect ratio and perceived slope

The same values can look steeper when the chart’s aspect ratio changes.

### Screen slope includes scale

Screen slope depends on value differences, axis domains and chart dimensions. Increasing height steepens the line without changing numerical growth.

### 45 degrees is a design heuristic

Adjusting average orientation can support local comparisons, but not every chart should be forced to 45 degrees. Consider the task, outliers, domains and comparison context.

### Align conditions for comparisons

When comparing trends, state domains and aspect ratios. Equal apparent steepness across charts does not guarantee equal numerical change.

### Key code: Changing slope through range

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **固定 domain**: Retain values and fix the input domain.
- **range([175,...])**: Smaller y pixels place larger values higher.

[D3 documentation](https://d3js.org/d3-scale/linear)

### Demonstration

Save A, change B’s height, and compare visual slope with the unchanged values.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-4)

## 4.5 Contours: Marching Squares

Separate corner classification, edge interpolation and segment connection.

### Four corners produce sixteen states

Corners are clockwise: top-left, top-right, bottom-right, bottom-left. This implementation classifies value ≥ threshold as high, encoding four booleans as 0–15. Lookup tables must follow the chosen convention.

### Interpolate edge crossings

When an edge’s endpoints straddle the threshold, locate the crossing with t=(threshold−a)/(b−a). Contours do not simply connect cell centers.

### Saddles can be ambiguous

Alternating high/low corners allow two connections. This implementation uses a bilinear decider and handles equality explicitly. Marching Cubes has 2⁸=256 raw states, distinct from symmetry-reduced classes.

![The sixteen Marching Squares cases from the course material. Case numbering must follow the implementation’s convention.](../figures/marching-squares-16.png)

### Key code: The d3.contours input contract

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **size([columns,rows])**: This is the sampling grid, not pixel dimensions.
- **thresholds([value])**: Specify the contour threshold explicitly.
- **geoIdentity().scale(15)**: Map grid coordinates to pixels.

[D3 documentation](https://d3js.org/d3-contour/contour)

### Demonstration

Choose a cell, reveal classifications, crossings and segments, then edit corners to compare all sixteen states and saddle cases.

[Open section](https://mississippipotato.github.io/recreate/#ch-4-5)


---

# Lesson  5  Time-series visualization

Lines, calendars, spirals and storylines suit different temporal tasks.

These revised notes accompany the explanation, key-code and demonstration tabs. Student, temperature, field and event examples are constructed teaching data.

## 5.1 Properties of time

Time has order, continuity, cycles and nested structure; representation affects comparison.

### Order and sampling intervals

Time is ordered, but samples need not be equally spaced. Equally spacing date categories can hide interval differences. Missing observations are not zero values.

### Cyclic and linear time

Days, weeks and seasons contain cycles. Linear axes show order; cyclic layouts compare phase. A circular display does not establish periodicity.

### Calendars and time zones

Month lengths, leap years and week starts affect coordinates. UTC calendar calculations avoid browser-local date shifts; 2024 contains 366 days.

### Key code: UTC date intervals

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **Date.UTC(...)**: Months start at zero; 1 is February.
- **utcDays(start,stop)**: Generate calendar dates, excluding stop.
- **scaleUtc()**: Map actual elapsed time.

[D3 documentation](https://d3js.org/d3-time)

### Demonstration

Select time properties to compare irregular intervals, missing values and leap day.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-1)

## 5.2 Linear-time visualization

Map actual time to the horizontal axis and state how missing readings are handled.

### Time and value axes

Use a temporal x scale and quantitative y scale. Sort by time before connecting observations; CSV row order is not necessarily chronological.

### Make missingness visible

d3.line().defined(predicate) breaks a path at missing values. Connecting across a gap implies interpolation, while zero imputation changes the represented values.

### Trends need context

The temperature series here is synthetic. The original name-frequency example illustrates a different measure. Do not mix sources and units without explanation.

### Key code: defined and missing values

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **defined(d => d.value !== null)**: Connect contiguous valid sample runs.
- **value ?? 0**: Zero substitution is a deliberately misleading comparison, not an observation.

[D3 documentation](https://d3js.org/d3-shape/line)

### Demonstration

Switch line and calendar, track the same day, and check that a missing date has not become zero.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-2)

## 5.3 Calendar heatmaps

Arrange dates by weekday, week and month to support calendar-based comparisons.

### Dates determine cell positions

Each valid date maps to a cell. The column is the week offset from the year’s first week and the row is weekday. State whether weeks begin Monday or Sunday.

### Color encodes values

Color supports quantitative comparison through a sequential scale and legend. Missing values need a separate cue outside the numerical domain.

### Choose a calendar for the task

Calendars support date lookup and weekday patterns. Line charts often show small numerical changes and continuous trends more directly. Choose by task.

### Key code: Dates to calendar coordinates

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **utcMonday.count(first,d)**: Count week boundaries from the initial week.
- **(getUTCDay()+6)%7**: Make Monday row zero.

[D3 documentation](https://d3js.org/d3-time)

### Demonstration

Locate February 29 and switch views. Date and value remain unchanged while the reading task changes.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-3)

## 5.4 Cyclic time and spiral views

Each turn represents a hypothesized period; compare values at matching phases.

### Angle and radius

Angle repeats by period while radius grows over time. For r=a+bθ, radius increases by 2πb per turn, not b.

### Display period is not generator period

Changing days per turn changes layout only. Compare candidate periods and validate through domain knowledge or analysis; visual alignment is not sufficient proof.

### Retain linear views for comparison

Cyclic views compare phase, but exact time gaps and long-term trends can be harder to read. Use a line chart alongside them when needed.

### Key code: Polar to Cartesian coordinates

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **theta = day/n * 2π**: n is the display period, not a source-data change.
- **cos / sin**: Angle and radius determine position.

[D3 documentation](https://d3js.org/d3-shape/line)

### Demonstration

Change from fourteen to seven days per turn, then reveal the generator. Distinguish display and generator periods.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-4)

## 5.5 Storyline visualization

Time and character lines describe events; vertical position is usually not a magnitude.

### Read the encoding convention

Each line represents a character; horizontal position describes event progression. Proximity denotes event co-occurrence, not necessarily physical distance or relationship strength.

### Generate paths from event records

Events specify times and participants; layout assigns line positions. Character highlighting and event highlighting answer different questions.

### Smoothing does not change events

Smooth paths support tracking without inventing meetings. This course uses a fictional expedition; the original Jurassic Park storyline remains a reference example.

### Key code: Joining multiple paths

This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.

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

- **data(series)**: Each nested array represents a character path.
- **attr("d", path)**: The line generator processes each event sequence.

[D3 documentation](https://d3js.org/d3-shape/line)

### Demonstration

Choose a character and a shared event, then reconcile paths with the event records.

[Open section](https://mississippipotato.github.io/recreate/#ch-5-5)
