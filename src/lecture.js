import { courses } from './content.js';
import { teachingFor } from './teaching.js';
import { lectureInitial, lectureBeats, lectureCue, lectureReadout } from './lecture-content.js';
import { createExperiment } from './experiments.js';
import { students, groupRecords } from './core.js';

export function mountLecture(ctx){
  const {app,L,T,esc,arrow,href,save,$,course,section,state,snapshot}=ctx;
  const all=courses.flatMap(c=>c.sections),index=all.indexOf(section),teaching=teachingFor(section),beats=lectureBeats(section);
  const phaseNames=[L('提问','Question'),L('演示','Demonstrate'),L('归纳','Explain'),L('追问','Discuss')];
  state.beat??=-1;state.answerRevealed??=false;state.parametersOpen=false;state.showData=section.id==='1.2';
  app.insertAdjacentHTML('beforeend',`<main id="main" class="lecture-page" data-phase="${state.phase}" data-kind="${section.kind}">
    <header class="lecture-heading"><div><p>${L('第','LESSON ')} ${course.id} ${L('课','')} · ${T(course.title)} <span>/ ${section.id}</span></p><h1>${T(section.title)}</h1></div><nav class="lecture-phases" aria-label="${L('课堂讲解步骤','Teaching stages')}">${phaseNames.map((name,i)=>`<button data-lecture-phase="${i}" aria-pressed="${state.phase===i}"><span>0${i+1}</span>${name}</button>`).join('')}</nav><span class="lecture-position">${String(index+1).padStart(2,'0')} <i>/ 27</i></span></header>
    <section class="lecture-stage"><div class="lecture-visual"><div id="lecture-question-board" class="lecture-question-board"><span id="board-label"></span><h2 id="board-question"></h2><p id="board-invitation"></p></div><div class="lecture-figure"><div class="lecture-figure-top"><span>${L('教学构造示例','CONSTRUCTED TEACHING EXAMPLE')}</span><div><button id="lecture-data" hidden>${L('查看数据','Show data')}</button><button id="lecture-parameters">${L('调整参数','Parameters')} ⤢</button></div></div><div id="projection-experiment" class="projection-experiment"></div><div id="lecture-readout" class="lecture-readout" aria-live="polite"></div></div></div><aside class="lecture-side" id="lecture-side"></aside></section>
    <footer class="lecture-controls"><div class="lecture-tools"><button id="lecture-restart" aria-label="${L('从当前小节重新讲解','Restart this section')}">↺ ${L('重新演示','Restart')}</button><button id="lecture-compare" hidden>${L('对照原图','Original view')}</button><button id="lecture-fullscreen">${L('全屏','Full screen')} ⤢</button><span class="lecture-key-hint">${L('← → 翻步 · F 全屏','← → to advance · F for full screen')}</span></div><div class="lecture-navigation"><button id="lecture-previous" aria-label="${L('上一步','Previous step')}">←</button><button class="primary" id="lecture-next"></button></div></footer>
  </main><button class="lecture-parameters-shade" id="lecture-parameters-shade" tabindex="-1" aria-label="${L('关闭演示参数','Close demonstration parameters')}"></button>`);

  let ready=false,comparing=false;
  const experiment=createExperiment($('#projection-experiment'),section,ctx.lang,()=>{if(ready)refreshFigure();});
  if(snapshot)experiment.restore(snapshot);else experiment.applyPreset(lectureInitial(section));
  if(!state.before)state.before=experiment.getState();
  ready=true;

  function refreshFigure(){
    const host=$('#projection-experiment'),parameters=host.querySelector('.experiment-controls');
    parameters.setAttribute('role','dialog');parameters.setAttribute('aria-label',L('演示参数','Demonstration parameters'));
    parameters.setAttribute('aria-modal','true');
    if(!parameters.querySelector('.lecture-close-parameters')){const close=document.createElement('button');close.type='button';close.className='lecture-close-parameters';close.textContent=L('关闭参数 ×','Close parameters ×');close.onclick=closeParameters;parameters.prepend(close);}
    document.body.classList.toggle('lecture-parameters-open',state.parametersOpen);
    host.querySelectorAll('.record-details').forEach(details=>details.open=state.showData||section.kind==='pipeline');
    if(section.kind==='pipeline'&&Number(experiment.getState().state.stage)===2){
      const pane=host.querySelector('.chart-pane');pane.querySelector('svg')?.remove();
      if(!pane.querySelector('.lecture-hierarchy-list')){
        const hierarchy=document.createElement('div');hierarchy.className='lecture-hierarchy-list';
        const major=name=>ctx.lang==='zh'?({Design:'设计',Computing:'计算机',Economics:'经济',Biology:'生物'}[name]):name;
        hierarchy.innerHTML=`<h3>${L('新生','Students')} <span>80</span></h3><div>${groupRecords(students).map(group=>`<section><h4>${major(group.key)} <span>${group.count}</span></h4>${groupRecords(group.members,'class').map(c=>`<p>${L('班级','Class')} ${c.key}<strong>${c.count}</strong></p>`).join('')}</section>`).join('')}</div>`;
        pane.append(hierarchy);
      }
    }
    $('.lecture-visual').classList.toggle('show-data',state.showData);
    $('#lecture-data').hidden=!['records','transform'].includes(section.kind)||state.phase===0||state.phase===3;
    $('#lecture-data').textContent=state.showData?L('回到图形','Show chart'):L('查看数据','Show data');
    $('#lecture-readout').textContent=lectureReadout(section,experiment.getState().state,ctx.lang);
    $('#lecture-compare').hidden=state.phase!==1&&state.phase!==2||state.beat<0;
    $('#lecture-compare').textContent=comparing?L('回到变化后','Changed view'):L('对照原图','Original view');
    $('.lecture-figure-top>span').textContent=comparing?L('原图 · 变化之前','ORIGINAL · BEFORE THE CHANGE'):L('教学构造示例','CONSTRUCTED TEACHING EXAMPLE');
  }
  function closeParameters(){state.parametersOpen=false;document.body.classList.remove('lecture-parameters-open');$('#lecture-parameters')?.focus({preventScroll:true});}
  function applyBeat(index){
    if(comparing){comparing=false;}
    experiment.restore(state.before);
    for(let i=0;i<=index;i++)experiment.applyPreset(beats[i].preset);
    state.beat=index;state.after=experiment.getState();refreshFigure();paint();
  }
  function remember(){const target=href(section)+(state.phase?`/step-${state.phase+1}`:'');history.replaceState(null,'',target);save('seeing-last-lecture',target);}
  function setPhase(phase){
    closeParameters();comparing=false;state.phase=phase;state.answerRevealed=false;
    if(phase===0){state.beat=-1;experiment.restore(state.before);}
    if(phase===1){state.beat=-1;experiment.restore(state.before);}
    if(phase===2&&state.beat<0)applyBeat(beats.length-1);
    $('#main').dataset.phase=phase;remember();paint();refreshFigure();
  }
  function next(){
    if(state.phase===0)setPhase(1);
    else if(state.phase===1&&state.beat<beats.length-1)applyBeat(state.beat+1);
    else if(state.phase===1)setPhase(2);
    else if(state.phase===2)setPhase(3);
    else if(!state.answerRevealed){state.answerRevealed=true;paint();}
    else location.hash=index<all.length-1?href(all[index+1]):'#clinic';
  }
  function previous(){
    if(state.phase===3&&state.answerRevealed){state.answerRevealed=false;paint();}
    else if(state.phase===1&&state.beat>=0)applyBeat(state.beat-1);
    else if(state.phase>0){const phase=state.phase-1;setPhase(phase);if(phase===1)applyBeat(beats.length-1);}
    else if(index>0)location.hash=href(all[index-1])+'/step-4';
  }
  function paint(){
    $('#main').dataset.phase=state.phase;
    document.querySelectorAll('[data-lecture-phase]').forEach(button=>button.setAttribute('aria-pressed',Number(button.dataset.lecturePhase)===state.phase));
    $('#board-label').textContent=state.phase===3?L('换个情境，请同学解释','A NEW CONTEXT TO DISCUSS'):L('先问全班一个问题','A QUESTION FOR THE ROOM');
    $('#board-question').textContent=T(state.phase===3?section.transfer:teaching.question);
    $('#board-invitation').textContent=state.phase===3?L('先听判断，再追问理由。','Hear the judgment, then ask for the reason.'):L('先想一想，等老师展示图形。','Think first. The demonstration follows.');
    let body='';
    if(state.phase===0)body=`<p class="lecture-side-label">${L('两种直觉，你更认同哪一种？','WHICH INTUITION FITS?')}</p><div class="oral-choices">${teaching.options.map((option,i)=>`<div><span>${String.fromCharCode(65+i)}</span><p>${T(option)}</p></div>`).join('')}</div><p class="oral-invitation">${L('请同学举手或口头回答，先保留不同判断。','Invite a show of hands or spoken answers. Keep both predictions open.')}</p>`;
    if(state.phase===1)body=`<p class="lecture-side-label">${L('请看这一处变化','WATCH THIS CHANGE')}</p><h2>${state.beat<0?L('先看原图。','First, the original view.'):T(beats[state.beat].title)}</h2><p class="lecture-cue">${esc(lectureCue(section,ctx.lang))}</p>${beats.length>1?`<div class="lecture-beats">${beats.map((beat,i)=>`<button data-beat="${i}" aria-pressed="${state.beat===i}"><span>${i+1}</span>${T(beat.title)}</button>`).join('')}</div>`:''}<button class="lecture-demo-button" id="lecture-apply">${state.beat<beats.length-1?T(beats[state.beat+1].title):L('恢复原图，再比较','Restore the original')} ${arrow}</button>`;
    if(state.phase===2)body=`<p class="lecture-side-label">${L('把变化归纳成一个概念','ONE IDEA TO KEEP')}</p><h2 class="lecture-takeaway">${T(teaching.insight)}</h2><p class="lecture-cue">${T(section.steps[1])}</p>`;
    if(state.phase===3)body=`<p class="lecture-side-label">${L('先讨论，再揭晓','DISCUSS BEFORE REVEALING')}</p><div class="oral-choices transfer-choices ${state.answerRevealed?'answer-revealed':''}">${section.options.map((option,i)=>`<div class="${state.answerRevealed&&i===section.answer?'correct-answer':''}"><span>${String.fromCharCode(65+i)}</span><p>${T(option)}</p>${state.answerRevealed&&i===section.answer?'<b>✓</b>':''}</div>`).join('')}</div>${state.answerRevealed?`<div class="lecture-answer" role="status"><strong>${L('判断依据','Reasoning')}</strong><p>${T(section.reason)}</p></div>`:`<button class="lecture-demo-button" id="lecture-reveal">${L('讨论后，揭示答案','Reveal after discussion')} ${arrow}</button>`}`;
    $('#lecture-side').innerHTML=body;
    if($('#lecture-apply'))$('#lecture-apply').onclick=()=>state.beat<beats.length-1?applyBeat(state.beat+1):setPhase(1);
    document.querySelectorAll('[data-beat]').forEach(button=>button.onclick=()=>applyBeat(Number(button.dataset.beat)));
    if($('#lecture-reveal'))$('#lecture-reveal').onclick=()=>{state.answerRevealed=true;paint();};
    $('#lecture-previous').disabled=state.phase===0&&index===0;
    const caption=state.phase===0?L('展示图形，开始演示','Show the demonstration'):state.phase===1&&state.beat<beats.length-1?L('下一步演示','Next demonstration'):state.phase===1?L('归纳这个变化','Explain the change'):state.phase===2?L('向全班追问','Ask the class'):!state.answerRevealed?L('揭示答案与理由','Reveal the reasoning'):index<all.length-1?L('进入下一节','Next section'):L('进入图表诊所','Go to chart clinic');
    $('#lecture-next').innerHTML=caption+arrow;
  }
  async function fullscreen(){
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('.lecture-key-hint').textContent=L('可用浏览器全屏键放大','Use your browser’s full-screen shortcut');}
  }
  function fullscreenLabel(){if($('#lecture-fullscreen'))$('#lecture-fullscreen').textContent=document.fullscreenElement?L('退出全屏 ⤡','Exit full screen ⤡'):L('全屏 ⤢','Full screen ⤢');}
  document.addEventListener('fullscreenchange',fullscreenLabel);
  $('#lecture-fullscreen').onclick=fullscreen;
  $('#lecture-parameters').onclick=()=>{state.parametersOpen=true;document.body.classList.add('lecture-parameters-open');$('#projection-experiment .lecture-close-parameters').focus();};
  $('#lecture-parameters-shade').onclick=closeParameters;
  $('#lecture-data').onclick=()=>{state.showData=!state.showData;refreshFigure();};
  $('#lecture-restart').onclick=()=>{experiment.reset();experiment.applyPreset(lectureInitial(section));state.before=experiment.getState();state.after=null;setPhase(0);};
  $('#lecture-compare').onclick=()=>{if(!comparing){state.after=experiment.getState();experiment.restore(state.before);comparing=true;}else{experiment.restore(state.after);comparing=false;}refreshFigure();};
  $('#lecture-next').onclick=next;$('#lecture-previous').onclick=previous;
  document.querySelectorAll('[data-lecture-phase]').forEach(button=>button.onclick=()=>setPhase(Number(button.dataset.lecturePhase)));
  if(state.phase===2&&state.beat<0)applyBeat(beats.length-1);
  paint();refreshFigure();remember();fullscreenLabel();
  return {
    experiment,closeOverlay:closeParameters,
    handleKey(event){
      if(event.key==='Escape'&&state.parametersOpen){closeParameters();return true;}
      if(state.parametersOpen){
        if(event.key==='Tab'){
          const f=[...$('#projection-experiment .experiment-controls').querySelectorAll('button,input,select,summary')].filter(el=>!el.disabled&&el.getClientRects().length);
          if(event.shiftKey&&document.activeElement===f[0]){event.preventDefault();f.at(-1).focus();}else if(!event.shiftKey&&document.activeElement===f.at(-1)){event.preventDefault();f[0].focus();}
        }return false;
      }
      if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)||document.activeElement.isContentEditable)return false;
      if(['ArrowRight','PageDown'].includes(event.key)||(event.code==='Space'&&document.activeElement.tagName!=='BUTTON')){event.preventDefault();next();return true;}
      if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();previous();return true;}
      if(event.key.toLowerCase()==='f'){event.preventDefault();fullscreen();return true;}
      return false;
    },
    cleanup(){document.body.classList.remove('lecture-parameters-open');document.removeEventListener('fullscreenchange',fullscreenLabel);}
  };
}
