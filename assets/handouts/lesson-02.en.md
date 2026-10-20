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
