import test from 'node:test';
import assert from 'node:assert/strict';
import {meanAbsoluteAngle,bankHeight,curledPoint,pairedPalette,visionRgb} from '../src/visual-math.js';
import {allSections} from '../src/course-data.js';
import {lessonSteps} from '../src/lesson-steps.js';

test('banking solves the actual average angle with one common pixel scale',()=>{
  assert.equal(meanAbsoluteAngle([[0,0],[1,1]],100,100),45);
  const points=[[0,0],[.2,.1],[.4,.5],[.6,.3],[1,1]],height=bankHeight(points,550);
  assert.ok(height>0);assert.ok(Math.abs(meanAbsoluteAngle(points,550,height)-45)<1e-8);
  assert.equal(bankHeight([[0,1],[1,1]],550),null);
  const flat=[[0,0],[.2,0],[.4,0],[.6,0],[.8,.5],[1,1]],culled=bankHeight(flat,500,45,true);
  assert.ok(Math.abs(meanAbsoluteAngle(flat,500,culled,true)-45)<1e-8);
});
test('curl interpolation retains exact linear and polar endpoints and is continuous',()=>{
  const a=curledPoint(.4,.7,0),b=curledPoint(.4,.7,1),mid=curledPoint(.4,.7,.5);
  assert.deepEqual(a,[245,139.5]);
  mid.forEach((v,i)=>assert.ok(Math.abs(v-(a[i]+b[i])/2)<1e-10));
  assert.ok(Math.hypot(...curledPoint(.4,.7,.50001).map((v,i)=>v-mid[i]))<.01);
});
test('paired palettes preserve hue identity while lowering saturation and increasing lightness',()=>{
  const colors=pairedPalette(350,80,45,7);assert.equal(colors.length,7);
  for(let i=0;i<6;i+=2){assert.equal(colors[i].h,colors[i+1].h);assert.ok(colors[i].s>colors[i+1].s);assert.ok(colors[i].l<colors[i+1].l);}
  assert.ok(colors.every(c=>c.h>=0&&c.h<360));
  assert.equal(pairedPalette(200,70,40,5).at(-1).role,'background');
});
test('linear-light CVD transforms keep neutral colors and clamp output channels',()=>{
  for(const mode of ['protan','deutan','tritan']){
    visionRgb([128,128,128],mode).forEach(v=>assert.ok(Math.abs(v-128)<.001));
    for(const rgb of [[255,0,0],[0,255,0],[0,0,255]])assert.ok(visionRgb(rgb,mode).every(v=>v>=0&&v<=255));
  }
});
test('all walkthroughs link bilingual steps to retained original code explanations',()=>{
  for(const section of allSections)for(const step of lessonSteps(section)){
    assert.ok(step.title?.zh&&step.title?.en,section.id);assert.ok(step.guide>=0);assert.ok(step.terms);
  }
});
