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
