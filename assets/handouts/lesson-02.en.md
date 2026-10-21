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
