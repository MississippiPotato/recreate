// Geometry is kept separate from D3 rendering so numerical claims can be checked.
export function meanAbsoluteAngle(points,width,height,excludeFlat=false){
  const angles=[];
  for(let i=1;i<points.length;i++){
    const dx=points[i][0]-points[i-1][0],dy=points[i][1]-points[i-1][1];
    if((dx!==0||dy!==0)&&(!excludeFlat||dy!==0))angles.push(Math.atan2(Math.abs(dy)*height,Math.abs(dx)*width)*180/Math.PI);
  }
  return angles.length?angles.reduce((a,b)=>a+b,0)/angles.length:0;
}
export function bankHeight(points,width,target=45,excludeFlat=false){
  if(!points.some((p,i)=>i&&p[0]!==points[i-1][0]&&p[1]!==points[i-1][1]))return null;
  let lo=.001,hi=width*1000;
  if(meanAbsoluteAngle(points,width,hi,excludeFlat)<target)return null;
  for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(meanAbsoluteAngle(points,width,mid,excludeFlat)<target)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
export function curledPoint(t,value,curl,period=14){
  const linear=[45+t*500,255-value*165];
  const angle=t*83/period*2*Math.PI-Math.PI/2,radius=27+t*133+(value-.5)*16;
  const spiral=[300+Math.cos(angle)*radius,205+Math.sin(angle)*radius];
  return linear.map((coordinate,i)=>coordinate+(spiral[i]-coordinate)*curl);
}
export function pairedPalette(h=205,s=75,l=49,count=7){
  const wrap=x=>(x%360+360)%360,clamp=x=>Math.max(5,Math.min(95,x));
  const hues=[h,h+30,h+180];
  const colors=hues.flatMap((h,i)=>[{h:wrap(h),s,l,role:'vivid',pair:i},{h:wrap(h),s:s*.48,l:clamp(l+22),role:'muted',pair:i}]);
  colors.push({h:wrap(h),s:s*.14,l:92,role:'background',pair:3});
  return Number(count)===5?[...colors.slice(0,4),colors[6]]:colors.slice(0,count);
}
export const cvdMatrices={
  protan:[[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
  deutan:[[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]],
  tritan:[[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.3039]]
};
export function visionRgb(rgb,mode){
  if(mode==='normal'||!cvdMatrices[mode])return [...rgb];
  const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
  const gamma=v=>255*(v<=.0031308?12.92*v:1.055*Math.max(0,v)**(1/2.4)-.055);
  const source=rgb.map(v=>linear(v/255));
  return cvdMatrices[mode].map(row=>Math.max(0,Math.min(255,gamma(row.reduce((sum,v,i)=>sum+v*source[i],0)))));
}
