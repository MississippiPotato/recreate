import test from 'node:test';
import assert from 'node:assert/strict';
import {curriculum} from '../src/course-data.js';
import {readCourseRoute,readPanelState,writePanelState,sectionHash,localId} from '../src/course-navigation.js';
import {buildSearchIndex,searchCourse,searchExcerpt} from '../src/course-search.js';

test('independent tabs round-trip in a shareable chapter link and restore Back snapshots',()=>{
  const course=curriculum[0],states=new Map(course.sections.map(section=>[section.id,'explain']));
  const first=writePanelState(new URL('https://example.com/recreate/?lang=en#lesson-1'),course,states);
  states.set('1.1','code');states.set('1.5','demo');
  const next=writePanelState(first,course,states);next.hash=sectionHash(course.sections[4],'demo','demo-workspace');
  assert.equal(next.searchParams.get('lang'),'en');
  assert.deepEqual([...readPanelState(next,course)], [...states]);
  const restored=readPanelState(first,course,states);
  assert.ok([...restored.values()].every(tab=>tab==='explain'));
  const route=readCourseRoute(next,curriculum);
  assert.equal(route.section.id,'1.5');assert.equal(route.tab,'demo');assert.equal(route.anchor,'demo-workspace');
});

test('legacy and lesson entry routes retain their destinations',()=>{
  for(const [path,id,tab] of [['lesson-04/','4.1','explain'],['#ch-4-5/step-2','4.5','demo'],['#ch-2-2/code/keycode-0','2.2','code']]){
    const route=readCourseRoute(new URL(path,'https://example.com/recreate/'),curriculum);
    assert.equal(route.section.id,id);assert.equal(route.tab,tab);
  }
  const ids=curriculum.flatMap(course=>course.sections.flatMap(section=>['explain','code','demo'].map(tab=>localId(section.id,tab,'panel'))));
  assert.equal(new Set(ids).size,81);
});

test('search distinguishes explanation, code and demo with exact code and heading targets',()=>{
  const index=buildSearchIndex();
  for(const section of curriculum.flatMap(course=>course.sections)){
    assert.deepEqual([...new Set(index.filter(doc=>doc.section.id===section.id).map(doc=>doc.tab))].sort(),['code','demo','explain']);
  }
  const rollup=searchCourse(index,'rollup');
  assert.ok(rollup.some(doc=>doc.section.id==='2.2'&&doc.tab==='code'&&doc.anchor.startsWith('keycode-')));
  const chinese=searchCourse(index,'测量尺度');
  assert.ok(chinese.some(doc=>doc.tab==='explain'&&doc.section.id==='1.3'&&doc.anchor.startsWith('reading-')));
  const comments=searchCourse(index,'一元');
  assert.ok(comments.some(doc=>doc.tab==='code'&&doc.section.id==='1.1'));
  assert.equal(searchCourse(index,'no_such_d3_function_8734').length,0);
});

test('search excerpts treat code and regex characters as text and highlight literal matches',()=>{
  const doc={text:{zh:'const value = svg.selectAll("<g>").data([1, 2]);',en:'fallback'}};
  for(const query of ['<g>','[1, 2]','selectAll(']){
    const runs=searchExcerpt(doc,query);
    assert.ok(runs.some(run=>run.match));
    assert.ok(runs.map(run=>run.text).join('').includes('<g>'));
  }
});
