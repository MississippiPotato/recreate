import { courses, ui, t } from './content.js';
import { mountHome } from './home.js';
import { mountLesson } from './lesson.js';
import { mountLecture } from './lecture.js';
import { mountClinic } from './clinic.js';
import { teachingFor, describeExperiment } from './teaching.js';

const app=document.querySelector('#app');
const $=selector=>document.querySelector(selector);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Storage is optional. */}};
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.7"/></svg>';
const href=section=>`#ch-${section.id.replace('.','-')}`;
const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
let lang=read('seeing-language','zh');if(!['zh','en'].includes(lang))lang='zh';
const notes=object(read('seeing-notes',{})),practiced=object(read('seeing-practiced',{}));
const lessonStates=new Map(),lectureStates=new Map(),experiments=new Map();
let active=null,lastSection=null,classroom=read('seeing-view','lecture')!=='study';
const requestedMode=new URLSearchParams(location.search).get('mode');
if(['lecture','study'].includes(requestedMode))classroom=requestedMode==='lecture';
const L=(zh,en)=>lang==='zh'?zh:en,T=value=>t(value,lang);
function route(){
  const hash=location.hash.slice(1),match=hash.match(/^ch-([1-5])-([1-8])(?:\/step-([1-4]))?$/)||hash.match(/^lesson-(\d)-(\d)$/);
  const id=Number(match?.[1]||hash.match(/^lesson-(\d)$/)?.[1]||(!hash&&location.pathname.match(/lesson-0([1-5])\//)?.[1])||0);
  const course=courses.find(c=>c.id===id),section=course?.sections.find(s=>s.id===`${id}.${match?.[2]}`)||course?.sections[0];
  return {course,section,step:Math.max(0,Number(match?.[3]||1)-1),page:hash.split('/')[0]};
}
function header(course,page){
  return `<header class="topbar"><a class="wordmark" href="#home" aria-label="${L('见数，课程首页','Seeing Data, home')}"><span class="brand-symbol"><i></i><i></i><i></i><i></i></span><strong>${T(ui.brand)}</strong><span class="brand-en">SEEING DATA</span></a>
    <nav class="topnav" aria-label="${L('主导航','Main navigation')}"><a href="#path" ${!course&&!['clinic','notebook'].includes(page)?'aria-current="page"':''}>${L('五课路线','The course')}</a><a href="#clinic" ${page==='clinic'?'aria-current="page"':''}>${L('图表诊所','Chart clinic')}</a>${!classroom?`<a href="#notebook" ${page==='notebook'?'aria-current="page"':''}>${L('我的发现','My discoveries')}<span class="note-count">${Object.keys(notes).length||''}</span></a>`:''}</nav>
    <div class="header-actions"><button id="language" aria-label="${L('Switch to English','切换为中文')}">${L('EN','中文')}</button><button id="classroom" class="mode-toggle" aria-label="${classroom?L('切换到课后自学','Switch to self study'):L('切换到课堂讲解','Switch to classroom teaching')}">${classroom?L('课后自学','Self study'):L('课堂讲解','Teach this class')}</button>${course?`<button id="menu" class="menu-button" aria-expanded="false" aria-controls="course-drawer">${L('目录','Contents')} <span>☰</span></button>`:''}</div></header>`;
}
function footer(){return `<footer class="site-footer"><div><a class="footer-brand" href="#home">${T(ui.brand)}<span>SEEING DATA</span></a><p>${L('让每一次看见，都多一层理解。','Every view, a deeper understanding.')}</p></div><div class="footer-links"><a href="#clinic">${L('去图表诊所','Visit the chart clinic')} ↗</a><a href="https://github.com/MississippiPotato/recreate" target="_blank" rel="noreferrer">${L('项目源码','Source code')} ↗</a><a href="https://cinger007.github.io/vis/" target="_blank" rel="noreferrer">${L('原课程','Original course')} ↗</a></div><span class="footer-tag">${L('可视化导论 · 交互课程','AN INTERACTIVE VISUALIZATION COURSE')}</span></footer>`;}
function drawer(course,section){return `<button class="drawer-shade" id="drawer-shade" aria-label="${L('关闭目录','Close contents')}" tabindex="-1"></button><aside class="course-drawer" id="course-drawer" aria-label="${L('课程目录','Course contents')}" hidden><div class="drawer-title"><a href="#path">${L('学习路线','Learning path')} ↗</a><button id="close-menu" aria-label="${L('关闭目录','Close contents')}">×</button></div><label class="search-wrap"><span>${L('找到你想理解的概念','Find a concept')}</span><input id="concept-search" placeholder="${L('搜索概念…','Search concepts…')}" type="search"></label><div id="search-results" hidden></div><div class="drawer-courses">${courses.map(c=>`<a href="#lesson-${c.id}" ${course.id===c.id?'aria-current="page"':''}>0${c.id}</a>`).join('')}</div><p class="eyebrow">${course.word} / LESSON 0${course.id}</p><h2>${T(course.title)}</h2><nav aria-label="${T(ui.contents)}">${course.sections.map(s=>`<a class="section-nav ${s.id===section.id?'active':''}" href="${href(s)}" ${s.id===section.id?'aria-current="page"':''}><span>${s.id}</span><strong>${T(s.title)}</strong><i>${practiced[s.id]?'✓':''}</i></a>`).join('')}</nav><p class="drawer-progress">${Object.keys(practiced).filter(id=>id.startsWith(course.id+'.')).length} / ${course.sections.length} ${L('已练习','practiced')}</p></aside>`;}
function toggleDrawer(open){
  if(!$('#course-drawer'))return;
  $('#course-drawer').hidden=!open;document.body.classList.toggle('menu-open',open);$('#menu').setAttribute('aria-expanded',open);
  if(open)$('#close-menu').focus();else $('#menu').focus({preventScroll:true});
}
function notebook(ctx){
  const saved=courses.flatMap(c=>c.sections).filter(s=>notes[s.id]);
  app.innerHTML=`${header(null,'notebook')}<main id="main" class="notebook-page section-wrap"><div class="page-intro"><p class="eyebrow">MY DISCOVERIES / ${L('把理解留下来','KEEP WHAT YOU LEARNED')}</p><h1>${L('用自己的话，<br>收集每一次发现。','Your words.<br>Your discoveries.')}</h1><p>${L('回看预测，保留解释，下次遇到新数据时再验证。','Revisit predictions. Keep explanations. Test them again with new data.')}</p></div><div class="notebook-toolbar"><span>${saved.length} ${L('条发现 · 保存在这台设备','discoveries · stored on this device')}</span><button class="primary" id="export-notes" ${saved.length?'':'disabled'}>${L('导出学习笔记','Export notes')} ↓</button></div>${saved.length?`<div class="notebook-list">${saved.map(s=>`<article class="notebook-entry"><span class="eyebrow">${s.id} / ${T(s.title)}</span><h2>${T(teachingFor(s).insight)}</h2><p class="saved-note">${esc(notes[s.id].text)}</p><details class="note-context"><summary>${L('当时的实验参数','Experiment settings')}</summary><code>${esc(describeExperiment(s,notes[s.id].experiment,lang).join(' · '))}</code></details><a data-restore="${s.id}" href="${href(s)}">${L('恢复当时的实验','Restore this experiment')} ${arrow}</a></article>`).join('')}</div>`:`<div class="notebook-empty"><span>↗</span><h2>${L('第一个发现，从动手开始。','Your first discovery starts with a change.')}</h2><p>${L('每个实验下方都可以记下你的解释。','Keep an explanation beneath any experiment.')}</p><a class="primary" href="#lesson-1">${L('去做一个实验','Try an experiment')} ${arrow}</a></div>`}</main>${footer()}`;
  document.querySelectorAll('[data-restore]').forEach(link=>link.onclick=()=>{
    const id=link.dataset.restore;classroom=false;experiments.set('study:'+id,{state:notes[id].experiment,baseline:null,stage:0});
  });
  $('#export-notes').onclick=()=>{
    const lines=['# '+L('见数 · 我的学习发现','Seeing Data · My discoveries'),''];
    saved.forEach(s=>{const n=notes[s.id],p=teachingFor(s);lines.push(`## ${s.id} ${T(s.title)}`,n.text,'',L('当时的预测：','Prediction: ')+(n.prediction===null?L('未选择','Not selected'):T(p.options[n.prediction])),'',L('实验参数：','Experiment settings: ')+describeExperiment(s,n.experiment,lang).join(' · '),'',location.href.split('#')[0]+href(s),'');});
    const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\n')],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='seeing-data-notes.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
}
function render(keepScroll=false){
  const y=window.scrollY;
  if(active?.experiment&&lastSection)experiments.set(active.snapshotKey,active.experiment.getState());
  active?.cleanup?.();active=null;
  const r=route(),{course,section,page}=r;
  if(page==='notebook')classroom=false;
  const states=classroom?lectureStates:lessonStates;
  if(section&&!states.has(section.id))states.set(section.id,{prediction:null,answer:null,checked:false,draft:notes[section.id]?.text||'',phase:r.step});
  const state=section?states.get(section.id):null;if(state&&!keepScroll)state.phase=r.step;
  lastSection=section?.id||null;
  document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=section?`${T(section.title)} · ${T(ui.brand)}`:`${T(ui.brand)} · ${L('看见数据，理解图形','See data. Understand charts.')}`;
  document.body.classList.remove('experiment-open','menu-open','is-classroom');document.body.classList.toggle('is-projecting',classroom&&!!(course||page==='clinic'));document.body.classList.toggle('is-home',!course&&!['clinic','notebook'].includes(page));
  const snapshotKey=(classroom?'lecture:':'study:')+section?.id;
  const ctx={lang,L,T,esc,arrow,href,read,save,notes,practiced,header,footer,$,course,section,state,app,classroom,snapshot:experiments.get(snapshotKey)};
  if(course){app.innerHTML=header(course,page)+drawer(course,section);active=classroom?mountLecture(ctx):mountLesson(ctx);active.snapshotKey=snapshotKey;}
  else if(page==='clinic'){app.innerHTML=`${header(null,page)}<main id="main" class="clinic-page section-wrap"><div class="page-intro"><p class="eyebrow">THE CHART CLINIC / ${L('把误读变成理解','TURN MISREADING INTO UNDERSTANDING')}</p><h1>${L('读图之前，<br>先问一句：对吗？','Before you believe it,<br>question the chart.')}</h1><p>${L('同一份数据，一次有意的误导。找到原因，亲手修复。','The same data. A misleading view. Find the cause and repair it.')}</p></div><div id="clinic"></div><a class="clinic-back" href="#path">← ${L('回到五课路线，继续深入','Back to the lessons')}</a></main>${footer()}`;active=mountClinic($('#clinic'),ctx);}
  else if(page==='notebook')notebook(ctx);else mountHome(ctx);
  $('.skip-link').onclick=event=>{event.preventDefault();$('#main').tabIndex=-1;$('#main').focus();};
  $('#language').onclick=()=>{lang=lang==='zh'?'en':'zh';save('seeing-language',lang);render(true);};
  $('#classroom').onclick=()=>{active?.closeOverlay?.();classroom=!classroom;save('seeing-view',classroom?'lecture':'study');const url=new URL(location.href);url.searchParams.set('mode',classroom?'lecture':'study');history.replaceState(null,'',url);if(page==='notebook'&&classroom)location.hash='path';else render();};
  if($('#menu')){
    $('#menu').onclick=()=>{active?.closeOverlay?.();toggleDrawer(!document.body.classList.contains('menu-open'));};$('#close-menu').onclick=()=>toggleDrawer(false);$('#drawer-shade').onclick=()=>toggleDrawer(false);
    $('#concept-search').oninput=event=>{const q=event.target.value.trim().toLowerCase(),results=$('#search-results');results.hidden=!q;if(q){const hits=courses.flatMap(c=>c.sections).filter(s=>(s.title.zh+s.title.en+s.question.zh+s.question.en).toLowerCase().includes(q));results.innerHTML=hits.length?hits.map(s=>`<a href="${href(s)}">${s.id} ${T(s.title)}</a>`).join(''):`<p>${T(ui.empty)}</p>`;}};
  }
  if(keepScroll)window.scrollTo({top:y,behavior:'instant'});else if(['path','introduction'].includes(page))$('#'+page)?.scrollIntoView({block:'start',behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',()=>render());
window.addEventListener('keydown',event=>{
  if(event.defaultPrevented)return;
  if(!document.body.classList.contains('menu-open')&&active?.handleKey?.(event))return;
  if(event.key==='Escape'){if(document.body.classList.contains('menu-open'))toggleDrawer(false);if($('.experiment-card.enlarged'))$('#enlarge').click();}
  if(event.key==='Tab'&&document.body.classList.contains('menu-open')){const f=[...$('#course-drawer').querySelectorAll('a,button,input')].filter(el=>!el.disabled&&el.getClientRects().length);if(event.shiftKey&&document.activeElement===f[0]){event.preventDefault();f.at(-1).focus();}else if(!event.shiftKey&&document.activeElement===f.at(-1)){event.preventDefault();f[0].focus();}}
});
if(window.d3)render();else window.addEventListener('load',()=>render(),{once:true});
