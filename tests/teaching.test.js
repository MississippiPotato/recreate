import test from 'node:test';
import assert from 'node:assert/strict';
import { courses } from '../src/content.js';
import { teachingFor, describeExperiment } from '../src/teaching.js';
import { clinicValues, clinicTemperatures, visibleRatio, repairMissing } from '../src/clinic.js';

test('every lesson supports a distinct prediction, intervention and bilingual takeaway',()=>{
  for(const section of courses.flatMap(c=>c.sections)){
    const teaching=teachingFor(section);
    assert.ok(teaching,section.id);
    for(const lang of ['zh','en']){
      assert.ok(teaching.question[lang]);assert.ok(teaching.insight[lang]);
      assert.notEqual(teaching.question[lang],section.transfer[lang],section.id);
      assert.ok(teaching.options.every(option=>option[lang]));
    }
    assert.ok(teaching.answer>=0&&teaching.answer<teaching.options.length);
    assert.ok(Object.keys(teaching.preset).length);
    assert.ok(!('pages' in section));
  }
});
test('axis clinic distinguishes the visible length ratio from the actual ratio',()=>{
  assert.deepEqual(clinicValues,[80,84]);
  assert.equal(visibleRatio(76),2);assert.equal(visibleRatio(0),1.05);
  assert.equal(visibleRatio(78),3);
});
test('missing-value repairs preserve unknowns and never rewrite source readings',()=>{
  const before=[...clinicTemperatures];
  assert.equal(repairMissing(clinicTemperatures,'zero')[2],0);
  for(const mode of ['gap','connect'])assert.equal(repairMissing(clinicTemperatures,mode)[2],null);
  assert.deepEqual(clinicTemperatures,before);
  assert.deepEqual(repairMissing(clinicTemperatures,'gap'),[18,19,null,21,22,23,21]);
});
test('discovery context describes the selected experiment instead of unrelated parameters',()=>{
  assert.deepEqual(describeExperiment({kind:'join'},{next:'B,C,D',joined:true,hue:200}),'新数据: B,C,D|已应用新数据'.split('|'));
  assert.deepEqual(describeExperiment({kind:'time'},{view:'calendar',day:59},'en'),['Time view: calendar','Selected date: 2024-02-29']);
  assert.deepEqual(describeExperiment({kind:'scale'},{scale:'log',threshold:75},'en'),['Scale: logarithmic']);
});
