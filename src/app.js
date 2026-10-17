import { courses, ui, goals, t } from './content.js';
import { createExperiment } from './experiments.js';
import { quartet } from './core.js';

const app=document.querySelector('#app');
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Learning remains available when storage is disabled. */}};
let lang=safeRead('seeing-language','zh'), classroom=false, activeExperiment=null, activeStep=0, answerChoice=null, answerChecked=false;
if(!['zh','en'].includes(lang))lang='zh';
let practiced=safeRead('seeing-practiced',{});
const experimentStates=new Map();
const $=(s)=>document.querySelector(s);
const L=(zh,en)=>lang==='zh'?zh:en;
const T=value=>t(value,lang);
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function route() {
  const hash=location.hash.slice(1);
  const sectionMatch=hash.match(/^ch-([1-5])-([1-8])(?:\/step-([1-3]))?$/)||hash.match(/^lesson-(\d)-(\d)$/);
  const courseMatch=hash.match(/^lesson-(\d)$/);
  const pathMatch=location.pathname.match(/lesson-0([1-5])\//);
  const id=Number(sectionMatch?.[1]||courseMatch?.[1]||(!hash&&pathMatch?.[1])||0);
  const course=courses.find(c=>c.id===id);
  const section=course?.sections.find(s=>s.id===`${id}.${sectionMatch?.[2]}`)||course?.sections[0];
  return {course,section,step:Math.max(0,Number(sectionMatch?.[3]||1)-1)};
}
const sectionHref=s=>`#ch-${s.id.replace('.','-')}`;
function header(course) {
  return `<header class="topbar"><a class="wordmark" href="#home" aria-label="${T(ui.home)}"><span class="brand-symbol">见</span><span>${T(ui.brand)}</span><i></i><small>${L('可视化导论','VISUALIZATION')}</small></a><nav class="topnav" aria-label="${L('五课导航','Course navigation')}">${courses.map(c=>`<a href="#lesson-${c.id}" ${course?.id===c.id?'aria-current="page"':''}>0${c.id}<span>${T(c.title)}</span></a>`).join('')}</nav><div class="header-actions"><button id="language" aria-label="${L('Switch to English','切换为中文')}">${T(ui.language)}</button>${course?`<button id="classroom" aria-pressed="${classroom}">${T(classroom?ui.exitClass:ui.classroom)}</button><button class="mobile-menu" id="menu" aria-expanded="false">${T(ui.contents)}</button>`:''}</div></header>`;
}
function footer() {
  return `<footer class="site-footer"><a class="footer-brand" href="#home">${T(ui.brand)}<small>SEEING DATA</small></a><p>${L('把看见，变成理解。','Turn seeing into understanding.')}<br><span>${T(ui.course)}</span></p><div><a href="https://github.com/MississippiPotato/recreate" target="_blank" rel="noreferrer">${L('项目源码','Source code')} ↗</a><a href="https://cinger007.github.io/vis/" target="_blank" rel="noreferrer">${L('原课程','Original course')} ↗</a><button id="clear-progress">${L('清除本地学习记录','Clear local learning records')}</button></div></footer>`;
}
function renderHome() {
  const last=safeRead('seeing-last',null);
  app.innerHTML=`${header()}<main id="main" class="home-page"><section class="home-hero"><div class="hero-copy"><p class="eyebrow"><span></span> LEARNING TO SEE · ${L('交互读本','INTERACTIVE READER')}</p><h1>${L('让数据<br>成为<span>看得见的理解。</span>','Make data<br><span>make sense.</span>')}</h1><p class="hero-description">${L('一张图为什么有效？<br>从一个问题出发，亲手改变图形，找到背后的理由。','Why does a chart work?<br>Start with a question. Change the picture. Discover the reason.')}</p><div class="hero-actions"><a class="primary" href="#lesson-1">${L('开始第一课','Start learning')} <span>↗</span></a>${last?`<a class="text-link" href="${escapeHtml(last)}">${L('继续上次学习','Continue learning')} →</a>`:`<a class="text-link" href="#introduction">${L('先看一个小实验','Try a short experiment')} ↓</a>`}</div><div class="hero-meta"><span>05 ${L('堂课','LESSONS')}</span><span>27 ${L('个学习小节','SECTIONS')}</span><span>${L('观察 · 操作 · 解释','OBSERVE · EXPLORE · EXPLAIN')}</span></div></div><div class="hero-art" aria-label="${L('同一组点从散布到有序映射的示意','Points transforming from observations to an ordered mapping')}"><div class="figure-label"><span>FIG. 00</span>${L('从记录到图形','FROM RECORDS TO A VIEW')}</div><svg id="hero-chart" viewBox="0 0 550 410" role="img" aria-label="${L('数据关系的图形表达','A visual representation of data relationships')}"></svg><div class="figure-note"><span>DATA → ENCODING → INSIGHT</span><span>↗</span></div></div></section>
  <section class="learning-path" aria-labelledby="path-heading"><div class="section-heading"><p class="eyebrow">THE LEARNING PATH</p><h2 id="path-heading">${L('五个问题，连成一条学习路径。','Five questions. One connected path.')}</h2><p>${L('从认识数据，到解释图形，再到选择适合问题的表达。','Understand the data, explain the picture, and choose a view for the question.')}</p></div><div class="course-grid">${courses.map(c=>`<a class="course-card" href="#lesson-${c.id}" style="--accent:${c.color}"><div class="course-card-top"><span class="course-number">0${c.id}</span><span class="course-word">${c.word}</span></div><div class="course-glyph glyph-${c.id}" aria-hidden="true">${glyph(c.id)}</div><h3>${T(c.title)}</h3><p>${T(c.question)}</p><div class="course-card-bottom"><span>${c.sections.length} ${L('小节','sections')}</span><span>↗</span></div></a>`).join('')}</div></section>
  <section class="intro-section" id="introduction"><div class="intro-copy"><p class="eyebrow">BEFORE WE BEGIN</p><h2>${L('统计量相近，<br>图形也一样吗？','Similar statistics.<br>Same picture?')}</h2><p>${L('四组数据的均值、方差和相关系数近似相同。先想一想：它们会长成相同的形状吗？','Four datasets have nearly identical means, variances and correlations. Predict: will their plots look alike?')}</p><div class="stats-row"><div><strong>9.00</strong><span>mean(x)</span></div><div><strong>7.50</strong><span>mean(y) ≈</span></div><div><strong>0.82</strong><span>correlation ≈</span></div></div><button class="primary" id="reveal-quartet">${L('展开四组图形','Reveal the four plots')} ↗</button><p class="source-note">${L('Anscombe 四重奏 · 教材 PDF 第 23–25 页','Anscombe’s quartet · textbook PDF pp. 23–25')}</p></div><div class="quartet-wrap"><div id="quartet" class="quartet is-concealed"></div><p id="quartet-explanation" hidden>${L('相近的摘要，可能来自不同结构：近似线性、弯曲、异常点，以及几乎相同的横坐标。图形帮助我们看见统计摘要没有说出的部分。','Similar summaries can hide linear patterns, curvature, outliers and nearly identical x values. A plot reveals what a summary leaves out.')}</p></div></section>
  <section class="method-strip"><div><span>01</span><h3>${L('先提问','Ask')}</h3><p>${L('明确你想从数据中知道什么。','Decide what you want to know.')}</p></div><div><span>02</span><h3>${L('再动手','Explore')}</h3><p>${L('改变一个条件，对照图形变化。','Change one condition and compare.')}</p></div><div><span>03</span><h3>${L('说出理由','Explain')}</h3><p>${L('用数据与图形证据支持判断。','Support your judgment with evidence.')}</p></div></section>
  <section class="references"><p class="eyebrow">READING & SOURCES</p><h2>${L('把实验，放回知识的来处。','Connect experiments to their sources.')}</h2><p>${L('参考陈为、沈则潜、陶煜波编著《数据可视化》。每节附教材 PDF 页序、数据说明及实际运行代码。课程课次与教材章次分别标注。','Based on Data Visualization by Wei Chen, Zeqian Shen and Yubo Tao. Each section includes PDF page references, data notes and running code. Course lessons and textbook chapters use separate numbering.')}</p><a href="https://d3js.org/" target="_blank" rel="noreferrer">D3 ${L('官方文档','documentation')} ↗</a><span> / </span><a href="https://cinger007.github.io/vis/" target="_blank" rel="noreferrer">${L('原课程内容','Original course')} ↗</a></section></main>${footer()}`;
  drawHero();drawQuartet();
  $('#reveal-quartet').onclick=()=>{const concealed=$('#quartet').classList.toggle('is-concealed');$('#quartet-explanation').hidden=concealed;$('#reveal-quartet').textContent=concealed?L('展开四组图形 ↗','Reveal the four plots ↗'):L('收起，重新预测 ↺','Conceal and predict again ↺');};
}
function glyph(id) {
  const svgStart='<svg viewBox="0 0 160 70" fill="none">';
  const contents={
    1:Array.from({length:15},(_,i)=>`<circle cx="${12+i%5*31}" cy="${10+Math.floor(i/5)*24}" r="${3+(i*7%4)}" fill="currentColor" opacity="${.25+(i%3)*.28}"/>`).join(''),
    2:'<path d="M10 35H50M60 35H100M110 35H150" stroke="currentColor"/><rect x="2" y="23" width="24" height="24" stroke="currentColor"/><circle cx="65" cy="35" r="13" fill="currentColor" opacity=".5"/><path d="M130 18 148 35 130 52 112 35Z" stroke="currentColor"/>',
    3:colorsForGlyph(),
    4:'<path d="M5 60C30 60 25 10 50 18S75 68 95 32 130 10 155 20" stroke="currentColor" stroke-width="2"/><path d="M5 68H155M5 5V68" stroke="currentColor" opacity=".2"/><circle cx="50" cy="18" r="4" fill="currentColor"/><circle cx="95" cy="32" r="4" fill="currentColor"/>',
    5:Array.from({length:36},(_,i)=>`<rect x="${20+i%12*10}" y="${12+Math.floor(i/12)*15}" width="8" height="12" fill="currentColor" opacity="${.15+(Math.sin(i)*.5+.5)*.75}"/>`).join('')
  };return svgStart+contents[id]+'</svg>';
}
function colorsForGlyph(){return ['#ead5c8','#ce9d7a','#6254c7','#704633','#246b90'].map((c,i)=>`<rect x="${5+i*31}" y="12" width="26" height="46" rx="13" fill="${c}"/>`).join('');}
function drawHero() {
  const d3=window.d3,g=d3.select('#hero-chart');
  [50,130,210,290,370].forEach(y=>g.append('line').attr('x1',35).attr('x2',515).attr('y1',y).attr('y2',y).attr('stroke','#dce4f2').attr('stroke-dasharray','2 6'));
  [50,150,250,350,450].forEach(x=>g.append('line').attr('x1',x).attr('x2',x).attr('y1',35).attr('y2',380).attr('stroke','#dce4f2').attr('stroke-dasharray','2 6'));
  const data=Array.from({length:40},(_,i)=>[48+i*11.4,330-i*5.8+Math.sin(i*2.8)*34]);
  g.append('path').attr('d',d3.line().curve(d3.curveBasis)([[45,335],[120,290],[220,255],[300,175],[400,165],[505,75]])).attr('fill','none').attr('stroke','#6254c7').attr('stroke-width',2);
  data.forEach((p,i)=>g.append('circle').attr('cx',p[0]).attr('cy',p[1]).attr('r',4+i%3*1.5).attr('fill',i%5===0?'#6254c7':'#246b90').attr('opacity',.38+i%4*.15));
  g.append('circle').attr('cx',350).attr('cy',172).attr('r',38).attr('fill','none').attr('stroke','#6254c7').attr('stroke-dasharray','3 5');
  g.append('path').attr('d','M387 160L425 130H510').attr('fill','none').attr('stroke','#6254c7');
  g.append('text').attr('x',420).attr('y',118).attr('fill','#6254c7').attr('font-size',13).text(L('看见关系','See relationships'));
  g.append('text').attr('x',50).attr('y',405).attr('fill','#68706e').attr('font-size',10).attr('letter-spacing',2).text('OBSERVATIONS →');
}
function drawQuartet() {
  const d3=window.d3;
  quartet.forEach((dataset,index)=>{
    const panel=d3.select('#quartet').append('div').attr('class','quartet-panel');panel.append('span').text(`0${index+1}`);
    const g=panel.append('svg').attr('viewBox','0 0 260 180').attr('role','img').attr('aria-label',`${L('数据组','Dataset')} ${index+1}`),x=d3.scaleLinear([0,20],[25,245]),y=d3.scaleLinear([0,14],[155,15]);
    g.append('path').attr('d',`M25 15V155H245`).attr('fill','none').attr('stroke','#c7d3e3');
    [0,10,20].forEach(v=>g.append('text').attr('x',x(v)).attr('y',174).attr('text-anchor','middle').attr('font-size',10).attr('fill','#68706e').text(v));
    [0,7,14].forEach(v=>g.append('text').attr('x',18).attr('y',y(v)+3).attr('text-anchor','end').attr('font-size',10).attr('fill','#68706e').text(v));
    dataset.x.forEach((v,i)=>g.append('circle').attr('cx',x(v)).attr('cy',y(dataset.y[i])).attr('r',4.2).attr('fill',index%2?'#6254c7':'#246b90').attr('opacity',.8));
  });
}
function renderCourse(course,section) {
  const index=course.sections.indexOf(section),original=`https://cinger007.github.io/vis/lesson-0${course.id}/#ch-${section.id.replace('.','-')}`;
  document.documentElement.style.setProperty('--accent',course.color);
  app.innerHTML=`${header(course)}<div class="course-shell"><aside class="sidebar" id="sidebar"><a class="back-link" href="#home">← ${T(ui.back)}</a><div class="sidebar-heading"><span class="eyebrow">LESSON 0${course.id}</span><h2>${T(course.title)}</h2></div><label class="search-wrap"><span class="sr-only">${L('查找概念','Find a concept')}</span><input id="concept-search" placeholder="${T(ui.search)}" type="search"></label><div id="search-results" hidden></div><nav aria-label="${T(ui.contents)}">${course.sections.map(s=>`<a class="section-nav ${s.id===section.id?'active':''}" href="${sectionHref(s)}" ${s.id===section.id?'aria-current="page"':''}><span class="section-num">${s.id}</span><span>${T(s.title)}${s.advanced?`<small>${T(ui.advanced)}</small>`:''}</span><i>${practiced[s.id]?'✓':''}</i></a>`).join('')}</nav><div class="sidebar-bottom"><p>${Object.keys(practiced).filter(id=>id.startsWith(course.id+'.')).length} / ${course.sections.length} ${T(ui.progress)}</p><small>${T(ui.notMastery)}</small></div></aside>
  <main id="main" class="lesson-main"><div class="lesson-masthead"><span class="masthead-number">0${course.id}</span><div><p class="eyebrow">${course.word} / ${L('课程讲解','COURSE READER')}</p><h1>${T(course.title)}</h1><p>${T(course.subtitle)}</p></div><span class="lesson-position">${String(index+1).padStart(2,'0')} <i>/ ${course.sections.length}</i></span></div>
  <article class="lesson-article"><div class="article-heading"><div><p class="eyebrow">${section.id} <span class="badge">${T(section.advanced?ui.advanced:ui.core)}</span></p><h2>${T(section.title)}</h2></div><a class="page-reference" href="#references">PDF ${section.pages} ↘</a></div>
  <p class="learning-goal"><span>${L('本节学会','LEARNING GOAL')}</span>${T(goals[section.kind])}</p><div class="teaching-grid"><div class="lesson-prose"><div class="question-block"><span>${T(ui.question)}</span><h3>${T(section.question)}</h3></div><p class="explanation">${T(section.explanation)}</p><div class="step-list" aria-label="${T(ui.step)}">${section.steps.map((s,i)=>`<button class="step-button ${activeStep===i?'active':''}" data-step="${i}" aria-pressed="${activeStep===i}"><span>0${i+1}</span><div><strong>${[L('观察','Observe'),L('解释','Explain'),L('迁移','Transfer')][i]}</strong><p>${T(s)}</p></div></button>`).join('')}</div><div class="step-pagination"><button id="previous-step" ${activeStep===0?'disabled':''}>← ${L('上一步','Previous')}</button><span id="step-count">0${activeStep+1} / 03</span><button id="next-step" ${activeStep===2?'disabled':''}>${L('下一步','Next')} →</button></div></div>
  <div class="experiment-column"><section class="experiment-card"><div class="experiment-heading"><span><i></i> ${T(ui.experiment)}</span><button id="enlarge" aria-pressed="false">${T(ui.full)} ⤢</button></div><div id="experiment"></div></section><p class="lab-note">${L('改变参数，观察结果。重置可回到同一初始状态。','Change a parameter and observe. Reset returns to the same initial state.')}</p></div></div>
  <section class="practice-card" aria-labelledby="practice-heading"><div class="practice-intro"><p class="eyebrow">TRY ANOTHER CONTEXT</p><h3 id="practice-heading">${T(ui.practice)}</h3><p>${T(section.transfer)}</p></div><form id="quiz"><fieldset><legend class="sr-only">${T(section.transfer)}</legend>${section.options.map((option,i)=>`<label class="answer-option"><input type="radio" name="answer" value="${i}" ${answerChoice===i?'checked':''}><span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${T(option)}</span></label>`).join('')}</fieldset><button class="primary" id="check-answer" type="submit" ${answerChoice===null?'disabled':''}>${T(ui.submit)} →</button><div id="answer-feedback" class="answer-feedback" role="status" ${answerChecked?'':'hidden'}></div></form></section>
  <div class="supporting-material"><details id="code-details"><summary><span>⌘</span> ${T(ui.code)} <span>+</span></summary><p>${L('以下片段直接取自本页实验使用的函数。部分函数依赖 D3 或其他辅助函数；完整实现见项目源码。','This excerpt comes directly from a function used by the experiment. Some functions depend on D3 or helpers; see the repository for the complete implementation.')}</p><pre><code id="running-code"></code></pre><a href="https://github.com/MississippiPotato/recreate/tree/main/src" target="_blank" rel="noreferrer">${L('查看完整源码','View complete source')} ↗</a></details><details id="references"><summary><span>↗</span> ${T(ui.source)} <span>+</span></summary><div class="reference-copy"><p><strong>${T(ui.pdf)} ${section.pages}</strong><br>${L('陈为、沈则潜、陶煜波编著。这里使用 PDF 页序，不等同于书内印刷页码。','By Wei Chen, Zeqian Shen and Yubo Tao. PDF sequence numbers may differ from printed page numbers.')}</p><p>${dataSource(section)}</p><p><a href="${original}" target="_blank" rel="noreferrer">${T(ui.original)}</a> · <a href="https://d3js.org/" target="_blank" rel="noreferrer">D3 ${L('官方文档','documentation')} ↗</a>${section.kind==='vision'?` · <a href="https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html" target="_blank" rel="noreferrer">Machado et al. (2009) ↗</a>`:''}</p></div></details></div>
  <nav class="lesson-bottom-nav" aria-label="${L('前后小节','Adjacent sections')}">${index>0?`<a href="${sectionHref(course.sections[index-1])}"><small>← ${T(ui.prev)}</small><span>${T(course.sections[index-1].title)}</span></a>`:`<a href="#home"><small>← ${T(ui.home)}</small><span>${T(ui.back)}</span></a>`}${index<course.sections.length-1?`<a href="${sectionHref(course.sections[index+1])}"><small>${T(ui.next)} →</small><span>${T(course.sections[index+1].title)}</span></a>`:course.id<5?`<a href="#lesson-${course.id+1}"><small>${L('进入下一课','Next lesson')} →</small><span>${T(courses[course.id].title)}</span></a>`:`<a href="#home"><small>${L('完成五课，返回路线','Return to the learning path')} →</small><span>${L('把理解带到新的数据中','Take your understanding to new data')}</span></a>`}</nav></article></main></div>${footer()}`;
  activeExperiment=createExperiment($('#experiment'),section,lang);
  activeExperiment.restore(experimentStates.get(section.id));
  $('#running-code').textContent=activeExperiment.source();
  $('[href="#references"]').onclick=(event)=>{event.preventDefault();$('#references').open=true;$('#references').scrollIntoView({behavior:'smooth',block:'center'});};
  document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>setStep(Number(b.dataset.step),section));
  $('#previous-step').onclick=()=>setStep(Math.max(0,activeStep-1),section);
  $('#next-step').onclick=()=>setStep(Math.min(2,activeStep+1),section);
  $('#quiz').onchange=(event)=>{answerChoice=Number(event.target.value);answerChecked=false;$('#check-answer').disabled=false;$('#answer-feedback').hidden=true;};
  $('#quiz').onsubmit=(event)=>{event.preventDefault();if(answerChoice===null)return;answerChecked=true;practiced[section.id]={choice:answerChoice,correct:answerChoice===section.answer};save('seeing-practiced',practiced);showFeedback(section);$('.section-nav.active i').textContent='✓';$('.sidebar-bottom p').textContent=`${Object.keys(practiced).filter(id=>id.startsWith(course.id+'.')).length} / ${course.sections.length} ${T(ui.progress)}`;};
  if(answerChecked)showFeedback(section);
  $('#enlarge').onclick=()=>{const card=$('.experiment-card');const enlarged=card.classList.toggle('enlarged');$('#enlarge').setAttribute('aria-pressed',enlarged);$('#enlarge').textContent=enlarged?L('收起实验 ⤡','Restore experiment ⤡'):T(ui.full)+' ⤢';document.body.classList.toggle('experiment-open',enlarged);};
  $('#concept-search').oninput=(event)=>{
    const query=event.target.value.trim().toLowerCase(),results=$('#search-results');results.hidden=!query;
    if(query){const hits=courses.flatMap(c=>c.sections).filter(s=>(s.title.zh+s.title.en+s.question.zh+s.question.en).toLowerCase().includes(query));results.innerHTML=hits.length?hits.map(s=>`<a href="${sectionHref(s)}">${s.id} ${T(s.title)}</a>`).join(''):`<p>${T(ui.empty)}</p>`;}
  };
  if(activeStep)activeExperiment.setStep(activeStep);
  save('seeing-last',sectionHref(section)+(activeStep?`/step-${activeStep+1}`:''));
}
function dataSource(section) {
  if(section.kind==='time')return L('2024 年逐日教学合成气温，固定种子 42；366 个日期，其中第 91、211 天缺失。不是任何城市的真实观测。三种视图共享同一数组与数值范围。','Synthetic daily temperature for 2024, seed 42: 366 dates, with days 91 and 211 missing. Not observations from any city. All views share one array and numerical domain.');
  if(section.kind==='period')return L('168 天教学合成序列；基线 10、幅度 6、周期 14 天，固定噪声种子 42。显示周期可以改变，生成规则保持不变。','168 synthetic days; baseline 10, amplitude 6, period 14 days, fixed noise seed 42. Display period changes without altering the generator.');
  if(section.kind==='story')return L('虚构的三人考察队事件表，用于解释共同出现的关系，不表示真实人物活动。原课程的电影故事线见对应内容链接，本站不嵌入视频。','A fictional three-person expedition illustrates co-occurrence, not real people’s activities. The original course’s film storyline is linked as a reference; no video is embedded here.');
  if(Number(section.id[0])<3)return L('80 条新生记录为教学合成数据，固定种子 42。第一、二课共享同一份数组，编号 S001–S080 保持稳定。','80 synthetic student records, seed 42. Lessons 1 and 2 share the same array and stable IDs S001–S080.');
  return L('本节数值、场或配色样例均为明确构造的教学数据，用于控制变量与检查算法，不作真实世界统计结论。','The values, fields and palette examples are constructed teaching data for controlled comparisons and algorithm inspection, not real-world statistical claims.');
}
function setStep(index,section) {
  activeStep=index;activeExperiment?.setStep(index);
  const hash=sectionHref(section)+(index?`/step-${index+1}`:'');
  history.replaceState(null,'',hash);save('seeing-last',hash);
  document.querySelectorAll('[data-step]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.step)===index);b.setAttribute('aria-pressed',Number(b.dataset.step)===index);});
  $('#step-count').textContent=`0${index+1} / 03`;$('#previous-step').disabled=index===0;$('#next-step').disabled=index===2;
  if(index===2&&classroom)$('#practice-heading').scrollIntoView({behavior:'smooth',block:'center'});
}
function showFeedback(section) {
  const feedback=$('#answer-feedback');feedback.hidden=false;feedback.classList.toggle('is-correct',answerChoice===section.answer);
  feedback.innerHTML=`<strong>${T(answerChoice===section.answer?ui.correct:ui.retry)}</strong><p>${T(section.reason)}</p><small>${T(ui.notMastery)}</small>`;
}
let lastSection=null;
function render(keepScroll=false) {
  const scrollY=window.scrollY;
  if(activeExperiment&&lastSection)experimentStates.set(lastSection,activeExperiment.getState());
  activeExperiment=null;
  const {course,section,step}=route();
  if(section?.id!==lastSection){activeStep=step;answerChoice=null;answerChecked=false;}
  lastSection=section?.id||null;
  document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  document.title=section?`${T(section.title)} · ${T(ui.brand)}`:`${T(ui.brand)} · ${T(ui.course)}`;
  document.body.classList.toggle('is-classroom',classroom&&!!course);document.body.classList.remove('experiment-open','menu-open');
  if(course)renderCourse(course,section);else renderHome();
  $('.skip-link').onclick=event=>{event.preventDefault();const main=$('#main');main.tabIndex=-1;main.focus();};
  $('#language').onclick=()=>{lang=lang==='zh'?'en':'zh';save('seeing-language',lang);render(true);};
  if($('#classroom'))$('#classroom').onclick=()=>{classroom=!classroom;document.body.classList.toggle('is-classroom',classroom);$('#classroom').textContent=T(classroom?ui.exitClass:ui.classroom);$('#classroom').setAttribute('aria-pressed',classroom);};
  if($('#menu'))$('#menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');$('#menu').setAttribute('aria-expanded',open);};
  $('#clear-progress').onclick=()=>{practiced={};experimentStates.clear();save('seeing-practiced',{});save('seeing-last',null);if(course)location.hash='home';else render(true);};
  if(keepScroll)window.scrollTo(0,scrollY);else if(location.hash==='#introduction')$('#introduction')?.scrollIntoView();else window.scrollTo(0,0);
}
window.addEventListener('hashchange',()=>render());
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    document.body.classList.remove('menu-open');$('#menu')?.setAttribute('aria-expanded','false');
    if($('.experiment-card.enlarged'))$('#enlarge').click();
  }
  if(!classroom||/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName))return;
  if(event.key==='ArrowRight'){event.preventDefault();$('#next-step')?.click();}
  if(event.key==='ArrowLeft'){event.preventDefault();$('#previous-step')?.click();}
});
// The local D3 bundle has no network dependency. Defer until its script is ready.
if(window.d3)render();else window.addEventListener('load',render,{once:true});
