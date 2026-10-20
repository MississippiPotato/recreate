// Pure calculations shared by the experiments and their displayed source.
export function seededRandom(seed = 42) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}
export function makeStudents(seed = 42) {
  const random = seededRandom(seed);
  return Array.from({ length: 80 }, (_, i) => ({
    id: `S${String(i + 1).padStart(3, '0')}`,
    major: ['Design', 'Computing', 'Economics', 'Biology'][i % 4],
    class: `${i % 4 + 1}-${Math.floor(i / 4) % 2 + 1}`,
    score: Math.round(48 + random() * 50),
    hours: Math.round((1 + random() * 7) * 10) / 10
  }));
}
export function transformRecords(rows, operation = 'all', threshold = 75) {
  if (operation === 'filter') return rows.filter(row => row.score >= threshold);
  if (operation === 'sort') return [...rows].sort((a, b) => b.score - a.score);
  return [...rows];
}
export function groupRecords(rows, field = 'major') {
  const groups = new Map();
  for (const row of rows) {
    const key = row[field];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups].map(([key, members]) => ({ key, count: members.length, ids: members.map(row => row.id), members }));
}
export function matchKeys(previous, next) {
  if (new Set(previous).size !== previous.length || new Set(next).size !== next.length) throw new Error('Keys must be unique');
  const oldKeys = new Set(previous), newKeys = new Set(next);
  return { enter: next.filter(id => !oldKeys.has(id)), update: next.filter(id => oldKeys.has(id)), exit: previous.filter(id => !newKeys.has(id)) };
}
export function toLong(rows, fields) {
  return rows.flatMap(row => fields.map(field => ({ id: row.id, field, value: row[field] })));
}
export function linearMap(value, domain, range) {
  if (domain[0] === domain[1]) return (range[0] + range[1]) / 2;
  return range[0] + (value - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]);
}
export function leastSquares(points) {
  if(points.length<2)return null;
  const meanX=points.reduce((sum,p)=>sum+p.x,0)/points.length;
  const meanY=points.reduce((sum,p)=>sum+p.y,0)/points.length;
  const denominator=points.reduce((sum,p)=>sum+(p.x-meanX)**2,0);
  if(!denominator)return null;
  const slope=points.reduce((sum,p)=>sum+(p.x-meanX)*(p.y-meanY),0)/denominator;
  return {slope,intercept:meanY-slope*meanX};
}
export function interpolateEdge(a, b, threshold) {
  if (a === b) return null; // Flat edges do not define a unique crossing.
  return (threshold - a) / (b - a);
}
export function marchingCell(values, threshold) {
  // Clockwise corners: top-left, top-right, bottom-right, bottom-left.
  const points = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const high = values.map(value => value >= threshold);
  const code = high.reduce((sum, flag, i) => sum + (flag ? 1 << i : 0), 0);
  const crossings = [];
  for (let edge = 0; edge < 4; edge++) {
    const next = (edge + 1) % 4;
    if (high[edge] !== high[next]) {
      const t = interpolateEdge(values[edge], values[next], threshold);
      crossings.push({ edge, t, point: points[edge].map((value, axis) => value + t * (points[next][axis] - value)) });
    }
  }
  const q = (values[0] - threshold) * (values[2] - threshold) - (values[1] - threshold) * (values[3] - threshold);
  let segments = [];
  if (crossings.length === 2) segments = [[crossings[0].point, crossings[1].point]];
  if (crossings.length === 4) {
    // Bilinear asymptotic decider; exact saddle q=0 uses a documented fixed tie.
    const pairs = q >= 0 ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]];
    segments = pairs.map(pair => pair.map(edge => crossings.find(c => c.edge === edge).point));
  }
  return { code, high, crossings, segments, ambiguous: crossings.length === 4, q };
}
export function makeField(size = 7) {
  return Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => Math.round(50 + 28 * Math.sin(x * .85) * Math.cos(y * .6) + 12 * Math.sin(y * 1.4 + x))));
}
export function makeDaily(seed = 42) {
  const random = seededRandom(seed);
  return Array.from({ length: 366 }, (_, i) => ({
    id: new Date(Date.UTC(2024, 0, i + 1)).toISOString().slice(0, 10),
    day: i,
    value: i === 90 || i === 210 ? null : Math.round((15 + 13 * Math.sin(2 * Math.PI * (i - 92) / 366) + (random() - .5) * 5) * 10) / 10
  }));
}
export function makePeriodic(period = 14, noise = 1, seed = 42) {
  const random = seededRandom(seed);
  return Array.from({ length: 168 }, (_, day) => ({ day, id: `D${day + 1}`, value: 10 + 6 * Math.sin(2 * Math.PI * day / period) + noise * (random() - .5) }));
}
export function spiralPoint(day, period, center = [240, 180], radiusStep = 13) {
  const angle = 2 * Math.PI * day / period - Math.PI / 2;
  const radius = 22 + radiusStep * day / period;
  return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
}
export function calendarPosition(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const year = date.getUTCFullYear();
  const day = Math.round((date - Date.UTC(year, 0, 1)) / 86400000);
  const offset = (new Date(Date.UTC(year, 0, 1)).getUTCDay() + 6) % 7;
  return { week: Math.floor((day + offset) / 7), weekday: (date.getUTCDay() + 6) % 7 };
}
export const students = makeStudents();
export const daily = makeDaily();
export const quartet = [
  {x:[10,8,13,9,11,14,6,4,12,7,5], y:[8.04,6.95,7.58,8.81,8.33,9.96,7.24,4.26,10.84,4.82,5.68]},
  {x:[10,8,13,9,11,14,6,4,12,7,5], y:[9.14,8.14,8.74,8.77,9.26,8.10,6.13,3.10,9.13,7.26,4.74]},
  {x:[10,8,13,9,11,14,6,4,12,7,5], y:[7.46,6.77,12.74,7.11,7.81,8.84,6.08,5.39,8.15,6.42,5.73]},
  {x:[8,8,8,8,8,8,8,19,8,8,8], y:[6.58,5.76,7.71,8.84,8.47,7.04,5.25,12.50,5.56,7.91,6.89]}
];
