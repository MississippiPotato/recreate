import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {curriculum,figures} from '../src/course-data.js';
import {codeLabs,programSource} from '../src/code-labs.js';

const out=new URL('../assets/handouts/',import.meta.url);
await mkdir(out,{recursive:true});
for(const lang of ['zh','en']){
  const L=(zh,en)=>lang==='zh'?zh:en,T=value=>value[lang];
  const chapters=[];
  for(const course of curriculum){
    const lines=[`# ${L('第','Lesson ')} ${course.id} ${L('章','')} ${T(course.title)}`,'',T(course.summary),'',L('本讲义基于原课程与课程材料重新组织，配套网站保留“讲解 / 关键代码 / 演示”。示例中的学生、气温、场与事件为教学构造数据。','These revised notes accompany the explanation, key-code and demonstration tabs. Student, temperature, field and event examples are constructed teaching data.'),''];
    for(const section of course.sections){
      const lab=codeLabs[section.api];lines.push(`## ${section.id} ${T(section.title)}`,'',T(section.intro),'');
      section.points.forEach(point=>lines.push(`### ${T(point.title)}`,'',T(point.text),''));
      for(const id of section.figures||[]){const figure=figures[id];lines.push(`![${T(figure.caption)}](../figures/${figure.file})`,'');}
      lines.push(`### ${L('关键代码','Key code')}: ${T(lab.title)}`,'',L('以下为网页中实际运行的语法示例函数；svg、d3、n、L 由示例运行环境传入，并非独立完整 HTML 文件。','This is the syntax-example function executed on the website. The environment supplies svg, d3, n and L; it is not a standalone HTML document.'),'','```javascript',programSource(lab,lang),'```','');
      lab.notes.forEach(note=>lines.push(`- **${note.term}**: ${T(note.text)}`));
      lines.push('',`[${L('D3 官方文档','D3 documentation')}](${lab.docs})`,'',`### ${L('演示观察','Demonstration')}`,'',T(section.watch),'',`[${L('打开本节','Open section')}](https://mississippipotato.github.io/recreate/#ch-${section.id.replace('.','-')})`,'');
    }
    const text=lines.join('\n');chapters.push(text);
    await writeFile(new URL(`lesson-0${course.id}.${lang}.md`,out),text);
  }
  await writeFile(new URL(`all.${lang}.md`,out),chapters.join('\n\n---\n\n'));
}
console.log('Exported bilingual handouts to '+fileURLToPath(out));
