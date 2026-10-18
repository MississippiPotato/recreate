import test from 'node:test';
import assert from 'node:assert/strict';
import { students, makeStudents, transformRecords, groupRecords, matchKeys, toLong, marchingCell, interpolateEdge, daily, calendarPosition, makePeriodic, spiralPoint, quartet } from '../src/core.js';
import { courses } from '../src/content.js';

test('stable synthetic IDs and deterministic records',()=>{
  assert.equal(students.length,80);assert.equal(new Set(students.map(r=>r.id)).size,80);
  assert.deepEqual(makeStudents(42),students);assert.notDeepEqual(makeStudents(43),students);
});
test('filtering and sorting do not mutate the input or identity',()=>{
  const rows=[{id:'A',score:80},{id:'B',score:60},{id:'C',score:90}],before=structuredClone(rows);
  assert.deepEqual(transformRecords(rows,'filter',80).map(r=>r.id),['A','C']);
  assert.deepEqual(transformRecords(rows,'sort').map(r=>r.id),['C','A','B']);assert.deepEqual(rows,before);
});
test('group membership sums to the source and preserves provenance',()=>{
  const groups=groupRecords(students);assert.equal(groups.length,4);
  assert.equal(groups.reduce((sum,g)=>sum+g.count,0),80);
  assert.equal(new Set(groups.flatMap(g=>g.ids)).size,80);
  for(const group of groups)assert.ok(group.members.every(r=>r.major===group.key));
  assert.deepEqual(groupRecords([]),[]);
});
test('key joins distinguish replacement from reordering',()=>{
  assert.deepEqual(matchKeys(['A','B','C'],['B','C','D']),{enter:['D'],update:['B','C'],exit:['A']});
  assert.deepEqual(matchKeys(['A','B','C'],['C','A','B']),{enter:[],update:['C','A','B'],exit:[]});
  assert.throws(()=>matchKeys(['A','A'],['A']));
});
test('wide to long preserves all measured values with entity identity',()=>{
  assert.deepEqual(toLong([{id:'A',x:12,y:25}],['x','y']),[{id:'A',field:'x',value:12},{id:'A',field:'y',value:25}]);
});
test('all 16 marching squares configurations have expected edge counts',()=>{
  const counts=[0,2,2,2,2,4,2,2,2,2,4,2,2,2,2,0];
  for(let code=0;code<16;code++){
    const cell=marchingCell([0,1,2,3].map(i=>(code&(1<<i))?1:0),.5);
    assert.equal(cell.code,code);assert.equal(cell.crossings.length,counts[code]);
    assert.equal(cell.segments.length,counts[code]/2);
    for(const c of cell.crossings)assert.equal(c.t,.5);
    for(const seg of cell.segments)for(const point of seg)assert.ok(point.every(v=>v>=0&&v<=1));
  }
});
test('edge interpolation and threshold equality have explicit behavior',()=>{
  assert.equal(interpolateEdge(10,30,20),.5);assert.equal(interpolateEdge(10,10,10),null);
  assert.equal(marchingCell([20,20,20,20],20).code,15);
  assert.deepEqual(marchingCell([20,20,20,20],20).segments,[]);
  const cell=marchingCell([20,10,10,10],20);assert.equal(cell.code,1);assert.ok(cell.segments.flat(2).every(Number.isFinite));
});
test('ambiguous saddles respond to the bilinear decider',()=>{
  const a=marchingCell([4,-1,4,-1],0),b=marchingCell([1,-4,1,-4],0);
  assert.equal(a.code,5);assert.equal(b.code,5);assert.ok(a.q>0&&b.q<0);
  assert.deepEqual(a.segments[0],[a.crossings[0].point,a.crossings[1].point]);
  assert.deepEqual(b.segments[0],[b.crossings[3].point,b.crossings[0].point]);
});
test('2024 dates include leap day and preserve missing records',()=>{
  assert.equal(daily.length,366);assert.equal(daily[59].id,'2024-02-29');assert.equal(daily[365].id,'2024-12-31');
  assert.equal(daily.filter(r=>r.value===null).length,2);assert.equal(daily[90].value,null);
  assert.deepEqual(calendarPosition('2024-01-01'),{week:0,weekday:0});
  assert.deepEqual(calendarPosition('2024-02-29'),{week:8,weekday:3});
  assert.equal(new Set(daily.map(r=>JSON.stringify(calendarPosition(r.id)))).size,366);
});
test('display period changes geometry, not the source signal',()=>{
  const data=makePeriodic(14,0);for(let i=0;i<14;i++)assert.ok(Math.abs(data[i].value-data[i+14].value)<1e-10);
  assert.notDeepEqual(spiralPoint(5,7),spiralPoint(5,14));assert.equal(data.length,168);
});
test('all 27 sections have bilingual explanations and valid transfer feedback',()=>{
  assert.deepEqual(courses.map(c=>c.sections.length),[5,4,8,5,5]);
  const ids=courses.flatMap(c=>c.sections.map(s=>s.id));assert.equal(new Set(ids).size,27);
  for(const c of courses)for(const s of c.sections){
    for(const name of ['title','question','explanation','transfer','reason'])for(const lang of ['zh','en'])assert.ok(s[name][lang].length>0,`${s.id}: ${name}/${lang}`);
    assert.equal(s.steps.length,3);assert.ok(s.answer>=0&&s.answer<s.options.length);
  }
});
test('Anscombe data retain similar summaries and distinct coordinates',()=>{
  const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  for(const group of quartet){assert.equal(mean(group.x),9);assert.ok(Math.abs(mean(group.y)-7.5)<.01);}
  assert.equal(new Set(quartet[3].x).size,2);
});
