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
