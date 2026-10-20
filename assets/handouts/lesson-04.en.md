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
