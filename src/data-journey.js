import {loadSource} from './source-data.js';
import {visionRgb,bankHeight,meanAbsoluteAngle} from './visual-math.js';

export function mountJourney(host,lang){
  const d3=window.d3,L=(zh,en)=>lang==='zh'?zh:en;
  let rows=null,scene=0,converted=false,uniform=true,vision=false,curl=100,dead=false,timer=null;
  const labels=L(['数据','流程','色彩','低维','时序'],['Data','Pipeline','Color','Space','Time']);
  const notes=L([
    '一份 CSV，80 条新生记录。把字符串解析成数值，保留每条记录的编号。',
    '按生日月份分组；同一个编号从表格移动到分组坐标。',
    '月份人数决定颜色深浅。比较彩虹色与顺序色板，再看色觉模拟。',
    '同一份分组结果：观察点、MonotoneX 曲线和二维密度等值线。',
    '把生日记录沿时间轴排列，再连续卷成按年重复的螺旋。'
  ],[
    'One CSV, 80 student records. Parse strings into numbers while retaining IDs.',
    'Group birthdays by month. The same IDs move from the table into group coordinates.',
    'Month counts determine color. Compare rainbow and sequential color, then simulate vision.',
    'The same groups as points, a MonotoneX curve and density contours.',
    'Arrange birthday records on a time axis, then curl it into yearly turns.'
  ]);
  host.innerHTML=`<div class="journey-title"><span>${L('一份数据，五种观察','ONE DATASET · FIVE VIEWS')}</span><button data-journey-play aria-label="${L('依次演示五章','Play the five chapters')}">▷</button></div><svg class="journey-canvas" viewBox="0 0 680 390" role="img" aria-label="${L('同一份新生数据的五章可视化之旅','Five visualization views of the same student records')}"></svg><div class="journey-controls"></div><p class="journey-note" role="status"></p><nav class="journey-scenes" aria-label="${L('五章演示','Five chapter demonstrations')}">${labels.map((name,i)=>`<button data-journey-scene="${i}" aria-pressed="${i===0}"><small>0${i+1}</small>${name}</button>`).join('')}</nav>`;
  const svg=d3.select(host.querySelector('svg')),background=svg.append('g'),marks=svg.append('g');
  const controls=host.querySelector('.journey-controls');
  const duration=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?0:950;
  function button(text,click){const b=document.createElement('button');b.textContent=text;b.onclick=click;controls.append(b);return b;}
  function draw(renderControls=true){
    if(!rows||dead)return;
    host.dataset.scene=scene;host.querySelectorAll('[data-journey-scene]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.journeyScene)===scene));
    host.querySelector('.journey-note').textContent=notes[scene];if(renderControls)controls.replaceChildren();background.selectAll('*').remove();
    const groups=d3.group(rows,d=>d.date.getUTCMonth()),count=d3.scaleLinear(d3.extent(Array.from(groups.values(),g=>g.length)),[0,1]);
    const maxCount=d3.max(Array.from(groups.values(),g=>g.length))+1;
    const x=d3.scaleLinear([-1,12],[30,650]),y=d3.scaleLinear([0,maxCount],[325,40]);
    if(scene===3){
      const normalized=d3.range(12).map(month=>[(month+1)/13,(groups.get(month)?.length||0)/maxCount]);
      const suggested=bankHeight(normalized,620,45,true);
      if(suggested){const factor=Math.min(1,270/suggested),width=620*factor,height=suggested*factor;x.range([340-width/2,340+width/2]);y.range([325,325-height]);const angle=meanAbsoluteAngle(normalized,width,height,true);host.dataset.bankAngle=angle.toFixed(2);host.querySelector('.journey-note').textContent=notes[scene]+L(` 非水平线段的平均绝对倾角为 ${angle.toFixed(1)}°。`,` Non-horizontal segments are banked to a mean absolute angle of ${angle.toFixed(1)}°.`);}
    }
    const dates=d3.extent(rows,d=>d.date),time=d3.scaleUtc(dates,[45,635]),age=d3.scaleLinear(d3.extent(rows,d=>d.age),[285,95]);
    const point=d=>{
      if(scene===0){const i=Number(d.id)-1;return [25+i%10*64+(converted?0:Math.sin(i*9)*5),42+Math.floor(i/10)*37];}
      if(scene<4){const group=groups.get(d.date.getUTCMonth());return [x(d.date.getUTCMonth()),y(group.indexOf(d)+.6)];}
      const days=(d.date-dates[0])/86400000,total=(dates[1]-dates[0])/86400000;
      const linear=[time(d.date),age(d.age)],theta=days/365.25*Math.PI*2-Math.PI/2,r=28+days/Math.max(1,total)*132;
      const spiral=[340+Math.cos(theta)*r,190+Math.sin(theta)*r];return linear.map((value,i)=>value+(spiral[i]-value)*curl/100);
    };
    const color=d=>{
      if(scene===0)return converted?'#347f96':'#b1c3ce';
      const t=count(groups.get(d.date.getUTCMonth()).length),c=scene<2?'#418caa':uniform?d3.interpolateViridis(t):d3.interpolateRainbow(t);
      return vision?`rgb(${visionRgb([d3.rgb(c).r,d3.rgb(c).g,d3.rgb(c).b],'deutan').join(',')})`:c;
    };
    if(scene>0&&scene<4){background.append('g').attr('transform','translate(0,335)').call(d3.axisBottom(x).tickValues(d3.range(12)).tickFormat(i=>L(`${i+1}月`,d3.utcFormat('%b')(new Date(Date.UTC(2024,i,1))))));background.append('g').attr('transform','translate(35,0)').call(d3.axisLeft(y).ticks(4));}
    if(scene===3){
      const monthly=d3.range(12).map(month=>[month,groups.get(month)?.length||0]);
      const contours=d3.contourDensity().x(d=>x(d.date.getUTCMonth())).y(d=>y(groups.get(d.date.getUTCMonth()).indexOf(d)+.6)).size([680,360]).bandwidth(28).thresholds(8)(rows);
      background.selectAll('path').data(contours).join('path').attr('d',d3.geoPath()).attr('fill','#80bdb9').attr('opacity',.1).attr('stroke','#4e9d9b').attr('stroke-width',.7);
      background.append('path').attr('d',d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveMonotoneX)(monthly)).attr('fill','none').attr('stroke','#db7751').attr('stroke-width',3);
    }
    if(scene===4){background.append('path').attr('d',d3.line()(rows.slice().sort((a,b)=>a.date-b.date).map(point))).attr('fill','none').attr('stroke','#b3ccd5').attr('stroke-width',1.2);background.append('g').attr('transform','translate(0,350)').attr('opacity',1-curl/100).call(d3.axisBottom(time).ticks(5).tickFormat(d3.utcFormat('%Y-%m')));background.selectAll('circle.time-guide').data([45,85,125,165]).join('circle').attr('class','time-guide').attr('cx',340).attr('cy',190).attr('r',d=>d).attr('fill','none').attr('stroke','#bed3de').attr('stroke-dasharray','3 5').attr('opacity',curl/100*.5);}
    const tokens=marks.selectAll('g.journey-record').data(rows,d=>d.id).join(enter=>{const g=enter.append('g').attr('class','journey-record');g.append('rect').attr('rx',4);g.append('text').attr('text-anchor','middle').attr('font-size',10).attr('dy',17);g.append('title');return g;});
    tokens.interrupt('journey').transition('journey').duration(renderControls?duration():0).attr('transform',d=>`translate(${point(d)})`);
    tokens.select('rect').interrupt('journey').transition('journey').duration(duration()).attr('width',scene===0?53:11).attr('height',scene===0?25:11).attr('rx',scene===0?4:5.5).attr('fill',color);
    tokens.select('text').attr('x',scene===0?26.5:0).attr('fill',converted?'white':'#244b64').text(d=>converted?d.age:'"'+d.age+'"').attr('opacity',scene===0?1:0);
    tokens.select('title').text(d=>`${d.id} · ${d.name} · ${d3.utcFormat('%Y-%m-%d')(d.date)} · ${d.age}`);
    if(renderControls){
    if(scene===0)button(converted?L('age: number · birthday: Date','age: number · birthday: Date'):L('解析 CSV → 类型转换','Parse CSV → convert types'),()=>{converted=!converted;draw();});
    if(scene===1)button(L('查看第二章的完整流程 →','Open the complete pipeline →'),()=>location.hash='#lesson-2');
    if(scene===2){button(uniform?L('切到彩虹色','Use rainbow'):L('改为 Viridis','Use Viridis'),()=>{uniform=!uniform;draw();});button(vision?L('恢复原色','Restore colors'):L('色盲视角','CVD view'),()=>{vision=!vision;draw();});}
    if(scene===3)button(L('曲线、倾角与等值线 →','Curves, banking and contours →'),()=>location.hash='#lesson-4');
    if(scene===4){const wrap=document.createElement('label');wrap.innerHTML=`<span>${L('直线','Line')} ↔ ${L('螺旋','Spiral')} <output>${curl}%</output></span><input type="range" min="0" max="100" value="${curl}" aria-label="${L('首页卷曲程度','Homepage curl amount')}">`;wrap.querySelector('input').oninput=event=>{curl=Number(event.target.value);wrap.querySelector('output').textContent=curl+'%';draw(false);};controls.append(wrap);}
    }
  }
  function selectScene(index){scene=index;draw();}
  host.querySelectorAll('[data-journey-scene]').forEach(b=>b.onclick=()=>{if(timer)clearInterval(timer);timer=null;selectScene(Number(b.dataset.journeyScene));});
  host.querySelector('[data-journey-play]').onclick=()=>{if(timer){clearInterval(timer);timer=null;return;}selectScene(0);timer=setInterval(()=>{selectScene((scene+1)%5);if(scene===4){clearInterval(timer);timer=null;}},2100);};
  loadSource('original-students.csv').then(value=>{if(dead)return;rows=value;draw();}).catch(error=>host.querySelector('.journey-note').textContent=error.message);
  return {selectScene,cleanup(){dead=true;if(timer)clearInterval(timer);svg.selectAll('*').interrupt('journey');}};
}
