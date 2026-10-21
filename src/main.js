import {curriculum,figures} from './course-data.js';
import {codeLabs,programSource} from './code-labs.js';
import {renderReading,readingOutline} from './reading-notes.js';
import {codeGuide,guideSource} from './code-guide.js';
import {mountInteractive} from './interactive.js';
import {mountJourney} from './data-journey.js';
import {mountStudio} from './learning-studio.js';
import {lessonSteps} from './lesson-steps.js';
import {mountClinic} from './clinic.js';
import {readCourseRoute,readPanelState,writePanelState,sectionHash,sectionKey,localId,panelTypes} from './course-navigation.js';
import {buildSearchIndex,searchCourse,searchExcerpt} from './course-search.js';

const app=document.querySelector('#app');
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const requested=new URLSearchParams(location.search).get('lang');
let lang=requested==='en'?'en':requested==='zh'?'zh':read('seeing-language','zh');if(!['zh','en'].includes(lang))lang='zh';
let active=null,last=null,searchOpen=false,zoom=read('course-text-size',false);
let currentCourse=null,currentLanguage=lang,observer=null,focusedSection=null,scrollFrame=0,searchIndex=null;
const controllers=new Map(),sectionTabs=new Map(),codeSettings=new Map();
const snapshots=new Map(),syntaxValues=new Map();
const L=(zh,en)=>lang==='zh'?zh:en,T=value=>typeof value==='string'?value:value?.[lang]??value?.zh??'';
const link=sectionHash;
const find=(root,id)=>root.querySelector(`[data-local-id="${id}"]`);
function scopedMarkup(html,section,tab){return html.replace(/\sid="([^"]+)"/g,(_,id)=>` id="${localId(section.id,tab,id)}" data-local-id="${id}"`);}
function bindModalEscape(dialog){
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}});
  dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
}
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const icon=kind=>({explain:'<path d="M4 5h6l2 2 2-2h6v14h-6l-2 2-2-2H4zM12 7v14"/>',code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',demo:'<path d="m7 4 13 8-13 8z"/>'}[kind]);
function route(){
  return readCourseRoute(new URL(location.href),curriculum);
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
  app.innerHTML=header(null)+`<main id="main" class="portal"><section class="portal-hero"><div class="hero-mesh" aria-hidden="true"></div><div class="portal-copy"><p class="overline">VISUALIZATION · INTRODUCTION</p><h1>${L('可视化导论','Introduction to<br>visualization')}</h1><p class="portal-subtitle">${L('从数据到图表：<br>JavaScript + D3.js 实战课程','From data to charts:<br>a JavaScript + D3.js course')}</p><p class="portal-description">${L('数据、流程、色彩、低维与时序。<br>五个章节，结合讲解、关键代码与交互演示。','Data, pipelines, color, space and time.<br>Five lessons with explanations, annotated code and interactive demonstrations.')}</p><a class="primary" href="#lesson-1">${L('进入第一章','Start lesson one')} ${arrow}</a><a class="portal-secondary" href="#path">${L('查看课程目录','Browse lessons')} ↓</a><div class="portal-meta"><span>05 <small>${L('章节','LESSONS')}</small></span><span>27 <small>${L('小节','SECTIONS')}</small></span><span>中文 / EN</span></div></div><div class="portal-art" id="data-journey"></div></section><section id="path" class="portal-lessons"><header><div><p class="overline">COURSE CONTENTS</p><h2>${L('课程章节','Course contents')}</h2></div><p>${L('按章节学习，也可以直接查找某个概念或 D3 语法。','Follow the sequence, or look up a concept or D3 API.')}</p></header><div class="lesson-grid">${curriculum.map(c=>`<a href="#lesson-${c.id}" class="portal-lesson lesson-art-${c.id}" data-course-card="${c.id-1}"><div class="lesson-art"><span>0${c.id}</span>${drawGlyph(c.id)}<b>↗</b></div><div class="portal-lesson-copy"><p>${L('第','LESSON ')} ${c.id} ${L('章','')} · ${c.sections.length} ${L('节','sections')}</p><h3>${T(c.title)}</h3><span>${T(c.summary)}</span><div>${c.sections.slice(0,3).map(s=>T(s.title)).join(' / ')}</div></div></a>`).join('')}<a href="#clinic" class="portal-extra"><span>＋</span><h3>${L('补充案例','Additional examples')}</h3><p>${L('坐标截断、颜色暗示、缺失值。<br>比较同一份数据的不同表达。','Truncated axes, implied rankings and missing values.<br>Compare representations of the same data.')}</p>${arrow}</a></div></section></main>`+footer();
  const journey=mountJourney(document.querySelector('#data-journey'),lang);
  active={cleanup:journey.cleanup};
  if(location.hash==='#path')document.querySelector('#path').scrollIntoView({behavior:'instant'});
}
function figureGallery(section){
  if(!section.figures?.length)return '';
  return `<section class="figure-gallery" aria-label="${L('原课程图示','Original course figures')}"><div class="figure-toolbar"><span>${L('原课程图示','ORIGINAL COURSE FIGURES')}</span><button id="enlarge-figure">${L('放大原图','Enlarge figure')} ⤢</button></div><div class="figure-tabs">${section.figures.map((id,i)=>`<button data-figure="${id}" aria-pressed="${i===0}">${i+1}. ${T(figures[id].caption).split('：').at(-1).split(':').at(-1).slice(0,30)}</button>`).join('')}</div><figure id="course-figure"><img src="${new URL('../assets/figures/'+figures[section.figures[0]].file,import.meta.url).href}" alt="${T(figures[section.figures[0]].caption)}" loading="lazy"><figcaption>${T(figures[section.figures[0]].caption)}</figcaption></figure></section>`;
}
function explain(section){
  let reading=renderReading(section.id,lang),gallery=figureGallery(section);
  const before=section.id==='2.3'?'reading-1':section.id==='4.5'?'reading-2':null;
  if(before){reading=reading.replace(`<h2 id="${before}">`,gallery+`<h2 id="${before}">`);gallery='';}
  return `<div class="explanation-content"><div class="course-reading">${reading}</div>${gallery}<section class="observation" id="observation"><span>${L('配套演示','DEMONSTRATION')}</span><p>${T(section.watch)}</p><a href="${link(section,'demo')}">${L('定位右侧画布','Locate the graphic')} ${arrow}</a></section></div>`;
}
function lesson(course,section,tab){
  const clinicSection={1:'1.3',2:'2.2',3:'3.8',4:'4.4',5:'5.2'}[course.id];
  app.innerHTML=header(course)+sidebar(course,section)+`<main id="main" class="course-main studio-course"><div class="reading-layout"><div class="course-article"><header class="chapter-intro"><div class="chapter-title"><p class="overline">LESSON 0${course.id} · ${course.word}</p><h1>${T(course.title)}</h1><p>${T(course.summary)}</p></div><div class="chapter-drawing" aria-hidden="true">${drawGlyph(course.id)}</div></header><details class="chapter-guide"><summary>${L('本章目录','Lesson contents')} · ${course.sections.length} ${L('小节','sections')}</summary><nav class="chapter-map">${course.sections.map(s=>`<a href="${link(s)}"><span>${s.id}</span>${T(s.title)}</a>`).join('')}</nav></details><div class="chapter-sections">${course.sections.map(s=>`<article class="course-section studio-section" id="${sectionKey(s.id)}" data-section="${s.id}" aria-labelledby="heading-${sectionKey(s.id)}"><header class="section-heading"><span class="section-number">${s.id}</span><div><p>${lang==='zh'?s.title.en:s.title.zh}</p><h2 id="heading-${sectionKey(s.id)}" tabindex="-1">${T(s.title)}</h2></div><button class="section-fullscreen-button" data-fullscreen aria-pressed="false" aria-label="${L('全屏展示小节','Show section in fullscreen')} ${s.id}"><span>${L('全屏','Fullscreen')}</span> ⤢</button></header><div class="studio-grid"><div class="studio-reading-pane"><nav class="reading-tools" aria-label="${L('阅读定位','Reading navigation')}"><a href="${link(s)}">${L('讲解','Explanation')}</a><a href="${link(s,'code')}">${L('关键代码','Key code')} <small>${codeGuide[s.id].length}</small></a><span>${L('讲解与图形同屏','Read alongside the graphic')}</span></nav><section data-panel="explain" id="${localId(s.id,'explain','panel')}">${scopedMarkup(explain(s),s,'explain')}</section><details class="code-fold" data-panel="code" id="${localId(s.id,'code','panel')}"><summary><span>〈/〉</span>${L('关键代码与关键点解释','Key code and explanations')}<small>${codeGuide[s.id].length} ${L('段','snippets')}</small></summary><div class="code-panel-inner">${scopedMarkup(codePanel(s),s,'code')}</div></details></div><aside class="studio-canvas-pane" data-panel="demo" id="${localId(s.id,'demo','panel')}" aria-label="${s.id} ${L('常驻交互画布','Persistent interactive canvas')}"><div class="studio-canvas-title"><span>${L('演示','DEMONSTRATION')}</span><a href="${link(s,'code')}" data-open-code>${L('对照代码','See code')} ↙</a></div><div class="demo-workspace" id="${localId(s.id,'demo','demo-workspace')}" data-local-id="demo-workspace"></div></aside></div>${s.id===clinicSection?`<details class="inline-clinic"><summary>${L('常见画法：比较与修复','Common mistakes: compare and repair')} <span>↗</span></summary><div class="chapter-clinic-mount"></div></details>`:''}<div class="section-foot"><a href="https://cinger007.github.io/vis/lesson-0${course.id}/#${sectionKey(s.id)}" target="_blank" rel="noreferrer">${L('原课程本节','Original section')} ↗</a><a href="#${sectionKey(s.id)}" data-section-top="${s.id}">${L('回到小节开头','Section top')} ↑</a></div></article>`).join('')}</div><nav class="section-pagination"><a href="${course.id>1?'#lesson-'+(course.id-1):'#home'}">← ${L('上一章','Previous lesson')}</a><a href="${course.id<5?'#lesson-'+(course.id+1):'#clinic'}">${L('下一章','Next lesson')} →</a></nav></div><aside class="page-outline"></aside></div></main>`;
  for(const s of course.sections){
    const root=document.getElementById(sectionKey(s.id));
    const controller={section:s,root,tab:null,mounted:new Map(),step:null};controllers.set(s.id,controller);
    setPanel(controller,sectionTabs.get(s.id)||'explain');
    root.querySelector('[data-fullscreen]').onclick=()=>focusedSection?exitSectionFullscreen():enterSectionFullscreen(controller);
    root.querySelector('[data-section-top]').onclick=event=>{event.preventDefault();jumpTo(s);};
    const fold=root.querySelector('.code-fold');fold.ontoggle=()=>{if(fold.open){mountSectionCode(controller);syncStudioCode(controller,controller.step);}};
    root.querySelectorAll('[data-code-sync]').forEach(button=>button.onclick=()=>{
      const index=Number(button.dataset.codeSync),steps=lessonSteps(s),match=steps.findIndex(step=>step.guide===index);
      controller.mounted.get('demo').setStep(match<0?Math.min(steps.length-1,index):match);
    });
    const clinic=root.querySelector('.inline-clinic');if(clinic)clinic.ontoggle=()=>{if(clinic.open&&!controller.clinic){controller.clinic=mountClinic(clinic.querySelector('.chapter-clinic-mount'),{L,arrow,initialCase:course.id===3?1:course.id===5?2:0});}};
  }
  updateOutline(section.id);
  const update=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(focusedSection)return;const list=[...controllers.values()],edge=document.querySelector('.course-header').offsetHeight+120,chosen=list.filter(item=>item.root.getBoundingClientRect().top<=edge).at(-1)||list[0];if(chosen)markCurrent(chosen.section.id);});};
  window.addEventListener('scroll',update,{passive:true});observer=new ResizeObserver(update);controllers.forEach(controller=>observer.observe(controller.root));
  active={cleanup(){window.removeEventListener('scroll',update);observer?.disconnect();if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;}};
}

