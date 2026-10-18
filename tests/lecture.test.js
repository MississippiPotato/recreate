import test from 'node:test';
import assert from 'node:assert/strict';
import { courses } from '../src/content.js';
import { students, transformRecords, makeField, marchingCell } from '../src/core.js';
import { lectureInitial, lectureBeats, lectureCue, lectureReadout } from '../src/lecture-content.js';

test('all 27 teaching segments provide spoken cues and reproducible demo steps',()=>{
  for(const section of courses.flatMap(c=>c.sections)){
    const beats=lectureBeats(section);
    assert.ok(beats.length>0,section.id);
    for(const lang of ['zh','en']){
      assert.ok(lectureCue(section,lang));
      for(const beat of beats){assert.ok(beat.title[lang]);assert.ok(Object.keys(beat.preset).length);}
    }
  }
});
test('the contour demonstration starts from a real field cell with one high corner',()=>{
  const section=courses[3].sections.find(s=>s.kind==='contour'),initial=lectureInitial(section),f=makeField(),y=Math.floor(initial.cell/6),x=initial.cell%6;
  const result=marchingCell([f[y][x],f[y][x+1],f[y+1][x+1],f[y+1][x]],initial.iso);
  assert.equal(result.code,1);
  assert.ok(result.segments[0][0].some((v,i)=>Math.abs(v-result.segments[0][1][i])>.01),'teaching example must contain a visible segment, not a threshold tie');
  assert.deepEqual(lectureBeats(section).map(b=>b.preset.show),[1,2,3]);
});
test('projected readouts use current data and preserve missingness',()=>{
  const section={kind:'transform'},state={operation:'filter',threshold:85,selected:'S017'};
  assert.ok(lectureReadout(section,state).includes(transformRecords(students,'filter',85).length+' / 80'));
  assert.equal(lectureReadout({kind:'time'},{day:90}),'2024-03-31 · 未观测，不是 0°C');
  assert.equal(lectureReadout({kind:'join'},{joined:true,next:'B,C,D'}),'进入 D · 保留 B、C · 退出 A');
  assert.equal(lectureReadout({kind:'period'},{period:7,revealed:true}),'生成周期：14 天 · 当前显示：每圈 7 天');
  assert.deepEqual(lectureInitial({kind:'time',id:'5.2'}),{day:181,view:'calendar'});
  assert.deepEqual(lectureBeats({kind:'time',id:'5.2'})[0].preset,{view:'line'});
});
