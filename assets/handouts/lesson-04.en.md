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
