import {mountInteractive} from './interactive.js';
import {mountVisualLab,hasVisualLab} from './visual-labs.js';
import {lessonSteps} from './lesson-steps.js';

export function mountStudio(host,section,lang,saved,onStep){
  const L=(zh,en)=>lang==='zh'?zh:en,steps=lessonSteps(section);
  let phase=Math.min(saved?.phase??steps.length-1,steps.length-1),timer=null,original=null;
  host.innerHTML=`<div class="walkthrough-toolbar"><span>${L('图形推演','VISUAL WALKTHROUGH')}</span><div><button data-walk-prev aria-label="${L('上一步','Previous step')}">←</button><button data-walk-play aria-label="${L('播放步骤','Play steps')}">▷</button><button data-walk-next aria-label="${L('下一步','Next step')}">→</button></div></div><nav class="walkthrough-steps" aria-label="${L('图形构建步骤','Visual construction steps')}">${steps.map((step,i)=>`<button data-step="${i}" aria-pressed="false"><span>${i+1}</span>${step.title[lang]}</button>`).join('')}</nav><div class="studio-live"></div>${hasVisualLab(section.id)?`<details class="original-experiment"><summary>${L('更多实验与原有操作','More experiments and original controls')}</summary><div class="original-mount"></div></details>`:''}<details class="drawing-source"><summary>${L('本演示的完整绘制函数','Complete drawing function')}</summary><pre><code></code></pre></details>`;
  const live=host.querySelector('.studio-live');
  const lab=mountVisualLab(live,section,lang,saved?.lab)||mountInteractive(live,section,lang,saved?.lab||saved);
  const previous=host.querySelector('[data-walk-prev]'),next=host.querySelector('[data-walk-next]'),play=host.querySelector('[data-walk-play]');
  function announce(){
    host.querySelectorAll('[data-step]').forEach(button=>{button.setAttribute('aria-pressed',Number(button.dataset.step)===phase);button.classList.toggle('step-complete',Number(button.dataset.step)<phase);});
    previous.disabled=phase===0;next.disabled=phase===steps.length-1;
    host.dataset.phase=phase;onStep?.({...steps[phase],phase,steps,source:lab.source?.()||''});
  }
  function stop(){if(timer)clearInterval(timer);timer=null;play.textContent='▷';play.setAttribute('aria-pressed','false');}
  function setStep(index){phase=Math.max(0,Math.min(steps.length-1,index));if(hasVisualLab(section.id))lab.setStep(phase);else if(section.id==='1.2')lab.applyPreset?.({layer:phase});else if(steps[phase].preset)lab.applyPreset?.(steps[phase].preset);announce();}
  host.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{stop();setStep(Number(button.dataset.step));});
  previous.onclick=()=>{stop();setStep(phase-1);};next.onclick=()=>{stop();setStep(phase+1);};
  play.onclick=()=>{if(timer){stop();return;}setStep(0);play.textContent='Ⅱ';play.setAttribute('aria-pressed','true');timer=setInterval(()=>{if(phase>=steps.length-1)stop();else setStep(phase+1);},1600);};
  const additional=host.querySelector('.original-experiment');
  if(additional)additional.ontoggle=()=>{if(additional.open&&!original)original=mountInteractive(additional.querySelector('.original-mount'),section,lang,saved?.original);};
  const source=host.querySelector('.drawing-source');source.ontoggle=()=>{if(source.open)source.querySelector('code').textContent=lab.source?.()||'';};
  const visibility=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();});visibility.observe(host);
  announce();
  return {setStep,applyPreset:lab.applyPreset,getState:()=>({phase,lab:lab.getState?.(),original:original?.getState?.()||saved?.original}),source:lab.source,cleanup(){stop();visibility.disconnect();lab.cleanup?.();original?.cleanup?.();}};
}
