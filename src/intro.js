// Original canvas artwork: the same particles form the five course subjects.
export function mountIntro(canvas,onScene=()=>{}){
  const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let width=650,height=390,scene=0,frame=0,visible=true,disposed=false;
  const pointer={x:-1000,y:-1000};
  const colors=['#81c7e9','#f29a6e','#a4d0c4','#c5d7e8','#edc66f'];
  const particles=Array.from({length:850},(_,i)=>({x:325+Math.cos(i*2.4)*500,y:195+Math.sin(i*1.7)*350,r:.9+i%5*.27,c:colors[i%colors.length]}));
  const targets=Array.from({length:5},()=>[]);
  const temp=document.createElement('canvas');temp.width=650;temp.height=390;
  const ink=temp.getContext('2d');ink.fillStyle='white';ink.font='bold 230px Georgia';ink.textAlign='center';ink.fillText('D3',325,275);
  const pixels=ink.getImageData(0,0,650,390).data,samples=[];
  for(let y=25;y<365;y+=5)for(let x=25;x<625;x+=5)if(pixels[(y*650+x)*4+3]>100)samples.push([x,y]);
  particles.forEach((p,i)=>{
    targets[0].push(samples[(i*17)%samples.length]);
    // Repeated columns, branching structure, color wheel, curve, calendar.
    const branch=i%8,depth=Math.floor(i/8)%4;
    targets[1].push([70+depth*155+(i%7)*1.7,195+(branch-3.5)*(depth+1)*14+Math.sin(i)*4]);
    const angle=i/particles.length*Math.PI*2,r=85+(i%13)*6;
    targets[2].push([325+Math.cos(angle)*r,195+Math.sin(angle)*r*.8]);
    const x=45+(i%170)*3.3,y=210-Math.sin((i%170)/170*Math.PI*3)*80+(Math.floor(i/170)-2)*6;
    targets[3].push([x,y]);
    const cell=i%91,column=Math.floor(cell/7),row=cell%7;
    targets[4].push([85+column*39+(Math.floor(i/91)%3-1)*4,75+row*37+(Math.floor(i/273)%3-1)*4]);
  });
  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});visibility.observe(canvas);
  const move=e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*650;pointer.y=(e.clientY-r.top)/r.height*390;};
  const leave=()=>{pointer.x=-1000;pointer.y=-1000;};
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);
  function paint(){
    if(disposed)return;
    if(visible){
      ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(width/650,height/390);
      ctx.strokeStyle='#9fc2df16';ctx.lineWidth=.65;
      for(let x=45;x<650;x+=40){ctx.beginPath();ctx.moveTo(x,15);ctx.lineTo(x,375);ctx.stroke();}
      particles.forEach((p,i)=>{
        const target=targets[scene][i],dx=target[0]-pointer.x,dy=target[1]-pointer.y,distance=Math.hypot(dx,dy),force=!reduced.matches&&distance<90?(90-distance)/90*16:0;
        const tx=target[0]+(distance?dx/distance*force:0),ty=target[1]+(distance?dy/distance*force:0);
        p.x+=(tx-p.x)*(reduced.matches?1:.085);p.y+=(ty-p.y)*(reduced.matches?1:.085);
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=scene===2?`hsl(${i/particles.length*360},55%,70%)`:p.c;ctx.globalAlpha=.55+(i%5)*.1;ctx.fill();
      });
      ctx.globalAlpha=1;ctx.restore();
    }
    frame=requestAnimationFrame(paint);
  }
  frame=requestAnimationFrame(paint);
  canvas.selectScene=index=>{scene=index;onScene(index);};
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();visibility.disconnect();canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);};
}
