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
