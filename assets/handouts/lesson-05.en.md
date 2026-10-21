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
