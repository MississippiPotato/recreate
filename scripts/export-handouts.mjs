import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {curriculum,figures} from '../src/course-data.js';
import {codeLabs,programSource} from '../src/code-labs.js';
import {readingMarkdown} from '../src/reading-notes.js';
import {codeGuide,guideSource} from '../src/code-guide.js';

const out=new URL('../assets/handouts/',import.meta.url);
await mkdir(out,{recursive:true});
for(const lang of ['zh','en']){
  const L=(zh,en)=>lang==='zh'?zh:en,T=value=>value[lang];
  const chapters=[];
  for(const course of curriculum){
    const lines=[`# ${L('第','Lesson ')} ${course.id} ${L('章','')} ${T(course.title)}`,'',T(course.summary),''];
    for(const section of course.sections){
      const lab=codeLabs[section.api];lines.push(`## ${section.id} ${T(section.title)}`,'',readingMarkdown(section.id,lang),'');
      for(const id of section.figures||[]){const figure=figures[id];lines.push(`![${T(figure.caption)}](../figures/${figure.file})`,'');}
      lines.push(`### ${L('关键代码','Key code')}`,'');
      codeGuide[section.id].forEach((guide,i)=>lines.push(`#### ${i+1}. ${T(guide.title)}`,'','```javascript',guideSource(guide,lang),'```','',`**${L('关键点解释','Key-point explanation')}**`,'',T(guide.explanation).replace(/<code>(.*?)<\/code>/g,'`$1`').replace(/<[^>]+>/g,''),''));
      lines.push(`### ${L('运行示例','Runnable example')}: ${T(lab.title)}`,'','```javascript',programSource(lab,lang),'```','');
      lines.push('',`[${L('D3 官方文档','D3 documentation')}](${lab.docs})`,'',`### ${L('演示观察','Demonstration')}`,'',T(section.watch),'',`[${L('打开本节','Open section')}](https://mississippipotato.github.io/recreate/#ch-${section.id.replace('.','-')})`,'');
    }
    const text=lines.join('\n');chapters.push(text);
    await writeFile(new URL(`lesson-0${course.id}.${lang}.md`,out),text);
  }
  await writeFile(new URL(`all.${lang}.md`,out),chapters.join('\n\n---\n\n'));
}
console.log('Exported bilingual handouts to '+fileURLToPath(out));
