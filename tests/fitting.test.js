import test from 'node:test';
import assert from 'node:assert/strict';
import {leastSquares} from '../src/core.js';

test('least-squares overlay recovers a known line without rewriting observations',()=>{
  const points=[{x:0,y:1},{x:1,y:3},{x:2,y:5},{x:3,y:7}],before=structuredClone(points);
  const fit=leastSquares(points);
  assert.equal(fit.slope,2);assert.equal(fit.intercept,1);
  assert.deepEqual(points,before);
});
test('a fitted y(x) line is unavailable for insufficient or identical x observations',()=>{
  assert.equal(leastSquares([]),null);assert.equal(leastSquares([{x:1,y:2}]),null);
  assert.equal(leastSquares([{x:1,y:2},{x:1,y:9}]),null);
});
