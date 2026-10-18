import { courses, goals } from './content.js';
import { teachingFor, lessonTakeaways } from './teaching.js';
import { createExperiment } from './experiments.js';

export function mountLesson(ctx){
  const {app,L,T,esc,arrow,href,save,notes,practiced,footer,$,course,section,state,snapshot}=ctx;
  const index=course.sections.indexOf(section),teaching=teachingFor(section);
  app.insertAdjacentHTML('beforeend',`<main id="main" class="lesson-page" data-phase="${state.phase}"><div class="lesson-breadcrumb"><a href="#path">${L('五课路线','The learning path')}</a><span>/</span><a href="#lesson-${course.id}">0${course.id} ${T(course.title)}</a><span>/</span><span>${section.id} ${T(section.title)}</span><span class="section-position">${index+1} / ${course.sections.length}</span></div>
  <section class="lesson-intro"><p class="eyebrow">${course.word} / ${T(section.title)}</p><h1>${T(section.question)}</h1><p class="learning-goal">${T(goals[section.kind])}</p></section>
  <nav class="learning-flow" aria-label="${L('本节学习阶段','Learning stages')}">${[L('先判断','Predict'),L('看变化','Explore'),L('讲原因','Explain'),L('换题用','Transfer')].map((name,i)=>`<button data-phase="${i}" aria-pressed="${state.phase===i}"><span>0${i+1}</span><strong>${name}</strong><i>${i<3?'→':'✓'}</i></button>`).join('')}</nav>
  <div class="learning-stage"><section class="experiment-card"><div class="experiment-heading"><span><i></i> ${L('把问题放进图形里','PUT THE QUESTION INTO THE PICTURE')}</span><button id="enlarge" aria-pressed="false">${L('放大','Enlarge')} ⤢</button></div><div id="experiment"></div></section><aside class="coach-panel" id="coach-panel" aria-label="${L('讲解与任务','Explanation and task')}"><div id="coach-content"></div><div class="phase-pagination"><button id="previous-step" aria-label="${L('上一个阶段','Previous stage')}">←</button><span id="phase-count"></span><button id="next-step">${L('继续','Continue')} ${arrow}</button></div></aside></div>
  <section class="discovery-strip"><span class="discovery-icon">↗</span><div><p class="eyebrow">${L('带走一个理解','ONE IDEA TO TAKE AWAY')}</p><h2>${T(teaching.insight)}</h2></div><button id="open-note" aria-expanded="false" aria-controls="note-editor">${notes[section.id]?L('编辑我的发现','Edit my discovery'):L('记下我的发现','Keep my discovery')} +</button></section>
  <section class="note-editor" id="note-editor" hidden><div><h3>${L('用自己的话，说清楚。','Put it in your own words.')}</h3><p>${L('写下你改变了什么、看到了什么，以及你现在的解释。笔记保存在这台设备。','Describe what you changed, what you saw, and why. Notes stay on this device.')}</p></div><div><label class="sr-only" for="discovery-text">${L('我的发现','My discovery')}</label><textarea id="discovery-text" rows="4" placeholder="${L('我原来以为……改变……以后，我发现……','I expected… After changing… I noticed…')}">${esc(state.draft)}</textarea><div class="note-editor-actions"><button class="primary" id="save-note">${L('保存到我的发现','Save my discovery')} ${arrow}</button><span id="note-status" role="status"></span></div></div></section>
  <div class="supporting-material"><details id="code-details"><summary>${L('看看图形背后的代码','See the code behind the view')}<span>+</span></summary><p>${L('这里展示本实验实际调用的函数；完整实现包含辅助函数与 D3。','This is a function used by the experiment; the full implementation includes helpers and D3.')}</p><pre><code id="running-code"></code></pre><a href="https://github.com/MississippiPotato/recreate/tree/main/src" target="_blank" rel="noreferrer">${L('查看完整源码','View full source')} ↗</a></details><details id="data-details"><summary>${L('了解这份数据','About this data')}<span>+</span></summary><p>${dataSource(section,L)}</p><p><a href="https://cinger007.github.io/vis/lesson-0${course.id}/#ch-${section.id.replace('.','-')}" target="_blank" rel="noreferrer">${L('原课程','Original course')} ↗</a> · <a href="https://d3js.org/" target="_blank" rel="noreferrer">D3 ${L('文档','documentation')} ↗</a>${section.kind==='vision'?' · <a href="https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html" target="_blank" rel="noreferrer">Machado et al. (2009) ↗</a>':''}</p></details></div>
  ${index===course.sections.length-1?`<section class="lesson-wrapup"><p class="eyebrow">LESSON 0${course.id} / ${L('回头看一眼','LOOK BACK')}</p><h2>${T(lessonTakeaways[course.id-1])}</h2><p>${L('试着向同学解释本课的一个图形：它的输入是什么？你改变了什么？什么结论依然不能下？','Explain one view to a classmate: what was its input, what did you change, and what can you still not conclude?')}</p><a href="#clinic">${L('去图表诊所检验一下','Test your judgment in the chart clinic')} ${arrow}</a></section>`:''}
  <nav class="lesson-bottom-nav" aria-label="${L('前后小节','Adjacent sections')}"><a href="${index?href(course.sections[index-1]):'#path'}"><small>← ${L('回到','Back to')}</small><span>${index?T(course.sections[index-1].title):L('学习路线','The learning path')}</span></a><a href="${index<course.sections.length-1?href(course.sections[index+1]):course.id<5?'#lesson-'+(course.id+1):'#clinic'}"><small>${L('下一步','Next')} →</small><span>${index<course.sections.length-1?T(course.sections[index+1].title):course.id<5?T(courses[course.id].title):L('图表诊所','Chart clinic')}</span></a></nav>
  </main>${footer()}`);
  const experiment=createExperiment($('#experiment'),section,ctx.lang);experiment.restore(snapshot);
  $('#running-code').textContent=experiment.source();
  function feedback(){
    const el=$('#answer-feedback');el.hidden=false;el.classList.toggle('is-correct',state.answer===section.answer);
    el.innerHTML=`<strong>${state.answer===section.answer?L('判断成立。','Your judgment holds.'):L('换个角度再想想。','Try another perspective.')}</strong><p>${T(section.reason)}</p><span>${L('练习记录用于回顾，不等于掌握认证。','A practice record is a reminder, not a mastery certificate.')}</span>`;
  }
  function paintCoach(){
    let body='';
    if(state.phase===0)body=`<p class="coach-kicker">${L('先让直觉作答','MAKE A PREDICTION')}</p><h2>${T(teaching.question)}</h2><div class="prediction-options">${teaching.options.map((option,i)=>`<button data-prediction="${i}" aria-pressed="${state.prediction===i}"><span>${String.fromCharCode(65+i)}</span>${T(option)}</button>`).join('')}</div><p class="coach-hint" role="status">${state.prediction===null?L('先选一个想法，再用实验检查。','Choose a hypothesis, then test it.'):L('已记下你的预测。带着它，去看看变化。','Prediction saved. Explore what actually happens.')}</p>`;
    if(state.phase===1)body=`<p class="coach-kicker">${L('只改变一个条件','CHANGE ONE CONDITION')}</p><h2>${L('动一下，<br>再仔细看。','Change it.<br>Look again.')}</h2><p class="coach-body">${T(section.steps[0])}</p><button id="guided-change" class="primary">${L('试试这个变化','Try this change')} ${arrow}</button><p id="guided-status" class="coach-hint" role="status">${L('也可以直接操作图形。试着说出什么变了、什么没变。','Explore the view directly too. Describe what changed and what stayed the same.')}</p>`;
    if(state.phase===2)body=`<p class="coach-kicker">${L('把变化连成解释','CONNECT WHAT YOU SAW')}</p><h2 class="coach-insight">${T(teaching.insight)}</h2>${state.prediction!==null?`<div class="prediction-feedback"><span>${L('回看你的预测','YOUR PREDICTION')}</span><p>${T(teaching.options[state.prediction])}</p><strong>${state.prediction===teaching.answer?L('这个判断成立。','This prediction holds.'):L('需要修正这个判断。','This prediction needs revising.')}</strong></div>`:''}<p class="coach-body">${T(section.explanation)}</p>`;
    if(state.phase===3)body=`<p class="coach-kicker">${L('换一个情境，检验理解','TRANSFER TO A NEW CONTEXT')}</p><h2 class="transfer-question">${T(section.transfer)}</h2><form id="quiz"><fieldset><legend class="sr-only">${T(section.transfer)}</legend>${section.options.map((option,i)=>`<label class="answer-option"><input type="radio" name="answer" value="${i}" ${state.answer===i?'checked':''}><span>${String.fromCharCode(65+i)}</span><strong>${T(option)}</strong></label>`).join('')}</fieldset><button class="primary" type="submit" id="check-answer" ${state.answer===null?'disabled':''}>${L('看看我的判断','Check my reasoning')} ${arrow}</button><div id="answer-feedback" class="answer-feedback" role="status" ${state.checked?'':'hidden'}></div></form>`;
    $('#coach-content').innerHTML=body;
    document.querySelectorAll('[data-prediction]').forEach(button=>button.onclick=()=>{state.prediction=Number(button.dataset.prediction);paintCoach();$(`[data-prediction="${state.prediction}"]`).focus({preventScroll:true});});
    if($('#guided-change'))$('#guided-change').onclick=()=>{experiment.applyPreset(teaching.preset);$('#guided-status').textContent=L('变化已应用。对照刚才的图形，解释你观察到的差异。','Change applied. Compare with the previous view and explain the difference.');};
    if($('#quiz')){
      $('#quiz').onchange=event=>{state.answer=Number(event.target.value);state.checked=false;$('#check-answer').disabled=false;$('#answer-feedback').hidden=true;};
      $('#quiz').onsubmit=event=>{event.preventDefault();if(state.answer===null)return;state.checked=true;practiced[section.id]={choice:state.answer,correct:state.answer===section.answer};save('seeing-practiced',practiced);feedback();$('.section-nav.active i').textContent='✓';$('.drawer-progress').textContent=`${Object.keys(practiced).filter(id=>id.startsWith(course.id+'.')).length} / ${course.sections.length} ${L('已练习','practiced')}`;};
      if(state.checked)feedback();
    }
    $('#phase-count').textContent=`0${state.phase+1} / 04`;$('#previous-step').disabled=state.phase===0;$('#next-step').disabled=state.phase===3;
  }
  function setPhase(index){
    state.phase=index;experiment.setStep(Math.max(0,Math.min(2,index-1)));
    $('#main').dataset.phase=index;
    const target=href(section)+(index?`/step-${index+1}`:'');history.replaceState(null,'',target);save('seeing-last',target);
    document.querySelectorAll('.learning-flow [data-phase]').forEach(button=>button.setAttribute('aria-pressed',Number(button.dataset.phase)===index));paintCoach();
    if(matchMedia('(min-width:851px)').matches&&$('.learning-stage').getBoundingClientRect().top>130)$('.learning-stage').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  }
  paintCoach();
  document.querySelectorAll('.learning-flow [data-phase]').forEach(button=>button.onclick=()=>setPhase(Number(button.dataset.phase)));
  $('#previous-step').onclick=()=>setPhase(Math.max(0,state.phase-1));$('#next-step').onclick=()=>setPhase(Math.min(3,state.phase+1));
  $('#enlarge').onclick=()=>{const enlarged=$('.experiment-card').classList.toggle('enlarged');$('#enlarge').setAttribute('aria-pressed',enlarged);$('#enlarge').textContent=enlarged?L('收起 ⤡','Restore ⤡'):L('放大 ⤢','Enlarge ⤢');document.body.classList.toggle('experiment-open',enlarged);};
  $('#open-note').onclick=()=>{const editor=$('#note-editor');editor.hidden=!editor.hidden;$('#open-note').setAttribute('aria-expanded',!editor.hidden);if(!editor.hidden)$('#discovery-text').focus({preventScroll:true});};
  $('#discovery-text').oninput=event=>{state.draft=event.target.value;};
  $('#save-note').onclick=()=>{const text=$('#discovery-text').value.trim();if(!text){$('#note-status').textContent=L('先写下一点你的发现。','Write down a discovery first.');return;}notes[section.id]={text,prediction:state.prediction,experiment:experiment.getState().state,updated:new Date().toISOString()};save('seeing-notes',notes);$('#note-status').textContent=L('已保存，在“我的发现”中回看和导出。','Saved. Revisit or export it in My discoveries.');$('.note-count').textContent=Object.keys(notes).length;};
  if(!snapshot&&state.phase)experiment.setStep(Math.max(0,Math.min(2,state.phase-1)));
  save('seeing-last',href(section)+(state.phase?`/step-${state.phase+1}`:''));
  return {experiment};
}
function dataSource(section,L){
  if(section.kind==='time')return L('2024 年逐日教学合成气温，固定种子 42；366 个日期，其中第 91、211 天缺失。并非真实城市观测。三个视图共享同一份数据和数值范围。','Synthetic 2024 daily temperatures, seed 42. 366 dates, days 91 and 211 missing. Not real city observations. Three views share one array and numerical domain.');
  if(section.kind==='period')return L('168 天教学合成序列，生成周期为 14 天，固定噪声种子 42。显示周期可以改变，数据生成规则保持不变。','168 synthetic days, a 14-day generator period, fixed noise seed 42. Display period can change while the source stays fixed.');
  if(section.kind==='story')return L('虚构的三人考察队事件表，用于解释共同出现的关系，不表示真实人物活动。','A fictional three-person expedition illustrates co-occurrence, not real people’s activity.');
  if(Number(section.id[0])<3)return L('80 条新生记录为教学合成数据，固定种子 42。前两课使用相同数组，编号 S001–S080 保持稳定。并非真实调查。','80 synthetic student records, seed 42, stable IDs S001–S080. The first two lessons share one array. This is not a real survey.');
  return L('本节数值、场或配色样例为构造的教学数据，便于控制变量和检查算法，不作为真实世界统计结论。','Constructed teaching values, fields or palettes support controlled comparisons and algorithm inspection, not real-world statistical conclusions.');
}
