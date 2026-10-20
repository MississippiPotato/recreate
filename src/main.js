import {curriculum,allSections,figures,B} from './course-data.js';
import {codeLabs,programSource} from './code-labs.js';
import {mountInteractive} from './interactive.js';
import {mountIntro} from './intro.js';
import {mountClinic} from './clinic.js';

const app=document.querySelector('#app');
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const requested=new URLSearchParams(location.search).get('lang');
let lang=requested==='en'?'en':requested==='zh'?'zh':read('seeing-language','zh');if(!['zh','en'].includes(lang))lang='zh';
let active=null,last=null,searchOpen=false,zoom=read('course-text-size',false);
const snapshots=new Map(),syntaxValues=new Map();
const L=(zh,en)=>lang==='zh'?zh:en,T=value=>typeof value==='string'?value:value?.[lang]??value?.zh??'';
const link=(section,tab='explain')=>`#ch-${section.id.replace('.','-')}${tab==='explain'?'':'/'+tab}`;
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const icon=kind=>({explain:'<path d="M4 5h6l2 2 2-2h6v14h-6l-2 2-2-2H4zM12 7v14"/>',code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',demo:'<path d="m7 4 13 8-13 8z"/>'}[kind]);
function route(){
  const hash=location.hash.slice(1),match=hash.match(/^ch-([1-5])-([1-8])(?:\/(explain|code|demo|step-[1-4]))?$/);
  const id=Number(match?.[1]||hash.match(/^lesson-(\d)$/)?.[1]||(!hash&&location.pathname.match(/lesson-0([1-5])\//)?.[1])||0);
  const course=curriculum.find(c=>c.id===id),section=course?.sections.find(s=>s.id===`${id}.${match?.[2]}`)||course?.sections[0];
  const tab=['code','demo'].includes(match?.[3])?match[3]:match?.[3]==='step-2'?'demo':'explain';
  return {course,section,tab,page:hash};
}
function header(course){
  return `<header class="course-header"><a href="#home" class="site-brand" aria-label="${L('可视化导论，课程首页','Visualization, course home')}"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M7 27 15 10l14 11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="7" cy="27" r="4"/><circle cx="15" cy="10" r="5" fill="#ec855a"/><circle cx="29" cy="21" r="4"/></svg><strong>${L('可视化导论','Visualization')}</strong><span>D3 / COURSE</span></a><nav class="global-nav" aria-label="${L('课程导航','Course navigation')}">${curriculum.map((c,i)=>`<a href="#lesson-${c.id}" ${course?.id===c.id?'aria-current="page"':''}><small>0${c.id}</small>${L(['数据','流程','色彩','低维','时序'][i],['Data','Pipeline','Color','Space','Time'][i])}</a>`).join('')}</nav><div class="header-tools"><button id="search-open" aria-label="${L('搜索课程','Search course')}"><span>⌕</span><i>${L('搜索','Search')}</i><kbd>Ctrl K</kbd></button><button id="text-size" aria-pressed="${zoom}" aria-label="${L('增大正文字号','Increase text size')}">A<span>+</span></button><button id="language">${L('EN','中文')}</button>${course?`<button id="mobile-menu" aria-expanded="false" aria-controls="course-sidebar">☰ <span class="sr-only">${L('课程目录','Contents')}</span></button>`:''}</div></header>`;
}
function footer(){return `<footer class="course-footer"><strong>${L('可视化导论','Introduction to visualization')}</strong><p>${L('基于李昕老师的 JavaScript + D3.js 课程重构','Rebuilt from Li Xin’s JavaScript + D3.js course')}</p><div><a href="https://cinger007.github.io/vis/" target="_blank" rel="noreferrer">${L('原课程','Original course')} ↗</a><a href="https://github.com/MississippiPotato/recreate" target="_blank" rel="noreferrer">GitHub ↗</a><a href="#clinic">${L('补充案例','Additional examples')} ↗</a></div></footer>`;}
function sidebar(course,section){
  const handout=new URL(`../assets/handouts/lesson-0${course.id}.${lang}.md`,import.meta.url).href;
  return `<aside id="course-sidebar" class="course-sidebar" aria-label="${L('章节目录','Lesson contents')}"><a class="sidebar-back" href="#home">← ${L('课程首页','Course home')}</a><p class="sidebar-label">${L('课程目录','CONTENTS')}</p>${curriculum.map(c=>`<details ${c.id===course.id?'open':''}><summary><span>0${c.id}</span><strong>${T(c.title)}</strong><i>⌄</i></summary><nav aria-label="${T(c.title)}">${c.sections.map(s=>`<a href="${link(s)}" ${section.id===s.id?'aria-current="page"':''}><span>${s.id}</span>${T(s.title)}</a>`).join('')}</nav></details>`).join('')}<div class="sidebar-bottom"><a href="${handout}" download>${L('下载本章讲义','Download lesson notes')} ↓</a><a href="#clinic">${L('补充案例：图表诊断','Examples: chart diagnostics')} ↗</a><a href="https://cinger007.github.io/vis/" target="_blank" rel="noreferrer">${L('老师的原课程','Original course')} ↗</a><span>JavaScript · D3.js 7</span></div></aside><button class="sidebar-shade" aria-label="${L('关闭目录','Close contents')}" tabindex="-1"></button>`;
}
function drawGlyph(id){
  const a=['#3293b5','#ef895c','#75aca2','#b0cbd5','#e5b962'];
  const drawings=[
    Array.from({length:32},(_,i)=>`<circle cx="${20+i%8*24}" cy="${22+Math.floor(i/8)*24}" r="${4+i%3}" fill="${a[i%5]}"/>`).join(''),
    '<path d="M20 62h65m0 0V27h105m-105 35v35h105" fill="none" stroke="currentColor" stroke-width="2"/>'+[[20,62],[85,62],[190,27],[190,97]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="10" fill="currentColor"/>`).join(''),
    a.map((c,i)=>`<rect x="${15+i*40}" y="20" width="33" height="85" rx="16" fill="${c}"/>`).join(''),
    '<path d="M15 102V18m0 84h202M20 92c28 0 23-70 56-55s27 75 63 29 53-40 76-35" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="76" cy="37" r="5" fill="#ef895c"/><circle cx="139" cy="66" r="5" fill="#ef895c"/>',
    Array.from({length:42},(_,i)=>`<rect x="${16+Math.floor(i/7)*33}" y="${15+i%7*14}" width="27" height="10" rx="2" fill="${a[i%5]}" opacity="${.35+i%4*.2}"/>`).join('')
  ];return `<svg viewBox="0 0 230 125" aria-hidden="true">${drawings[id-1]}</svg>`;
}
function home(){
  app.innerHTML=header(null)+`<main id="main" class="portal"><section class="portal-hero"><div class="hero-mesh" aria-hidden="true"></div><div class="portal-copy"><p class="overline">VISUALIZATION · INTRODUCTION</p><h1>${L('可视化导论','Introduction to<br>visualization')}</h1><p class="portal-subtitle">${L('从数据到图表：<br>JavaScript + D3.js 实战课程','From data to charts:<br>a JavaScript + D3.js course')}</p><p class="portal-description">${L('数据、流程、色彩、低维与时序。<br>五个章节，结合讲解、关键代码与交互演示。','Data, pipelines, color, space and time.<br>Five lessons with explanations, annotated code and interactive demonstrations.')}</p><a class="primary" href="#lesson-1">${L('进入第一章','Start lesson one')} ${arrow}</a><a class="portal-secondary" href="#path">${L('查看课程目录','Browse lessons')} ↓</a><div class="portal-meta"><span>05 <small>${L('章节','LESSONS')}</small></span><span>27 <small>${L('小节','SECTIONS')}</small></span><span>中文 / EN</span></div></div><div class="portal-art"><span class="art-label">DATA → VISUALIZATION</span><canvas id="intro-canvas" role="img" aria-label="${L('粒子组成 D3、树、色轮、曲线与日历','Particles forming D3, a tree, a color wheel, a curve and a calendar')}"></canvas><div class="particle-scenes" role="group" aria-label="${L('切换粒子图形','Choose particle artwork')}">${curriculum.map((c,i)=>`<button data-scene="${i}" aria-pressed="${i===0}"><small>0${i+1}</small>${L(['数据','流程','色彩','低维','时序'][i],['Data','Pipeline','Color','Space','Time'][i])}</button>`).join('')}</div></div></section><section id="path" class="portal-lessons"><header><div><p class="overline">COURSE CONTENTS</p><h2>${L('课程章节','Course contents')}</h2></div><p>${L('按章节学习，也可以直接查找某个概念或 D3 语法。','Follow the sequence, or look up a concept or D3 API.')}</p></header><div class="lesson-grid">${curriculum.map(c=>`<a href="#lesson-${c.id}" class="portal-lesson lesson-art-${c.id}" data-course-card="${c.id-1}"><div class="lesson-art"><span>0${c.id}</span>${drawGlyph(c.id)}<b>↗</b></div><div class="portal-lesson-copy"><p>${L('第','LESSON ')} ${c.id} ${L('章','')} · ${c.sections.length} ${L('节','sections')}</p><h3>${T(c.title)}</h3><span>${T(c.summary)}</span><div>${c.sections.slice(0,3).map(s=>T(s.title)).join(' / ')}</div></div></a>`).join('')}<a href="#clinic" class="portal-extra"><span>＋</span><h3>${L('补充案例','Additional examples')}</h3><p>${L('坐标截断、颜色暗示、缺失值。<br>比较同一份数据的不同表达。','Truncated axes, implied rankings and missing values.<br>Compare representations of the same data.')}</p>${arrow}</a></div></section></main>`+footer();
  const canvas=document.querySelector('#intro-canvas');
  const cleanup=mountIntro(canvas,index=>document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.scene)===index)));
  document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>canvas.selectScene?.(Number(b.dataset.scene)));
  document.querySelectorAll('[data-course-card]').forEach(a=>a.onpointerenter=()=>canvas.selectScene?.(Number(a.dataset.courseCard)));
  active={cleanup};
  if(location.hash==='#path')document.querySelector('#path').scrollIntoView({behavior:'instant'});
}
function figureGallery(section){
  if(!section.figures?.length)return '';
  return `<section class="figure-gallery" aria-label="${L('原课程图示','Original course figures')}"><div class="figure-toolbar"><span>${L('原课程图示','ORIGINAL COURSE FIGURES')}</span><button id="enlarge-figure">${L('放大原图','Enlarge figure')} ⤢</button></div><div class="figure-tabs">${section.figures.map((id,i)=>`<button data-figure="${id}" aria-pressed="${i===0}">${i+1}. ${T(figures[id].caption).split('：').at(-1).split(':').at(-1).slice(0,30)}</button>`).join('')}</div><figure id="course-figure"><img src="${new URL('../assets/figures/'+figures[section.figures[0]].file,import.meta.url).href}" alt="${T(figures[section.figures[0]].caption)}" loading="lazy"><figcaption>${T(figures[section.figures[0]].caption)}</figcaption></figure></section>`;
}
function conceptDiagram(section){
  const labels=section.id==='1.2'?L(['数据','信息','知识','决策'],['Data','Information','Knowledge','Decision']):section.id==='2.1'?L(['原始数据','数据表','视觉结构','视图'],['Raw data','Data table','Visual structure','View']):section.id==='1.5'?['selectAll','data(key)','join','attr / on']:section.id.startsWith('3.')?L(['数据含义','色彩空间','颜色映射','图例检验'],['Semantics','Color space','Color mapping','Legend check']):section.id.startsWith('5.')?L(['时间字段','采样间隔','布局映射','趋势 / 周期'],['Time field','Sampling','Layout','Trend / cycle']):section.id.startsWith('4.')?L(['原始数值','数据变换','比例尺','屏幕图形'],['Raw values','Transformation','Scale','Screen view']):L(['原始记录','字段与含义','变换与映射','图形'],['Records','Fields and meaning','Transform / map','View']);
  return `<div class="concept-chain" aria-label="${L('概念联系','Concept relationships')}">${labels.map((label,i)=>`<span><small>0${i+1}</small>${label}</span>${i<labels.length-1?'<i>→</i>':''}`).join('')}</div>`;
}
function explain(section){
  return `<div class="explanation-content"><p class="section-opening">${T(section.intro)}</p>${conceptDiagram(section)}<div class="theory-blocks">${section.points.map((p,i)=>`<section class="theory-block" id="concept-${i}"><span class="theory-number">0${i+1}</span><div><h2>${T(p.title)}</h2><p>${T(p.text)}</p></div></section>`).join('')}</div>${figureGallery(section)}<section class="observation" id="observation"><span>${L('演示观察','IN THE DEMONSTRATION')}</span><p>${T(section.watch)}</p><a href="${link(section,'demo')}">${L('打开本节演示','Open this demonstration')} ${arrow}</a></section><details class="discussion"><summary>${L('思考：','Discuss: ')}${T(section.transfer)}</summary><p>${T(section.reason)}</p></details></div>`;
}
function lesson(course,section,tab){
  const index=allSections.findIndex(s=>s.id===section.id);
  const tabs=[['explain',L('讲解','Explanation')],['code',L('关键代码','Key code')],['demo',L('演示','Demonstration')]];
  app.innerHTML=header(course)+sidebar(course,section)+`<main id="main" class="course-main"><div class="reading-layout"><article class="course-article"><div class="lesson-breadcrumb"><a href="#home">${L('课程首页','Course home')}</a><span>›</span><a href="#lesson-${course.id}">${T(course.title)}</a><span>› ${section.id}</span></div><header class="article-heading"><p class="overline">LESSON 0${course.id} / ${course.word}</p><h1><span>${section.id}</span>${T(section.title)}</h1><p>${T(section.intro)}</p></header><nav class="section-tabs" role="tablist" aria-label="${T(section.title)}">${tabs.map(([id,name])=>`<a href="${link(section,id)}" id="tab-${id}" role="tab" aria-selected="${tab===id}" aria-controls="panel-${id}" tabindex="${tab===id?0:-1}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${icon(id)}</svg>${name}</a>`).join('')}<button id="demo-fullscreen" title="${L('放大演示区','Enlarge demonstration')}" ${tab!=='demo'?'hidden':''}>⤢ <span>${L('放大','Enlarge')}</span></button></nav><section class="tab-content" id="panel-${tab}" role="tabpanel" aria-labelledby="tab-${tab}">${tab==='explain'?explain(section):tab==='code'?codePanel(section):demoPanel(section)}</section><nav class="section-pagination" aria-label="${L('前后小节','Adjacent sections')}"><a href="${index?link(allSections[index-1]):'#home'}"><small>← ${L('上一节','Previous')}</small><strong>${index?T(allSections[index-1].title):L('课程首页','Course home')}</strong></a><a href="${index<allSections.length-1?link(allSections[index+1]):'#clinic'}"><small>${L('下一节','Next')} →</small><strong>${index<allSections.length-1?T(allSections[index+1].title):L('补充案例','Additional examples')}</strong></a></nav><p class="section-credit"><a href="https://cinger007.github.io/vis/lesson-0${course.id}/#ch-${section.id.replace('.','-')}" target="_blank" rel="noreferrer">${L('查看原课程本节','Original course section')} ↗</a><span>JavaScript · D3.js</span></p></article><aside class="page-outline"><span>${L('本节内容','ON THIS PAGE')}</span>${(tab==='explain'?section.points.map((p,i)=>[`#concept-${i}`,T(p.title)]):tab==='code'?[['#syntax-source',L('示例代码','Example code')],['#syntax-notes',L('语法说明','Syntax notes')],['#syntax-preview',L('运行结果','Running result')]]:[['#demo-workspace',L('交互演示','Interactive demonstration')],['#demo-observe',L('观察要点','What to observe')]]).map(([url,label])=>`<a href="${url}" data-scroll="${url}">${label}</a>`).join('')}</aside></div></main>`;
  document.querySelectorAll('[data-scroll]').forEach(a=>a.onclick=e=>{e.preventDefault();document.querySelector(a.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});});
  if(tab==='demo'){
    const experiment=mountInteractive(document.querySelector('#demo-workspace'),section,lang,snapshots.get(section.id));
    active={experiment,cleanup:experiment.cleanup};
    document.querySelector('#demo-fullscreen').onclick=()=>{const expanded=document.body.classList.toggle('demo-expanded');document.querySelector('#demo-fullscreen').setAttribute('aria-pressed',expanded);document.querySelector('#demo-fullscreen').innerHTML=expanded?'⤡ '+L('还原','Restore'):'⤢ '+L('放大','Enlarge');};
  }else if(tab==='code')mountCode(section);else bindFigures(section);
  document.querySelectorAll('[role="tab"]').forEach((a,i)=>a.onkeydown=e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const target=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;location.hash=link(section,tabs[target][0]);}});
  save('course-last-section',link(section,tab));
}
function codePanel(section){
  const lab=codeLabs[section.api];
  return `<div class="code-intro"><span>JavaScript / D3.js 7</span><h2>${T(lab.title)}</h2><p>${L('下面的代码会在本页运行。SVG 由页面提供；参数 n 来自滑块。修改参数后运行，比较代码与结果。','This code runs on this page. The page supplies the SVG; the slider supplies n. Change n, run, and compare source with output.')}</p></div><section id="syntax-source" class="syntax-source"><div class="code-toolbar"><span>${section.api}.js</span><label><input id="show-comments" type="checkbox" checked> ${L('显示注释','Show comments')}</label><button id="copy-code">${L('复制代码','Copy code')}</button></div><pre class="annotated-code" tabindex="0" aria-label="${L('带注释的示例代码','Annotated example code')}"><code id="syntax-code"></code></pre></section><section class="syntax-notes" id="syntax-notes"><h2>${L('语法说明','Reading the syntax')}</h2><div>${lab.notes.map((note,i)=>`<button data-code-note="${i}"><code>${esc(note.term)}</code><span>${T(note.text)}</span></button>`).join('')}</div></section><section id="syntax-preview" class="syntax-preview"><div class="syntax-preview-heading"><h2>${L('运行结果','Running result')}</h2><span>${L('与上方代码共用同一个函数','THE FUNCTION ABOVE IS EXECUTED HERE')}</span></div><div class="syntax-controls"><label><span>${T(lab.control)} <output id="syntax-value">${syntaxValues.get(section.id)??lab.value}</output></span><input id="syntax-parameter" type="range" min="${lab.min}" max="${lab.max}" value="${syntaxValues.get(section.id)??lab.value}" aria-label="${T(lab.control)}"></label><button class="primary" id="run-syntax">${L('运行示例','Run example')} ${arrow}</button><span id="syntax-status" role="status"></span></div><div id="syntax-canvas"></div><details class="syntax-output" open><summary>${L('返回值','Return value')}</summary><pre id="syntax-result"></pre></details></section><div class="code-links"><a href="${lab.docs}" target="_blank" rel="noreferrer">${L('D3 官方文档','D3 documentation')} ↗</a><a href="${link(section,'demo')}">${L('查看完整演示','Open the full demonstration')} ${arrow}</a><a href="https://github.com/MississippiPotato/recreate/blob/main/src/interactive.js" target="_blank" rel="noreferrer">${L('完整演示源码','Full demonstration source')} ↗</a></div>`;
}
function highlight(line){
  const pattern=/\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|return|function|async|await|if|else|new|true|false|null|undefined|typeof)\b|\b\d+(?:\.\d+)?\b/g;
  let cursor=0,result='';for(const m of line.matchAll(pattern)){result+=esc(line.slice(cursor,m.index));const token=m[0],kind=token.startsWith('//')?'comment':/^["'`]/.test(token)?'string':/^\d/.test(token)?'number':'keyword';result+=`<span class="token-${kind}">${esc(token)}</span>`;cursor=m.index+token.length;}return result+esc(line.slice(cursor));
}
function mountCode(section){
  const lab=codeLabs[section.api],target=document.querySelector('#syntax-code');let disposed=false,running=0;
  function paintCode(){const comments=document.querySelector('#show-comments').checked,source=programSource(lab,lang);target.innerHTML=source.split('\n').filter(line=>comments||!line.trim().startsWith('//')).map((line,i)=>`<span class="code-line"><b aria-hidden="true">${i+1}</b><span>${highlight(line)}</span></span>`).join('');}
  paintCode();document.querySelector('#show-comments').onchange=paintCode;
  document.querySelectorAll('[data-code-note]').forEach(b=>b.onclick=()=>{const note=lab.notes[Number(b.dataset.codeNote)],token=note.term.match(/[a-zA-Z_$][\w$]*(?:\.[\w$]+)?/)?.[0];document.querySelectorAll('.code-line').forEach(line=>line.classList.toggle('highlighted',!!token&&line.textContent.includes(token)));});
  const svg=window.d3.select('#syntax-canvas').append('svg').attr('viewBox','0 0 600 210').attr('role','img').attr('aria-label',T(lab.title));
  async function run(){
    const ticket=++running,n=Number(document.querySelector('#syntax-parameter').value);syntaxValues.set(section.id,n);
    const status=document.querySelector('#syntax-status'),result=document.querySelector('#syntax-result'),runButton=document.querySelector('#run-syntax');status.textContent=L('运行中…','Running…');status.dataset.ok='';runButton.disabled=true;
    if(!lab.persistent)svg.selectAll('*').remove();
    try{const value=await lab.run({svg,d3:window.d3,n,L});if(disposed||ticket!==running)return;result.textContent=typeof value==='string'?value:JSON.stringify(value,null,2);status.textContent=L('已运行','Executed');status.dataset.ok='true';}catch(error){if(disposed)return;result.textContent=error.message;status.textContent=L('运行失败','Run failed');status.dataset.ok='false';}finally{if(!disposed&&ticket===running)runButton.disabled=false;}
  }
  document.querySelector('#syntax-parameter').oninput=e=>{document.querySelector('#syntax-value').textContent=e.target.value;};document.querySelector('#run-syntax').onclick=run;
  document.querySelector('#copy-code').onclick=async()=>{const button=document.querySelector('#copy-code');try{await navigator.clipboard.writeText(programSource(lab,lang));button.textContent=L('已复制','Copied');}catch{button.textContent=L('请选择代码复制','Select code to copy');}};
  active={cleanup(){disposed=true;svg.selectAll('*').interrupt();}};run();
}
function demoPanel(section){return `<div class="demo-intro"><h2>${L('交互演示','Interactive demonstration')}</h2><p>${T(section.watch)}</p></div><div id="demo-workspace" class="demo-workspace"></div><section id="demo-observe" class="demo-observe"><h2>${L('观察要点','What to observe')}</h2><p>${T(section.points.at(-1).text)}</p><a href="${link(section,'code')}">${L('对照本节关键代码','See the key code')} ${arrow}</a></section><p class="data-note">${L('学生、气温、场与事件使用教学构造数据。示例用于控制变量和说明方法，不作为现实统计结论。','Student, temperature, field and event examples use constructed teaching data for controlled comparisons, not real-world statistical claims.')}</p>`;}
function bindFigures(section){
  if(!section.figures?.length)return;
  document.querySelectorAll('[data-figure]').forEach(b=>b.onclick=()=>{const f=figures[b.dataset.figure];document.querySelectorAll('[data-figure]').forEach(x=>x.setAttribute('aria-pressed',x===b));const image=document.querySelector('#course-figure img');image.src=new URL('../assets/figures/'+f.file,import.meta.url).href;image.alt=T(f.caption);document.querySelector('#course-figure figcaption').textContent=T(f.caption);});
  document.querySelector('#enlarge-figure').onclick=()=>{const image=document.querySelector('#course-figure img');const dialog=document.createElement('dialog');dialog.className='image-dialog';dialog.innerHTML=`<button aria-label="${L('关闭原图','Close figure')}">×</button><img src="${image.src}" alt="${esc(image.alt)}"><p>${esc(image.alt)}</p>`;document.body.append(dialog);dialog.showModal();dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclose=()=>{dialog.remove();document.querySelector('#enlarge-figure')?.focus();};dialog.onclick=e=>{if(e.target===dialog)dialog.close();};};
}
function searchDialog(){
  if(searchOpen)return;searchOpen=true;
  const dialog=document.createElement('dialog');dialog.className='search-dialog';dialog.innerHTML=`<div><span>⌕</span><input type="search" id="course-search" aria-label="${L('搜索概念或语法','Search concepts or syntax')}" placeholder="${L('搜索章节、概念或 D3 API…','Search lessons, concepts or D3 APIs…')}"><button aria-label="${L('关闭搜索','Close search')}">Esc</button></div><nav id="search-results"></nav>`;document.body.append(dialog);
  const input=dialog.querySelector('input'),results=dialog.querySelector('nav');
  function list(){const q=input.value.trim().toLowerCase();const found=allSections.filter(s=>(s.id+s.title.zh+s.title.en+s.intro.zh+s.intro.en+s.api+codeLabs[s.api].notes.map(n=>n.term).join(' ')).toLowerCase().includes(q));results.innerHTML=found.length?found.map(s=>`<a href="${link(s)}"><span>${s.id}</span><strong>${T(s.title)}</strong><small>${s.api}</small></a>`).join(''):`<p>${L('没有找到相关小节。','No matching section.')}</p>`;results.querySelectorAll('a').forEach(a=>a.onclick=()=>dialog.close());}
  input.oninput=list;dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclose=()=>{searchOpen=false;dialog.remove();document.querySelector('#search-open')?.focus();};dialog.onclick=e=>{if(e.target===dialog)dialog.close();};list();dialog.showModal();input.focus();
}
function render(keepPosition=false){
  const position=window.scrollY,focusTab=document.activeElement?.getAttribute('role')==='tab';if(active?.experiment&&last)snapshots.set(last,active.experiment.getState());active?.cleanup?.();active=null;
  document.querySelectorAll('dialog').forEach(d=>d.close());
  document.body.classList.remove('demo-expanded','sidebar-open');document.body.classList.toggle('large-text',zoom);
  const {course,section,tab,page}=route();last=section?.id||null;document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=section?`${section.id} ${T(section.title)} · ${L('可视化导论','Visualization')}`:L('可视化导论 · JavaScript + D3.js','Visualization · JavaScript + D3.js');
  document.body.classList.toggle('is-course',!!course);
  if(course)lesson(course,section,tab);else if(page==='clinic'){
    app.innerHTML=header(null)+`<main id="main" class="additional-page"><p class="overline">ADDITIONAL EXAMPLES</p><h1>${L('图表诊断','Chart diagnostics')}</h1><p>${L('比较同一份数据的不同表达，找出坐标、颜色与缺失值带来的误读。','Compare representations of the same data and diagnose axes, color and missingness.')}</p><div id="clinic"></div></main>`+footer();active=mountClinic(document.querySelector('#clinic'),{L,arrow});
  }else home();
  document.querySelector('#language').onclick=()=>{lang=lang==='zh'?'en':'zh';save('seeing-language',lang);const url=new URL(location.href);url.searchParams.delete('lang');history.replaceState(null,'',url);render(true);};
  document.querySelector('#text-size').onclick=()=>{zoom=!zoom;save('course-text-size',zoom);document.body.classList.toggle('large-text',zoom);document.querySelector('#text-size').setAttribute('aria-pressed',zoom);};
  document.querySelector('#search-open').onclick=searchDialog;
  document.querySelector('.skip-link').onclick=event=>{event.preventDefault();const main=document.querySelector('#main');main.tabIndex=-1;main.focus({preventScroll:true});main.scrollIntoView({block:'start',behavior:'instant'});};
  if(document.querySelector('#mobile-menu')){document.querySelector('#mobile-menu').onclick=()=>{const open=document.body.classList.toggle('sidebar-open');document.querySelector('#mobile-menu').setAttribute('aria-expanded',open);};document.querySelector('.sidebar-shade').onclick=()=>{document.body.classList.remove('sidebar-open');document.querySelector('#mobile-menu').setAttribute('aria-expanded',false);};}
  if(keepPosition)window.scrollTo({top:position,behavior:'instant'});else if(page!=='path')window.scrollTo({top:0,behavior:'instant'});
  if(course&&focusTab)document.querySelector('#tab-'+tab)?.focus({preventScroll:true});
}
window.addEventListener('hashchange',()=>render());
window.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();searchDialog();}
  if(event.key==='Escape'){document.body.classList.remove('demo-expanded','sidebar-open');const b=document.querySelector('#demo-fullscreen');if(b)b.innerHTML='⤢ '+L('放大','Enlarge');document.querySelector('#mobile-menu')?.setAttribute('aria-expanded',false);}
});
if(window.d3)render();else window.addEventListener('load',()=>render(),{once:true});
