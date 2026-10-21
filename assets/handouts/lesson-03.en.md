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