function mountSectionCode(controller){
  if(controller.mounted.has('code'))return;
  controller.mounted.set('code',mountCode(controller.section,controller.root.querySelector('[data-panel=code]')));
}

function syncStudioCode(controller,step){
  if(!step)return;const changed=controller.step&&controller.step.phase!==step.phase;controller.step=step;
  if(changed){controller.root.querySelector('.code-fold').open=true;mountSectionCode(controller);}
  let pattern;try{pattern=new RegExp(step.terms,'i');}catch{pattern=new RegExp(step.terms.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');}
  controller.root.querySelectorAll('.code-walkthrough').forEach((block,i)=>{block.classList.toggle('code-step-active',i===step.guide);block.querySelectorAll('.code-line').forEach(line=>line.classList.toggle('highlighted',i===step.guide&&pattern.test(line.textContent)));});
  if(changed)controller.root.querySelector('.code-step-active')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
}

function setPanel(controller,tab){
  const {root,section}=controller,initial=!controller.mounted.has('demo');controller.tab=tab;sectionTabs.set(section.id,tab);
  if(!controller.mounted.has('explain')){bindFigures(section,root.querySelector('[data-panel=explain]'));controller.mounted.set('explain',{});}
  if(!controller.mounted.has('demo')){
    const host=find(root.querySelector('[data-panel=demo]'),'demo-workspace');
    controller.mounted.set('demo',mountStudio(host,section,lang,snapshots.get(section.id),step=>syncStudioCode(controller,step)));
  }
  if(tab==='code'||initial&&codeSettings.get(section.id)?.foldOpen){root.querySelector('.code-fold').open=true;mountSectionCode(controller);syncStudioCode(controller,controller.step);}
}

function selectPanel(section,tab){
  const controller=controllers.get(section.id);
  setPanel(controller,tab);markCurrent(section.id);updateOutline(section.id);
  const url=writePanelState(new URL(location.href),currentCourse,sectionTabs);url.hash=link(section,tab);
  history.pushState(null,'',url);save('course-last-section',link(section,tab));
  // A sticky tab bar must not disappear when a long explanation is replaced
  // by a shorter demonstration. Other sections are left untouched.
  jumpTo(section,'',tab);
  if(focusedSection)controller.root.scrollTo({top:0,behavior:'instant'});
}

function markCurrent(id){
  if(!controllers.has(id))return;
  document.querySelectorAll('.course-sidebar nav a').forEach(a=>{const selected=a.hash===link(controllers.get(id).section);if(selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  if(last!==id){last=id;updateOutline(id);}
  const section=controllers.get(id).section;document.title=`${T(currentCourse.title)} · ${id} ${T(section.title)} · ${L('可视化导论','Visualization')}`;
}

function updateOutline(id){
  const controller=controllers.get(id),outline=document.querySelector('.page-outline');if(!controller||!outline)return;
  const {section,tab}=controller;
  const items=tab==='explain'?readingOutline(id,lang).map(item=>[item.id,item.title]):tab==='code'?[...codeGuide[id].map((guide,i)=>['keycode-'+i,T(guide.title)]),['syntax-preview',L('运行示例','Run example')]]:[['demo-workspace',L('交互演示','Interactive demonstration')]];
  outline.innerHTML=`<span>${L('当前小节','CURRENT SECTION')}</span><strong>${id} ${T(section.title)}</strong>${items.map(([anchor,title])=>`<a href="${link(section,tab,anchor)}">${title}</a>`).join('')}`;
}

function jumpTo(section,anchor='',tab=sectionTabs.get(section.id)||'explain'){
  const controller=controllers.get(section.id);if(!controller)return;
  if(tab==='code'&&anchor?.startsWith('keycode-')){
    const index=Number(anchor.slice(8)),steps=lessonSteps(section),match=steps.findIndex(step=>step.guide===index),phase=match<0?Math.min(steps.length-1,index):match;
    if(controller.step?.phase!==phase)controller.mounted.get('demo').setStep(phase);
  }
  const target=anchor?find(controller.root.querySelector(`[data-panel="${tab}"]`),anchor):tab==='code'?controller.root.querySelector('.code-fold'):tab==='demo'?controller.root.querySelector('[data-panel=demo]'):controller.root;
  (target||controller.root).scrollIntoView({block:'start',behavior:'instant'});markCurrent(section.id);updateOutline(section.id);
  if(anchor&&target){target.classList.remove('search-hit');void target.offsetWidth;target.classList.add('search-hit');target.tabIndex=target.tabIndex<0?-1:target.tabIndex;target.focus({preventScroll:true});}
}

async function enterSectionFullscreen(controller){
  const inert=[];let node=controller.root;
  while(node.parentElement){for(const sibling of node.parentElement.children)if(sibling!==node&&!sibling.inert){sibling.inert=true;inert.push(sibling);}node=node.parentElement;if(node===document.body)break;}
  focusedSection={controller,scroll:window.scrollY,trigger:document.activeElement,inert};
  document.body.classList.add('section-fullscreen');controller.root.classList.add('section-focused');
  const button=controller.root.querySelector('[data-fullscreen]');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',L('退出小节全屏','Exit section fullscreen'));button.querySelector('span').textContent=L('退出全屏','Exit fullscreen');
  controller.root.scrollTop=0;button.focus({preventScroll:true});
  if(controller.root.requestFullscreen){try{await controller.root.requestFullscreen();}catch{/* The in-page expanded view remains available. */}}
}

function restoreSectionFullscreen(){
  if(!focusedSection)return;const {controller,scroll,trigger,inert}=focusedSection;focusedSection=null;
  inert.forEach(node=>node.inert=false);
  controller.root.classList.remove('section-focused');document.body.classList.remove('section-fullscreen');
  const button=controller.root.querySelector('[data-fullscreen]');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`${L('全屏展示小节','Show section in fullscreen')} ${controller.section.id}`);button.querySelector('span').textContent=L('全屏','Fullscreen');
  window.scrollTo({top:scroll,behavior:'instant'});if(trigger?.isConnected)trigger.focus({preventScroll:true});
}

async function exitSectionFullscreen(){
  if(document.fullscreenElement){try{await document.exitFullscreen();}catch{}}
  restoreSectionFullscreen();
}
function codePanel(section){
  const lab=codeLabs[section.api];
  return `<div class="code-walkthroughs">${codeGuide[section.id].map((guide,i)=>`<section class="code-walkthrough" id="keycode-${i}"><header><span>${String(i+1).padStart(2,'0')}</span><h2>${T(guide.title)}</h2><button data-code-sync="${i}">${L('在图中查看','Show in graphic')} ↗</button></header><div class="syntax-source"><div class="code-toolbar"><span>JavaScript / D3.js</span><button data-copy-snippet="${i}">${L('复制这段代码','Copy snippet')}</button></div><pre class="annotated-code guide-code" tabindex="0" aria-label="${T(guide.title)}"><code>${guideSource(guide,lang).split('\n').map((line,n)=>`<span class="code-line"><b aria-hidden="true">${n+1}</b><span>${highlight(line)}</span></span>`).join('')}</code></pre></div><div class="key-explanation"><h3>${L('关键点解释','Key-point explanation')}</h3><p>${T(guide.explanation)}</p></div></section>`).join('')}</div>
    <section id="syntax-preview" class="syntax-preview"><div class="syntax-preview-heading"><h2>${L('运行示例：','Run example: ')}${T(lab.title)}</h2></div><p class="run-instruction">${L('调整参数并运行，观察图形和返回值。','Change the parameter, run the example and inspect the graphic and return value.')}</p>
    <details class="full-source"><summary>${L('查看完整运行代码','View the complete runnable code')}</summary><section id="syntax-source" class="syntax-source"><div class="code-toolbar"><span>${section.api}.js</span><label><input id="show-comments" type="checkbox" checked> ${L('显示注释','Show comments')}</label><button id="copy-code">${L('复制代码','Copy code')}</button></div><pre class="annotated-code" tabindex="0" aria-label="${L('完整运行代码','Complete runnable code')}"><code id="syntax-code"></code></pre></section></details>
    <div class="syntax-controls"><label><span>${T(lab.control)} <output id="syntax-value">${syntaxValues.get(section.id)??lab.value}</output></span><input id="syntax-parameter" type="range" min="${lab.min}" max="${lab.max}" value="${syntaxValues.get(section.id)??lab.value}" aria-label="${T(lab.control)}"></label><button class="primary" id="run-syntax">${L('运行示例','Run example')} ${arrow}</button><span id="syntax-status" role="status"></span></div><div id="syntax-canvas"></div><details class="syntax-output" open><summary>${L('返回值','Return value')}</summary><pre id="syntax-result"></pre></details></section>
    <div class="code-links"><a href="${lab.docs}" target="_blank" rel="noreferrer">${L('D3 官方文档','D3 documentation')} ↗</a><a href="${link(section,'demo')}">${L('查看完整演示','Open the full demonstration')} ${arrow}</a></div>`;
}
function highlight(line){
  const pattern=/\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|return|function|async|await|if|else|new|true|false|null|undefined|typeof)\b|\b\d+(?:\.\d+)?\b/g;
  let cursor=0,result='';for(const m of line.matchAll(pattern)){result+=esc(line.slice(cursor,m.index));const token=m[0],kind=token.startsWith('//')?'comment':/^["'`]/.test(token)?'string':/^\d/.test(token)?'number':'keyword';result+=`<span class="token-${kind}">${esc(token)}</span>`;cursor=m.index+token.length;}return result+esc(line.slice(cursor));
}
function mountCode(section,panel){
  const lab=codeLabs[section.api],target=find(panel,'syntax-code'),q=id=>find(panel,id),settings=codeSettings.get(section.id)||{};let disposed=false,running=0;
  if(settings.open)panel.querySelector('.full-source').open=true;
  q('show-comments').checked=settings.comments!==false;
  function paintCode(){const comments=q('show-comments').checked,source=programSource(lab,lang);target.innerHTML=source.split('\n').filter(line=>comments||!line.trim().startsWith('//')).map((line,i)=>`<span class="code-line"><b aria-hidden="true">${i+1}</b><span>${highlight(line)}</span></span>`).join('');}
  paintCode();q('show-comments').onchange=paintCode;
  panel.querySelectorAll('[data-copy-snippet]').forEach(button=>button.onclick=async()=>{try{await navigator.clipboard.writeText(guideSource(codeGuide[section.id][Number(button.dataset.copySnippet)],lang));button.textContent=L('已复制','Copied');}catch{button.textContent=L('请选择代码复制','Select code to copy');}});
  const svg=window.d3.select(q('syntax-canvas')).append('svg').attr('viewBox','0 0 600 210').attr('role','img').attr('aria-label',T(lab.title));
  async function run(){
    const ticket=++running,n=Number(q('syntax-parameter').value);syntaxValues.set(section.id,n);
    const status=q('syntax-status'),result=q('syntax-result'),runButton=q('run-syntax');status.textContent=L('运行中…','Running…');status.dataset.ok='';runButton.disabled=true;
    if(!lab.persistent)svg.selectAll('*').remove();
    try{const value=await lab.run({svg,d3:window.d3,n,L});if(disposed||ticket!==running)return;result.textContent=typeof value==='string'?value:JSON.stringify(value,null,2);status.textContent=L('已运行','Executed');status.dataset.ok='true';}catch(error){if(disposed)return;result.textContent=error.message;status.textContent=L('运行失败','Run failed');status.dataset.ok='false';}finally{if(!disposed&&ticket===running)runButton.disabled=false;}
  }
  q('syntax-parameter').oninput=e=>{q('syntax-value').textContent=e.target.value;syntaxValues.set(section.id,Number(e.target.value));};q('run-syntax').onclick=run;
  q('copy-code').onclick=async()=>{const button=q('copy-code');try{await navigator.clipboard.writeText(programSource(lab,lang));button.textContent=L('已复制','Copied');}catch{button.textContent=L('请选择代码复制','Select code to copy');}};
  run();return {cleanup(){codeSettings.set(section.id,{open:panel.querySelector('.full-source').open,comments:q('show-comments').checked,foldOpen:panel.open});disposed=true;svg.selectAll('*').interrupt();}};
}
function demoPanel(section){return `<div class="demo-intro"><h2>${L('交互演示','Interactive demonstration')}</h2><p>${T(section.watch)}</p></div><div id="demo-workspace" class="demo-workspace"></div><nav id="demo-observe" class="demo-related"><a href="${link(section)}">${L('返回本节讲解','Read the explanation')} ${arrow}</a><a href="${link(section,'code')}">${L('对照关键代码','See the key code')} ${arrow}</a></nav>`;}
function bindFigures(section,panel){
  if(!section.figures?.length)return;
  panel.querySelectorAll('[data-figure]').forEach(b=>b.onclick=()=>{const f=figures[b.dataset.figure];panel.querySelectorAll('[data-figure]').forEach(x=>x.setAttribute('aria-pressed',x===b));const image=find(panel,'course-figure').querySelector('img');image.src=new URL('../assets/figures/'+f.file,import.meta.url).href;image.alt=T(f.caption);find(panel,'course-figure').querySelector('figcaption').textContent=T(f.caption);});
  find(panel,'enlarge-figure').onclick=()=>{const image=find(panel,'course-figure').querySelector('img');const dialog=document.createElement('dialog');dialog.className='image-dialog';dialog.innerHTML=`<button aria-label="${L('关闭原图','Close figure')}">×</button><img src="${image.src}" alt="${esc(image.alt)}"><p>${esc(image.alt)}</p>`;(focusedSection?.controller.root||document.body).append(dialog);dialog.showModal();dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclose=()=>{dialog.remove();find(panel,'enlarge-figure')?.focus({preventScroll:true});};dialog.onclick=e=>{if(e.target===dialog)dialog.close();};};
}
function searchDialog(){
  if(searchOpen)return;searchOpen=true;
  searchIndex??=buildSearchIndex();
  const previous=document.activeElement,dialog=document.createElement('dialog');let selected=0,found=[],navigating=false;
  dialog.className='search-dialog';dialog.setAttribute('aria-label',L('搜索课程内容','Search course materials'));bindModalEscape(dialog);
  dialog.innerHTML=`<div class="search-input-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg><input type="search" id="course-search" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="search-results" aria-label="${L('搜索概念或语法','Search concepts or syntax')}" placeholder="${L('搜索概念、函数或一段代码…','Search a concept, function or code…')}"><button aria-label="${L('关闭搜索','Close search')}">Esc</button></div><div class="search-summary" role="status"></div><nav id="search-results" role="listbox" aria-label="${L('搜索结果','Search results')}"></nav><footer><span>↑ ↓ ${L('选择','Select')}　↵ ${L('打开','Open')}</span><span>${L('讲解 / 关键代码 / 演示','Explanation / Code / Demo')}</span></footer>`;
  (focusedSection?.controller.root||document.body).append(dialog);
  const input=dialog.querySelector('input'),results=dialog.querySelector('nav');
  const names={explain:L('讲解','Explanation'),code:L('关键代码','Key code'),demo:L('演示','Demo')};
  function choose(index){selected=index;results.querySelectorAll('a').forEach((a,i)=>a.setAttribute('aria-selected',i===index));if(found.length)input.setAttribute('aria-activedescendant',`search-result-${index}`);else input.removeAttribute('aria-activedescendant');}
  function open(index){
    const item=found[index];if(!item)return;navigating=true;dialog.close();
    const course=curriculum.find(c=>c.id===item.section.courseId)||curriculum.find(c=>c.sections.some(s=>s.id===item.section.id));
    sectionTabs.set(item.section.id,item.tab);const url=writePanelState(new URL(location.href),course,sectionTabs);url.hash=link(item.section,item.tab,item.anchor);
    history.pushState(null,'',url);render();
  }
  function list(){
    found=searchCourse(searchIndex,input.value,lang);
    dialog.querySelector('.search-summary').textContent=input.value.trim()?L(`找到 ${found.length} 条内容`,'Found '+found.length+' results'):L('从课程内容开始','Browse course materials');
    results.innerHTML=found.length?found.map((item,i)=>`<a id="search-result-${i}" role="option" aria-selected="false" href="${link(item.section,item.tab,item.anchor)}"><div class="search-result-meta"><span class="result-type result-${item.tab}">${names[item.tab]}</span><span>${item.section.id} · ${T(item.section.title)}</span></div><strong>${esc(T(item.title))}</strong><p>${searchExcerpt(item,input.value,lang).map(run=>run.match?`<mark>${esc(run.text)}</mark>`:esc(run.text)).join('')}</p></a>`).join(''):`<p class="search-empty">${L('没有找到相关内容。可以试试函数名，例如 rollup 或 scaleLinear。','No results. Try a function name such as rollup or scaleLinear.')}</p>`;
    results.querySelectorAll('a').forEach((a,i)=>{a.onclick=event=>{event.preventDefault();open(i);};a.onfocus=()=>choose(i);});choose(0);
  }
  input.oninput=list;input.onkeydown=event=>{
    if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(found.length){choose((selected+(event.key==='ArrowDown'?1:found.length-1))%found.length);results.children[selected].scrollIntoView({block:'nearest'});}}
    if(event.key==='Enter'){event.preventDefault();open(selected);}
  };
  dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclose=()=>{searchOpen=false;dialog.remove();if(!navigating&&previous?.isConnected)previous.focus({preventScroll:true});};dialog.onclick=e=>{if(e.target===dialog)dialog.close();};list();dialog.showModal();input.focus();
}
function render(keepPosition=false){
  const position=window.scrollY,previousSection=last,previousOffset=controllers.get(last)?.root.getBoundingClientRect().top;
  const {course,section,tab,page,anchor,explicit}=route();
  if(course){const states=readPanelState(new URL(location.href),course,sectionTabs);if(explicit)states.set(section.id,tab);states.forEach((value,key)=>sectionTabs.set(key,value));}
  const reuse=course&&currentCourse?.id===course.id&&currentLanguage===lang;
  if(!reuse){
    if(focusedSection){if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});restoreSectionFullscreen();}
    for(const controller of controllers.values())for(const [type,instance] of controller.mounted){if(type==='demo'&&instance.getState)snapshots.set(controller.section.id,instance.getState());instance.cleanup?.();}
    controllers.clear();active?.cleanup?.();active=null;last=null;
  }else if(focusedSection&&focusedSection.controller.section.id!==section.id){if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});restoreSectionFullscreen();}
  document.querySelectorAll('dialog').forEach(d=>d.close());
  document.body.classList.remove('sidebar-open');document.body.classList.toggle('large-text',zoom);
  currentCourse=course;currentLanguage=lang;document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  document.title=course?`${T(course.title)} · ${L('可视化导论','Visualization')}`:L('可视化导论 · JavaScript + D3.js','Visualization · JavaScript + D3.js');
  document.body.classList.toggle('is-course',!!course);
  document.documentElement.classList.toggle('course-document',!!course);
  if(course){
    if(!reuse)lesson(course,section,tab);else for(const s of course.sections){const controller=controllers.get(s.id);if(controller.tab!==sectionTabs.get(s.id))setPanel(controller,sectionTabs.get(s.id));}
    if(explicit)setPanel(controllers.get(section.id),tab);
    const canonical=writePanelState(new URL(location.href),course,sectionTabs);canonical.searchParams.set('lang',lang);history.replaceState(null,'',canonical);
    if(keepPosition&&previousSection&&controllers.has(previousSection)){const top=controllers.get(previousSection).root.getBoundingClientRect().top;window.scrollBy({top:top-previousOffset,behavior:'instant'});markCurrent(previousSection);}
    else if(explicit)jumpTo(section,anchor,sectionTabs.get(section.id));
    else jumpTo(section);
    save('course-last-section',link(section,sectionTabs.get(section.id)));
  }else if(page==='clinic'){
    app.innerHTML=header(null)+`<main id="main" class="additional-page"><p class="overline">ADDITIONAL EXAMPLES</p><h1>${L('图表诊断','Chart diagnostics')}</h1><p>${L('比较同一份数据的不同表达，找出坐标、颜色与缺失值带来的误读。','Compare representations of the same data and diagnose axes, color and missingness.')}</p><div id="clinic"></div></main>`+footer();active=mountClinic(document.querySelector('#clinic'),{L,arrow});
  }else home();
  document.querySelector('#language').onclick=()=>{lang=lang==='zh'?'en':'zh';save('seeing-language',lang);const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);render(true);};
  document.querySelector('#text-size').onclick=()=>{zoom=!zoom;save('course-text-size',zoom);document.body.classList.toggle('large-text',zoom);document.querySelector('#text-size').setAttribute('aria-pressed',zoom);};
  document.querySelector('#search-open').onclick=searchDialog;
  document.querySelector('.skip-link').onclick=event=>{event.preventDefault();const main=document.querySelector('#main');main.tabIndex=-1;main.focus({preventScroll:true});main.scrollIntoView({block:'start',behavior:'instant'});};
  if(document.querySelector('#mobile-menu')){document.querySelector('#mobile-menu').onclick=()=>{const open=document.body.classList.toggle('sidebar-open');document.querySelector('#mobile-menu').setAttribute('aria-expanded',open);};document.querySelector('.sidebar-shade').onclick=()=>{document.body.classList.remove('sidebar-open');document.querySelector('#mobile-menu').setAttribute('aria-expanded',false);};}
  if(!course){if(keepPosition)window.scrollTo({top:position,behavior:'instant'});else if(page!=='path')window.scrollTo({top:0,behavior:'instant'});}
}
window.addEventListener('hashchange',()=>render());
window.addEventListener('popstate',()=>render());
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
  const a=event.target.closest('a[href^="#"]');if(!a||a.target||a.hasAttribute('download'))return;
  const url=new URL(a.href),next=readCourseRoute(url,curriculum);if(!next.course)return;
  event.preventDefault();
  if(a.closest('.course-sidebar nav,.chapter-map,.chapter-meta'))url.hash=link(next.section,sectionTabs.get(next.section.id)||'explain');
  if(currentCourse?.id!==next.course.id)url.searchParams.delete('tabs');
  if(url.href!==location.href)history.pushState(null,'',url);render();
});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&focusedSection){focusedSection.controller.root.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());restoreSectionFullscreen();}});
window.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();searchDialog();}
  if(event.key==='Escape'&&!document.querySelector('dialog[open]')){if(focusedSection)exitSectionFullscreen();document.body.classList.remove('sidebar-open');document.querySelector('#mobile-menu')?.setAttribute('aria-expanded',false);}
});
if(window.d3)render();else window.addEventListener('load',()=>render(),{once:true});
